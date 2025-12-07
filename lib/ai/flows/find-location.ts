import { flow } from "@genkit-ai/core";
import { runWithKeyRotation, streamWithKeyRotation } from "../genkit";
import { LocationQuerySchema, LocationResponseSchema, LocationQuery } from "../schemas/location";
import { CAMPUS_ASSISTANT_PROMPT } from "../prompts/campus-assistant";
import { getFacilitiesForChat } from "@/lib/supabase/queries/facilities";

export const findLocationFlow = flow(
  {
    name: "findLocation",
    inputSchema: LocationQuerySchema,
    outputSchema: LocationResponseSchema,
  },
  async (input: LocationQuery) => {
    // Data is now cached by Next.js in the data layer
    const { data: facilitiesContext } = await getFacilitiesForChat();

    // If we fail to fetch context, we should probably still try to answer or error out.
    // For now, we'll proceed with an empty list if data is missing, 
    // though the query function tries its best.
    // Optimize Context: Truncate descriptions to save tokens
    const validContext = (facilitiesContext || []).map(f => ({
      ...f,
      description: f.description ? f.description.slice(0, 150) : undefined
    }));

    const userQuery = input.query;
    const contextData = input.context || {};
    const summary = contextData.summary || "None";

    // Optimization: Limit history to last 6 messages
    const conversationHistory = contextData.conversationHistory?.length
      ? contextData.conversationHistory
        .slice(-6)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n") // Use single newline for compactness
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
${JSON.stringify(validContext)}

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
  const { data: facilitiesContext } = await getFacilitiesForChat();
  // Optimize Context: Truncate descriptions
  const validContext = (facilitiesContext || []).map(f => ({
    ...f,
    description: f.description ? f.description.slice(0, 150) : undefined
  }));

  const userQuery = input.query;
  const contextData = input.context || {};
  // Optimization: Limit history
  const conversationHistory = contextData.conversationHistory?.length
    ? contextData.conversationHistory
      .slice(-6)
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")
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
${JSON.stringify(validContext)}

Answer the user's query based on the available facilities. Consider the conversation history for context.
`;

  return await streamWithKeyRotation(async (ai) => {
    return await ai.generateStream({
      prompt: prompt,
      output: { schema: LocationResponseSchema },
    });
  });
}
