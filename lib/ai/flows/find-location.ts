import { flow } from "@genkit-ai/core";
import { runWithKeyRotation } from "../genkit";
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
    const previousContext = input.context ? JSON.stringify(input.context) : "None";

    const prompt = `
${CAMPUS_ASSISTANT_PROMPT}

## Context
User Query: "${userQuery}"
Previous Context: ${previousContext}

## Available Facilities
${JSON.stringify(facilitiesContext, null, 2)}

Answer the user's query based on the available facilities.
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
