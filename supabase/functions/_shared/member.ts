import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2.110.7';
import { HttpError } from './http.ts';

export type MemberSettings = {
  enabled: boolean;
  public_registration: boolean;
  require_email_verification: boolean;
  activation_mode: 'automatic_after_verification' | 'manual_approval';
  captcha_enabled: boolean;
  terms_version: string;
  privacy_version: string;
  invitation_expiry_days: number;
};

export type MemberProfile = {
  user_id: string;
  display_name: string;
  member_role: 'member';
  status: 'pending_verification' | 'pending_approval' | 'active' | 'suspended' | 'archived';
  verified_at: string | null;
  approved_at: string | null;
  suspended_at: string | null;
  archived_at: string | null;
  anonymized_at?: string | null;
};

export async function getMemberSettings(service: SupabaseClient): Promise<MemberSettings> {
  const { data, error } = await service
    .from('member_settings')
    .select('enabled,public_registration,require_email_verification,activation_mode,captcha_enabled,terms_version,privacy_version,invitation_expiry_days')
    .eq('id', 1)
    .single();

  if (error || !data) throw new HttpError(503, 'member_settings_unavailable', 'Member Accounts is not available.');
  return data as MemberSettings;
}

export async function getMemberProfile(service: SupabaseClient, userId: string): Promise<MemberProfile | null> {
  const { data, error } = await service
    .from('member_profiles')
    .select('user_id,display_name,member_role,status,verified_at,approved_at,suspended_at,archived_at,anonymized_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new HttpError(500, 'profile_lookup_failed', 'The member profile could not be checked.');
  return data as MemberProfile | null;
}

export function requireActiveMember(profile: MemberProfile | null): MemberProfile {
  if (!profile || profile.status !== 'active') {
    throw new HttpError(403, 'member_access_blocked', 'This member account cannot access the requested resource.');
  }
  return profile;
}

export function memberStatusMessage(profile: MemberProfile | null): string {
  if (!profile) return 'No member profile is attached to this account.';
  switch (profile.status) {
    case 'pending_verification': return 'Verify your email before signing in.';
    case 'pending_approval': return 'Your account is awaiting administrator approval.';
    case 'suspended': return 'This member account is suspended.';
    case 'archived': return 'This member account is archived.';
    default: return 'This member account cannot sign in.';
  }
}

export function safeRedirect(path: unknown, fallback: string): string {
  const requested = String(path || '').trim();
  if (!requested.startsWith('/') || requested.startsWith('//') || requested.includes('\\')) return fallback;
  try {
    const url = new URL(requested, 'https://cudfirm.invalid');
    if (url.origin !== 'https://cudfirm.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function siteUrl(): string {
  const value = (Deno.env.get('MEMBER_SITE_URL') || '').trim().replace(/\/$/, '');
  if (!/^https:\/\//i.test(value) && !/^http:\/\/localhost(?::\d+)?$/i.test(value) && !/^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(value)) {
    throw new Error('MEMBER_SITE_URL must be an HTTPS URL or an approved local development URL.');
  }
  return value;
}

export function userEmail(user: User): string {
  return String(user.email || '').trim().toLowerCase();
}
