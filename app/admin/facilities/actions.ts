"use server";

import { revalidatePath } from "next/cache";
import { unifiedFacilitySchema } from "@/lib/validation/facility";
import { roomSchema } from "@/lib/validation/room";
import {
  createFacility,
  deleteFacility as deleteFacilityQuery,
  updateFacility,
} from "@/lib/supabase/queries/facilities";
import {
  createRoom,
  deleteRoom as deleteRoomQuery,
  updateRoom,
} from "@/lib/supabase/queries/rooms";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function createFacilityAction(input: unknown) {
  const parsed = unifiedFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await createFacility(parsed.data, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function updateFacilityAction(id: string, input: unknown) {
  const parsed = unifiedFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await updateFacility(id, parsed.data, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function deleteFacilityAction(id: string) {
  const client = await getSupabaseServerClient();
  const { error } = await deleteFacilityQuery(id, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data: true };
}

export async function createRoomAction(input: unknown) {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await createRoom(parsed.data, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function updateRoomAction(id: string, input: unknown) {
  const parsed = roomSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await updateRoom({ id, ...parsed.data }, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data };
}

export async function deleteRoomAction(id: string) {
  const client = await getSupabaseServerClient();
  const { error } = await deleteRoomQuery(id, client);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities");
  return { data: true };
}
