import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getWebSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  // Estas variables son inyectadas por Next.js en runtime
  // No las accedas en tiempo de compilación
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || !key) {
    const missing = !url ? "NEXT_PUBLIC_SUPABASE_URL" : "NEXT_PUBLIC_SUPABASE_ANON_KEY";
    throw new Error(
      `Missing environment variable: ${missing}. ` +
      `Make sure it's set in .env.local and the dev server has been restarted.`
    );
  }

  _client = createClient(url, key);
  return _client;
}
