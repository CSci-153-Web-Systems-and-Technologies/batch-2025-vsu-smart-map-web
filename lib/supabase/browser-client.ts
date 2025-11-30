import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

const assertEnv = () => {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
};

export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient;
  assertEnv();
  browserClient = createSupabaseClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
};

export const createClient = getSupabaseBrowserClient;