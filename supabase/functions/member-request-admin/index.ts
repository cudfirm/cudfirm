import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, normalizeReason, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createCallerClient, createServiceClient, requireModulePermission, userEmail } from '../_shared/supabase.ts';
import { recordAdminActivity, recordMemberEvent } from '../_shared/audit.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const actor = await requireModulePermission(request, 'manage_member_closure_requests');
    const caller = createCallerClient(request);
    const service = createServiceClient();
    const body = await parseJson<{ action?: unknown; requestId?: unknown; notes?: unknown }>(request);
    const action = String(body.action || '').trim();
    const requestId = String(body.requestId || '').trim();
    const notes = normalizeReason(body.notes, action === 'reject');

    if (!['approve', 'reject'].includes(action)) throw new HttpError(400, 'invalid_action', 'Unsupported closure action.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new HttpError(400, 'invalid_request', 'The closure request is invalid.');
    }

    const { data: closureRequest, error: requestError } = await service
      .from('member_closure_requests')
      .select('id,member_id,status,reason,requested_at')
      .eq('id', requestId)
      .single();
    if (requestError || !closureRequest) throw new HttpError(404, 'request_not_found', 'The closure request was not found.');
    if (closureRequest.status !== 'pending') throw new HttpError(409, 'invalid_state', 'This closure request has already been reviewed.');

    const { data: authData } = await service.auth.admin.getUserById(closureRequest.member_id);
    const memberEmail = String(authData.user?.email || '').toLowerCase();
    const reviewedAt = new Date().toISOString();

    if (action === 'reject') {
      const { error } = await service
        .from('member_closure_requests')
        .update({ status: 'rejected', reviewed_at: reviewedAt, reviewed_by: actor.id, resolution_notes: notes })
        .eq('id', requestId);
      if (error) throw new HttpError(500, 'closure_review_failed', 'The closure request could not be rejected.');
      await service.from('member_profiles').update({ closure_requested_at: null }).eq('user_id', closureRequest.member_id);
    } else {
      const { error: profileError } = await service
        .from('member_profiles')
        .update({ status: 'archived', archived_at: reviewedAt, closure_requested_at: closureRequest.requested_at })
        .eq('user_id', closureRequest.member_id)
        .neq('status', 'archived');
      if (profileError) throw new HttpError(500, 'closure_archive_failed', 'The member account could not be archived.');

      const { error } = await service
        .from('member_closure_requests')
        .update({ status: 'completed', reviewed_at: reviewedAt, reviewed_by: actor.id, resolution_notes: notes })
        .eq('id', requestId);
      if (error) throw new HttpError(500, 'closure_review_failed', 'The closure request could not be completed.');
    }

    await recordAdminActivity(caller, `member_closure_${action}`, memberEmail || closureRequest.member_id, { requestId, notes });
    await recordMemberEvent(service, 'member_closure_reviewed', {
      actorId: actor.id, actorEmail: userEmail(actor), subjectId: closureRequest.member_id,
      subjectEmail: memberEmail, userAgent: getUserAgent(request),
      details: { requestId, decision: action, status: action === 'approve' ? 'completed' : 'rejected' },
    });
    if (memberEmail) {
      await sendTransactionalEmail(service, {
        event: action === 'approve' ? 'member_closure_completed' : 'member_closure_rejected',
        to: memberEmail, subjectId: closureRequest.member_id,
        userAgent: getUserAgent(request), data: { notes },
      });
    }

    return jsonResponse(request, { ok: true, status: action === 'approve' ? 'completed' : 'rejected' });
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
