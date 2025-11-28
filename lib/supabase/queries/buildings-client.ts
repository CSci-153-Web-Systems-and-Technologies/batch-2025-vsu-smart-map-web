import type { SupabaseClient } from "@supabase/supabase-js";
import { BUILDING_CATEGORIES } from "@/lib/constants";
import { getSupabaseBrowserClient } from "../browser-client";

type BuildingCategory = (typeof BUILDING_CATEGORIES)[number];

type BuildingRow = {
  id: string;
  code: string;
  name: string;
  category: BuildingCategory;
  lat: number;
  lng: number;
};

type BaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const selectBase = () => "id, code, name, category, lat, lng";

const normalizeError = (error: { message: string } | null) =>
  error ? { ...error, message: "Unable to complete building request" } : null;

const resolveClient = async (client?: SupabaseClient | Promise<SupabaseClient>) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

export async function getBuildingsClient(options?: {
  category?: BuildingCategory;
  featured?: boolean;
  client?: SupabaseClient | Promise<SupabaseClient>;
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
