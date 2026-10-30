-- ============================================================
-- CUDFIRM CMS — Migration 009
-- Phase 6.2: User Roles and Permissions
-- Run after 008_backup_restore_permissions.sql
-- Safe to re-run.
-- ============================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_role_check check (role in ('super_admin','admin','editor','viewer'))
);

create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_user_profiles_active on public.user_profiles(is_active);

-- Existing Auth users receive profiles without overwriting existing choices.
insert into public.user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', ''), 'viewer', true, u.created_at, now()
from auth.users u
on conflict (id) do update set email = excluded.email;

-- Ensure the oldest existing account becomes Super Admin only when no
-- Super Admin currently exists. This prevents lockout on first install
-- while preserving roles on subsequent runs.
do $$
begin
  if not exists (select 1 from public.user_profiles where role = 'super_admin' and is_active) then
    update public.user_profiles
      set role = 'super_admin', is_active = true, updated_at = now()
      where id = (select id from public.user_profiles order by created_at asc limit 1);
  end if;
end $$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'viewer', true, coalesce(new.created_at, now()), now())
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

-- Security-definer helpers are used by RLS policies. They intentionally
-- return false for inactive or missing profiles.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public
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
      'view_messages','view_subscribers','view_seo','manage_seo',
      'view_media','manage_media','run_site_health','view_activity'
    ])
    when 'viewer' then permission_name = any(array[
      'view_dashboard','view_messages','view_subscribers','view_seo',
      'view_media','run_site_health','view_activity'
    ])
    else false
  end;
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.has_permission(text) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

alter table public.user_profiles enable row level security;
drop policy if exists "users read own profile or super admin" on public.user_profiles;
create policy "users read own profile or super admin" on public.user_profiles
for select to authenticated
using (id = auth.uid() or public.has_permission('manage_users'));

drop policy if exists "super admin updates user profiles" on public.user_profiles;
create policy "super admin updates user profiles" on public.user_profiles
for update to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

-- Prevent accidental removal of the final active Super Admin.
create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'super_admin' and old.is_active = true
     and (new.role <> 'super_admin' or new.is_active = false)
     and (select count(*) from public.user_profiles where role='super_admin' and is_active=true and id<>old.id) = 0 then
    raise exception 'At least one active Super Admin is required.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_last_super_admin_trigger on public.user_profiles;
create trigger protect_last_super_admin_trigger
before update on public.user_profiles
for each row execute function public.protect_last_super_admin();

-- ---------- CONTENT TABLES ----------
-- Remove broad "any authenticated user" write policies.
drop policy if exists "authenticated write hero" on public.hero;
drop policy if exists "authenticated write services" on public.services;
drop policy if exists "authenticated write portfolio_projects" on public.portfolio_projects;
drop policy if exists "authenticated write testimonials" on public.testimonials;
drop policy if exists "authenticated write faq" on public.faq;
drop policy if exists "authenticated write navigation" on public.navigation;

-- Hero: create/edit, with deletion reserved for admins.
drop policy if exists "permitted insert hero" on public.hero;
drop policy if exists "permitted update hero" on public.hero;
drop policy if exists "permitted delete hero" on public.hero;
create policy "permitted insert hero" on public.hero for insert to authenticated with check (public.has_permission('create_content'));
create policy "permitted update hero" on public.hero for update to authenticated using (public.has_permission('edit_content')) with check (public.has_permission('edit_content'));
create policy "permitted delete hero" on public.hero for delete to authenticated using (public.has_permission('delete_content'));

-- Reusable policies for ordered content tables.
do $$
declare t text;
begin
  foreach t in array array['services','portfolio_projects','testimonials','faq','navigation'] loop
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

-- ---------- SETTINGS / SEO / MEDIA ----------
drop policy if exists "authenticated write site_settings" on public.site_settings;
drop policy if exists "permitted write site_settings" on public.site_settings;
create policy "permitted write site_settings" on public.site_settings for all to authenticated
using (public.has_permission('manage_settings')) with check (public.has_permission('manage_settings'));

drop policy if exists "authenticated write seo_meta" on public.seo_meta;
drop policy if exists "permitted write seo_meta" on public.seo_meta;
create policy "permitted write seo_meta" on public.seo_meta for all to authenticated
using (public.has_permission('manage_seo')) with check (public.has_permission('manage_seo'));

