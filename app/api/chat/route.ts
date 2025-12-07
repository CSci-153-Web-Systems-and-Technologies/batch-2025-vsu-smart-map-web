import {
  findLocationFlow,
  streamFindLocation,
} from "@/lib/ai/flows/find-location";
import { getFacilitiesByIds } from "@/lib/supabase/queries/facilities";
import { NextResponse } from "next/server";
import { CHAT_HISTORY } from "@/lib/constants/chat";
import type { FacilityMatch } from "@/lib/types/chat";

type HistoryEntry = { role: "user" | "assistant"; content: string };
const encoder = new TextEncoder();

function getPreviousQueries(history: unknown): string[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (entry): entry is HistoryEntry =>
        entry?.role === "user" && typeof entry.content === "string"
    )
    .map((entry) => entry.content)
    .filter(Boolean)
    .slice(-CHAT_HISTORY.MAX_CONTEXT_MESSAGES);
}

function getConversationHistory(history: unknown): HistoryEntry[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (entry): entry is HistoryEntry =>
        (entry?.role === "user" || entry?.role === "assistant") &&
        typeof entry.content === "string" &&
        entry.content.trim().length > 0
    )
    .slice(-CHAT_HISTORY.MAX_CONTEXT_MESSAGES);
}

async function resolveFacilityMatches(
  facilities: Array<{ facilityId: string; name: string }> | undefined
): Promise<FacilityMatch[]> {
  if (!facilities?.length) return [];

  const ids = Array.from(new Set(facilities.map((f) => f.facilityId)));
  const { data } = await getFacilitiesByIds({ ids });

  if (!data) return [];

  return facilities
    .map((facility) => {
      const fullFacility = data.find((item) => item.id === facility.facilityId);
      if (!fullFacility) return null;

      return {
        facility: fullFacility,
        matchReason: "",
        confidence: 1,
      };
    })
    .filter(Boolean) as FacilityMatch[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const streaming = Boolean(body?.streaming);
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const previousQueries = getPreviousQueries(history);
    const conversationHistory = getConversationHistory(history);
    const context = { previousQueries, conversationHistory };

    if (streaming) {
      const stream = await streamFindLocation({
        query: message,
        context,
      });

      const readable = new ReadableStream({
        async start(controller) {
          const send = (data: unknown) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

          try {
            let lastResponseText = "";

            for await (const chunk of stream.stream) {
              const output = (chunk as { output?: { response?: string } }).output;
              if (!output?.response) continue;

              const newText = output.response.slice(lastResponseText.length);
              if (!newText) continue;

              lastResponseText = output.response;
              send({ type: "chunk", content: newText });
            }

            const response = await stream.response;
            if (!response.output) {
              throw new Error("AI response missing output");
            }

            const matches = await resolveFacilityMatches(response.output.facilities);

            send({
              type: "final",
              content: response.output.response,
              facilities: matches,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to stream response";
            let userMessage = "Sorry, I encountered an error. Please try again.";

            if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
              userMessage = "I'm currently experiencing high traffic. Please wait a moment and try again.";
            } else if (errorMessage.includes("rate limit") || errorMessage.includes("Max retries")) {
              userMessage = "Too many requests right now. Please try again in a few seconds.";
            } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
              userMessage = "The request timed out. Please try again.";
            } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
              userMessage = "Network connection issue. Please check your connection and try again.";
            }

            send({ type: "error", error: userMessage });
          } finally {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await findLocationFlow({
      query: message,
      context,
    });

    const matches = await resolveFacilityMatches(result.facilities);

    return NextResponse.json({
      content: result.response,
      facilities: matches,
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let userMessage = "Sorry, I encountered an error. Please try again.";
    let statusCode = 500;

    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
      userMessage = "I'm currently experiencing high traffic. Please wait a moment and try again.";
      statusCode = 429;
    } else if (errorMessage.includes("rate limit") || errorMessage.includes("Max retries")) {
      userMessage = "Too many requests right now. Please try again in a few seconds.";
      statusCode = 429;
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      userMessage = "The request timed out. Please try again.";
      statusCode = 504;
    } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = "Network connection issue. Please check your connection and try again.";
      statusCode = 503;
    }

    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    );
  }
}
