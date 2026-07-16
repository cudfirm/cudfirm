import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.7';

export type MemberEventType =
  | 'member_registration_requested' | 'member_registered' | 'member_verification_resent'
  | 'member_invitation_sent' | 'member_invitation_accepted'
  | 'member_login_success' | 'member_login_failed' | 'member_access_denied'
  | 'member_approved' | 'member_suspended' | 'member_reactivated' | 'member_archived'
  | 'member_anonymized' | 'member_deleted'
  | 'member_closure_requested' | 'member_closure_reviewed'
  | 'member_export_requested' | 'member_export_ready' | 'member_export_downloaded'
  | 'member_email_delivery_failed';

export async function recordMemberEvent(
  service: SupabaseClient,
  eventType: MemberEventType,
  input: {
    actorId?: string | null;
    actorEmail?: string | null;
    subjectId?: string | null;
    subjectEmail?: string | null;
    success?: boolean;
    severity?: 'info' | 'warning' | 'critical';
    details?: Record<string, unknown>;
    userAgent?: string | null;
    source?: string;
  } = {},
): Promise<void> {
  const { error } = await service.rpc('record_member_security_event', {
    p_event_type: eventType,
    p_actor_id: input.actorId || null,
    p_actor_email: input.actorEmail || null,
    p_subject_id: input.subjectId || null,
    p_subject_email: input.subjectEmail || null,
    p_success: input.success ?? true,
    p_severity: input.severity || 'info',
    p_details: input.details || {},
    p_user_agent: input.userAgent || null,
    p_source: input.source || 'member_edge_function',
  });
  if (error) console.error('Member audit event failed:', eventType, error.message);
}

export async function recordAdminActivity(
  caller: SupabaseClient,
  action: string,
  entityLabel: string,
  details: Record<string, unknown>,
): Promise<void> {
  const { error } = await caller.rpc('record_activity_event', {
    p_action: action,
    p_entity: 'member_accounts',
    p_entity_label: entityLabel,
    p_details: details,
  });
  if (error) console.error('Member admin activity log failed:', error.message);
}
