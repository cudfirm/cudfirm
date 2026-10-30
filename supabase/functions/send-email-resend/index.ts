// Bridges CUDFIRM e-mail events to Resend (https://resend.com).
// Deploy:  supabase functions deploy send-email-resend --no-verify-jwt
// Secrets: RESEND_API_KEY, MEMBER_EMAIL_WEBHOOK_SECRET (shared with the other functions),
//          optional RESEND_FROM (default "CUDFIRM <onboarding@resend.dev>").
// Returns 200 ONLY when Resend accepted the message.
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const clean = (v: unknown, max = 200) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, max);

function compose(event: string, d: Record<string, unknown>, url?: string) {
  const rows = (pairs: [string, unknown][]) => pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  switch (event) {
    case 'admin_new_service_request':
      return { subject: `New service request ${clean(d.reference)}: ${clean(d.service, 80)}`,
        text: rows([['Reference', d.reference], ['Service', d.service], ['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Timeline', d.timeline], ['Budget', d.budget], ['Submitted', d.submittedAt], ['Requirements', d.requirements], ['More info', d.extra], ['Dashboard', url]]) };
    case 'admin_new_contact_message':
      return { subject: `New contact message from ${clean(d.name, 60)}`,
        text: rows([['Name', d.name], ['Contact', d.contact], ['Submitted', d.submittedAt], ['Message', d.message], ['Dashboard', url]]) };
    case 'admin_new_project_message':
      return { subject: `New client message on project: ${clean(d.project, 80)}`, text: rows([['Project', d.project], ['Message', d.message], ['Dashboard', url]]) };
    case 'client_new_project_message':
      return { subject: `New message about your project: ${clean(d.project, 80)}`, text: `You have a new message from CUDFIRM.\nOpen your client portal to read it: ${url || ''}` };
    case 'client_service_request_received':
      return { subject: `We received your request ${clean(d.reference)}`, text: `Thank you. Your request ${clean(d.reference)} has been received. This is not yet a confirmed booking; we will review it and reply.` };
    default:
      return { subject: `CUDFIRM notification: ${clean(event, 60)}`, text: rows(Object.entries(d).map(([k, v]) => [k, typeof v === 'string' ? v : ''] as [string, unknown]).concat([['Link', url]])) };
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = (Deno.env.get('MEMBER_EMAIL_WEBHOOK_SECRET') || '').trim();
  const supplied = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!secret || secret.length !== supplied.length || [...secret].reduce((a, c, i) => a | (c.charCodeAt(0) ^ supplied.charCodeAt(i)), 0) !== 0) {
    return new Response('Unauthorized', { status: 401 });
  }
  const key = (Deno.env.get('RESEND_API_KEY') || '').trim();
  if (!key) return new Response('RESEND_API_KEY not set', { status: 500 });

  const body = await request.json().catch(() => null) as { event?: string; to?: string; actionUrl?: string; data?: Record<string, unknown> } | null;
  if (!body?.event || !body.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) return new Response('Bad request', { status: 400 });

  const { subject, text } = compose(body.event, body.data || {}, body.actionUrl);
  const html = `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.5">${esc(text)}</div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('RESEND_FROM') || 'CUDFIRM <onboarding@resend.dev>', to: [body.to], subject, text, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) { console.error('Resend rejected the message', res.status); return new Response('Resend error', { status: 502 }); }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
