-- ============================================================
-- CUDFIRM CMS — Migration 014
-- Complete RLS, grants, RPC and Storage hardening
-- Run after 013_theme_wide_default_fix.sql.
--
-- IMPORTANT:
--   * This migration preserves the current public website reads.
--   * Public contact/newsletter submissions remain available.
--   * Dashboard access remains role-based through user_profiles.
--   * The legacy public.content table, when present, is quarantined
--     because the current CUDFIRM codebase does not use it.
-- ============================================================

begin;

-- -----------------------------------------------------------------
-- 1. Harden role helper functions used by every RLS policy.
-- -----------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select up.role
  from public.user_profiles as up
  where up.id = auth.uid()
    and up.is_active = true
  limit 1;
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case public.current_app_role()
    when 'super_admin' then true
    when 'admin' then permission_name = any(array[
      'view_dashboard','create_content','edit_content','delete_content','publish_content',
      'view_messages','manage_messages','view_subscribers','manage_subscribers',
      'view_seo','manage_seo','view_media','manage_media','run_site_health',
      'export_data','view_activity','manage_settings'
    ])
    when 'editor' then permission_name = any(array[
      'view_dashboard','create_content','edit_content','publish_content',
      'view_seo','manage_seo','view_media','manage_media','run_site_health'
    ])
    when 'viewer' then permission_name = any(array[
      'view_dashboard','view_seo','view_media','run_site_health'
    ])
    else false
  end;
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

-- Trigger functions should not be directly executable by API roles.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.protect_last_super_admin() from public, anon, authenticated;
revoke all on function public.sync_subscriber_status_fields() from public, anon, authenticated;
revoke all on function public.sync_message_workflow_fields() from public, anon, authenticated;
revoke all on function public.audit_user_profile_security_change() from public, anon, authenticated;

