import { flow } from "@genkit-ai/core";
import { runWithKeyRotation, streamWithKeyRotation } from "../genkit";
import { LocationQuerySchema, LocationResponseSchema, LocationQuery } from "../schemas/location";
import { CAMPUS_ASSISTANT_PROMPT } from "../prompts/campus-assistant";
import { getFacilitiesForChatCached } from "@/lib/supabase/queries/facilities.server";

export const findLocationFlow = flow(
  {
    name: "findLocation",
    inputSchema: LocationQuerySchema,
    outputSchema: LocationResponseSchema,
  },
  async (input: LocationQuery) => {
    // Data is now cached by Next.js in the data layer
    const { data: facilitiesContext } = await getFacilitiesForChatCached();

    // If we fail to fetch context, we should probably still try to answer or error out.
    // For now, we'll proceed with an empty list if data is missing, 
    // though the query function tries its best.
    // Optimize Context: Truncate descriptions to save tokens
    const validContext = (facilitiesContext || []).map(f => ({
      ...f,
      description: f.description ? f.description.slice(0, 150) : undefined
    }));

    let userQuery = input.query;
    const contextData = input.context || {};
    const summary = contextData.summary || "None";

    // Detect potential room codes (e.g., ICT303, CAS101)
    const roomCodePattern = /([A-Za-z]+)(\d{2,3})/i;
    const match = userQuery.match(roomCodePattern);

    if (match) {
        const prefix = match[1].toUpperCase();
        
        // Check if the specific room is NOT in the context
        const specificRoomExists = (facilitiesContext || []).some(f => 
            f.rooms?.some(r => r.roomCode?.toUpperCase() === userQuery.toUpperCase())
        );

        if (!specificRoomExists) {
            // Try to find a building with a matching name or code prefix
            const inferredBuilding = (facilitiesContext || []).find(f => 
                f.name.toUpperCase().startsWith(prefix) || 
                f.code?.toUpperCase() === prefix ||
                (f.category === 'academic' && f.name.toUpperCase().includes(prefix))
            );

            if (inferredBuilding) {
                userQuery = `${userQuery} (Note: I couldn't find this specific room in my data, but based on the naming pattern, it is likely located in the ${inferredBuilding.name}. I will assume it's there and explicitly mention this assumption to the user.)`;
            }
        }
    }

    // Optimization: Limit history to last 6 messages and only include text response for Assistant
    const conversationHistory = contextData.conversationHistory?.length
      ? contextData.conversationHistory
        .slice(-6)
        .map((msg) => {
          let content = msg.content;
          if (msg.role === "assistant") {
            try {
              // Extract only the response text if it's JSON
              const parsed = JSON.parse(msg.content);
              content = parsed.response || msg.content;
            } catch {
              // Fallback to original content if not JSON
            }
          }
          return `${msg.role === "user" ? "User" : "Assistant"}: ${content}`;
        })
        .join("\n")
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
  const { data: facilitiesContext } = await getFacilitiesForChatCached();
  // Optimize Context: Truncate descriptions
  const validContext = (facilitiesContext || []).map(f => ({
    ...f,
    description: f.description ? f.description.slice(0, 150) : undefined
  }));

  const userQuery = input.query;
  const contextData = input.context || {};
  // Optimization: Limit history to last 6 messages and only include text response for Assistant
  const conversationHistory = contextData.conversationHistory?.length
    ? contextData.conversationHistory
      .slice(-6)
      .map((msg) => {
        let content = msg.content;
        if (msg.role === "assistant") {
          try {
            // Extract only the response text if it's JSON
            const parsed = JSON.parse(msg.content);
            content = parsed.response || msg.content;
          } catch {
            // Fallback to original content if not JSON
          }
        }
        return `${msg.role === "user" ? "User" : "Assistant"}: ${content}`;
      })
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
