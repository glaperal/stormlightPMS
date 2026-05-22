// Outbound email via Resend.
// Configure RESEND_API_KEY + RESEND_FROM in Supabase Vault / function secrets.

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<{ id?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM') ?? 'StormlightPMS <noreply@stormlight.example>';
  if (!apiKey) return { error: 'RESEND_API_KEY not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { error: `resend_failed: ${res.status} ${txt}` };
  }
  const body = (await res.json()) as { id?: string };
  return { id: body.id };
}
