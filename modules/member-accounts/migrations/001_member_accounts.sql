-- ============================================================
-- CUDFIRM Member Accounts — Module Migration 001
-- Member identity schema, settings, module permissions, RLS, and helpers.
-- Requires CUDFIRM migration 016_module_permissions_foundation.sql.
-- Do not rewrite after execution; use a later module migration.
-- ============================================================

begin;

do $$
begin
  if to_regclass('public.module_permissions') is null
     or to_regclass('public.module_role_permissions') is null
     or to_regprocedure('public.has_module_permission(text,text)') is null then
    raise exception 'Run supabase/016_module_permissions_foundation.sql before Member Accounts migration 001.';
  end if;
end;
$$;

create table if not exists public.member_settings (
  id smallint primary key default 1,
  enabled boolean not null default true,
  public_registration boolean not null default false,
  require_email_verification boolean not null default true,
  activation_mode text not null default 'automatic_after_verification',
  profile_visibility text not null default 'private',
  sign_in_method text not null default 'email_password',
  mfa_mode text not null default 'disabled',
  invitation_expiry_days smallint not null default 7,
  failed_sign_in_limit smallint not null default 5,
  temporary_lock_minutes smallint not null default 15,
  require_terms_consent boolean not null default true,
  require_privacy_consent boolean not null default true,
  captcha_enabled boolean not null default true,
  terms_version text not null default '1.0',
  privacy_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_settings_singleton check (id = 1),
  constraint member_settings_activation_mode_check
    check (activation_mode in ('automatic_after_verification','manual_approval')),
  constraint member_settings_profile_visibility_check
    check (profile_visibility in ('private','public')),
  constraint member_settings_sign_in_method_check
    check (sign_in_method = 'email_password'),
  constraint member_settings_mfa_mode_check
    check (mfa_mode in ('disabled','optional','required')),
  constraint member_settings_invitation_expiry_check
    check (invitation_expiry_days between 1 and 30),
  constraint member_settings_failed_sign_in_limit_check
    check (failed_sign_in_limit between 3 and 20),
  constraint member_settings_lock_minutes_check
    check (temporary_lock_minutes between 1 and 1440),
  constraint member_settings_terms_version_check
    check (char_length(btrim(terms_version)) between 1 and 50),
  constraint member_settings_privacy_version_check
    check (char_length(btrim(privacy_version)) between 1 and 50)
);

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  member_role text not null default 'member',
  status text not null default 'pending_verification',
  verified_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id) on delete set null,
  suspension_reason text,
  archived_at timestamptz,
  closure_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_profiles_display_name_check
    check (char_length(btrim(display_name)) between 2 and 80),
  constraint member_profiles_role_check
    check (member_role = 'member'),
  constraint member_profiles_status_check
    check (status in ('pending_verification','pending_approval','active','suspended','archived')),
  constraint member_profiles_suspension_reason_length_check
    check (suspension_reason is null or char_length(suspension_reason) <= 1000)
);

create table if not exists public.member_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(user_id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  registration_source text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint member_consents_terms_version_check
    check (char_length(btrim(terms_version)) between 1 and 50),
  constraint member_consents_privacy_version_check
    check (char_length(btrim(privacy_version)) between 1 and 50),
  constraint member_consents_source_check
    check (registration_source in ('self_registration','invitation','policy_reacceptance')),
  constraint member_consents_version_unique
    unique (member_id, terms_version, privacy_version)
);

create table if not exists public.member_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  status text not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  auth_user_id uuid references auth.users(id) on delete set null,
  resend_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_invitations_email_check
    check (char_length(btrim(email)) between 3 and 320 and position('@' in email) > 1),
  constraint member_invitations_display_name_check
    check (char_length(btrim(display_name)) between 2 and 80),
  constraint member_invitations_status_check
    check (status in ('pending','accepted','expired','revoked')),
  constraint member_invitations_resend_count_check
    check (resend_count between 0 and 100)
);

create table if not exists public.member_closure_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(user_id) on delete cascade,
  status text not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution_notes text,
  constraint member_closure_requests_status_check
    check (status in ('pending','approved','rejected','completed','cancelled')),
  constraint member_closure_requests_reason_length_check
    check (reason is null or char_length(reason) <= 2000),
  constraint member_closure_requests_resolution_length_check
    check (resolution_notes is null or char_length(resolution_notes) <= 4000)
);

