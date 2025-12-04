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

function extractSuggestionName(payload: Record<string, unknown> | null): string {
  if (!payload) return "Unnamed suggestion";

  const nameField = payload.name;
  if (nameField) {
    if (typeof nameField === "object" && nameField !== null && "to" in nameField) {
      return String((nameField as { to: unknown }).to);
    }
    return String(nameField);
  }

  const roomCodeField = payload.roomCode;
  if (roomCodeField) {
    if (typeof roomCodeField === "object" && roomCodeField !== null && "to" in roomCodeField) {
      return `Room ${String((roomCodeField as { to: unknown }).to)}`;
    }
    return `Room ${String(roomCodeField)}`;
  }

  return "Unnamed suggestion";
}

export async function getAdminStats(): Promise<AdminStats> {
  let client;
  try {
    const admin = await getSupabaseAdminClient({ requireServiceRole: true });
    client = admin.client;
  } catch (error) {
    console.error("Failed to get admin client for stats:", error);
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin dashboard. Add it to .env.local and restart."
    );
  }

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
  let client;
  try {
    const admin = await getSupabaseAdminClient({ requireServiceRole: true });
    client = admin.client;
  } catch (error) {
    console.error("Failed to get admin client for submissions:", error);
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin dashboard. Add it to .env.local and restart."
    );
  }

  const { data } = await client
    .from("suggestions")
    .select("id, payload, status, type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (
    data?.map((row) => {
      const payload = row.payload as Record<string, unknown> | null;
      const name = extractSuggestionName(payload);

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
