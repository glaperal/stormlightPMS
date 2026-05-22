// send-email — caller-scoped wrapper around Resend.
// deno-lint-ignore-file no-explicit-any
import {
  corsHeaders,
  getCallerProfile,
  jsonResponse,
  requireMethod,
} from '../_shared/auth.ts';
import { sendEmail } from '../_shared/email.ts';

Deno.serve(async (req) => {
  const m = requireMethod(req, 'POST');
  if (m) return m;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const caller = await getCallerProfile(req);
    if (!caller) return jsonResponse(401, { error: 'unauthorized' });
    const body = (await req.json()) as { to: string; subject: string; html: string; text?: string };
    if (!body?.to || !body?.subject || !body?.html) {
      return jsonResponse(400, { error: 'missing_fields' });
    }
    const res = await sendEmail(body);
    if (res.error) return jsonResponse(500, res);
    return jsonResponse(200, res);
  } catch (e) {
    return jsonResponse(500, { error: (e as Error).message });
  }
});