create table if not exists public.member_export_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles(user_id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  storage_path text,
  expires_at timestamptz,
  downloaded_at timestamptz,
  rejection_reason text,
  constraint member_export_requests_status_check
    check (status in ('pending','approved','rejected','processing','ready','expired','downloaded')),
  constraint member_export_requests_storage_path_length_check
    check (storage_path is null or char_length(storage_path) <= 1000),
  constraint member_export_requests_rejection_length_check
    check (rejection_reason is null or char_length(rejection_reason) <= 2000)
);

create table if not exists public.member_auth_locks (
  identifier_hash text primary key,
  failed_attempts smallint not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint member_auth_locks_identifier_hash_check
    check (char_length(identifier_hash) between 32 and 128),
  constraint member_auth_locks_failed_attempts_check
    check (failed_attempts between 0 and 32767)
);

create index if not exists member_profiles_status_idx
  on public.member_profiles(status);
create index if not exists member_profiles_created_at_idx
  on public.member_profiles(created_at desc);
create index if not exists member_consents_member_idx
  on public.member_consents(member_id, accepted_at desc);
create index if not exists member_invitations_status_idx
  on public.member_invitations(status, expires_at);
create unique index if not exists member_invitations_pending_email_uidx
  on public.member_invitations(lower(email))
  where status = 'pending';
create unique index if not exists member_closure_requests_pending_member_uidx
  on public.member_closure_requests(member_id)
  where status = 'pending';
create unique index if not exists member_export_requests_open_member_uidx
  on public.member_export_requests(member_id)
  where status in ('pending','approved','processing','ready');
create index if not exists member_auth_locks_locked_until_idx
  on public.member_auth_locks(locked_until)
  where locked_until is not null;

create or replace function public.set_member_record_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_member_record_updated_at()
from public, anon, authenticated;

drop trigger if exists member_settings_updated_at on public.member_settings;
create trigger member_settings_updated_at
before update on public.member_settings
for each row execute function public.set_member_record_updated_at();

drop trigger if exists member_profiles_updated_at on public.member_profiles;
create trigger member_profiles_updated_at
before update on public.member_profiles
for each row execute function public.set_member_record_updated_at();

drop trigger if exists member_invitations_updated_at on public.member_invitations;
create trigger member_invitations_updated_at
before update on public.member_invitations
for each row execute function public.set_member_record_updated_at();

drop trigger if exists member_auth_locks_updated_at on public.member_auth_locks;
create trigger member_auth_locks_updated_at
before update on public.member_auth_locks
for each row execute function public.set_member_record_updated_at();

create or replace function public.current_member_status()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select mp.status
  from public.member_profiles mp
  where mp.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(public.current_member_status() = 'active', false);
$$;

