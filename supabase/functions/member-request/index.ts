import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, normalizeReason, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createCallerClient, createServiceClient, requireAuthenticatedUser, userEmail } from '../_shared/supabase.ts';
import { getMemberProfile, requireActiveMember } from '../_shared/member.ts';
import { consumeRateLimit } from '../_shared/rate-limit.ts';
import { recordMemberEvent } from '../_shared/audit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const user = await requireAuthenticatedUser(request);
    const caller = createCallerClient(request);
    const service = createServiceClient();
    const profile = requireActiveMember(await getMemberProfile(service, user.id));
    const body = await parseJson<{ action?: unknown; reason?: unknown; requestId?: unknown }>(request);
    const action = String(body.action || '').trim();

    await consumeRateLimit(service, 'request_member', user.id, 10, 3600, 3600);

    if (action === 'request_closure') {
      const reason = normalizeReason(body.reason, false);
      const { data, error } = await caller
        .from('member_closure_requests')
        .insert({ member_id: user.id, reason })
        .select('id,status,requested_at')
        .single();
      if (error || !data) {
        if (error?.code === '23505') throw new HttpError(409, 'request_exists', 'A closure request is already pending.');
        throw new HttpError(500, 'closure_request_failed', 'The closure request could not be submitted.');
      }

      await service.from('member_profiles').update({ closure_requested_at: data.requested_at }).eq('user_id', user.id);
      await recordMemberEvent(service, 'member_closure_requested', {
        actorId: user.id, actorEmail: userEmail(user), subjectId: user.id, subjectEmail: userEmail(user),
        userAgent: getUserAgent(request), details: { requestId: data.id },
      });
      return jsonResponse(request, { ok: true, request: data }, 201);
    }

    if (action === 'request_export') {
      const { data, error } = await caller
        .from('member_export_requests')
        .insert({ member_id: user.id })
        .select('id,status,requested_at')
        .single();
      if (error || !data) {
        if (error?.code === '23505') throw new HttpError(409, 'request_exists', 'A data-export request is already open.');
        throw new HttpError(500, 'export_request_failed', 'The export request could not be submitted.');
      }

      await recordMemberEvent(service, 'member_export_requested', {
        actorId: user.id, actorEmail: userEmail(user), subjectId: user.id, subjectEmail: userEmail(user),
        userAgent: getUserAgent(request), details: { requestId: data.id },
      });
      return jsonResponse(request, { ok: true, request: data }, 201);
    }

    if (action === 'get_export_download') {
      const requestId = String(body.requestId || '').trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
        throw new HttpError(400, 'invalid_request', 'The export request is invalid.');
      }
      await consumeRateLimit(service, 'export_download', user.id, 10, 3600, 3600);

      const { data: exportRequest, error } = await service
        .from('member_export_requests')
        .select('id,member_id,status,storage_path,expires_at')
        .eq('id', requestId)
        .eq('member_id', user.id)
        .single();
      if (error || !exportRequest || exportRequest.status !== 'ready' || !exportRequest.storage_path) {
        throw new HttpError(404, 'export_not_ready', 'The export is not available.');
      }
      if (!exportRequest.expires_at || new Date(exportRequest.expires_at).getTime() <= Date.now()) {
        await service.from('member_export_requests').update({ status: 'expired' }).eq('id', requestId);
        throw new HttpError(410, 'export_expired', 'The export has expired.');
      }

      const { data: signed, error: signedError } = await service.storage
        .from('member-exports')
        .createSignedUrl(exportRequest.storage_path, 300);
      if (signedError || !signed?.signedUrl) throw new HttpError(500, 'download_link_failed', 'A secure download link could not be created.');

      await service.from('member_export_requests').update({ downloaded_at: new Date().toISOString(), status: 'downloaded' }).eq('id', requestId);
      await recordMemberEvent(service, 'member_export_downloaded', {
        actorId: user.id, actorEmail: userEmail(user), subjectId: user.id, subjectEmail: userEmail(user),
        userAgent: getUserAgent(request), details: { requestId },
      });
      return jsonResponse(request, { ok: true, downloadUrl: signed.signedUrl, expiresIn: 300 });
    }

    throw new HttpError(400, 'invalid_action', 'Unsupported member request action.');
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
