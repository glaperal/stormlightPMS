// set-profile-status — Admin activates/deactivates a PM (or superAdmin: any user).
// SRS §5.8 / FR-AUTH-6
// deno-lint-ignore-file no-explicit-any
import {
  adminClient,
  getCallerProfile,
  corsHeaders,
  jsonResponse,
  requireMethod,
} from '../_shared/auth.ts';

interface Payload {
  profile_id: string;
  status: 'active' | 'inactive';
}

Deno.serve(async (req) => {
  const m = requireMethod(req, 'POST');
  if (m) return m;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const caller = await getCallerProfile(req);
    if (!caller) return jsonResponse(401, { error: 'unauthorized' });
    if (caller.role !== 'admin' && caller.role !== 'superadmin') {
      return jsonResponse(403, { error: 'forbidden' });
    }

    const body: Payload = await req.json();
    if (!body?.profile_id || (body.status !== 'active' && body.status !== 'inactive')) {
      return jsonResponse(400, { error: 'invalid_payload' });
    }

    const admin = adminClient();
    const { data: target, error: tErr } = await admin
      .from('profiles')
      .select('id, org_id, role')
      .eq('id', body.profile_id)
      .maybeSingle();
    if (tErr || !target) return jsonResponse(404, { error: 'profile_not_found' });

    if (caller.role === 'admin') {
      if ((target as any).org_id !== caller.org_id) {
        return jsonResponse(403, { error: 'cannot_cross_org' });
      }
      if ((target as any).role !== 'property_manager') {
        return jsonResponse(403, { error: 'admin_can_only_toggle_pm' });
      }
    }

    const { error: upErr } = await admin
      .from('profiles')
      .update({ status: body.status })
      .eq('id', body.profile_id);
    if (upErr) return jsonResponse(400, { error: upErr.message });

    const { error: banErr } = await admin.auth.admin.updateUserById(body.profile_id, {
      ban_duration: body.status === 'inactive' ? '2999-12-31T23:59:59.000Z' : 'none',
    } as any);
    if (banErr) return jsonResponse(400, { error: banErr.message });

    return jsonResponse(200, { profile_id: body.profile_id, status: body.status });
  } catch (e) {
    return jsonResponse(500, { error: (e as Error).message });
  }
});
