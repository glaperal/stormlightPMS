import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Console warn (not throw) so tests and early dev don't crash.
  console.warn(
    "[stormlight] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local.",
  );
}

export const supabase: SupabaseClient = createClient(
  url ?? "http://localhost:54321",
  anon ?? "public-anon-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
