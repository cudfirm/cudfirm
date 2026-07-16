import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createServiceClient, requireAuthenticatedUser, userEmail } from '../_shared/supabase.ts';
import { getMemberSettings } from '../_shared/member.ts';
import { recordMemberEvent } from '../_shared/audit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);
    const user = await requireAuthenticatedUser(request);
    const service = createServiceClient();
    const settings = await getMemberSettings(service);

    const body = await parseJson<{
      invitationId?: unknown;
      termsAccepted?: unknown;
      privacyAccepted?: unknown;
      termsVersion?: unknown;
      privacyVersion?: unknown;
    }>(request);

    const invitationId = String(body.invitationId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitationId)) {
      throw new HttpError(400, 'invalid_invitation', 'The invitation is invalid.');
    }
    if (body.termsAccepted !== true || body.privacyAccepted !== true) {
      throw new HttpError(400, 'consent_required', 'Terms of Service and Privacy Policy acceptance is required.');
    }

    const termsVersion = String(body.termsVersion || '').trim();
    const privacyVersion = String(body.privacyVersion || '').trim();
    if (termsVersion !== settings.terms_version || privacyVersion !== settings.privacy_version) {
      throw new HttpError(409, 'policy_version_changed', 'Review and accept the current Terms and Privacy Policy.');
    }

    const { data, error } = await service.rpc('member_accept_invitation_record', {
      p_invitation_id: invitationId,
      p_user_id: user.id,
      p_terms_version: termsVersion,
      p_privacy_version: privacyVersion,
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('expired')) throw new HttpError(410, 'invitation_expired', 'The invitation has expired.');
      throw new HttpError(409, 'invitation_unavailable', 'The invitation cannot be accepted.');
    }

    await recordMemberEvent(service, 'member_invitation_accepted', {
      actorId: user.id,
      actorEmail: userEmail(user),
      subjectId: user.id,
      subjectEmail: userEmail(user),
      userAgent: getUserAgent(request),
      details: { invitationId, status: (data as { status?: string })?.status },
    });

    return jsonResponse(request, { ok: true, member: data as Record<string, unknown> });
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
