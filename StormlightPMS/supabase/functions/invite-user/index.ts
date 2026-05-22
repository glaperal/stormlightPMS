// invite-user — superAdmin invites first Admin of an org, or Admin invites a PM within own org.
// SRS §5.1 / FR-AUTH-2 / FR-AUTH-3
// deno-lint-ignore-file no-explicit-any
import {
  adminClient,
  getCallerProfile,
  corsHeaders,
  jsonResponse,
  requireMethod,
} from '../_shared/auth.ts';

interface InvitePayload {
  email: string;
  full_name: string;
  role: 'admin' | 'property_manager';
  org_id: string;
}

Deno.serve(async (req) => {
  const m = requireMethod(req, 'POST');
  if (m) return m;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const caller = await getCallerProfile(req);
    if (!caller) return jsonResponse(401, { error: 'unauthorized' });

    const body: InvitePayload = await req.json();
    if (!body?.email || !body?.full_name || !body?.role || !body?.org_id) {
      return jsonResponse(400, { error: 'missing_fields' });
    }
    if (body.role !== 'admin' && body.role !== 'property_manager') {
      return jsonResponse(400, { error: 'invalid_role' });
    }

    // Authorization
    if (caller.role === 'superadmin') {
      // any org is ok
    } else if (caller.role === 'admin') {
      if (body.role !== 'property_manager') {
        return jsonResponse(403, { error: 'admins_can_only_invite_pms' });
      }
      if (body.org_id !== caller.org_id) {
        return jsonResponse(403, { error: 'admins_cannot_cross_org' });
      }
    } else {
      return jsonResponse(403, { error: 'forbidden' });
    }

    const admin = adminClient();

    // Ensure the org exists & is active
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .select('id, status')
      .eq('id', body.org_id)
      .maybeSingle();
    if (orgErr || !org) return jsonResponse(404, { error: 'org_not_found' });
    if ((org as any).status !== 'active') return jsonResponse(400, { error: 'org_not_active' });

    const redirectTo = Deno.env.get('SITE_URL')
      ? `${Deno.env.get('SITE_URL')}/update-password`
      : undefined;

    const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email, {
      data: {
        org_id: body.org_id,
        role: body.role,
        full_name: body.full_name,
      },
      redirectTo,
    });

    if (error) return jsonResponse(400, { error: error.message });
    return jsonResponse(200, { user_id: data?.user?.id ?? null });
  } catch (e) {
    return jsonResponse(500, { error: (e as Error).message });
  }
});
