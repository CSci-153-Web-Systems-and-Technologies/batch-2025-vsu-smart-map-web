import { findLocationFlow } from "@/lib/ai/flows/find-location";
import { getFacilitiesByIds } from "@/lib/supabase/queries/facilities";
import { NextResponse } from "next/server";
import type { FacilityMatch } from "@/lib/types/chat";

type HistoryEntry = { role: "user" | "assistant"; content: string };

function getPreviousQueries(history: unknown): string[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (entry): entry is HistoryEntry =>
        entry?.role === "user" && typeof entry.content === "string"
    )
    .map((entry) => entry.content)
    .filter(Boolean)
    .slice(-6);
}

async function resolveFacilityMatches(
  facilities: Array<{ id: string; matchReason: string }> | undefined
): Promise<FacilityMatch[]> {
  if (!facilities?.length) return [];

  const ids = Array.from(new Set(facilities.map((f) => f.id)));
  const { data } = await getFacilitiesByIds({ ids });

  if (!data) return [];

  return facilities
    .map((facility) => {
      const fullFacility = data.find((item) => item.id === facility.id);
      if (!fullFacility) return null;

      return {
        facility: fullFacility,
        matchReason: facility.matchReason,
        confidence: 1,
      };
    })
    .filter(Boolean) as FacilityMatch[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const previousQueries = getPreviousQueries(body?.history);

    const result = await findLocationFlow({
      query: message,
      context: { previousQueries },
    });

    const matches = await resolveFacilityMatches(result.facilities);

    return NextResponse.json({
      content: result.response,
      facilities: matches,
      followUp: result.followUp ?? null,
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (
      errorMessage.includes("429") ||
      errorMessage.includes("Max retries exceeded")
    ) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
