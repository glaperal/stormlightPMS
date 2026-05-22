// set-org-suspended — superAdmin toggles org suspension; bans/unbans all users in the org.
// SRS §5.8 / FR-ORG-2
// deno-lint-ignore-file no-explicit-any
import {
  adminClient,
  getCallerProfile,
  corsHeaders,
  jsonResponse,
  requireMethod,
} from '../_shared/auth.ts';

interface Payload {
  org_id: string;
  suspended: boolean;
}

Deno.serve(async (req) => {
  const m = requireMethod(req, 'POST');
  if (m) return m;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const caller = await getCallerProfile(req);
    if (!caller || caller.role !== 'superadmin') {
      return jsonResponse(403, { error: 'forbidden' });
    }

    const body: Payload = await req.json();
    if (!body?.org_id || typeof body.suspended !== 'boolean') {
      return jsonResponse(400, { error: 'missing_fields' });
    }

    const admin = adminClient();
    const banUntil = body.suspended ? '2999-12-31T23:59:59.000Z' : 'none';

    // Update org status
    const { error: orgErr } = await admin
      .from('organizations')
      .update({ status: body.suspended ? 'suspended' : 'active' })
      .eq('id', body.org_id);
    if (orgErr) return jsonResponse(400, { error: orgErr.message });

    // Fetch all profiles in the org, ban / unban each
    const { data: profs, error: profErr } = await admin
      .from('profiles')
      .select('id')
      .eq('org_id', body.org_id);
    if (profErr) return jsonResponse(400, { error: profErr.message });

    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const p of (profs ?? []) as { id: string }[]) {
      const { error } = await admin.auth.admin.updateUserById(p.id, {
        ban_duration: banUntil,
      } as any);
      results.push({ id: p.id, ok: !error, error: error?.message });
    }

    return jsonResponse(200, { org_id: body.org_id, suspended: body.suspended, results });
  } catch (e) {
    return jsonResponse(500, { error: (e as Error).message });
  }
});
