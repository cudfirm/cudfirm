-- ============================================================
-- CUDFIRM Member Accounts — Module Migration 002
-- Trusted server-operation foundation for registration, sign-in protection,
-- invitations, member state changes, requests, exports, and audit events.
-- Requires Member Accounts migration 001.
-- Do not rewrite after execution; use a later corrective migration.
-- ============================================================

begin;

do $$
begin
  if to_regclass('public.member_profiles') is null
     or to_regclass('public.member_settings') is null
     or to_regprocedure('public.has_module_permission(text,text)') is null then
    raise exception 'Run Member Accounts migration 001 before migration 002.';
  end if;
end;
$$;

-- -----------------------------------------------------------------
-- 1. Server-controlled rate-limit state.
-- -----------------------------------------------------------------
create table if not exists public.member_rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash),
  constraint member_rate_limits_scope_check check (
    scope in (
      'register_ip','register_email','signin_ip','resend_ip','resend_email',
      'invite_email','request_member','export_download'
    )
  ),
  constraint member_rate_limits_identifier_hash_check
    check (char_length(identifier_hash) between 32 and 128),
  constraint member_rate_limits_request_count_check
    check (request_count between 0 and 1000000)
);

create index if not exists member_rate_limits_blocked_until_idx
  on public.member_rate_limits(blocked_until)
  where blocked_until is not null;

alter table public.member_rate_limits enable row level security;
alter table public.member_rate_limits force row level security;
revoke all on table public.member_rate_limits from public, anon, authenticated;

-- Member anonymization metadata is additive and does not rewrite migration 001.
alter table public.member_profiles
  add column if not exists anonymized_at timestamptz,
  add column if not exists anonymized_by uuid references auth.users(id) on delete set null;

-- Private temporary export bucket. Only trusted server handlers use it.
insert into storage.buckets (id, name, public)
values ('member-exports', 'member-exports', false)
on conflict (id) do update set public = false;

