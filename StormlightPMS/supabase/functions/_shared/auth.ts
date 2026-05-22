// Shared utilities for Edge Functions.
// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const ALLOWED_ROLES = ['admin', 'property_manager', 'superadmin'] as const;
export type Role = (typeof ALLOWED_ROLES)[number];

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json',
  };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface CallerProfile {
  id: string;
  role: Role | null;
  org_id: string | null;
  status: string | null;
}

export async function getCallerProfile(req: Request): Promise<CallerProfile | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY required');

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userResp, error } = await client.auth.getUser(token);
  if (error || !userResp?.user) return null;

  const admin = adminClient();
  const { data: prof } = await admin
    .from('profiles')
    .select('id, role, org_id, status')
    .eq('id', userResp.user.id)
    .maybeSingle();
  return (prof as any) ?? null;
}

export function requireMethod(req: Request, method: string): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }
  if (req.method !== method) {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }
  return null;
}
