import { z } from "genkit";

export const LocationQuerySchema = z.object({
  query: z.string().describe("The user's natural language query about a location"),
  context: z
    .object({
      previousQueries: z.array(z.string()).optional(),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        )
        .optional()
        .describe("Recent conversation history with both user and assistant messages"),
      summary: z.string().optional().describe("Summary of previous conversation history"),
      userLocation: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      forceRefresh: z.boolean().optional().describe("Force refresh cached facilities"),
    })
    .optional(),
});

export const LocationResponseSchema = z.object({
  response: z.string().describe("Natural language response to the user in their preferred language"),
  facilities: z
    .array(
      z.object({
        facilityId: z.string().describe("The facility's ID from the provided data"),
        name: z.string().describe("The facility's official name"),
      })
    )
    .max(6)
    .describe("List of matched facilities (maximum 6, empty array if no match)"),
});

export type LocationQuery = z.infer<typeof LocationQuerySchema>;
export type LocationResponse = z.infer<typeof LocationResponseSchema>;
