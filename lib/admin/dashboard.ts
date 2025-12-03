import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export type AdminStats = {
  facilities: number;
  rooms: number;
  pendingSubmissions: number;
};

export type AdminSubmission = {
  id: string;
  suggestedName: string;
  status: string;
  createdAt: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const client = await getSupabaseServerClient();

  const [{ count: facilities }, { count: rooms }, { count: pendingSubmissions }] =
    await Promise.all([
      client.from("facilities").select("id", { count: "exact", head: true }),
      client.from("rooms").select("id", { count: "exact", head: true }),
      client
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING"),
    ]);

  return {
    facilities: facilities ?? 0,
    rooms: rooms ?? 0,
    pendingSubmissions: pendingSubmissions ?? 0,
  };
}

export async function getRecentSubmissions(limit = 5): Promise<AdminSubmission[]> {
  const client = await getSupabaseServerClient();
  const { data } = await client
    .from("submissions")
    .select("id, suggested_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (
    data?.map((row) => ({
      id: row.id,
      suggestedName: row.suggested_name,
      status: row.status,
      createdAt: row.created_at,
    })) ?? []
  );
}
