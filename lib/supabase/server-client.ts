import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let serviceClient: SupabaseClient | null = null;

const assertEnv = () => {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
};
const assertServiceEnv = () => {
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
};

export const getSupabaseServerClient = async () => {
  assertEnv();
  const cookieStoreMaybePromise = cookies();

  const cookieStore =
    cookieStoreMaybePromise instanceof Promise
      ? await cookieStoreMaybePromise
      : cookieStoreMaybePromise;

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // In server components, cookies() returns a read-only store; ignore if setting is unsupported.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (cookieStore as any).set?.(name, value, options);
          });
        } catch {
          // swallow errors in read-only contexts
        }
      },
    },
  });
};

export const getSupabaseServiceRoleClient = () => {
  if (serviceClient) return serviceClient;
  assertServiceEnv();
  serviceClient = createClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return serviceClient;
};
