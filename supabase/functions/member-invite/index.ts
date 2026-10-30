import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, normalizeDisplayName, normalizeEmail, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createCallerClient, createServiceClient, requireModulePermission, userEmail } from '../_shared/supabase.ts';
import { getMemberSettings, siteUrl } from '../_shared/member.ts';
import { consumeRateLimit } from '../_shared/rate-limit.ts';
import { recordAdminActivity, recordMemberEvent } from '../_shared/audit.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const actor = await requireModulePermission(request, 'invite_members');
    const caller = createCallerClient(request);
    const service = createServiceClient();
    const settings = await getMemberSettings(service);
    if (!settings.enabled) throw new HttpError(503, 'member_accounts_disabled', 'Member Accounts is disabled.');

    const body = await parseJson<{ email?: unknown; displayName?: unknown }>(request);
    const email = normalizeEmail(body.email);
    const displayName = normalizeDisplayName(body.displayName);
    const userAgent = getUserAgent(request);

    await consumeRateLimit(service, 'invite_email', email, 5, 86400, 86400);

    const expiresAt = new Date(Date.now() + settings.invitation_expiry_days * 86400000).toISOString();
    let invitationId: string;

    const { data: existingInvitation, error: existingError } = await service
      .from('member_invitations')
      .select('id,resend_count')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();
    if (existingError) throw new HttpError(500, 'invitation_lookup_failed', 'The invitation could not be checked.');

    if (existingInvitation) {
      invitationId = existingInvitation.id;
      const { error } = await service
        .from('member_invitations')
        .update({
          display_name: displayName,
          expires_at: expiresAt,
          resend_count: Math.min(100, Number(existingInvitation.resend_count || 0) + 1),
          invited_by: actor.id,
        })
        .eq('id', invitationId);
      if (error) throw new HttpError(500, 'invitation_update_failed', 'The invitation could not be refreshed.');
    } else {
      const { data, error } = await service
        .from('member_invitations')
        .insert({
          email,
          display_name: displayName,
          expires_at: expiresAt,
          invited_by: actor.id,
        })
        .select('id')
        .single();
      if (error || !data) throw new HttpError(500, 'invitation_create_failed', 'The invitation could not be created.');
      invitationId = data.id;
    }

    const redirectTo = `${siteUrl()}/account/invitation.html?invitation=${encodeURIComponent(invitationId)}`;
    let invitedUserId: string | null = null;
    let deliveryMode = 'supabase_auth';

    const { data: inviteData, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { display_name: displayName, member_invitation_id: invitationId },
    });

    if (!inviteError && inviteData.user) {
      invitedUserId = inviteData.user.id;
    } else {
      // Existing Auth identities cannot be invited through inviteUserByEmail.
      // Reuse the existing identity and deliver a generated activation link via
      // the client-configured transactional email webhook.
      const { data: lookupRows, error: lookupError } = await service.rpc('member_find_auth_user_by_email', {
        p_email: email,
      });
      if (lookupError || !Array.isArray(lookupRows) || !lookupRows[0]?.user_id) {
        await service.from('member_invitations').delete().eq('id', invitationId);
        throw new HttpError(502, 'auth_invitation_failed', 'The authentication invitation could not be created.');
      }

      invitedUserId = String(lookupRows[0].user_id);
      const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo,
          data: { display_name: displayName, member_invitation_id: invitationId },
        },
      });
      const actionLink = (linkData as { properties?: { action_link?: string } } | null)?.properties?.action_link;
      if (linkError || !actionLink) {
        throw new HttpError(502, 'existing_account_link_failed', 'The existing account activation link could not be generated.');
      }

      try {
        await sendTransactionalEmail(service, {
          event: 'member_invitation_existing_account',
          to: email,
          actionUrl: actionLink,
          data: { displayName, expiresAt },
          subjectId: invitedUserId,
          userAgent,
          required: true,
        });
      } catch {
        await service.from('member_invitations').update({ status: 'revoked' }).eq('id', invitationId);
        throw new HttpError(503, 'invitation_email_unavailable', 'The invitation email provider is not configured or could not deliver the message.');
      }
      deliveryMode = 'transactional_webhook';
    }

    const { error: profileError } = await service.rpc('member_prepare_invited_profile', {
      p_invitation_id: invitationId,
      p_user_id: invitedUserId,
      p_display_name: displayName,
    });
    if (profileError) throw new HttpError(500, 'invited_profile_failed', 'The invited member profile could not be prepared.');

    await recordAdminActivity(caller, 'member_invited', displayName, {
      memberId: invitedUserId,
      invitationId,
      deliveryMode,
    });
    await recordMemberEvent(service, 'member_invitation_sent', {
      actorId: actor.id,
      actorEmail: userEmail(actor),
      subjectId: invitedUserId,
      subjectEmail: email,
      userAgent,
      details: { invitationId, deliveryMode, expiresAt },
    });

    return jsonResponse(request, {
      ok: true,
      invitation: { id: invitationId, expiresAt, deliveryMode },
    }, 201);
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
