import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { BUILDING_CATEGORIES } from "@/lib/constants";
import type { Building, BuildingWithRooms } from "@/lib/types";
import { buildingSchema } from "@/lib/validation";
import {
  getSupabaseBrowserClient,
  getSupabaseServiceRoleClient,
  getSupabaseServerClient,
} from "../index";

type BuildingInsert = Parameters<typeof buildingSchema.parse>[0];
type BuildingUpdate = Partial<BuildingInsert> & { id: string };

type QueryClient = SupabaseClient;

type BaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

const normalizeError = (error: PostgrestError | null) => {
  if (!error) return null;
  return { ...error, message: "Unable to complete building request" };
};

const selectBase = () =>
  "id, code, name, description, category, email, phone, facebook, website, hero_image_url, hero_image_alt, lat, lng, address, tags, is_featured, created_at, updated_at";

export async function getBuildings(options?: {
  category?: (typeof BUILDING_CATEGORIES)[number];
  featured?: boolean;
  withRooms?: boolean;
  client?: QueryClient;
}): Promise<BaseResult<Building[]>> {
  const client = options?.client ?? getSupabaseBrowserClient();
  const query = client.from("buildings").select(selectBase());

  if (options?.category) {
    query.eq("category", options.category);
  }
  if (options?.featured !== undefined) {
    query.eq("is_featured", options.featured);
  }

  const { data, error } = await query.order("name", { ascending: true });
  return { data, error: normalizeError(error) };
}

export async function getBuildingById(params: {
  id: string;
  withRooms?: boolean;
  client?: QueryClient;
}): Promise<BaseResult<Building | BuildingWithRooms>> {
  const { id, withRooms = false } = params;
  const client = params.client ?? getSupabaseBrowserClient();

  const select = withRooms
    ? `${selectBase()}, rooms ( id, room_code, name, description, floor, created_at, updated_at )`
    : selectBase();

  const { data, error } = await client
    .from("buildings")
    .select(select)
    .eq("id", id)
    .maybeSingle();

  return { data, error: normalizeError(error) };
}

export async function searchBuildings(params: {
  term: string;
  category?: (typeof BUILDING_CATEGORIES)[number];
  client?: QueryClient;
}): Promise<BaseResult<Building[]>> {
  const { term, category } = params;
  const client = params.client ?? getSupabaseBrowserClient();

  const query = client
    .from("buildings")
    .select(selectBase())
    .ilike("name", `%${term}%`)
    .order("name", { ascending: true });

  if (category) {
    query.eq("category", category);
  }

  const { data, error } = await query;
  return { data, error: normalizeError(error) };
}

export async function createBuilding(
  payload: BuildingInsert,
  client?: QueryClient,
): Promise<BaseResult<Building>> {
  const supabase = client ?? getSupabaseServerClient();
  const parsed = buildingSchema.parse(payload);

  const { data, error } = await supabase
    .from("buildings")
    .insert(parsed)
    .select(selectBase())
    .single();

  return { data, error: normalizeError(error) };
}

export async function updateBuilding(
  payload: BuildingUpdate,
  client?: QueryClient,
): Promise<BaseResult<Building>> {
  const supabase = client ?? getSupabaseServerClient();
  const { id, ...rest } = payload;
  const parsed = buildingSchema.partial().parse(rest);

  const { data, error } = await supabase
    .from("buildings")
    .update(parsed)
    .eq("id", id)
    .select(selectBase())
    .single();

  return { data, error: normalizeError(error) };
}

export async function deleteBuilding(
  id: string,
  useServiceRole = false,
): Promise<BaseResult<Building>> {
  const supabase = useServiceRole
    ? getSupabaseServiceRoleClient()
    : getSupabaseServerClient();

  const { data, error } = await supabase
    .from("buildings")
    .delete()
    .eq("id", id)
    .select(selectBase())
    .single();

  return { data, error: normalizeError(error) };
}
