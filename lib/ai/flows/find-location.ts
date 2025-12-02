import { flow } from "@genkit-ai/core";
import { runWithKeyRotation } from "../genkit";
import { LocationQuerySchema, LocationResponseSchema, LocationQuery } from "../schemas/location";
import { CAMPUS_ASSISTANT_PROMPT } from "../prompts/campus-assistant";
import { getFacilities } from "@/lib/supabase/queries/facilities";

export const findLocationFlow = flow(
  {
    name: "findLocation",
    inputSchema: LocationQuerySchema,
    outputSchema: LocationResponseSchema,
  },
  async (input: LocationQuery) => {
    const { data: facilities } = await getFacilities();

    if (!facilities) {
      throw new Error("Failed to fetch facilities context");
    }

    const facilitiesContext = facilities.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      description: f.description,
    }));

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
