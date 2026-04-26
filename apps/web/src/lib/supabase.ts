import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

/** Browser-side Supabase client. Use for auth only — never use service role here. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Returns the current session's access token, or null if not authenticated. */
export const getAccessToken = async (): Promise<string | null> => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
};
