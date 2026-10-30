import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, normalizeReason, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createCallerClient, createServiceClient, requireModulePermission, userEmail } from '../_shared/supabase.ts';
import { recordAdminActivity, recordMemberEvent } from '../_shared/audit.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const actor = await requireModulePermission(request, 'manage_member_exports');
    const caller = createCallerClient(request);
    const service = createServiceClient();
    const body = await parseJson<{ action?: unknown; requestId?: unknown; reason?: unknown }>(request);
    const action = String(body.action || '').trim();
    const requestId = String(body.requestId || '').trim();

    if (!['generate', 'reject'].includes(action)) throw new HttpError(400, 'invalid_action', 'Unsupported export action.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new HttpError(400, 'invalid_request', 'The export request is invalid.');
    }

    const { data: exportRequest, error: requestError } = await service
      .from('member_export_requests')
      .select('id,member_id,status,requested_at')
      .eq('id', requestId)
      .single();
    if (requestError || !exportRequest) throw new HttpError(404, 'request_not_found', 'The export request was not found.');
    if (!['pending', 'approved', 'processing'].includes(exportRequest.status)) {
      throw new HttpError(409, 'invalid_state', 'This export request is no longer open.');
    }

    const { data: authData, error: authError } = await service.auth.admin.getUserById(exportRequest.member_id);
    if (authError || !authData.user) throw new HttpError(404, 'member_not_found', 'The member Auth identity was not found.');
    const memberEmail = String(authData.user.email || '').toLowerCase();

    if (action === 'reject') {
      const reason = normalizeReason(body.reason, true);
      const { error } = await service
        .from('member_export_requests')
        .update({ status: 'rejected', approved_at: new Date().toISOString(), approved_by: actor.id, rejection_reason: reason })
        .eq('id', requestId);
      if (error) throw new HttpError(500, 'export_rejection_failed', 'The export request could not be rejected.');

      await recordAdminActivity(caller, 'member_export_rejected', memberEmail || exportRequest.member_id, { requestId, reason });
      await sendTransactionalEmail(service, {
        event: 'member_export_rejected', to: memberEmail, subjectId: exportRequest.member_id,
        userAgent: getUserAgent(request), data: { reason },
      });
      return jsonResponse(request, { ok: true, status: 'rejected' });
    }

    await service.from('member_export_requests').update({ status: 'processing' }).eq('id', requestId);

    const [profileResult, consentsResult, closureResult, exportHistoryResult] = await Promise.all([
      service.from('member_profiles').select('user_id,display_name,member_role,status,verified_at,approved_at,suspended_at,archived_at,closure_requested_at,created_at,updated_at').eq('user_id', exportRequest.member_id).single(),
      service.from('member_consents').select('terms_version,privacy_version,registration_source,accepted_at,created_at').eq('member_id', exportRequest.member_id).order('accepted_at'),
      service.from('member_closure_requests').select('status,reason,requested_at,reviewed_at,resolution_notes').eq('member_id', exportRequest.member_id).order('requested_at'),
      service.from('member_export_requests').select('id,status,requested_at,approved_at,expires_at,downloaded_at,rejection_reason').eq('member_id', exportRequest.member_id).order('requested_at'),
    ]);

    if (profileResult.error || !profileResult.data || consentsResult.error || closureResult.error || exportHistoryResult.error) {
      await service.from('member_export_requests').update({ status: 'approved' }).eq('id', requestId);
      throw new HttpError(500, 'export_collection_failed', 'The permitted member data could not be collected.');
    }

    const generatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const exportDocument = {
      meta: {
        format: 'cudfirm-member-export',
        moduleId: 'member-accounts',
        moduleVersion: '1.0.0',
        generatedAt,
      },
      account: {
        userId: authData.user.id,
        email: memberEmail,
        emailVerifiedAt: authData.user.email_confirmed_at,
        createdAt: authData.user.created_at,
      },
      profile: profileResult.data,
      consents: consentsResult.data || [],
      closureRequests: closureResult.data || [],
      exportRequests: exportHistoryResult.data || [],
      extensions: {},
    };

    const storagePath = `${exportRequest.member_id}/${requestId}.json`;
    const bytes = new TextEncoder().encode(JSON.stringify(exportDocument, null, 2));
    const { error: uploadError } = await service.storage
      .from('member-exports')
      .upload(storagePath, bytes, { contentType: 'application/json', upsert: true, cacheControl: '0' });
    if (uploadError) {
      await service.from('member_export_requests').update({ status: 'approved' }).eq('id', requestId);
      throw new HttpError(500, 'export_upload_failed', 'The private export file could not be stored.');
    }

    const { error: updateError } = await service
      .from('member_export_requests')
      .update({
        status: 'ready', approved_at: generatedAt, approved_by: actor.id,
        storage_path: storagePath, expires_at: expiresAt, rejection_reason: null,
      })
      .eq('id', requestId);
    if (updateError) throw new HttpError(500, 'export_status_failed', 'The export status could not be saved.');

    await recordAdminActivity(caller, 'member_export_generated', memberEmail || exportRequest.member_id, { requestId, expiresAt });
    await recordMemberEvent(service, 'member_export_ready', {
      actorId: actor.id, actorEmail: userEmail(actor), subjectId: exportRequest.member_id,
      subjectEmail: memberEmail, userAgent: getUserAgent(request), details: { requestId, expiresAt },
    });
    await sendTransactionalEmail(service, {
      event: 'member_export_ready', to: memberEmail, subjectId: exportRequest.member_id,
      userAgent: getUserAgent(request), data: { expiresAt },
      actionUrl: `${(Deno.env.get('MEMBER_SITE_URL') || '').replace(/\/$/, '')}/account/profile.html#data-export`,
    });

    return jsonResponse(request, { ok: true, status: 'ready', expiresAt });
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