-- -----------------------------------------------------------------
-- 2. Atomic general-purpose rate limiter for trusted Edge Functions.
-- -----------------------------------------------------------------
create or replace function public.member_rate_limit_consume(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.member_rate_limits%rowtype;
  v_count integer;
  v_blocked_until timestamptz;
  v_allowed boolean;
  v_retry_after integer := 0;
begin
  if p_scope not in (
    'register_ip','register_email','signin_ip','resend_ip','resend_email',
    'invite_email','request_member','export_download'
  ) then
    raise exception 'Unsupported rate-limit scope.';
  end if;

  if char_length(coalesce(p_identifier_hash, '')) not between 32 and 128 then
    raise exception 'Invalid rate-limit identifier.';
  end if;

  if p_limit not between 1 and 10000
     or p_window_seconds not between 1 and 86400
     or p_block_seconds not between 1 and 604800 then
    raise exception 'Invalid rate-limit configuration.';
  end if;

  insert into public.member_rate_limits(scope, identifier_hash, request_count)
  values (p_scope, p_identifier_hash, 0)
  on conflict (scope, identifier_hash) do nothing;

  select * into v_row
  from public.member_rate_limits
  where scope = p_scope and identifier_hash = p_identifier_hash
  for update;

  if v_row.blocked_until is not null and v_row.blocked_until > v_now then
    v_retry_after := greatest(1, ceil(extract(epoch from (v_row.blocked_until - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'count', v_row.request_count,
      'remaining', 0,
      'retryAfter', v_retry_after,
      'blockedUntil', v_row.blocked_until
    );
  end if;

  if v_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
    v_count := 1;
    v_blocked_until := null;
    update public.member_rate_limits
    set window_started_at = v_now,
        request_count = v_count,
        blocked_until = null,
        updated_at = v_now
    where scope = p_scope and identifier_hash = p_identifier_hash;
  else
    v_count := v_row.request_count + 1;
    if v_count > p_limit then
      v_blocked_until := v_now + make_interval(secs => p_block_seconds);
      v_retry_after := p_block_seconds;
    else
      v_blocked_until := null;
    end if;

    update public.member_rate_limits
    set request_count = v_count,
        blocked_until = v_blocked_until,
        updated_at = v_now
    where scope = p_scope and identifier_hash = p_identifier_hash;
  end if;

  v_allowed := v_count <= p_limit;

  return jsonb_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'remaining', greatest(0, p_limit - v_count),
    'retryAfter', case when v_allowed then 0 else greatest(1, v_retry_after) end,
    'blockedUntil', v_blocked_until
  );
end;
$$;

-- -----------------------------------------------------------------
-- 3. Approved five-attempt / fifteen-minute member sign-in lock.
-- -----------------------------------------------------------------
create or replace function public.member_auth_lock_check(p_identifier_hash text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.member_auth_locks%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_row
  from public.member_auth_locks
  where identifier_hash = p_identifier_hash;

  if not found then
    return jsonb_build_object('locked', false, 'failedAttempts', 0, 'retryAfter', 0);
  end if;

  if v_row.locked_until is not null and v_row.locked_until > v_now then
    return jsonb_build_object(
      'locked', true,
      'failedAttempts', v_row.failed_attempts,
      'retryAfter', greatest(1, ceil(extract(epoch from (v_row.locked_until - v_now)))::integer),
      'lockedUntil', v_row.locked_until
    );
  end if;

  if v_row.locked_until is not null then
    delete from public.member_auth_locks where identifier_hash = p_identifier_hash;
    return jsonb_build_object('locked', false, 'failedAttempts', 0, 'retryAfter', 0);
  end if;

  return jsonb_build_object(
    'locked', false,
    'failedAttempts', v_row.failed_attempts,
    'retryAfter', 0
  );
end;
$$;

create or replace function public.member_auth_lock_record_failure(p_identifier_hash text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_limit integer;
  v_lock_minutes integer;
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
  v_locked_until timestamptz;
begin
  select failed_sign_in_limit, temporary_lock_minutes
  into v_limit, v_lock_minutes
  from public.member_settings
  where id = 1;

  insert into public.member_auth_locks(identifier_hash, failed_attempts, locked_until, updated_at)
  values (p_identifier_hash, 1, null, v_now)
  on conflict (identifier_hash) do update
  set failed_attempts = case
        when public.member_auth_locks.locked_until is not null
         and public.member_auth_locks.locked_until <= v_now then 1
        else public.member_auth_locks.failed_attempts + 1
      end,
      locked_until = case
        when (
          case
            when public.member_auth_locks.locked_until is not null
             and public.member_auth_locks.locked_until <= v_now then 1
            else public.member_auth_locks.failed_attempts + 1
          end
        ) >= v_limit
        then v_now + make_interval(mins => v_lock_minutes)
        else null
      end,
      updated_at = v_now
  returning failed_attempts, locked_until into v_attempts, v_locked_until;

  return jsonb_build_object(
    'locked', v_locked_until is not null and v_locked_until > v_now,
    'failedAttempts', v_attempts,
    'retryAfter', case
      when v_locked_until is null then 0
      else greatest(1, ceil(extract(epoch from (v_locked_until - v_now)))::integer)
    end,
    'lockedUntil', v_locked_until
  );
end;
$$;

create or replace function public.member_auth_lock_clear(p_identifier_hash text)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.member_auth_locks where identifier_hash = p_identifier_hash;
$$;

-- -----------------------------------------------------------------
-- 4. Auth identity lookup and profile finalization helpers.
--    Service role only; no browser caller may execute these.
-- -----------------------------------------------------------------
create or replace function public.member_find_auth_user_by_email(p_email text)
returns table(user_id uuid, email_confirmed boolean, created_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select au.id, au.email_confirmed_at is not null, au.created_at
  from auth.users au
  where lower(au.email) = lower(btrim(p_email))
  limit 1;
$$;

create or replace function public.member_finalize_registration(
  p_user_id uuid,
  p_display_name text,
  p_terms_version text,
  p_privacy_version text,
  p_registration_source text default 'self_registration'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_name text;
  v_user auth.users%rowtype;
  v_settings public.member_settings%rowtype;
  v_status text;
  v_profile public.member_profiles%rowtype;
begin
  if p_registration_source not in ('self_registration','invitation') then
    raise exception 'Invalid registration source.';
  end if;

  v_name := regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters.';
  end if;

  select * into v_user from auth.users where id = p_user_id;
  if not found then
    raise exception 'Auth user was not found.';
  end if;

  select * into v_settings from public.member_settings where id = 1;

  if p_terms_version is distinct from v_settings.terms_version
     or p_privacy_version is distinct from v_settings.privacy_version then
    raise exception 'Current Terms and Privacy versions must be accepted.';
  end if;

  v_status := case
    when v_user.email_confirmed_at is null then 'pending_verification'
    when v_settings.activation_mode = 'manual_approval' then 'pending_approval'
    else 'active'
  end;

  insert into public.member_profiles(
    user_id, display_name, status, verified_at, approved_at
  ) values (
    p_user_id,
    v_name,
    v_status,
    v_user.email_confirmed_at,
    case when v_status = 'active' then now() else null end
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name
  where public.member_profiles.status in ('pending_verification','pending_approval')
  returning * into v_profile;

  if v_profile.user_id is null then
    select * into v_profile from public.member_profiles where user_id = p_user_id;
  end if;

  insert into public.member_consents(
    member_id, terms_version, privacy_version, registration_source
  ) values (
    p_user_id, p_terms_version, p_privacy_version, p_registration_source
  ) on conflict (member_id, terms_version, privacy_version) do nothing;

  return jsonb_build_object(
    'userId', v_profile.user_id,
    'displayName', v_profile.display_name,
    'status', v_profile.status,
    'verifiedAt', v_profile.verified_at
  );
end;
$$;

create or replace function public.member_prepare_invited_profile(
  p_invitation_id uuid,
  p_user_id uuid,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_name text;
  v_user auth.users%rowtype;
  v_status text;
  v_profile public.member_profiles%rowtype;
begin
  v_name := regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters.';
  end if;

  select * into v_user from auth.users where id = p_user_id;
  if not found then
    raise exception 'Auth user was not found.';
  end if;

  v_status := case
    when v_user.email_confirmed_at is null then 'pending_verification'
    else 'pending_approval'
  end;

  insert into public.member_profiles(user_id, display_name, status, verified_at)
  values (p_user_id, v_name, v_status, v_user.email_confirmed_at)
  on conflict (user_id) do update
  set display_name = excluded.display_name
  where public.member_profiles.status in ('pending_verification','pending_approval')
  returning * into v_profile;

  if v_profile.user_id is null then
    select * into v_profile from public.member_profiles where user_id = p_user_id;
  end if;

  update public.member_invitations
  set auth_user_id = p_user_id
  where id = p_invitation_id and status = 'pending';

  return jsonb_build_object(
    'userId', v_profile.user_id,
    'status', v_profile.status,
    'verifiedAt', v_profile.verified_at
  );
end;
$$;

create or replace function public.member_accept_invitation_record(
  p_invitation_id uuid,
  p_user_id uuid,
  p_terms_version text,
  p_privacy_version text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_invitation public.member_invitations%rowtype;
  v_user auth.users%rowtype;
  v_settings public.member_settings%rowtype;
  v_status text;
begin
  select * into v_invitation
  from public.member_invitations
  where id = p_invitation_id
  for update;

  if not found or v_invitation.status <> 'pending' then
    raise exception 'Invitation is not available.';
  end if;

  if v_invitation.expires_at <= now() then
    update public.member_invitations set status = 'expired' where id = p_invitation_id;
    raise exception 'Invitation has expired.';
  end if;

  select * into v_user from auth.users where id = p_user_id;
  if not found or v_user.email_confirmed_at is null then
    raise exception 'A verified account is required.';
  end if;

  if lower(v_user.email) <> lower(v_invitation.email) then
    raise exception 'Invitation does not match the authenticated account.';
  end if;

  if v_invitation.auth_user_id is not null and v_invitation.auth_user_id <> p_user_id then
    raise exception 'Invitation belongs to another account.';
  end if;

  select * into v_settings from public.member_settings where id = 1;
  if p_terms_version is distinct from v_settings.terms_version
     or p_privacy_version is distinct from v_settings.privacy_version then
    raise exception 'Current Terms and Privacy versions must be accepted.';
  end if;

  insert into public.member_consents(
    member_id, terms_version, privacy_version, registration_source
  ) values (
    p_user_id, p_terms_version, p_privacy_version, 'invitation'
  ) on conflict (member_id, terms_version, privacy_version) do nothing;

  v_status := case
    when v_settings.activation_mode = 'manual_approval' then 'pending_approval'
    else 'active'
  end;

  update public.member_profiles
  set display_name = v_invitation.display_name,
      status = v_status,
      verified_at = coalesce(verified_at, v_user.email_confirmed_at),
      approved_at = case when v_status = 'active' then coalesce(approved_at, now()) else approved_at end
  where user_id = p_user_id
    and status in ('pending_verification','pending_approval');

  if not found then
    raise exception 'Member profile is not eligible for invitation activation.';
  end if;

  update public.member_invitations
  set status = 'accepted',
      auth_user_id = p_user_id,
      accepted_at = now()
  where id = p_invitation_id;

  return jsonb_build_object(
    'userId', p_user_id,
    'status', v_status,
    'acceptedAt', now()
  );
end;
$$;

-- -----------------------------------------------------------------
-- 5. Verification-state sync. Consent must exist before activation.
-- -----------------------------------------------------------------
create or replace function public.sync_member_email_verification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_activation_mode text;
  v_has_consent boolean;
begin
  if new.email_confirmed_at is null
     or old.email_confirmed_at is not null then
    return new;
  end if;

  select activation_mode into v_activation_mode
  from public.member_settings where id = 1;

  select exists(
    select 1 from public.member_consents mc where mc.member_id = new.id
  ) into v_has_consent;

  update public.member_profiles
  set verified_at = coalesce(verified_at, new.email_confirmed_at),
      status = case
        when status <> 'pending_verification' then status
        when not v_has_consent then 'pending_verification'
        when v_activation_mode = 'manual_approval' then 'pending_approval'
        else 'active'
      end,
      approved_at = case
        when status = 'pending_verification'
         and v_has_consent
         and v_activation_mode = 'automatic_after_verification'
        then coalesce(approved_at, now())
        else approved_at
      end
  where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists sync_member_email_verification_trigger on auth.users;
create trigger sync_member_email_verification_trigger
after update of email_confirmed_at on auth.users
for each row execute function public.sync_member_email_verification();

-- -----------------------------------------------------------------
-- 6. Member security events in the existing protected audit table.
-- -----------------------------------------------------------------
alter table public.security_events
  drop constraint if exists security_events_type_check;

alter table public.security_events
  add constraint security_events_type_check check (event_type in (
    'login_success','login_failed','logout','access_denied',
    'role_changed','user_suspended','user_reactivated',
    'member_registration_requested','member_registered','member_verification_resent',
    'member_invitation_sent','member_invitation_accepted',
    'member_login_success','member_login_failed','member_access_denied',
    'member_approved','member_suspended','member_reactivated','member_archived',
    'member_anonymized','member_deleted',
    'member_closure_requested','member_closure_reviewed',
    'member_export_requested','member_export_ready','member_export_downloaded',
    'member_email_delivery_failed'
  ));

create or replace function public.record_member_security_event(
  p_event_type text,
  p_actor_id uuid default null,
  p_actor_email text default null,
  p_subject_id uuid default null,
  p_subject_email text default null,
  p_success boolean default true,
  p_severity text default 'info',
  p_details jsonb default '{}'::jsonb,
  p_user_agent text default null,
  p_source text default 'member_edge_function'
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id bigint;
  v_details jsonb;
begin
  if p_event_type not in (
    'member_registration_requested','member_registered','member_verification_resent',
    'member_invitation_sent','member_invitation_accepted',
    'member_login_success','member_login_failed','member_access_denied',
    'member_approved','member_suspended','member_reactivated','member_archived',
    'member_anonymized','member_deleted',
    'member_closure_requested','member_closure_reviewed',
    'member_export_requested','member_export_ready','member_export_downloaded',
    'member_email_delivery_failed'
  ) then
    raise exception 'Unsupported member security event type.';
  end if;

  if p_severity not in ('info','warning','critical') then
    raise exception 'Unsupported security severity.';
  end if;

  v_details := coalesce(p_details, '{}'::jsonb)
    - 'password' - 'token' - 'access_token' - 'refresh_token'
    - 'verification_link' - 'recovery_link' - 'invite_link';

  if pg_column_size(v_details) > 16384 then
    v_details := jsonb_build_object('note', 'Details omitted because they exceeded the audit size limit.');
  end if;

  insert into public.security_events(
    event_type, severity, actor_id, actor_email, subject_id, subject_email,
    success, source, user_agent, details
  ) values (
    p_event_type,
    p_severity,
    p_actor_id,
    nullif(left(lower(btrim(coalesce(p_actor_email, ''))), 320), ''),
    p_subject_id,
    nullif(left(lower(btrim(coalesce(p_subject_email, ''))), 320), ''),
    p_success,
    left(coalesce(p_source, 'member_edge_function'), 120),
    left(coalesce(p_user_agent, ''), 500),
    v_details
  ) returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------
-- 7. Grants: all trusted helpers are service-role only.
-- -----------------------------------------------------------------
revoke all on function public.member_rate_limit_consume(text,text,integer,integer,integer)
  from public, anon, authenticated;
revoke all on function public.member_auth_lock_check(text)
  from public, anon, authenticated;
revoke all on function public.member_auth_lock_record_failure(text)
  from public, anon, authenticated;
revoke all on function public.member_auth_lock_clear(text)
  from public, anon, authenticated;
revoke all on function public.member_find_auth_user_by_email(text)
  from public, anon, authenticated;
revoke all on function public.member_finalize_registration(uuid,text,text,text,text)
  from public, anon, authenticated;
revoke all on function public.member_prepare_invited_profile(uuid,uuid,text)
  from public, anon, authenticated;
revoke all on function public.member_accept_invitation_record(uuid,uuid,text,text)
  from public, anon, authenticated;
revoke all on function public.sync_member_email_verification()
  from public, anon, authenticated;
revoke all on function public.record_member_security_event(text,uuid,text,uuid,text,boolean,text,jsonb,text,text)
  from public, anon, authenticated;

-- Supabase hosted projects provide the service_role database role.
grant execute on function public.member_rate_limit_consume(text,text,integer,integer,integer) to service_role;
grant execute on function public.member_auth_lock_check(text) to service_role;
grant execute on function public.member_auth_lock_record_failure(text) to service_role;
grant execute on function public.member_auth_lock_clear(text) to service_role;
grant execute on function public.member_find_auth_user_by_email(text) to service_role;
grant execute on function public.member_finalize_registration(uuid,text,text,text,text) to service_role;
grant execute on function public.member_prepare_invited_profile(uuid,uuid,text) to service_role;
grant execute on function public.member_accept_invitation_record(uuid,uuid,text,text) to service_role;
grant execute on function public.record_member_security_event(text,uuid,text,uuid,text,boolean,text,jsonb,text,text) to service_role;

commit;
