"use server";

import { revalidatePath } from "next/cache";
import { baseFacilitySchema, unifiedFacilitySchema } from "@/lib/validation/facility";
import { z } from "zod";
import { roomSchema } from "@/lib/validation/room";
import { createFacility, updateFacility } from "@/lib/supabase/queries/facilities";
import { createRoom, updateRoom } from "@/lib/supabase/queries/rooms";
import { getSuggestionById, updateSuggestion } from "@/lib/supabase/queries/suggestions";
import { getSupabaseAdminClient } from "@/lib/supabase/server-client";
import type { FacilityCategory, FacilityInsert, FacilityUpdate } from "@/lib/types/facility";
import { deleteImage } from "@/lib/supabase/storage";
import { getFacilityById } from "@/lib/supabase/queries/facilities";

const GENERIC_ERROR = "Unable to process suggestion. Please try again.";

const mapFacilityInsert = (input: FacilityInsert): FacilityInsert => ({
  code: input.code ?? undefined,
  name: input.name,
  description: input.description ?? undefined,
  category: input.category as FacilityCategory,
  hasRooms: input.hasRooms,
  coordinates: input.coordinates,
  imageUrl: input.imageUrl ?? undefined,
  slug: input.slug,
});

const mapFacilityUpdate = (input: FacilityUpdate): FacilityUpdate => {
  const update: FacilityUpdate = {};
  if (input.code !== undefined) update.code = input.code ?? undefined;
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description ?? undefined;
  if (input.category !== undefined) update.category = input.category as FacilityCategory;
  if (input.hasRooms !== undefined) update.hasRooms = input.hasRooms;
  if (input.coordinates) update.coordinates = input.coordinates;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl ?? undefined;
  if (input.slug !== undefined) update.slug = input.slug;
  return update;
};

export async function approveSuggestion(id: string, overridePayload?: unknown) {
  let client;
  try {
    const admin = await getSupabaseAdminClient({ requireServiceRole: true });
    if (!admin.isServiceRole) {
      return { error: "Service role key is required to approve suggestions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local." };
    }
    client = admin.client;
  } catch (error) {
    console.error("Failed to get admin client for approval:", error);
    return { error: "Service role key is required to approve suggestions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local." };
  }

  const { data: suggestion, error } = await getSuggestionById(id, client);

  if (error || !suggestion) {
    return { error: error?.message ?? GENERIC_ERROR };
  }

  if (suggestion.status !== "PENDING") {
    return { error: "Suggestion already processed." };
  }

  const payloadToUse = overridePayload ?? suggestion.payload;

  switch (suggestion.type) {
    case "ADD_FACILITY": {
      const parsed = unifiedFacilitySchema.safeParse(payloadToUse);
      if (!parsed.success) {
        return { error: "Suggestion payload is invalid." };
      }

      const payload = mapFacilityInsert(parsed.data);
      const { data, error: createError } = await createFacility(payload, client);
      if (createError || !data) {
        return { error: createError?.message ?? GENERIC_ERROR };
      }

      await updateSuggestion(id, { status: "APPROVED", targetId: data.id, payload: parsed.data }, client);
      break;
    }

    case "EDIT_FACILITY": {
      if (!suggestion.targetId) {
        return { error: "Missing target facility for edit." };
      }

      const partialSchema = baseFacilitySchema.extend({ hasRooms: z.boolean().optional() }).partial();
      const parsed = partialSchema.safeParse(payloadToUse);
      if (!parsed.success) {
        return { error: "Suggestion payload is invalid." };
      }

      const updatePayload = mapFacilityUpdate(parsed.data);
      const { error: updateError } = await updateFacility(suggestion.targetId, updatePayload, client);
      if (updateError) {
        return { error: updateError.message ?? GENERIC_ERROR };
      }

      await updateSuggestion(id, { status: "APPROVED", payload: parsed.data }, client);
      break;
    }

    case "ADD_ROOM": {
      const parsed = roomSchema.safeParse(payloadToUse);
      if (!parsed.success) {
        return { error: "Room payload is invalid." };
      }

      const { error: addRoomError } = await createRoom(parsed.data, client);
      if (addRoomError) {
        return { error: addRoomError.message ?? GENERIC_ERROR };
      }

      await updateSuggestion(id, { status: "APPROVED", payload: parsed.data }, client);
      break;
    }

    case "EDIT_ROOM": {
      if (!suggestion.targetId) {
        return { error: "Missing target room for edit." };
      }

      const parsed = roomSchema.partial().safeParse(payloadToUse);
      if (!parsed.success) {
        return { error: "Room payload is invalid." };
      }

      const { error: editRoomError } = await updateRoom(
        { id: suggestion.targetId, ...parsed.data },
        client,
      );
      if (editRoomError) {
        return { error: editRoomError.message ?? GENERIC_ERROR };
      }

      await updateSuggestion(id, { status: "APPROVED", payload: parsed.data }, client);
      break;
    }

    default:
      return { error: "Unsupported suggestion type." };
  }

  revalidatePath("/admin/suggestions");
  revalidatePath(`/admin/suggestions/${id}`);
  revalidatePath("/admin/facilities");
  revalidatePath("/directory");
  revalidatePath("/");

  return { data: true };
}

export async function rejectSuggestion(id: string, reason?: string) {
  let client;
  try {
    const admin = await getSupabaseAdminClient({ requireServiceRole: true });
    if (!admin.isServiceRole) {
      return { error: "Service role key is required to reject suggestions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local." };
    }
    client = admin.client;
  } catch (error) {
    console.error("Failed to get admin client for rejection:", error);
    return { error: "Service role key is required to reject suggestions. Set SUPABASE_SERVICE_ROLE_KEY in .env.local." };
  }

  const { data: suggestion, error } = await getSuggestionById(id, client);

  if (error || !suggestion) {
    return { error: error?.message ?? GENERIC_ERROR };
  }

  if (suggestion.status !== "PENDING") {
    return { error: "Suggestion already processed." };
  }

  // Cleanup orphaned images if they were uploaded with the suggestion
  if (suggestion.type === "ADD_FACILITY") {
    const payload = suggestion.payload as unknown as FacilityInsert;
    if (typeof payload.imageUrl === "string" && payload.imageUrl) {
      await deleteImage(payload.imageUrl, true);
    }
  } else if (suggestion.type === "EDIT_FACILITY") {
    const payload = suggestion.payload as unknown as FacilityUpdate;
    // Only delete if the image was changed (uploaded new)
    if (typeof payload.imageUrl === "string" && payload.imageUrl && suggestion.targetId) {
      const { data: currentFacility } = await getFacilityById({
        id: suggestion.targetId,
        client,
      });

      if (currentFacility && currentFacility.imageUrl !== payload.imageUrl) {
        await deleteImage(payload.imageUrl, true);
      }
    }
  }

  await updateSuggestion(
    id,
    {
      status: "REJECTED",
      adminNote: reason ?? null,
    },
    client,
  );

  revalidatePath("/admin/suggestions");
  revalidatePath(`/admin/suggestions/${id}`);

  return { data: true };
}
