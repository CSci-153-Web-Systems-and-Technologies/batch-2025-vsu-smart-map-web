import { getSupabaseAdminClient } from "@/lib/supabase/server-client";

export type AdminStats = {
  facilities: number;
  rooms: number;
  pendingSubmissions: number;
};

export type AdminSubmission = {
  id: string;
  type: string;
  suggestedName: string;
  status: string;
  createdAt: string;
  source?: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const { client } = await getSupabaseAdminClient({ requireServiceRole: true }).catch((error) => {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin dashboard. Add it to .env.local and restart.",
      { cause: error },
    );
  });

  const [{ count: facilities }, { count: rooms }, { count: pendingSubmissions }] =
    await Promise.all([
      client.from("facilities").select("id", { count: "exact", head: true }),
      client.from("rooms").select("id", { count: "exact", head: true }),
      client
        .from("suggestions")
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
  const { client } = await getSupabaseAdminClient({ requireServiceRole: true }).catch((error) => {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin dashboard. Add it to .env.local and restart.",
      { cause: error },
    );
  });

  const { data } = await client
    .from("suggestions")
    .select("id, payload, status, type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (
    data?.map((row) => {
      const payload = row.payload as Record<string, unknown> | null;
      let name = "Unnamed suggestion";

      if (payload?.name) {
        if (typeof payload.name === "object" && payload.name !== null && "to" in payload.name) {
          name = String((payload.name as { to: unknown }).to);
        } else {
          name = String(payload.name);
        }
      } else if (payload?.roomCode) {
        if (typeof payload.roomCode === "object" && payload.roomCode !== null && "to" in payload.roomCode) {
          name = `Room ${String((payload.roomCode as { to: unknown }).to)}`;
        } else {
          name = `Room ${String(payload.roomCode)}`;
        }
      }

      return {
        id: row.id,
        type: row.type,
        suggestedName: name,
        status: row.status,
        createdAt: row.created_at,
        source: (payload?.source as string) ?? "USER",
      };
    }) ?? []
  );
}
