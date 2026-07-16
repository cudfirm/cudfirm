import { assertAllowedOrigin, getUserAgent, HttpError, jsonResponse, normalizeReason, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createCallerClient, createServiceClient, requireModulePermission, userEmail } from '../_shared/supabase.ts';
import { getMemberProfile } from '../_shared/member.ts';
import { randomPassword } from '../_shared/crypto.ts';
import { recordAdminActivity, recordMemberEvent, type MemberEventType } from '../_shared/audit.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

const ACTIONS = {
  approve: { permission: 'approve_members', event: 'member_approved' as MemberEventType },
  suspend: { permission: 'suspend_members', event: 'member_suspended' as MemberEventType },
  reactivate: { permission: 'reactivate_members', event: 'member_reactivated' as MemberEventType },
  archive: { permission: 'archive_members', event: 'member_archived' as MemberEventType },
  anonymize: { permission: 'anonymize_members', event: 'member_anonymized' as MemberEventType },
  delete: { permission: 'delete_members', event: 'member_deleted' as MemberEventType },
} as const;

type Action = keyof typeof ACTIONS;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const body = await parseJson<{ action?: unknown; memberId?: unknown; reason?: unknown }>(request);
    const action = String(body.action || '') as Action;
    if (!(action in ACTIONS)) throw new HttpError(400, 'invalid_action', 'Unsupported member action.');

    const memberId = String(body.memberId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId)) {
      throw new HttpError(400, 'invalid_member', 'The member ID is invalid.');
    }

    const reason = normalizeReason(body.reason, action === 'suspend' || action === 'reactivate');
    const actor = await requireModulePermission(request, ACTIONS[action].permission);
    const caller = createCallerClient(request);
    const service = createServiceClient();
    const profile = await getMemberProfile(service, memberId);
    if (!profile) throw new HttpError(404, 'member_not_found', 'The member was not found.');

    const { data: authData, error: authError } = await service.auth.admin.getUserById(memberId);
    if (authError || !authData.user) throw new HttpError(404, 'auth_user_not_found', 'The member Auth identity was not found.');
    const memberEmail = String(authData.user.email || '').toLowerCase();
    const now = new Date().toISOString();

    let update: Record<string, unknown> | null = null;
    let emailEvent: string | null = null;

    switch (action) {
      case 'approve':
        if (profile.status !== 'pending_approval') throw new HttpError(409, 'invalid_state', 'Only pending members can be approved.');
        update = { status: 'active', approved_at: now, approved_by: actor.id };
        emailEvent = 'member_approved';
        break;

      case 'suspend':
        if (profile.status !== 'active') throw new HttpError(409, 'invalid_state', 'Only active members can be suspended.');
        update = {
          status: 'suspended', suspended_at: now, suspended_by: actor.id,
          suspension_reason: reason,
        };
        emailEvent = 'member_suspended';
        break;

      case 'reactivate':
        if (profile.status !== 'suspended') throw new HttpError(409, 'invalid_state', 'Only suspended members can be reactivated.');
        update = {
          status: 'active', suspended_at: null, suspended_by: null,
          suspension_reason: null, approved_at: profile.approved_at || now,
        };
        emailEvent = 'member_reactivated';
        break;

      case 'archive':
        if (profile.status === 'archived') throw new HttpError(409, 'invalid_state', 'The member is already archived.');
        update = { status: 'archived', archived_at: now };
        emailEvent = 'member_archived';
        break;

      case 'anonymize': {
        if (profile.status !== 'archived') throw new HttpError(409, 'invalid_state', 'Archive the member before anonymizing the account.');
        const { data: cmsProfile, error: cmsError } = await service
          .from('user_profiles')
          .select('id')
          .eq('id', memberId)
          .maybeSingle();
        if (cmsError) throw new HttpError(500, 'dual_profile_check_failed', 'The account type could not be checked.');
        if (cmsProfile) {
          throw new HttpError(409, 'dual_profile_present', 'This Auth identity also has CMS access. Remove or transfer that access before anonymizing it.');
        }

        const anonymizedEmail = `${memberId}@deleted.invalid`;
        const { error } = await service.auth.admin.updateUserById(memberId, {
          email: anonymizedEmail,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: { display_name: 'Deleted Member', member_anonymized: true },
        });
        if (error) throw new HttpError(500, 'auth_anonymization_failed', 'The Auth identity could not be anonymized.');

        update = {
          display_name: 'Deleted Member', status: 'archived', archived_at: profile.archived_at || now,
          anonymized_at: now, anonymized_by: actor.id,
          suspension_reason: null, suspended_at: null, suspended_by: null,
        };
        break;
      }

      case 'delete': {
        const { data: cmsProfile, error: cmsError } = await service
          .from('user_profiles')
          .select('id')
          .eq('id', memberId)
          .maybeSingle();
        if (cmsError) throw new HttpError(500, 'dual_profile_check_failed', 'The account type could not be checked.');
        if (cmsProfile) {
          throw new HttpError(409, 'dual_profile_present', 'This Auth identity also has CMS access and cannot be hard-deleted as a member.');
        }
        if (profile.status !== 'archived') {
          throw new HttpError(409, 'invalid_state', 'Archive the member before permanent deletion.');
        }

        const { error } = await service.auth.admin.deleteUser(memberId, false);
        if (error) throw new HttpError(409, 'delete_blocked', 'The member could not be deleted. Dependent records or retention requirements may still exist.');
        update = null;
        break;
      }
    }

    if (update) {
      const { error } = await service.from('member_profiles').update(update).eq('user_id', memberId);
      if (error) throw new HttpError(500, 'member_update_failed', 'The member action could not be saved.');
    }

    await recordAdminActivity(caller, `member_${action}`, profile.display_name, {
      memberId,
      oldStatus: profile.status,
      newStatus: update?.status || 'deleted',
      reason,
    });
    await recordMemberEvent(service, ACTIONS[action].event, {
      actorId: actor.id,
      actorEmail: userEmail(actor),
      subjectId: memberId,
      subjectEmail: memberEmail,
      severity: action === 'suspend' || action === 'delete' ? 'critical' : 'warning',
      userAgent: getUserAgent(request),
      details: { oldStatus: profile.status, newStatus: update?.status || 'deleted', reason },
    });

    if (emailEvent && memberEmail) {
      await sendTransactionalEmail(service, {
        event: emailEvent,
        to: memberEmail,
        subjectId: memberId,
        userAgent: getUserAgent(request),
        data: { displayName: profile.display_name, reason },
      });
    }

    return jsonResponse(request, {
      ok: true,
      action,
      memberId,
      status: update?.status || 'deleted',
    });
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
