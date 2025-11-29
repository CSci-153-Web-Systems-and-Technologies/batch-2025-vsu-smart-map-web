import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { FACILITY_TYPES } from "@/lib/constants/facilities";
import { facilitySchema, safeValidate } from "@/lib/validation";
import type { Facility, FacilityInput, FacilityUpdateInput } from "@/lib/types/facility";
import { getSupabaseBrowserClient } from "../browser-client";

type FacilityType = (typeof FACILITY_TYPES)[number];

type FacilityRow = {
  id: string;
  name: string;
  type: FacilityType;
  description: string | null;
  building_id: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type BaseResult<T> = { data: T | null; error: PostgrestError | null };
type MaybeClient = SupabaseClient | Promise<SupabaseClient>;

const selectBase = () =>
  "id, name, type, description, building_id, latitude, longitude, is_active, created_at, updated_at";

const normalizeError = (error: PostgrestError | null) =>
  error ? { ...error, message: "Unable to complete facility request" } : null;

const resolveClient = async (client?: MaybeClient) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

const loadServerClient = async () =>
  (await import("../server-client")).getSupabaseServerClient();

const toFacility = (row: FacilityRow): Facility => ({
  id: row.id,
  name: row.name,
  type: row.type,
  description: row.description ?? undefined,
  buildingId: row.building_id,
  coordinates: { lat: row.latitude, lng: row.longitude },
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapInsertPayload = (input: FacilityInput) => ({
  name: input.name,
  type: input.type,
  description: input.description || null,
  building_id: input.buildingId || null,
  latitude: input.coordinates.lat,
  longitude: input.coordinates.lng,
  is_active: input.isActive ?? true,
});

const mapUpdatePayload = (input: FacilityUpdateInput) => {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.type !== undefined) patch.type = input.type;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.buildingId !== undefined) patch.building_id = input.buildingId || null;
  if (input.coordinates) {
    patch.latitude = input.coordinates.lat;
    patch.longitude = input.coordinates.lng;
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  return patch;
};

export async function getFacilities(params?: {
  type?: FacilityType | FacilityType[];
  isActive?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<Facility[]>> {
  const client = await resolveClient(params?.client);
  const query = client.from("facilities").select(selectBase());

  if (params?.type) {
    if (Array.isArray(params.type)) {
      query.in("type", params.type);
    } else {
      query.eq("type", params.type);
    }
  }

  const { data, error } = await query.order("name", { ascending: true });
  const rows = data as FacilityRow[] | null;
  return { data: rows ? rows.map(toFacility) : null, error: normalizeError(error) };
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

export async function createFacility(
  payload: unknown,
  client?: MaybeClient,
): Promise<BaseResult<Facility>> {
  const parsed = safeValidate(facilitySchema, payload);
  if (!parsed.success) {
    return {
      data: null,
      error: {
        name: "ValidationError",
        message: parsed.errors.join("; "),
        details: "",
        hint: "",
        code: "VALIDATION_FAILED",
      } as PostgrestError,
    };
  }

  const supabase = await resolveClient(client ?? loadServerClient());
  const insertPayload = mapInsertPayload(parsed.data);
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
  payload: unknown,
  client?: MaybeClient,
): Promise<BaseResult<Facility>> {
  const parsed = safeValidate(facilitySchema.partial(), payload);
  if (!parsed.success) {
    return {
      data: null,
      error: {
        name: "ValidationError",
        message: parsed.errors.join("; "),
        details: "",
        hint: "",
        code: "VALIDATION_FAILED",
      } as PostgrestError,
    };
  }

  const supabase = await resolveClient(client ?? loadServerClient());
  const updatePayload = mapUpdatePayload(parsed.data);

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
  const supabase = await resolveClient(client ?? loadServerClient());
  const { data, error } = await supabase
    .from("facilities")
    .delete()
    .eq("id", id)
    .select(selectBase())
    .maybeSingle();

  const row = data as FacilityRow | null;
  return { data: row ? toFacility(row) : null, error: normalizeError(error) };
}

export async function upsertFacilitiesBulk(
  payloads: unknown[],
  client?: MaybeClient,
): Promise<BaseResult<Facility[]>> {
  const parsed = safeValidate(facilitySchema.array(), payloads);
  if (!parsed.success) {
    return {
      data: null,
      error: {
        name: "ValidationError",
        message: parsed.errors.join("; "),
        details: "",
        hint: "",
        code: "VALIDATION_FAILED",
      } as PostgrestError,
    };
  }

  const supabase = await resolveClient(client ?? loadServerClient());
  const insertPayloads = parsed.data.map(mapInsertPayload);
  const { data, error } = await supabase
    .from("facilities")
    .upsert(insertPayloads, { onConflict: "id" })
    .select(selectBase());

  const rows = data as FacilityRow[] | null;
  return { data: rows ? rows.map(toFacility) : null, error: normalizeError(error) };
}
