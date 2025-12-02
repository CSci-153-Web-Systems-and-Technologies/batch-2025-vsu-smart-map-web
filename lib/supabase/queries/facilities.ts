import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Facility,
  FacilityCategory,
  FacilityRow,
  FacilityInsert,
  FacilityUpdate,
  FacilityWithRooms,
  FacilityPOI,
} from "@/lib/types/facility";
import { FACILITY_CATEGORIES } from "@/lib/types/facility";
import { getSupabaseBrowserClient } from "../browser-client";

type BaseResult<T> = { data: T | null; error: PostgrestError | null };
type MaybeClient = SupabaseClient | Promise<SupabaseClient>;

const selectBase = () =>
  "id, code, name, slug, description, category, has_rooms, latitude, longitude, image_url, created_at, updated_at";

const normalizeError = (error: PostgrestError | null) =>
  error ? { ...error, message: "Unable to complete facility request" } : null;

const resolveClient = async (client?: MaybeClient) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

function toFacility(row: FacilityRow): Facility {
  const base = {
    id: row.id,
    code: row.code ?? undefined,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    category: row.category as FacilityCategory,
    coordinates: { lat: row.latitude, lng: row.longitude },
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.has_rooms) {
    return { ...base, hasRooms: true } as FacilityWithRooms;
  }
  return { ...base, hasRooms: false } as FacilityPOI;
}

function mapInsertPayload(input: FacilityInsert) {
  return {
    code: input.code ?? null,
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
    description: input.description ?? null,
    category: input.category,
    has_rooms: input.hasRooms,
    latitude: input.coordinates.lat,
    longitude: input.coordinates.lng,
    image_url: input.imageUrl ?? null,
  };
}

function mapUpdatePayload(input: FacilityUpdate) {
  const patch: Record<string, unknown> = {};
  if (input.code !== undefined) patch.code = input.code ?? null;
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.hasRooms !== undefined) patch.has_rooms = input.hasRooms;
  if (input.coordinates) {
    patch.latitude = input.coordinates.lat;
    patch.longitude = input.coordinates.lng;
  }
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl ?? null;
  return patch;
}

type FacilityChatContext = Pick<Facility, "id" | "name" | "category" | "description" | "code">;

export async function getFacilitiesForChat(
  client?: MaybeClient
): Promise<BaseResult<FacilityChatContext[]>> {
  const resolved = await resolveClient(client);
  const { data, error } = await resolved
    .from("facilities")
    .select("id, name, code, category, description")
    .order("name", { ascending: true });

  return {
    data: data as FacilityChatContext[] | null,
    error: normalizeError(error),
  };
}

export async function getFacilities(params?: {
  category?: FacilityCategory | FacilityCategory[];
  hasRooms?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<Facility[]>> {
  const client = await resolveClient(params?.client);
  const query = client.from("facilities").select(selectBase());

  if (params?.category) {
    if (Array.isArray(params.category)) {
      query.in("category", params.category);
    } else {
      query.eq("category", params.category);
    }
  }

  if (params?.hasRooms !== undefined) {
    query.eq("has_rooms", params.hasRooms);
  }

  const { data, error } = await query.order("name", { ascending: true });
  const rows = data as FacilityRow[] | null;
  return { data: rows ? rows.map(toFacility) : null, error: normalizeError(error) };
}

export async function getBuildings(params?: {
  category?: FacilityCategory | FacilityCategory[];
  client?: MaybeClient;
}): Promise<BaseResult<FacilityWithRooms[]>> {
  const result = await getFacilities({
    ...params,
    hasRooms: true,
  });
  return {
    data: result.data as FacilityWithRooms[] | null,
    error: result.error,
  };
}

export async function getPOIs(params?: {
  category?: FacilityCategory | FacilityCategory[];
  client?: MaybeClient;
}): Promise<BaseResult<FacilityPOI[]>> {
  const result = await getFacilities({
    ...params,
    hasRooms: false,
  });
  return {
    data: result.data as FacilityPOI[] | null,
    error: result.error,
  };
}

export async function getFacilityById(params: {
  id: string;
  client?: MaybeClient;
}): Promise<BaseResult<Facility>> {
  const client = await resolveClient(params.client);
  const { data, error } = await client
    .from("facilities")
    .select(selectBase())
    .eq("id", params.id)
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export async function getFacilityBySlug(params: {
  slug: string;
  client?: MaybeClient;
}): Promise<BaseResult<Facility>> {
  const client = await resolveClient(params.client);
  const { data, error } = await client
    .from("facilities")
    .select(selectBase())
    .eq("slug", params.slug)
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export async function createFacility(
  input: FacilityInsert,
  client?: MaybeClient,
): Promise<BaseResult<Facility>> {
  const supabase = await resolveClient(client);
  const insertPayload = mapInsertPayload(input);
  const { data, error } = await supabase
    .from("facilities")
    .insert(insertPayload)
    .select(selectBase())
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export async function updateFacility(
  id: string,
  input: FacilityUpdate,
  client?: MaybeClient,
): Promise<BaseResult<Facility>> {
  const supabase = await resolveClient(client);
  const updatePayload = mapUpdatePayload(input);

  const { data, error } = await supabase
    .from("facilities")
    .update(updatePayload)
    .eq("id", id)
    .select(selectBase())
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export async function deleteFacility(
  id: string,
  client?: MaybeClient,
): Promise<BaseResult<Facility>> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facilities")
    .delete()
    .eq("id", id)
    .select(selectBase())
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export function isValidCategory(category: string): category is FacilityCategory {
  return (FACILITY_CATEGORIES as readonly string[]).includes(category);
}
