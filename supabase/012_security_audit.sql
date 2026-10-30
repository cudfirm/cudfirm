-- ============================================================
-- CUDFIRM CMS — Migration 012
-- Phase 6.5: Security events and audit improvements
-- Run after 011_theme_customization.sql
-- Safe to re-run.
-- ============================================================

create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  severity text not null default 'info',
  actor_id uuid,
  actor_email text,
  subject_id uuid,
  subject_email text,
  success boolean not null default true,
  source text not null default 'dashboard',
  user_agent text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint security_events_type_check check (event_type in (
    'login_success','login_failed','logout','access_denied',
    'role_changed','user_suspended','user_reactivated'
  )),
  constraint security_events_severity_check check (severity in ('info','warning','critical'))
);

create index if not exists idx_security_events_created_at on public.security_events(created_at desc);
create index if not exists idx_security_events_type on public.security_events(event_type);
create index if not exists idx_security_events_actor_email on public.security_events(lower(actor_email));
create index if not exists idx_security_events_subject_email on public.security_events(lower(subject_email));

alter table public.security_events enable row level security;

drop policy if exists "super admins read security events" on public.security_events;
create policy "super admins read security events" on public.security_events
for select to authenticated
using (public.has_permission('view_security'));

-- Security events are written through controlled functions/triggers only.
-- Direct client inserts, updates and deletes remain unavailable.
revoke all on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;

-- Records login/logout/access events without granting direct table inserts.
-- Anonymous callers may record only failed logins. Authenticated callers may
-- record their own successful login, logout or denied dashboard access.
create or replace function public.record_auth_security_event(
  p_event_type text,
  p_email text default null,
  p_success boolean default true,
  p_details jsonb default '{}'::jsonb,
  p_user_agent text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_severity text;
  v_id bigint;
begin
  if p_event_type not in ('login_success','login_failed','logout','access_denied') then
    raise exception 'Unsupported security event type.';
  end if;

  if v_uid is null and p_event_type <> 'login_failed' then
    raise exception 'Authentication is required for this event.';
  end if;

  if v_uid is not null then
    select coalesce(up.email, auth.jwt()->>'email') into v_email
    from public.user_profiles up
    where up.id = v_uid;
    v_email := coalesce(v_email, auth.jwt()->>'email', p_email);
  else
    v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  end if;

  v_severity := case
    when p_event_type = 'login_failed' then 'warning'
    when p_event_type = 'access_denied' then 'critical'
    else 'info'
  end;

  -- Keep the anonymous endpoint useful for failed-login visibility without
  -- allowing a client to flood the audit table indefinitely.
  if v_uid is null and (
    select count(*) from public.security_events
    where event_type = 'login_failed'
      and actor_email is not distinct from left(v_email, 320)
      and user_agent is not distinct from left(coalesce(p_user_agent, ''), 500)
      and created_at > now() - interval '10 minutes'
  ) >= 20 then
    return 0;
  end if;

  insert into public.security_events (
    event_type, severity, actor_id, actor_email, success, source, user_agent, details
  ) values (
    p_event_type,
    v_severity,
    v_uid,
    left(v_email, 320),
    p_success,
    'dashboard',
    left(coalesce(p_user_agent, ''), 500),
    jsonb_build_object('reason', left(coalesce(p_details->>'reason', ''), 120))
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_auth_security_event(text,text,boolean,jsonb,text) from public;
grant execute on function public.record_auth_security_event(text,text,boolean,jsonb,text) to anon, authenticated;

-- Server-side audit trail for role and suspension changes. The actor is
-- derived from auth.uid(), so the browser cannot impersonate another admin.
create or replace function public.audit_user_profile_security_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
  v_event_type text;
  v_severity text := 'warning';
begin
  if old.role is not distinct from new.role
     and old.is_active is not distinct from new.is_active then
    return new;
  end if;

  select email into v_actor_email from public.user_profiles where id = auth.uid();

  if old.is_active = true and new.is_active = false then
    v_event_type := 'user_suspended';
    v_severity := 'critical';
  elsif old.is_active = false and new.is_active = true then
    v_event_type := 'user_reactivated';
  else
    v_event_type := 'role_changed';
    if new.role = 'super_admin' or old.role = 'super_admin' then
      v_severity := 'critical';
    end if;
  end if;

  insert into public.security_events (
    event_type, severity, actor_id, actor_email,
    subject_id, subject_email, success, source, details
  ) values (
    v_event_type, v_severity, auth.uid(), v_actor_email,
    new.id, new.email, true, 'database_trigger',
    jsonb_build_object(
      'old_role', old.role,
      'new_role', new.role,
      'old_is_active', old.is_active,
      'new_is_active', new.is_active
    )
  );

  return new;
end;
$$;

drop trigger if exists audit_user_profile_security_change_trigger on public.user_profiles;
create trigger audit_user_profile_security_change_trigger
after update of role, is_active on public.user_profiles
for each row execute function public.audit_user_profile_security_change();
