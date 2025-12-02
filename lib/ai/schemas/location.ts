import { z } from "genkit";

export const LocationQuerySchema = z.object({
  query: z.string().describe("The user's natural language query about a location"),
  context: z
    .object({
      previousQueries: z.array(z.string()).optional(),
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
  intent: z
    .enum(["find_facility", "get_directions", "list_category", "general_info"])
    .describe("The detected intent of the user's query"),
  facilities: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        matchReason: z.string().describe("Why this facility matches the query"),
      })
    )
    .describe("List of facilities that match the query"),
  response: z.string().describe("Natural language response to the user"),
  followUp: z.string().optional().describe("Optional suggested follow-up question"),
});

export type LocationQuery = z.infer<typeof LocationQuerySchema>;
export type LocationResponse = z.infer<typeof LocationResponseSchema>;
