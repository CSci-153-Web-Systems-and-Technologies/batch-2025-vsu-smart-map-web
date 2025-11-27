import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { BUILDING_CATEGORIES } from "@/lib/constants";
import { buildingSchema } from "@/lib/validation";
import { getSupabaseBrowserClient } from "../browser-client";

type BuildingCategory = (typeof BUILDING_CATEGORIES)[number];

type BuildingRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: BuildingCategory;
  email: string | null;
  phone: string | null;
  facebook: string | null;
  website: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  lat: number;
  lng: number;
  address: string | null;
  tags: string[] | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

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

type BuildingRowWithRooms = BuildingRow & {
  rooms: RoomRow[] | null;
};

type BaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type MaybeClient = SupabaseClient | Promise<SupabaseClient>;

const selectBase = () =>
  "id, code, name, description, category, email, phone, facebook, website, hero_image_url, hero_image_alt, lat, lng, address, tags, is_featured, created_at, updated_at";

const selectWithRooms = () =>
  `${selectBase()}, rooms ( id, building_id, room_code, name, description, floor, created_at, updated_at )`;

const toPostgrestError = (message: string): PostgrestError => ({
  name: "PostgrestError",
  message,
  details: "",
  hint: "",
  code: "PGRST_INVALID_INPUT",
});

const normalizeError = (error: PostgrestError | null) =>
  error ? { ...error, message: "Unable to complete building request" } : null;

const resolveClient = async (client?: MaybeClient) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

const loadServerClient = async () =>
  (await import("../server-client")).getSupabaseServerClient();

const loadServiceRoleClient = async () =>
  (await import("../server-client")).getSupabaseServiceRoleClient();

const mapToDbPayload = (payload: unknown) => {
  const parsed = buildingSchema.parse(payload);
  return {
    code: parsed.code,
    name: parsed.name,
    description: parsed.description || null,
    category: parsed.category,
    email: parsed.contacts?.email || null,
    phone: parsed.contacts?.phone || null,
    facebook: parsed.contacts?.facebook || null,
    website: parsed.contacts?.website || null,
    hero_image_url: parsed.heroImage?.src || null,
    hero_image_alt: parsed.heroImage?.alt || null,
    lat: parsed.coordinates.lat,
    lng: parsed.coordinates.lng,
    address: parsed.address || null,
    tags: parsed.tags ?? [],
    is_featured: parsed.isFeatured ?? false,
  };
};

const mapToDbUpdatePayload = (payload: unknown) => {
  const parsed = buildingSchema.partial().parse(payload);
  const patch: Record<string, unknown> = {};

  if (parsed.code !== undefined) patch.code = parsed.code;
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.description !== undefined) patch.description = parsed.description || null;
  if (parsed.category !== undefined) patch.category = parsed.category;

  if (parsed.contacts) {
    patch.email = parsed.contacts.email || null;
    patch.phone = parsed.contacts.phone || null;
    patch.facebook = parsed.contacts.facebook || null;
    patch.website = parsed.contacts.website || null;
  }

  if (parsed.heroImage) {
    patch.hero_image_url = parsed.heroImage.src || null;
    patch.hero_image_alt = parsed.heroImage.alt || null;
  }

  if (parsed.coordinates) {
    patch.lat = parsed.coordinates.lat;
    patch.lng = parsed.coordinates.lng;
  }

  if (parsed.address !== undefined) patch.address = parsed.address || null;
  if (parsed.tags !== undefined) patch.tags = parsed.tags;
  if (parsed.isFeatured !== undefined) patch.is_featured = parsed.isFeatured;

  return patch;
};

export async function getBuildings(options?: {
  category?: BuildingCategory;
  featured?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<BuildingRow[]>> {
  const client = await resolveClient(options?.client);
  const query = client.from("buildings").select(selectBase());

  if (options?.category) {
    query.eq("category", options.category);
  }
  if (options?.featured !== undefined) {
    query.eq("is_featured", options.featured);
  }

  const { data, error } = await query.order("name", { ascending: true });
  return { data: data as BuildingRow[] | null, error: normalizeError(error) };
}

export async function getBuildingById(params: {
  id: string;
  withRooms?: boolean;
  client?: MaybeClient;
}): Promise<BaseResult<BuildingRow | BuildingRowWithRooms>> {
  const { id, withRooms = false } = params;
  const client = await resolveClient(params.client);

  const { data, error } = await client
    .from("buildings")
    .select(withRooms ? selectWithRooms() : selectBase())
    .eq("id", id)
    .maybeSingle();

  return {
    data: data as BuildingRow | BuildingRowWithRooms | null,
    error: normalizeError(error),
  };
}

export async function searchBuildings(params: {
  term: string;
  category?: BuildingCategory;
  client?: MaybeClient;
}): Promise<BaseResult<BuildingRow[]>> {
  const { term, category } = params;
  const client = await resolveClient(params.client);

  const query = client
    .from("buildings")
    .select(selectBase())
    .ilike("name", `%${term}%`)
    .order("name", { ascending: true });

  if (category) {
    query.eq("category", category);
  }

  const { data, error } = await query;
  return { data: data as BuildingRow[] | null, error: normalizeError(error) };
}

export async function createBuilding(
  payload: unknown,
  client?: MaybeClient,
): Promise<BaseResult<BuildingRow>> {
  try {
    const supabase = await resolveClient(client ?? loadServerClient());
    const insertPayload = mapToDbPayload(payload);

    const { data, error } = await supabase
      .from("buildings")
      .insert(insertPayload)
      .select(selectBase())
      .single();

    return { data: data as BuildingRow | null, error: normalizeError(error) };
  } catch (err) {
    return {
      data: null,
      error: toPostgrestError(
        err instanceof Error ? err.message : "Invalid building payload",
      ),
    };
  }
}

export async function updateBuilding(
  payload: { id: string } & Record<string, unknown>,
  client?: MaybeClient,
): Promise<BaseResult<BuildingRow>> {
  const { id, ...rest } = payload;

  try {
    const supabase = await resolveClient(client ?? loadServerClient());
    const updatePayload = mapToDbUpdatePayload(rest);

    const { data, error } = await supabase
      .from("buildings")
      .update(updatePayload)
      .eq("id", id)
      .select(selectBase())
      .single();

    return { data: data as BuildingRow | null, error: normalizeError(error) };
  } catch (err) {
    return {
      data: null,
      error: toPostgrestError(
        err instanceof Error ? err.message : "Invalid building payload",
      ),
    };
  }
}

export async function deleteBuilding(
  id: string,
  useServiceRole = false,
): Promise<BaseResult<BuildingRow>> {
  const supabase = useServiceRole
    ? await resolveClient(loadServiceRoleClient())
    : await resolveClient(loadServerClient());

  const { data, error } = await supabase
    .from("buildings")
    .delete()
    .eq("id", id)
    .select(selectBase())
    .single();

  return { data: data as BuildingRow | null, error: normalizeError(error) };
}
