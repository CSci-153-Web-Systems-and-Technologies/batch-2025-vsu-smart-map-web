"use server";

import { revalidatePath } from "next/cache";
import { unifiedFacilitySchema, partialFacilitySchema } from "@/lib/validation/facility";
import { roomSchema } from "@/lib/validation/room";
import { calculateChanges } from "@/lib/logic/change-tracking";
import {
  createFacility,
  deleteFacility as deleteFacilityQuery,
  updateFacility,
  getFacilityById,
} from "@/lib/supabase/queries/facilities";
import { revalidateFacilitiesCache } from "@/lib/supabase/queries/facilities.server";
import { getSuggestions, createSuggestion, pruneHistory } from "@/lib/supabase/queries/suggestions";
import {
  createRoom,
  deleteRoom as deleteRoomQuery,
  updateRoom,
  getRoomById,
} from "@/lib/supabase/queries/rooms";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server-client";
import { deleteImage } from "@/lib/supabase/storage";
// import type { Facility } from "@/lib/types/facility";

const MAX_HISTORY_ITEMS = 5;



export async function getFacilityHistory(facilityId: string) {
  const { client } = await getSupabaseAdminClient({ requireServiceRole: true });
  const { data, error } = await getSuggestions({
    targetId: facilityId,
    status: "APPROVED",
    client,
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

const FACILITY_VALIDATION_ERROR =
  "Invalid facility data. Please check your entries and try again.";
const ROOM_VALIDATION_ERROR =
  "Invalid room data. Please check your entries and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function createFacilityAction(input: unknown) {
  const parsed = unifiedFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: FACILITY_VALIDATION_ERROR };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await createFacility(parsed.data, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  if (data) {
    const { client: adminClient } = await getSupabaseAdminClient({ requireServiceRole: true });
    await createSuggestion(
      {
        type: "ADD_FACILITY",
        targetId: data.id,
        status: "APPROVED",
        payload: { ...parsed.data, source: "ADMIN" },
      },
      adminClient
    );
  }

  await revalidateFacilitiesCache();
  revalidatePath("/admin/facilities");
  return { data };
}

export async function updateFacilityAction(id: string, input: unknown) {
  const parsed = partialFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: FACILITY_VALIDATION_ERROR };
  }

  const client = await getSupabaseServerClient();

  const { data: currentFacility } = await getFacilityById({ id, client });

  // Delete old image if being replaced with a new one OR if being cleared
  const inputData = parsed.data as Record<string, unknown>;
  const isClearing = inputData.imageUrl === null || inputData.imageUrl === '';
  const isReplacing = inputData.imageUrl && inputData.imageUrl !== currentFacility?.imageUrl;
  if (currentFacility?.imageUrl && (isClearing || isReplacing)) {
    await deleteImage(currentFacility.imageUrl, true);
  }

  const { data, error } = await updateFacility(id, parsed.data, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  const changes = currentFacility ? calculateChanges(currentFacility as unknown as Record<string, unknown>, parsed.data) : {};

  if (!currentFacility && !Object.keys(changes).length) {
    Object.assign(changes, parsed.data);
  }

  if (Object.keys(changes).length > 0) {
    const { client: adminClient } = await getSupabaseAdminClient({ requireServiceRole: true });
    await createSuggestion(
      {
        type: "EDIT_FACILITY",
        targetId: id,
        status: "APPROVED",
        payload: { ...changes, source: "ADMIN" },
      },
      adminClient
    );

    await pruneHistory({
      targetId: id,
      type: "EDIT_FACILITY",
      limit: MAX_HISTORY_ITEMS,
      client: adminClient,
    });
  }

  await revalidateFacilitiesCache();
  revalidatePath("/admin/facilities");
  return { data };
}

export async function deleteFacilityAction(id: string) {
  const client = await getSupabaseServerClient();
  const { error } = await deleteFacilityQuery(id, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  await revalidateFacilitiesCache();
  revalidatePath("/admin/facilities");
  return { data: true };
}

export async function createRoomAction(input: unknown) {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { error: ROOM_VALIDATION_ERROR };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await createRoom(parsed.data, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  if (data) {
    const { client: adminClient } = await getSupabaseAdminClient({ requireServiceRole: true });
    await createSuggestion(
      {
        type: "ADD_ROOM",
        targetId: data.facility_id,
        status: "APPROVED",
        payload: { ...parsed.data, roomId: data.id, roomCode: data.room_code, source: "ADMIN" },
      },
      adminClient
    );
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function updateRoomAction(id: string, input: unknown) {
  const parsed = roomSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: ROOM_VALIDATION_ERROR };
  }

  const client = await getSupabaseServerClient();

  const { data: currentRoom } = await getRoomById({ id, client });

  // Delete old room image if being replaced with a new one OR if being cleared
  if (currentRoom && !("facility" in currentRoom) && currentRoom.image_url) {
    const isClearing = parsed.data.imageUrl === null || parsed.data.imageUrl === '';
    const isReplacing = parsed.data.imageUrl && parsed.data.imageUrl !== currentRoom.image_url;
    if (isClearing || isReplacing) {
      await deleteImage(currentRoom.image_url, true);
    }
  }

  const { data, error } = await updateRoom({ id, ...parsed.data }, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  if (data && currentRoom && !("facility" in currentRoom)) {
    const changes = calculateChanges(currentRoom as unknown as Record<string, unknown>, parsed.data);

    if (Object.keys(changes).length > 0) {
      const { client: adminClient } = await getSupabaseAdminClient({ requireServiceRole: true });
      await createSuggestion(
        {
          type: "EDIT_ROOM",
          targetId: data.facility_id,
          status: "APPROVED",
          payload: { ...changes, roomId: id, roomCode: data.room_code, source: "ADMIN" },
        },
        adminClient
      );

      await pruneHistory({
        targetId: data.facility_id,
        type: "EDIT_ROOM",
        limit: MAX_HISTORY_ITEMS,
        client: adminClient,
      });
    }
  } else if (data) {
    const { client: adminClient } = await getSupabaseAdminClient({ requireServiceRole: true });
    await createSuggestion(
      {
        type: "EDIT_ROOM",
        targetId: data.facility_id,
        status: "APPROVED",
        payload: { ...parsed.data, roomId: id, roomCode: data.room_code, source: "ADMIN" },
      },
      adminClient
    );

    await pruneHistory({
      targetId: data.facility_id,
      type: "EDIT_ROOM",
      limit: MAX_HISTORY_ITEMS,
      client: adminClient,
    });
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function deleteRoomAction(id: string) {
  const client = await getSupabaseServerClient();
  const { error } = await deleteRoomQuery(id, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  revalidatePath("/admin/facilities");
  return { data: true };
}