drop policy if exists "authenticated write media_library" on public.media_library;
drop policy if exists "permitted write media_library" on public.media_library;
create policy "permitted write media_library" on public.media_library for all to authenticated
using (public.has_permission('manage_media')) with check (public.has_permission('manage_media'));

-- Storage bucket write permissions.
drop policy if exists "authenticated upload media bucket" on storage.objects;
drop policy if exists "authenticated update media bucket" on storage.objects;
drop policy if exists "authenticated delete media bucket" on storage.objects;
drop policy if exists "permitted upload media bucket" on storage.objects;
drop policy if exists "permitted update media bucket" on storage.objects;
drop policy if exists "permitted delete media bucket" on storage.objects;
create policy "permitted upload media bucket" on storage.objects for insert to authenticated
with check (bucket_id='media' and public.has_permission('manage_media'));
create policy "permitted update media bucket" on storage.objects for update to authenticated
using (bucket_id='media' and public.has_permission('manage_media'))
with check (bucket_id='media' and public.has_permission('manage_media'));
create policy "permitted delete media bucket" on storage.objects for delete to authenticated
using (bucket_id='media' and public.has_permission('manage_media'));

-- ---------- MESSAGES ----------
drop policy if exists "authenticated manage messages" on public.messages;
drop policy if exists "authenticated update messages" on public.messages;
drop policy if exists "authenticated delete messages" on public.messages;
drop policy if exists "permitted read messages" on public.messages;
drop policy if exists "permitted update messages" on public.messages;
drop policy if exists "permitted delete messages" on public.messages;
create policy "permitted read messages" on public.messages for select to authenticated using (public.has_permission('view_messages'));
create policy "permitted update messages" on public.messages for update to authenticated
using (public.has_permission('manage_messages')) with check (public.has_permission('manage_messages'));
create policy "permitted delete messages" on public.messages for delete to authenticated using (public.has_permission('manage_messages'));

-- ---------- SUBSCRIBERS ----------
drop policy if exists "authenticated read subscribers" on public.subscribers;
drop policy if exists "authenticated update subscribers" on public.subscribers;
drop policy if exists "authenticated delete subscribers" on public.subscribers;
drop policy if exists "authenticated insert subscribers" on public.subscribers;
drop policy if exists "permitted read subscribers" on public.subscribers;
drop policy if exists "permitted insert subscribers" on public.subscribers;
drop policy if exists "permitted update subscribers" on public.subscribers;
drop policy if exists "permitted delete subscribers" on public.subscribers;
create policy "permitted read subscribers" on public.subscribers for select to authenticated using (public.has_permission('view_subscribers'));
create policy "permitted insert subscribers" on public.subscribers for insert to authenticated
with check (public.has_permission('manage_subscribers') or public.has_permission('backup_restore'));
create policy "permitted update subscribers" on public.subscribers for update to authenticated
using (public.has_permission('manage_subscribers')) with check (public.has_permission('manage_subscribers'));
create policy "permitted delete subscribers" on public.subscribers for delete to authenticated using (public.has_permission('manage_subscribers'));

-- ---------- ACTIVITY LOG ----------
drop policy if exists "authenticated read activity_log" on public.activity_log;
drop policy if exists "authenticated write activity_log" on public.activity_log;
drop policy if exists "authenticated delete activity_log" on public.activity_log;
drop policy if exists "permitted read activity_log" on public.activity_log;
drop policy if exists "active users insert activity_log" on public.activity_log;
drop policy if exists "backup restore deletes activity_log" on public.activity_log;
create policy "permitted read activity_log" on public.activity_log for select to authenticated using (public.has_permission('view_activity'));
create policy "active users insert activity_log" on public.activity_log for insert to authenticated
with check (public.current_app_role() is not null);
create policy "backup restore deletes activity_log" on public.activity_log for delete to authenticated
using (public.has_permission('backup_restore'));

-- Helpful grants (RLS still controls rows and actions).
grant select on public.user_profiles to authenticated;
grant update (role, is_active, updated_at) on public.user_profiles to authenticated;
