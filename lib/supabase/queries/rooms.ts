import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { roomSchema } from "@/lib/validation";
import {
  getSupabaseBrowserClient,
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "../index";

type RoomRow = {
  id: string;
  building_id: string;
  room_code: string;
  name: string | null;
  description: string | null;
  floor: number | null;
  created_at: string;
  updated_at: string;
};

type BuildingSummary = {
  id: string;
  name: string;
  code: string;
};

type RoomRowWithBuilding = RoomRow & {
  building: BuildingSummary | null;
};

type BaseResult<T> = { data: T | null; error: PostgrestError | null };
type MaybeClient = SupabaseClient | Promise<SupabaseClient>;

const selectBase = () =>
  "id, building_id, room_code, name, description, floor, created_at, updated_at";
const selectWithBuilding = () =>
  `${selectBase()}, building:buildings(id, name, code)`;

const toPostgrestError = (message: string): PostgrestError => ({
  name: "PostgrestError",
  message,
  details: "",
  hint: "",
  code: "PGRST_INVALID_INPUT",
});

const normalizeError = (error: PostgrestError | null) =>
  error ? { ...error, message: "Unable to complete room request" } : null;

const resolveClient = async (client?: MaybeClient) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

const mapInsert = (payload: unknown) => {
  const parsed = roomSchema.parse(payload);
  return {
    building_id: parsed.buildingId,
    room_code: parsed.roomCode,
    name: parsed.name || null,
    description: parsed.description || null,
    floor: parsed.floor ?? null,
  };
};

const mapUpdate = (payload: unknown) => {
  const parsed = roomSchema.partial().parse(payload);
  const patch: Record<string, unknown> = {};

  if (parsed.buildingId !== undefined) patch.building_id = parsed.buildingId;
  if (parsed.roomCode !== undefined) patch.room_code = parsed.roomCode;
  if (parsed.name !== undefined) patch.name = parsed.name || null;
  if (parsed.description !== undefined) patch.description = parsed.description || null;
  if (parsed.floor !== undefined) patch.floor = parsed.floor;

  return patch;
};

export async function getRoomsByBuilding(params: {
  buildingId: string;
  includeBuilding?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<RoomRow[] | RoomRowWithBuilding[]>> {
  const client = await resolveClient(params.client);
  const { data, error } = await client
    .from("rooms")
    .select(params.includeBuilding ? selectWithBuilding() : selectBase())
    .eq("building_id", params.buildingId)
    .order("room_code", { ascending: true });

  return {
    data: data as RoomRow[] | RoomRowWithBuilding[] | null,
    error: normalizeError(error),
  };
}

export async function getRoomById(params: {
  id: string;
  includeBuilding?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<RoomRow | RoomRowWithBuilding>> {
  const client = await resolveClient(params.client);
  const { data, error } = await client
    .from("rooms")
    .select(params.includeBuilding ? selectWithBuilding() : selectBase())
    .eq("id", params.id)
    .maybeSingle();

  return {
    data: data as RoomRow | RoomRowWithBuilding | null,
    error: normalizeError(error),
  };
}

export async function searchRooms(params: {
  term: string;
  buildingId?: string;
  includeBuilding?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<RoomRow[] | RoomRowWithBuilding[]>> {
  const client = await resolveClient(params.client);
  const query = client
    .from("rooms")
    .select(params.includeBuilding ? selectWithBuilding() : selectBase())
    .or(`room_code.ilike.%${params.term}%,description.ilike.%${params.term}%`)
    .order("room_code", { ascending: true });

  if (params.buildingId) {
    query.eq("building_id", params.buildingId);
  }

  const { data, error } = await query;
  return {
    data: data as RoomRow[] | RoomRowWithBuilding[] | null,
    error: normalizeError(error),
  };
}

export async function createRoom(
  payload: unknown,
  client?: MaybeClient,
): Promise<BaseResult<RoomRow>> {
  try {
    const supabase = await resolveClient(client ?? getSupabaseServerClient());
    const insertPayload = mapInsert(payload);

    const { data, error } = await supabase
      .from("rooms")
      .insert(insertPayload)
      .select(selectBase())
      .single();

    return { data: data as RoomRow | null, error: normalizeError(error) };
  } catch (err) {
    return {
      data: null,
      error: toPostgrestError(err instanceof Error ? err.message : "Invalid room payload"),
    };
  }
}

export async function updateRoom(
  payload: { id: string } & Record<string, unknown>,
  client?: MaybeClient,
): Promise<BaseResult<RoomRow>> {
  const { id, ...rest } = payload;

  try {
    const supabase = await resolveClient(client ?? getSupabaseServerClient());
    const updatePayload = mapUpdate(rest);

    const { data, error } = await supabase
      .from("rooms")
      .update(updatePayload)
      .eq("id", id)
      .select(selectBase())
      .single();

    return { data: data as RoomRow | null, error: normalizeError(error) };
  } catch (err) {
    return {
      data: null,
      error: toPostgrestError(err instanceof Error ? err.message : "Invalid room payload"),
    };
  }
}

export async function deleteRoom(
  id: string,
  useServiceRole = false,
): Promise<BaseResult<RoomRow>> {
  const supabase = useServiceRole
    ? await resolveClient(getSupabaseServiceRoleClient())
    : await resolveClient(getSupabaseServerClient());

  const { data, error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", id)
    .select(selectBase())
    .single();

  return { data: data as RoomRow | null, error: normalizeError(error) };
}