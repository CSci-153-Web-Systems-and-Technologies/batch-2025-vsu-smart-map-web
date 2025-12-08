"use server";

import { revalidatePath } from "next/cache";
import { unifiedFacilitySchema, partialFacilitySchema } from "@/lib/validation/facility";
import { roomSchema } from "@/lib/validation/room";
import { isDeepEqual } from "@/lib/utils";
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
import type { Facility } from "@/lib/types/facility";

const MAX_HISTORY_ITEMS = 5;

function getFacilityValue(facility: Facility, key: string): unknown {
  const facilityRecord = facility as unknown as Record<string, unknown>;
  return facilityRecord[key];
}

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
    await createSuggestion(
      {
        type: "ADD_FACILITY",
        targetId: data.id,
        status: "APPROVED",
        payload: { ...parsed.data, source: "ADMIN" },
      },
      client
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

  const { data, error } = await updateFacility(id, parsed.data, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  const changes: Record<string, unknown> = {};
  if (currentFacility) {
    const inputData = parsed.data as Record<string, unknown>;
    Object.keys(inputData).forEach((key) => {
      const newValue = inputData[key];
      const currentValue = getFacilityValue(currentFacility, key);

      if (key === "coordinates" && newValue && typeof newValue === "object") {
        const newCoords = newValue as { lat: number; lng: number };
        const currentCoords = currentFacility.coordinates;
        if (
          newCoords.lat !== currentCoords.lat ||
          newCoords.lng !== currentCoords.lng
        ) {
          changes[key] = { from: currentCoords, to: newCoords };
        }
      } else if (!isDeepEqual(newValue, currentValue)) {
        if (newValue !== undefined) {
          changes[key] = { from: currentValue, to: newValue };
        }
      }
    });
  } else {
    Object.assign(changes, parsed.data);
  }

  if (Object.keys(changes).length > 0) {
    await createSuggestion(
      {
        type: "EDIT_FACILITY",
        targetId: id,
        status: "APPROVED",
        payload: { ...changes, source: "ADMIN" },
      },
      client
    );

    await pruneHistory({
      targetId: id,
      type: "EDIT_FACILITY",
      limit: MAX_HISTORY_ITEMS,
      client,
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
    await createSuggestion(
      {
        type: "ADD_ROOM",
        targetId: data.facility_id,
        status: "APPROVED",
        payload: { ...parsed.data, roomId: data.id, roomCode: data.room_code, source: "ADMIN" },
      },
      client
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

  const { data, error } = await updateRoom({ id, ...parsed.data }, client);
  if (error) {
    return { error: error.message ?? GENERIC_ERROR };
  }

  if (data && currentRoom && !("facility" in currentRoom)) {
    const changes: Record<string, unknown> = {};
    const inputData = parsed.data;

    if (inputData.roomCode !== undefined && inputData.roomCode !== currentRoom.room_code) {
      changes.roomCode = { from: currentRoom.room_code, to: inputData.roomCode };
    }
    if (inputData.name !== undefined && inputData.name !== currentRoom.name) {
      changes.name = { from: currentRoom.name, to: inputData.name };
    }
    if (inputData.description !== undefined && inputData.description !== currentRoom.description) {
      changes.description = { from: currentRoom.description, to: inputData.description };
    }
    if (inputData.floor !== undefined && inputData.floor !== currentRoom.floor) {
      changes.floor = { from: currentRoom.floor, to: inputData.floor };
    }
    if (inputData.facilityId !== undefined && inputData.facilityId !== currentRoom.facility_id) {
      changes.facilityId = { from: currentRoom.facility_id, to: inputData.facilityId };
    }
    if (inputData.imageUrl !== undefined && inputData.imageUrl !== currentRoom.image_url) {
      changes.imageUrl = { from: currentRoom.image_url, to: inputData.imageUrl };
    }

    if (Object.keys(changes).length > 0) {
      await createSuggestion(
        {
          type: "EDIT_ROOM",
          targetId: data.facility_id,
          status: "APPROVED",
          payload: { ...changes, roomId: id, roomCode: data.room_code, source: "ADMIN" },
        },
        client
      );

      await pruneHistory({
        targetId: data.facility_id,
        type: "EDIT_ROOM",
        limit: MAX_HISTORY_ITEMS,
        client,
      });
    }
  } else if (data) {
    await createSuggestion(
      {
        type: "EDIT_ROOM",
        targetId: data.facility_id,
        status: "APPROVED",
        payload: { ...parsed.data, roomId: id, roomCode: data.room_code, source: "ADMIN" },
      },
      client
    );

    await pruneHistory({
      targetId: data.facility_id,
      type: "EDIT_ROOM",
      limit: MAX_HISTORY_ITEMS,
      client,
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
