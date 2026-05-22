import { createClient } from '@supabase/supabase-js';

// We intentionally omit the generated Database generic until
// `supabase gen types typescript` has been run. The placeholder shape would
// collapse Insert/Update args to `never`. Once types are generated, swap the
// `createClient(...)` line for `createClient<Database>(...)`.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = Boolean(url && anonKey);
if (!SUPABASE_CONFIGURED) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing. The app will boot but all data calls will fail. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
  );
}

// Fall back to a valid placeholder URL so createClient does not throw on `new URL('')`.
const effectiveUrl = url || 'https://placeholder.supabase.co';
const effectiveAnonKey = anonKey || 'placeholder-anon-key';

export const supabase = createClient(effectiveUrl, effectiveAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
