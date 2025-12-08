"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSuggestion } from "@/lib/supabase/queries/suggestions";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server-client";
import { verifyTurnstileToken } from "@/lib/turnstile";

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
  payload: z.record(z.string(), z.unknown()),
  adminNote: z.string().optional().nullable(),
  turnstileToken: z.string().optional(),
});

const GENERIC_ERROR = "Unable to submit suggestion. Please try again.";

export async function createSuggestionAction(input: unknown) {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid suggestion payload. Please review the form and try again." };
  }

  const hasTurnstileConfigured = !!process.env.TURNSTILE_SECRET_KEY;

  if (hasTurnstileConfigured) {
    if (!parsed.data.turnstileToken) {
      return { error: "Captcha verification required. Please complete the captcha." };
    }
    const turnstileResult = await verifyTurnstileToken(parsed.data.turnstileToken);
    if (!turnstileResult.success) {
      return { error: turnstileResult.error ?? "Captcha verification failed" };
    }
  }

  const suggestionData = {
    id: parsed.data.id,
    type: parsed.data.type,
    targetId: parsed.data.targetId,
    payload: parsed.data.payload,
    adminNote: parsed.data.adminNote,
  };

  const client = getSupabaseServiceRoleClient();
  const { data, error } = await createSuggestion(suggestionData, client);
  if (error) {
    const payload = parsed.data.payload;
    if (typeof payload.imageUrl === "string" && payload.imageUrl) {
      const { deleteImage } = await import("@/lib/supabase/storage");
      await deleteImage(payload.imageUrl);
    }
    return { error: error.message ?? GENERIC_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/directory");
  return { data };
}

