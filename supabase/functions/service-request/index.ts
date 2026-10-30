// Public endpoint: validates, rate-limits, stores and announces a service request.
// Deploy WITHOUT gateway JWT verification (visitors are anonymous):
//   supabase functions deploy service-request --no-verify-jwt
// The database row is the source of truth; e-mail is a notification only.
import { assertAllowedOrigin, getClientIp, getUserAgent, HttpError, jsonResponse, normalizeEmail, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { sha256Hex } from '../_shared/crypto.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Strip control characters (including CR/LF) and collapse whitespace.
function clean(value: unknown, max: number, multiline = false): string {
  const text = String(value ?? '');
  const stripped = multiline
    ? text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : text.replace(/[\u0000-\u001F\u007F]/g, ' ');
  return stripped.replace(multiline ? /[ \t]+/g : /\s+/g, ' ').trim().slice(0, max);
}

async function allow(service: ReturnType<typeof createServiceClient>, key: string, limit: number, windowSeconds: number) {
  const { data, error } = await service.rpc('enquiry_rate_limit_consume', {
    p_key_hash: await sha256Hex(key), p_limit: limit, p_window_seconds: windowSeconds,
  });
  if (error) throw new HttpError(503, 'rate_limit_unavailable', 'The request could not be checked safely.');
  if (data !== true) throw new HttpError(429, 'too_many_requests', 'Too many requests. Please try again later.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);
    const body = await parseJson<Record<string, unknown>>(request);

    // Honeypot: bots fill hidden fields. Pretend success, store nothing.
    if (clean(body.website, 200)) return jsonResponse(request, { ok: true, reference: null, notification: 'not_sent' }, 202);

    const name = clean(body.name, 120);
    const email = normalizeEmail(body.email);
    const phone = clean(body.phone, 40) || null;
    const service = clean(body.service, 200);
    const requirements = clean(body.requirements, 5000, true);
    const timeline = clean(body.timeline, 200) || null;
    const budget = clean(body.budget, 120) || null;
    const extra = clean(body.extra, 3000, true) || null;
    const clientToken = UUID.test(String(body.clientToken || '')) ? String(body.clientToken).toLowerCase() : null;

    if (!name || !EMAIL.test(email) || email.length > 320 || !service || !requirements) {
      throw new HttpError(400, 'invalid_request', 'Name, a valid email, a service and your requirements are required.');
    }

    const service_ = createServiceClient();
    await allow(service_, `sr-ip:${getClientIp(request)}`, 5, 3600);
    await allow(service_, `sr-email:${email}`, 5, 86400);

    // Logged-in, ACTIVE client? Link the request to their verified account (identity comes from the
    // signed session token, never from a matching e-mail address). Anything else stays anonymous.
    let memberId: string | null = null;
    let accountEmail: string | null = null;
    const jwt = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (jwt) {
      const { data: auth } = await service_.auth.getUser(jwt);
      if (auth?.user) {
        const { data: mp } = await service_.from('member_profiles').select('status').eq('user_id', auth.user.id).maybeSingle();
        if (mp?.status === 'active') { memberId = auth.user.id; accountEmail = auth.user.email ?? null; }
      }
    }

    const { data: row, error } = await service_
      .from('service_requests')
      .insert({ name, email: accountEmail || email, phone, service_name: service, requirements, timeline, budget, extra, client_token: clientToken, member_id: memberId })
      .select('id,reference')
      .single();

    if (error) {
      // Unique violation on client_token = the same submission arriving twice.
      if (error.code === '23505' && clientToken) {
        const { data: existing } = await service_.from('service_requests')
          .select('reference').eq('client_token', clientToken).maybeSingle();
        return jsonResponse(request, { ok: true, reference: existing?.reference ?? null, duplicate: true, notification: 'already_handled' }, 200);
      }
      throw new HttpError(500, 'save_failed', 'Your request could not be saved. Please try again.');
    }

    // ---- notifications (best effort; never discard the saved request) ----
    const adminTo = (Deno.env.get('ADMIN_NOTIFY_EMAIL') || '').trim();
    let notification: 'sent' | 'failed' | 'not_configured' = 'not_configured';
    let emailError: string | null = null;

    if (adminTo) {
      const delivered = await sendTransactionalEmail(service_, {
        event: 'admin_new_service_request',
        to: adminTo, // fixed by server configuration, never by the visitor
        subjectId: null,
        userAgent: getUserAgent(request),
        data: { reference: row.reference, name, email, phone, service, requirements, timeline, budget, extra, submittedAt: new Date().toISOString() },
        actionUrl: `${(Deno.env.get('MEMBER_SITE_URL') || '').replace(/\/$/, '')}/dashboard/requests.html`,
      });
      notification = delivered ? 'sent' : 'failed';
      if (!delivered) emailError = 'Notification webhook did not accept the message.';
    } else {
      emailError = 'ADMIN_NOTIFY_EMAIL or the e-mail webhook is not configured.';
    }

    if (Deno.env.get('SEND_CLIENT_ACKNOWLEDGEMENT') === 'true' && notification !== 'not_configured') {
      // Fixed template: only the generated reference is included.
      await sendTransactionalEmail(service_, {
        event: 'client_service_request_received', to: email, data: { reference: row.reference }, userAgent: getUserAgent(request),
      });
    }

    await service_.from('service_requests').update({ email_status: notification, email_error: emailError }).eq('id', row.id);

    return jsonResponse(request, { ok: true, reference: row.reference, notification }, 201);
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});