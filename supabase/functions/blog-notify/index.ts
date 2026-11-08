// E-mails active newsletter subscribers when a blog post is published (once per post).
// Setup:
//   1. supabase functions deploy blog-notify --no-verify-jwt
//   2. Secrets: RESEND_API_KEY, RESEND_FROM (a verified-domain sender, e.g. "CUDFIRM <blog@yourdomain.com>"),
//      BLOG_WEBHOOK_SECRET (any long random string), MEMBER_SITE_URL (https://your-site), UNSUBSCRIBE_SECRET (another long random string)
//   3. Supabase Dashboard > Database > Webhooks: table public.blog_posts, events INSERT + UPDATE,
//      HTTP header  Authorization: Bearer <BLOG_WEBHOOK_SECRET>, URL = this function.
// Only the post id is taken from the payload; everything else is re-read from the database.
import { HttpError, jsonResponse, safeErrorResponse } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { unsubToken } from '../_shared/unsub.ts';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function equalSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length || x.length === 0) return false;
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'POST required.');
    const secret = (Deno.env.get('BLOG_WEBHOOK_SECRET') || '').trim();
    const supplied = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!secret || !equalSecret(secret, supplied)) throw new HttpError(401, 'unauthorized', 'Unauthorised.');

    const payload = await request.json().catch(() => null) as { type?: string; record?: { id?: number } } | null;
    const id = payload?.record?.id;
    if (!payload || !['INSERT', 'UPDATE'].includes(payload.type || '') || !id) throw new HttpError(400, 'invalid_payload', 'Unsupported payload.');

    const key = (Deno.env.get('RESEND_API_KEY') || '').trim();
    const from = (Deno.env.get('RESEND_FROM') || '').trim();
    const unsubSecret = (Deno.env.get('UNSUBSCRIBE_SECRET') || '').trim();
    const site = (Deno.env.get('MEMBER_SITE_URL') || '').replace(/\/$/, '');
    const projectUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
    if (!key || !from || !unsubSecret || !site) return jsonResponse(request, { ok: true, notification: 'not_configured' });

    const service = createServiceClient();
    // Claim the post atomically: only one invocation can flip notified_at from null.
    const { data: claimed } = await service.from('blog_posts')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'published').is('notified_at', null)
      .select('id,slug,title,summary,image_url,content_type').maybeSingle();
    if (!claimed) return jsonResponse(request, { ok: true, notification: 'skipped' });

    const { data: subs } = await service.from('subscribers').select('email').eq('status', 'active');
    const emails = (subs || []).map((s: { email: string }) => s.email).filter(Boolean);
    if (!emails.length) return jsonResponse(request, { ok: true, notification: 'no_subscribers' });

    const postUrl = `${site}/blog.html?post=${encodeURIComponent(claimed.slug)}`;
    const label = claimed.content_type === 'sponsored' ? 'New sponsored post' : 'New on the CUDFIRM blog';
    let sent = 0, failed = 0;
    for (let i = 0; i < emails.length; i += 100) {
      const batch = await Promise.all(emails.slice(i, i + 100).map(async (to: string) => {
        const t = await unsubToken(unsubSecret, to);
        const unsub = `${projectUrl}/functions/v1/newsletter-unsubscribe?e=${encodeURIComponent(to)}&t=${t}`;
        const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.55;color:#1c2218">
<p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#C8922A;font-weight:700">${esc(label)}</p>
<h1 style="font-size:24px;margin:.2em 0">${esc(claimed.title)}</h1>
${claimed.summary ? `<p>${esc(claimed.summary)}</p>` : ''}
<p><a href="${esc(postUrl)}" style="display:inline-block;background:#0B3D2E;color:#fff;padding:12px 22px;text-decoration:none;font-weight:700">Read the post</a></p>
<p style="font-size:12px;color:#7A8A72;margin-top:28px">You are receiving this because you subscribed to CUDFIRM updates. <a href="${esc(unsub)}">Unsubscribe</a></p></div>`;
        return { from, to: [to], subject: claimed.title, html,
          text: `${label}\n\n${claimed.title}\n${claimed.summary || ''}\n\nRead: ${postUrl}\n\nUnsubscribe: ${unsub}`,
          headers: { 'List-Unsubscribe': `<${unsub}>` } };
      }));
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(batch), signal: AbortSignal.timeout(20000),
      }).catch(() => null);
      if (res?.ok) sent += batch.length; else { failed += batch.length; console.error('Resend batch rejected', res?.status); }
    }
    return jsonResponse(request, { ok: true, notification: 'done', sent, failed });
  } catch (err) {
    return safeErrorResponse(request, err);
  }
});
