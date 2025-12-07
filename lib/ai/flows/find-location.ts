import { flow } from "@genkit-ai/core";
import { runWithKeyRotation, streamWithKeyRotation } from "../genkit";
import { LocationQuerySchema, LocationResponseSchema, LocationQuery } from "../schemas/location";
import { CAMPUS_ASSISTANT_PROMPT } from "../prompts/campus-assistant";
import { getFacilitiesForChat } from "@/lib/supabase/queries/facilities";
import type { Facility } from "@/lib/types/facility";

type FacilityContext = Pick<Facility, "id" | "name" | "category" | "description" | "code">;

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFacilities: FacilityContext[] | null = null;
let cachedAt: number | null = null;

async function getCachedFacilities(forceRefresh = false): Promise<FacilityContext[]> {
  const now = Date.now();
  const isExpired = !cachedAt || now - cachedAt > CACHE_TTL_MS;

  if (!cachedFacilities || isExpired || forceRefresh) {
    const { data } = await getFacilitiesForChat();
    if (!data) {
      throw new Error("Failed to fetch facilities context");
    }
    cachedFacilities = data;
    cachedAt = now;
  }

  return cachedFacilities as FacilityContext[];
}

export const findLocationFlow = flow(
  {
    name: "findLocation",
    inputSchema: LocationQuerySchema,
    outputSchema: LocationResponseSchema,
  },
  async (input: LocationQuery) => {
    const facilitiesContext = await getCachedFacilities(input.context?.forceRefresh);

    const userQuery = input.query;
    const contextData = input.context || {};
    const previousQueries = contextData.previousQueries?.length
      ? contextData.previousQueries.join("\n- ")
      : "None";
    const summary = contextData.summary || "None";

    const conversationHistory = contextData.conversationHistory?.length
      ? contextData.conversationHistory
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n")
      : "None";

    const prompt = `
${CAMPUS_ASSISTANT_PROMPT}

## Context
User Query: "${userQuery}"

Previous Conversation Summary:
${summary}

Recent Conversation History:
${conversationHistory}

## Available Facilities
${JSON.stringify(facilitiesContext, null, 2)}

Answer the user's query based on the available facilities. Consider the conversation history for context.
`;

    return await runWithKeyRotation(async (ai) => {
      const result = await ai.generate({
        prompt: prompt,
        output: { schema: LocationResponseSchema },
      });

      if (!result.output) {
        throw new Error("AI failed to generate a response");
      }

      return result.output;
    });
  }
);

export async function streamFindLocation(input: LocationQuery) {
  const facilitiesContext = await getCachedFacilities(input.context?.forceRefresh);

  const userQuery = input.query;
  const contextData = input.context || {};
  const conversationHistory = contextData.conversationHistory?.length
    ? contextData.conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n")
    : "None";
  const summary = contextData.summary || "None";

  const prompt = `
${CAMPUS_ASSISTANT_PROMPT}

## Context
User Query: "${userQuery}"

Previous Conversation Summary:
${summary}

Recent Conversation History:
${conversationHistory}

## Available Facilities
${JSON.stringify(facilitiesContext, null, 2)}

Answer the user's query based on the available facilities. Consider the conversation history for context.
`;

  return await streamWithKeyRotation(async (ai) => {
    return await ai.generateStream({
      prompt: prompt,
      output: { schema: LocationResponseSchema },
    });
  });
}