create or replace function public.update_own_member_display_name(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_name text;
  v_profile public.member_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  v_name := regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters.';
  end if;

  update public.member_profiles
  set display_name = v_name
  where user_id = auth.uid()
    and status = 'active'
  returning * into v_profile;

  if not found then
    raise exception 'An active member account is required.';
  end if;

  return jsonb_build_object(
    'userId', v_profile.user_id,
    'displayName', v_profile.display_name,
    'role', v_profile.member_role,
    'status', v_profile.status,
    'updatedAt', v_profile.updated_at
  );
end;
$$;

revoke all on function public.current_member_status() from public, anon;
revoke all on function public.is_active_member() from public, anon;
revoke all on function public.update_own_member_display_name(text) from public, anon;
grant execute on function public.current_member_status() to authenticated;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.update_own_member_display_name(text) to authenticated;

insert into public.member_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.module_permissions (module_id, permission_id, description)
values
  ('member-accounts','view_members','View permitted member records.'),
  ('member-accounts','invite_members','Invite public members.'),
  ('member-accounts','approve_members','Approve pending public members.'),
  ('member-accounts','suspend_members','Suspend public member access.'),
  ('member-accounts','reactivate_members','Reactivate suspended members.'),
  ('member-accounts','archive_members','Archive public member accounts.'),
  ('member-accounts','manage_member_closure_requests','Review member account-closure requests.'),
  ('member-accounts','manage_member_exports','Review and generate member data exports.'),
  ('member-accounts','manage_member_settings','Manage Member Accounts module settings.'),
  ('member-accounts','anonymize_members','Anonymize member personal data.'),
  ('member-accounts','delete_members','Permanently delete eligible member accounts.')
on conflict (module_id, permission_id) do update
set description = excluded.description;

-- Viewer may read permitted member records. Editor receives no member-management
-- permissions. Admin receives operational management permissions. Super Admin
-- is granted every declared module permission by has_module_permission(...).
insert into public.module_role_permissions (module_id, role, permission_id)
values
  ('member-accounts','viewer','view_members'),
  ('member-accounts','admin','view_members'),
  ('member-accounts','admin','invite_members'),
  ('member-accounts','admin','approve_members'),
  ('member-accounts','admin','suspend_members'),
  ('member-accounts','admin','reactivate_members'),
  ('member-accounts','admin','archive_members'),
  ('member-accounts','admin','manage_member_closure_requests'),
  ('member-accounts','admin','manage_member_exports')
on conflict do nothing;

alter table public.member_settings enable row level security;
alter table public.member_settings force row level security;
alter table public.member_profiles enable row level security;
alter table public.member_profiles force row level security;
alter table public.member_consents enable row level security;
alter table public.member_consents force row level security;
alter table public.member_invitations enable row level security;
alter table public.member_invitations force row level security;
alter table public.member_closure_requests enable row level security;
alter table public.member_closure_requests force row level security;
alter table public.member_export_requests enable row level security;
alter table public.member_export_requests force row level security;
alter table public.member_auth_locks enable row level security;
alter table public.member_auth_locks force row level security;

-- Safe module settings are publicly readable; only Super Admin may change them.
drop policy if exists "public read member settings" on public.member_settings;
create policy "public read member settings"
on public.member_settings for select to anon
using (id = 1);

drop policy if exists "authenticated read member settings" on public.member_settings;
create policy "authenticated read member settings"
on public.member_settings for select to authenticated
using (id = 1);

drop policy if exists "super admin updates member settings" on public.member_settings;
create policy "super admin updates member settings"
on public.member_settings for update to authenticated
using (public.has_module_permission('member-accounts','manage_member_settings'))
with check (id = 1 and public.has_module_permission('member-accounts','manage_member_settings'));

-- Members may read only their own profile. CMS users require view_members.
drop policy if exists "members read own profile" on public.member_profiles;
create policy "members read own profile"
on public.member_profiles for select to authenticated
using (user_id = auth.uid());

drop policy if exists "cms users read member profiles" on public.member_profiles;
create policy "cms users read member profiles"
on public.member_profiles for select to authenticated
using (public.has_module_permission('member-accounts','view_members'));

drop policy if exists "controlled insert member profiles" on public.member_profiles;
create policy "controlled insert member profiles"
on public.member_profiles for insert to authenticated
with check (public.has_module_permission('member-accounts','invite_members'));

drop policy if exists "members update own active profile" on public.member_profiles;
create policy "members update own active profile"
on public.member_profiles for update to authenticated
using (user_id = auth.uid() and status = 'active')
with check (user_id = auth.uid() and status = 'active' and member_role = 'member');

drop policy if exists "cms users manage member profiles" on public.member_profiles;
create policy "cms users manage member profiles"
on public.member_profiles for update to authenticated
using (
  public.has_module_permission('member-accounts','approve_members')
  or public.has_module_permission('member-accounts','suspend_members')
  or public.has_module_permission('member-accounts','reactivate_members')
  or public.has_module_permission('member-accounts','archive_members')
  or public.has_module_permission('member-accounts','anonymize_members')
)
with check (
  public.has_module_permission('member-accounts','approve_members')
  or public.has_module_permission('member-accounts','suspend_members')
  or public.has_module_permission('member-accounts','reactivate_members')
  or public.has_module_permission('member-accounts','archive_members')
  or public.has_module_permission('member-accounts','anonymize_members')
);

drop policy if exists "super admin deletes member profiles" on public.member_profiles;
create policy "super admin deletes member profiles"
on public.member_profiles for delete to authenticated
using (public.has_module_permission('member-accounts','delete_members'));

-- Consent is append-only. Members may read their own history; CMS viewers may
-- inspect it when permitted. Writes are performed by trusted module handlers.
drop policy if exists "members read own consents" on public.member_consents;
create policy "members read own consents"
on public.member_consents for select to authenticated
using (member_id = auth.uid());

drop policy if exists "cms users read member consents" on public.member_consents;
create policy "cms users read member consents"
on public.member_consents for select to authenticated
using (public.has_module_permission('member-accounts','view_members'));

drop policy if exists "controlled insert member consents" on public.member_consents;
create policy "controlled insert member consents"
on public.member_consents for insert to authenticated
with check (member_id = auth.uid());

-- Invitation rows contain email addresses and remain restricted to Admin/Super Admin.
drop policy if exists "member managers read invitations" on public.member_invitations;
create policy "member managers read invitations"
on public.member_invitations for select to authenticated
using (
  public.has_module_permission('member-accounts','invite_members')
  or public.has_module_permission('member-accounts','approve_members')
);

drop policy if exists "member managers insert invitations" on public.member_invitations;
create policy "member managers insert invitations"
on public.member_invitations for insert to authenticated
with check (public.has_module_permission('member-accounts','invite_members'));

drop policy if exists "member managers update invitations" on public.member_invitations;
create policy "member managers update invitations"
on public.member_invitations for update to authenticated
using (public.has_module_permission('member-accounts','invite_members'))
with check (public.has_module_permission('member-accounts','invite_members'));

drop policy if exists "super admin deletes invitations" on public.member_invitations;
create policy "super admin deletes invitations"
on public.member_invitations for delete to authenticated
using (public.has_module_permission('member-accounts','delete_members'));

-- Members can submit and inspect their own requests. Administrators review them.
drop policy if exists "members read own closure requests" on public.member_closure_requests;
create policy "members read own closure requests"
on public.member_closure_requests for select to authenticated
using (member_id = auth.uid());

drop policy if exists "active members request closure" on public.member_closure_requests;
create policy "active members request closure"
on public.member_closure_requests for insert to authenticated
with check (member_id = auth.uid() and public.is_active_member());

drop policy if exists "member managers read closure requests" on public.member_closure_requests;
create policy "member managers read closure requests"
on public.member_closure_requests for select to authenticated
using (public.has_module_permission('member-accounts','manage_member_closure_requests'));

drop policy if exists "member managers update closure requests" on public.member_closure_requests;
create policy "member managers update closure requests"
on public.member_closure_requests for update to authenticated
using (public.has_module_permission('member-accounts','manage_member_closure_requests'))
with check (public.has_module_permission('member-accounts','manage_member_closure_requests'));

drop policy if exists "members read own export requests" on public.member_export_requests;
create policy "members read own export requests"
on public.member_export_requests for select to authenticated
using (member_id = auth.uid());

drop policy if exists "active members request data export" on public.member_export_requests;
create policy "active members request data export"
on public.member_export_requests for insert to authenticated
with check (member_id = auth.uid() and public.is_active_member());

drop policy if exists "member managers read export requests" on public.member_export_requests;
create policy "member managers read export requests"
on public.member_export_requests for select to authenticated
using (public.has_module_permission('member-accounts','manage_member_exports'));

drop policy if exists "member managers update export requests" on public.member_export_requests;
create policy "member managers update export requests"
on public.member_export_requests for update to authenticated
using (public.has_module_permission('member-accounts','manage_member_exports'))
with check (public.has_module_permission('member-accounts','manage_member_exports'));

-- No API policies are created for member_auth_locks. Trusted server-side handlers
-- will manage it in Phase 2.

revoke all on table
  public.member_settings,
  public.member_profiles,
  public.member_consents,
  public.member_invitations,
  public.member_closure_requests,
  public.member_export_requests,
  public.member_auth_locks
from anon, authenticated;

grant select on public.member_settings to anon;
grant select, update on public.member_settings to authenticated;
grant select on public.member_profiles, public.member_consents, public.member_invitations
to authenticated;
grant select, update on public.member_closure_requests, public.member_export_requests
to authenticated;
grant insert (member_id, reason) on public.member_closure_requests to authenticated;
grant insert (member_id) on public.member_export_requests to authenticated;

commit;
