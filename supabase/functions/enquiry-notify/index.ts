// Database-webhook receiver. Configure Supabase Database Webhooks (INSERT) on
//   public.messages and public.project_messages -> this function, with the header
//   Authorization: Bearer <ENQUIRY_WEBHOOK_SECRET>
// Deploy WITHOUT gateway JWT verification; the shared secret is the check:
//   supabase functions deploy enquiry-notify --no-verify-jwt
// The payload is only used to find the row id; content is re-read from the database.
import { HttpError, jsonResponse, safeErrorResponse } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

function equalSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length || x.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'POST required.');
    const secret = (Deno.env.get('ENQUIRY_WEBHOOK_SECRET') || '').trim();
    const supplied = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!secret || !equalSecret(secret, supplied)) throw new HttpError(401, 'unauthorized', 'Unauthorised.');

    const payload = await request.json().catch(() => null) as { type?: string; table?: string; record?: { id?: string } } | null;
    if (!payload || payload.type !== 'INSERT' || !payload.record?.id) throw new HttpError(400, 'invalid_payload', 'Unsupported payload.');

    const service = createServiceClient();
    const adminTo = (Deno.env.get('ADMIN_NOTIFY_EMAIL') || '').trim();
    const site = (Deno.env.get('MEMBER_SITE_URL') || '').replace(/\/$/, '');

    if (payload.table === 'messages') {
      const { data } = await service.from('messages').select('id,name,contact_info,message,created_at').eq('id', payload.record.id).maybeSingle();
      if (!data || !adminTo) return jsonResponse(request, { ok: true, notification: adminTo ? 'skipped' : 'not_configured' });
      const sent = await sendTransactionalEmail(service, {
        event: 'admin_new_contact_message', to: adminTo,
        data: { name: data.name, contact: data.contact_info, message: data.message, submittedAt: data.created_at, recordId: data.id },
        actionUrl: `${site}/dashboard/messages.html`,
      });
      return jsonResponse(request, { ok: true, notification: sent ? 'sent' : 'failed' });
    }

    if (payload.table === 'project_messages') {
      const { data: msg } = await service.from('project_messages')
        .select('id,project_id,sender_role,kind,body,created_at').eq('id', payload.record.id).maybeSingle();
      if (!msg || msg.kind !== 'message') return jsonResponse(request, { ok: true, notification: 'skipped' });
      const { data: project } = await service.from('client_projects').select('title,member_id').eq('id', msg.project_id).maybeSingle();
      if (!project) return jsonResponse(request, { ok: true, notification: 'skipped' });

      if (msg.sender_role === 'client') {
        if (!adminTo) return jsonResponse(request, { ok: true, notification: 'not_configured' });
        const sent = await sendTransactionalEmail(service, {
          event: 'admin_new_project_message', to: adminTo,
          data: { project: project.title, message: msg.body, submittedAt: msg.created_at },
          actionUrl: `${site}/dashboard/projects.html`,
        });
        return jsonResponse(request, { ok: true, notification: sent ? 'sent' : 'failed' });
      }

      // Admin reply -> the project's own member (address read from Auth, never from the payload).
      const { data: user } = await service.auth.admin.getUserById(project.member_id);
      const to = user?.user?.email;
      if (!to) return jsonResponse(request, { ok: true, notification: 'skipped' });
      const sent = await sendTransactionalEmail(service, {
        event: 'client_new_project_message', to,
        data: { project: project.title }, // message body is not e-mailed; read it in the portal
        actionUrl: `${site}/account/`,
      });
      return jsonResponse(request, { ok: true, notification: sent ? 'sent' : 'failed' });
    }

    throw new HttpError(400, 'unsupported_table', 'Unsupported table.');
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
