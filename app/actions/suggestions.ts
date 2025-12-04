"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSuggestion } from "@/lib/supabase/queries/suggestions";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

const SUGGESTION_TYPES = [
  "ADD_FACILITY",
  "EDIT_FACILITY",
  "ADD_ROOM",
  "EDIT_ROOM",
] as const;

const suggestionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(SUGGESTION_TYPES),
  targetId: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.any()),
  adminNote: z.string().optional().nullable(),
});

const GENERIC_ERROR = "Unable to submit suggestion. Please try again.";

export async function createSuggestionAction(input: unknown) {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid suggestion payload. Please review the form and try again." };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await createSuggestion(parsed.data, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/directory");
  return { data };
}
