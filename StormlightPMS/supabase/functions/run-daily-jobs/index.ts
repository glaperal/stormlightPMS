// run-daily-jobs — JOB-1..JOB-4 in a single fanout invoked by pg_cron via pg_net.
// SRS §9. Reads the service-role key from env (Vault).
// deno-lint-ignore-file no-explicit-any
import { adminClient, corsHeaders, jsonResponse } from '../_shared/auth.ts';
import { sendEmail } from '../_shared/email.ts';

interface NotificationRow {
  id: string;
  org_id: string;
  profile_id: string;
  notification_type: string;
  title: string;
  body: string | null;
  email_sent_at: string | null;
  profile_email?: string;
  reminder_email_enabled?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const expected = Deno.env.get('JOBS_SHARED_SECRET');
  if (expected) {
    const got = req.headers.get('x-jobs-secret') ?? '';
    if (got !== expected) return jsonResponse(401, { error: 'unauthorized' });
  }

  const admin = adminClient();

  const { data: jobs, error } = await admin.rpc('run_scheduled_jobs');
  if (error) return jsonResponse(500, { error: error.message });

  // Email fanout: unsent notifications with reminder_email_enabled true
  const { data: pending } = await admin
    .from('v_notifications_to_email')
    .select('*')
    .limit(500);

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const n of ((pending ?? []) as NotificationRow[])) {
    if (!n.profile_email) continue;
    const { id: notifId } = n;
    const send = await sendEmail({
      to: n.profile_email,
      subject: n.title,
      html: `<p>${escapeHtml(n.title)}</p>${n.body ? `<p>${escapeHtml(n.body)}</p>` : ''}`,
    });
    if (send.error) {
      results.push({ id: notifId, ok: false, error: send.error });
    } else {
      await admin
        .from('notifications')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', notifId);
      results.push({ id: notifId, ok: true });
    }
  }

  return jsonResponse(200, { ok: true, jobs, emails: results.length });
});

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