-- -----------------------------------------------------------------
-- 2. Enable and force RLS on every application table.
-- -----------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'hero','services','portfolio_projects','testimonials','faq','navigation',
    'site_settings','seo_meta','media_library','messages','subscribers',
    'activity_log','user_profiles','security_events'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('alter table public.%I force row level security', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------
-- 3. Rebuild public-content policies with explicit target roles.
-- -----------------------------------------------------------------
drop policy if exists "public read hero" on public.hero;
create policy "public read hero"
on public.hero for select to anon, authenticated
using (true);

-- Published-only tables: anonymous visitors see only published rows;
-- authenticated dashboard users use separate permission policies.
do $$
declare
  t text;
begin
  foreach t in array array['services','portfolio_projects','testimonials','faq','navigation'] loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I', t);
    execute format(
      'create policy "public read %1$s" on public.%1$I for select to anon using (status = ''published'')',
      t
    );
  end loop;
end $$;

-- Public runtime configuration and SEO metadata are intentionally readable.
drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings"
on public.site_settings for select to anon, authenticated
using (id = 1);

drop policy if exists "public read seo_meta" on public.seo_meta;
create policy "public read seo_meta"
on public.seo_meta for select to anon, authenticated
using (true);

-- Media files remain reachable through their public Storage URLs, but the
-- database catalogue itself is private to permitted dashboard users.
drop policy if exists "public read media_library" on public.media_library;

-- -----------------------------------------------------------------
-- 4. Rebuild dashboard content policies and remove historical broad ones.
-- -----------------------------------------------------------------
drop policy if exists "authenticated write hero" on public.hero;
drop policy if exists "permitted insert hero" on public.hero;
drop policy if exists "permitted update hero" on public.hero;
drop policy if exists "permitted delete hero" on public.hero;
create policy "permitted insert hero" on public.hero
for insert to authenticated with check (public.has_permission('create_content'));
create policy "permitted update hero" on public.hero
for update to authenticated
using (public.has_permission('edit_content'))
with check (public.has_permission('edit_content'));
create policy "permitted delete hero" on public.hero
for delete to authenticated using (public.has_permission('delete_content'));

do $$
declare
  t text;
begin
  foreach t in array array['services','portfolio_projects','testimonials','faq','navigation'] loop
    execute format('drop policy if exists "authenticated write %1$s" on public.%1$I', t);
    execute format('drop policy if exists "permitted read %1$s" on public.%1$I', t);
    execute format('drop policy if exists "permitted insert %1$s" on public.%1$I', t);
    execute format('drop policy if exists "permitted update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "permitted delete %1$s" on public.%1$I', t);
    execute format('create policy "permitted read %1$s" on public.%1$I for select to authenticated using (public.has_permission(''view_dashboard''))', t);
    execute format('create policy "permitted insert %1$s" on public.%1$I for insert to authenticated with check (public.has_permission(''create_content''))', t);
    execute format('create policy "permitted update %1$s" on public.%1$I for update to authenticated using (public.has_permission(''edit_content'')) with check (public.has_permission(''edit_content''))', t);
    execute format('create policy "permitted delete %1$s" on public.%1$I for delete to authenticated using (public.has_permission(''delete_content''))', t);
  end loop;
end $$;

-- Settings, SEO and media metadata.
drop policy if exists "authenticated write site_settings" on public.site_settings;
drop policy if exists "permitted write site_settings" on public.site_settings;
create policy "permitted write site_settings" on public.site_settings
for all to authenticated
using (public.has_permission('manage_settings'))
with check (public.has_permission('manage_settings') and id = 1);

drop policy if exists "authenticated write seo_meta" on public.seo_meta;
drop policy if exists "permitted write seo_meta" on public.seo_meta;
create policy "permitted write seo_meta" on public.seo_meta
for all to authenticated
using (public.has_permission('manage_seo'))
with check (public.has_permission('manage_seo'));

drop policy if exists "authenticated write media_library" on public.media_library;
drop policy if exists "permitted read media_library" on public.media_library;
drop policy if exists "permitted write media_library" on public.media_library;
create policy "permitted read media_library" on public.media_library
for select to authenticated using (public.has_permission('view_media'));
create policy "permitted write media_library" on public.media_library
for all to authenticated
using (public.has_permission('manage_media'))
with check (public.has_permission('manage_media'));

-- -----------------------------------------------------------------
-- 5. Harden public submission tables.
-- -----------------------------------------------------------------
drop policy if exists "public submit messages" on public.messages;
create policy "public submit messages" on public.messages
for insert to anon, authenticated
with check (
  char_length(btrim(coalesce(name, ''))) between 1 and 120
  and char_length(btrim(coalesce(contact_info, ''))) between 3 and 320
  and char_length(btrim(coalesce(message, ''))) between 1 and 5000
  and status = 'unread'
  and is_read = false
  and is_archived = false
  and is_important = false
  and replied_at is null
  and archived_at is null
);

-- Admin/Super Admin message access. Backup restore can insert historical rows.
drop policy if exists "authenticated manage messages" on public.messages;
drop policy if exists "authenticated update messages" on public.messages;
drop policy if exists "authenticated delete messages" on public.messages;
drop policy if exists "permitted read messages" on public.messages;
drop policy if exists "permitted insert messages" on public.messages;
drop policy if exists "permitted update messages" on public.messages;
drop policy if exists "permitted delete messages" on public.messages;
create policy "permitted read messages" on public.messages
for select to authenticated using (public.has_permission('view_messages'));
create policy "permitted insert messages" on public.messages
for insert to authenticated with check (public.has_permission('backup_restore'));
create policy "permitted update messages" on public.messages
for update to authenticated
using (public.has_permission('manage_messages'))
with check (public.has_permission('manage_messages'));
create policy "permitted delete messages" on public.messages
for delete to authenticated using (public.has_permission('manage_messages'));

-- Public newsletter signup: only a normalized active/footer record is valid.
drop policy if exists "public subscribe" on public.subscribers;
create policy "public subscribe" on public.subscribers
for insert to anon, authenticated
with check (
  char_length(btrim(email)) between 5 and 320
  and email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  and status = 'active'
  and is_active = true
  and source = 'footer'
  and unsubscribed_at is null
  and bounced_at is null
  and archived_at is null
);

drop policy if exists "authenticated read subscribers" on public.subscribers;
drop policy if exists "authenticated update subscribers" on public.subscribers;
drop policy if exists "authenticated delete subscribers" on public.subscribers;
drop policy if exists "authenticated insert subscribers" on public.subscribers;
drop policy if exists "permitted read subscribers" on public.subscribers;
drop policy if exists "permitted insert subscribers" on public.subscribers;
drop policy if exists "permitted update subscribers" on public.subscribers;
drop policy if exists "permitted delete subscribers" on public.subscribers;
create policy "permitted read subscribers" on public.subscribers
for select to authenticated using (public.has_permission('view_subscribers'));
create policy "permitted insert subscribers" on public.subscribers
for insert to authenticated
with check (public.has_permission('manage_subscribers') or public.has_permission('backup_restore'));
create policy "permitted update subscribers" on public.subscribers
for update to authenticated
using (public.has_permission('manage_subscribers'))
with check (public.has_permission('manage_subscribers'));
create policy "permitted delete subscribers" on public.subscribers
for delete to authenticated using (public.has_permission('manage_subscribers'));

-- -----------------------------------------------------------------
-- 6. Replace forgeable direct activity logging with a controlled RPC.
-- -----------------------------------------------------------------
create or replace function public.record_activity_event(
  p_action text,
  p_entity text default null,
  p_entity_label text default null,
  p_details jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_id bigint;
begin
  if v_uid is null or public.current_app_role() is null then
    raise exception 'Authentication is required.';
  end if;

  if char_length(btrim(coalesce(p_action, ''))) not between 1 and 80 then
    raise exception 'Invalid activity action.';
  end if;

  select up.email into v_email
  from public.user_profiles as up
  where up.id = v_uid and up.is_active = true;

  insert into public.activity_log(actor_email, action, entity, entity_label, details)
  values (
    left(coalesce(v_email, auth.jwt()->>'email'), 320),
    left(btrim(p_action), 80),
    nullif(left(btrim(coalesce(p_entity, '')), 120), ''),
    nullif(left(btrim(coalesce(p_entity_label, '')), 320), ''),
    case
      when p_details is null then null
      when pg_column_size(p_details) <= 16384 then p_details
      else jsonb_build_object('note', 'Details omitted because they exceeded the audit size limit.')
    end
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_activity_event(text,text,text,jsonb) from public, anon;
grant execute on function public.record_activity_event(text,text,text,jsonb) to authenticated;

-- Remove historical direct-write policies. Only Super Admin backup restore may
-- directly insert/delete activity rows; normal logging uses the RPC above.
drop policy if exists "authenticated read activity_log" on public.activity_log;
drop policy if exists "authenticated write activity_log" on public.activity_log;
drop policy if exists "authenticated delete activity_log" on public.activity_log;
drop policy if exists "permitted read activity_log" on public.activity_log;
drop policy if exists "active users insert activity_log" on public.activity_log;
drop policy if exists "backup restore inserts activity_log" on public.activity_log;
drop policy if exists "backup restore deletes activity_log" on public.activity_log;
create policy "permitted read activity_log" on public.activity_log
for select to authenticated using (public.has_permission('view_activity'));
create policy "backup restore inserts activity_log" on public.activity_log
for insert to authenticated with check (public.has_permission('backup_restore'));
create policy "backup restore deletes activity_log" on public.activity_log
for delete to authenticated using (public.has_permission('backup_restore'));

-- -----------------------------------------------------------------
-- 7. User profiles and security events.
-- -----------------------------------------------------------------
drop policy if exists "users read own profile or super admin" on public.user_profiles;
create policy "users read own profile or super admin" on public.user_profiles
for select to authenticated
using (id = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "super admin updates user profiles" on public.user_profiles;
create policy "super admin updates user profiles" on public.user_profiles
for update to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

drop policy if exists "super admins read security events" on public.security_events;
create policy "super admins read security events" on public.security_events
for select to authenticated using (public.has_permission('view_security'));

-- Strengthen the anonymous failed-login audit endpoint with both per-identity
-- and global rolling caps. This cannot be a full anti-abuse system without an
-- Edge Function/IP signal, but it prevents unbounded database growth.
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
set search_path = pg_catalog, public
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
    from public.user_profiles as up
    where up.id = v_uid;
    v_email := coalesce(v_email, auth.jwt()->>'email');
  else
    v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');
  end if;

  v_severity := case
    when p_event_type = 'login_failed' then 'warning'
    when p_event_type = 'access_denied' then 'critical'
    else 'info'
  end;

  if v_uid is null then
    if (select count(*) from public.security_events
        where event_type = 'login_failed'
          and created_at > now() - interval '10 minutes') >= 500 then
      return 0;
    end if;

    if (select count(*) from public.security_events
        where event_type = 'login_failed'
          and actor_email is not distinct from left(v_email, 320)
          and created_at > now() - interval '10 minutes') >= 10 then
      return 0;
    end if;
  end if;

  insert into public.security_events(
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

-- -----------------------------------------------------------------
-- 8. Storage metadata policies. The bucket remains public for direct file
--    delivery, but anonymous users cannot enumerate storage.objects.
-- -----------------------------------------------------------------
drop policy if exists "public read media bucket" on storage.objects;
drop policy if exists "authenticated upload media bucket" on storage.objects;
drop policy if exists "authenticated update media bucket" on storage.objects;
drop policy if exists "authenticated delete media bucket" on storage.objects;
drop policy if exists "permitted upload media bucket" on storage.objects;
drop policy if exists "permitted update media bucket" on storage.objects;
drop policy if exists "permitted delete media bucket" on storage.objects;
create policy "permitted upload media bucket" on storage.objects
for insert to authenticated
with check (bucket_id = 'media' and public.has_permission('manage_media'));
create policy "permitted update media bucket" on storage.objects
for update to authenticated
using (bucket_id = 'media' and public.has_permission('manage_media'))
with check (bucket_id = 'media' and public.has_permission('manage_media'));
create policy "permitted delete media bucket" on storage.objects
for delete to authenticated
using (bucket_id = 'media' and public.has_permission('manage_media'));

-- -----------------------------------------------------------------
-- 9. Least-privilege table grants. RLS remains the final row authority.
-- -----------------------------------------------------------------
revoke all on table public.hero, public.services, public.portfolio_projects,
  public.testimonials, public.faq, public.navigation, public.site_settings,
  public.seo_meta, public.media_library, public.messages, public.subscribers,
  public.activity_log, public.user_profiles, public.security_events
from anon, authenticated;

-- Anonymous/public website reads.
grant select on public.hero, public.services, public.portfolio_projects,
  public.testimonials, public.faq, public.navigation, public.site_settings,
  public.seo_meta to anon;

-- Restrict anonymous inserts to the exact public form columns.
grant insert (name, contact_info, message) on public.messages to anon;
grant insert (email) on public.subscribers to anon;

-- Authenticated dashboard privileges; RLS policies apply the role matrix.
grant select, insert, update, delete on public.hero, public.services,
  public.portfolio_projects, public.testimonials, public.faq, public.navigation,
  public.seo_meta, public.media_library, public.messages, public.subscribers
  to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, delete on public.activity_log to authenticated;
grant select on public.security_events to authenticated;
grant select on public.user_profiles to authenticated;
grant update (role, is_active, updated_at) on public.user_profiles to authenticated;

-- Authenticated users may still use the public contact/subscriber forms; their
-- RLS permissions determine whether the request is a public submission or an
-- administrative operation.

-- -----------------------------------------------------------------
-- 10. Quarantine the legacy/unmanaged public.content table if it exists.
--     The audited CUDFIRM frontend/dashboard contains no reference to it.
-- -----------------------------------------------------------------
do $$
declare
  p record;
begin
  if to_regclass('public.content') is not null then
    execute 'alter table public.content enable row level security';
    execute 'alter table public.content force row level security';
    for p in select policyname from pg_policies where schemaname='public' and tablename='content' loop
      execute format('drop policy if exists %I on public.content', p.policyname);
    end loop;
    execute 'revoke all on table public.content from anon, authenticated';
    comment on table public.content is
      'Quarantined by CUDFIRM migration 014: not referenced by the audited application. Review before reuse.';
  end if;
end $$;

-- Prevent future public-schema tables from silently receiving broad API grants.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

commit;
