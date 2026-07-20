-- ============================================================================
-- CUDFIRM CMS 2.0.0 — Canonical Core Fresh Installer
-- Generated from the append-only migration history through migration 016.
--
-- RUN ONLY ON A NEW, EMPTY CLIENT SUPABASE PROJECT.
-- DO NOT RUN AGAINST CUDFIRM_DATABASE OR AN EXISTING CLIENT PROJECT.
--
-- Intentionally excluded:
--   002_seed.sql                     CUDFIRM website content
--   017_public_messaging_refresh.sql CUDFIRM website messaging only
--
-- After this file succeeds, run a client-specific starter-content file and then
-- 03_verify_fresh_install.sql. Do not edit migration history after execution.
-- ============================================================================



-- ============================================================================
-- SOURCE MIGRATION: 001_schema.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Schema Migration 001
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: uses IF NOT EXISTS everywhere.
-- ============================================================

-- ---------- HERO (singleton row, id = 1) ----------
create table if not exists hero (
  id                     int primary key default 1,
  eyebrow                text,
  title                  text,
  subtitle               text,
  cta_primary_text       text,
  cta_primary_target     text,   -- tab id or 'connect-content'
  cta_secondary_text     text,
  cta_secondary_target   text,
  trust_items            jsonb default '[]'::jsonb, -- [{icon, label}]
  updated_at             timestamptz default now(),
  constraint hero_is_singleton check (id = 1)
);

-- ---------- SERVICES ----------
create table if not exists services (
  id            bigint generated always as identity primary key,
  name          text not null,        -- e.g. "Starter Landing Page"
  description   text not null,
  price         text,                 -- kept as display text (₦ formatting varies)
  tags          jsonb default '[]'::jsonb,   -- ["#Landing","#Starter","#₦50K"]
  search_terms  text,                 -- used by the on-page search box
  is_special    boolean default false,-- "Got a special request?" style card
  is_active     boolean default true,
  sort_order    int default 0,
  updated_at    timestamptz default now()
);

-- ---------- PORTFOLIO PROJECTS ----------
create table if not exists portfolio_projects (
  id            bigint generated always as identity primary key,
  name          text not null,
  industry      text,
  project_type  text,
  image_url     text,
  link          text,                 -- '#', external URL, or an internal tab id
  problem       text,
  solution      text,
  tags          jsonb default '[]'::jsonb,
  is_live       boolean default true, -- true = "Live", false = "Demo"
  featured_home boolean default true, -- show in the Home tab preview grid
  is_active     boolean default true,
  sort_order    int default 0,
  updated_at    timestamptz default now()
);

-- ---------- TESTIMONIALS ----------
create table if not exists testimonials (
  id              bigint generated always as identity primary key,
  name            text not null,
  role            text,
  quote           text not null,
  accent_color    text default '#0B3D2E',
  is_placeholder  boolean default true, -- shows the "Illustrative" badge
  is_active       boolean default true,
  sort_order      int default 0,
  updated_at      timestamptz default now()
);

-- ---------- FAQ ----------
create table if not exists faq (
  id          bigint generated always as identity primary key,
  question    text not null,
  answer      text not null,
  is_active   boolean default true,
  sort_order  int default 0,
  updated_at  timestamptz default now()
);

-- ---------- NAVIGATION (sidebar + footer tabs) ----------
create table if not exists navigation (
  id          bigint generated always as identity primary key,
  tab_id      text not null,          -- 'tab1', 'connect-content', ...
  label       text not null,
  location    text not null check (location in ('sidebar','footer')),
  badge       text,                   -- e.g. 'hot'
  is_active   boolean default true,
  sort_order  int default 0
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Dev-phase policy: public can READ, nobody can write until
-- Supabase Auth is wired up (Phase 3 of the roadmap).
-- ============================================================
alter table hero enable row level security;
alter table services enable row level security;
alter table portfolio_projects enable row level security;
alter table testimonials enable row level security;
alter table faq enable row level security;
alter table navigation enable row level security;

drop policy if exists "public read hero" on hero;
create policy "public read hero" on hero for select using (true);

drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (true);

drop policy if exists "public read portfolio_projects" on portfolio_projects;
create policy "public read portfolio_projects" on portfolio_projects for select using (true);

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);

drop policy if exists "public read faq" on faq;
create policy "public read faq" on faq for select using (true);

drop policy if exists "public read navigation" on navigation;
create policy "public read navigation" on navigation for select using (true);

-- NOTE: No insert/update/delete policies exist yet on purpose.
-- Once Supabase Auth (admin role) is added, we will add policies like:
--   create policy "admin write services" on services
--     for all using (auth.jwt() ->> 'role' = 'admin');


-- ============================================================================
-- SOURCE MIGRATION: 003_admin_write_policies.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 003
-- Admin write policies for the Phase 2 dashboard
--
-- Run this in Supabase SQL Editor AFTER 001_schema.sql and
-- 002_seed.sql. It does not touch either of those files or
-- recreate any table — it only ADDS insert/update/delete
-- policies so that a logged-in Supabase Auth user (created via
-- Authentication > Users, no public sign-up) can use the
-- /dashboard admin panel.
--
-- Public read access (from 001_schema.sql) is untouched.
-- Safe to re-run: uses drop-if-exists before each create.
--
-- v2: uses `auth.uid() is not null` instead of
-- `auth.role() = 'authenticated'`. The role-string comparison
-- depends on the `role` claim being present and exactly equal
-- to 'authenticated' on the request JWT; if it isn't populated
-- that way, the USING clause silently evaluates to false, RLS
-- treats the row as not there for UPDATE, and PostgREST returns
-- 0 rows — which surfaces client-side as "Cannot coerce the
-- result to a single JSON object". Checking auth.uid() is not
-- null is the check Supabase currently recommends for "any
-- logged-in user" policies and doesn't depend on that claim.
-- ============================================================

-- ---------- HERO ----------
drop policy if exists "authenticated write hero" on hero;
create policy "authenticated write hero" on hero
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------- SERVICES ----------
drop policy if exists "authenticated write services" on services;
create policy "authenticated write services" on services
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------- PORTFOLIO PROJECTS ----------
drop policy if exists "authenticated write portfolio_projects" on portfolio_projects;
create policy "authenticated write portfolio_projects" on portfolio_projects
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------- TESTIMONIALS ----------
drop policy if exists "authenticated write testimonials" on testimonials;
create policy "authenticated write testimonials" on testimonials
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------- FAQ ----------
drop policy if exists "authenticated write faq" on faq;
create policy "authenticated write faq" on faq
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ---------- NAVIGATION ----------
drop policy if exists "authenticated write navigation" on navigation;
create policy "authenticated write navigation" on navigation
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================
-- NOTE ON FUTURE HARDENING
-- This grants write access to ANY authenticated user. Since the
-- dashboard has no public sign-up (accounts are created manually
-- in Supabase), this is safe for a single-admin setup. If you
-- later add more Auth users who should NOT have admin rights,
-- replace `auth.uid() is not null` with a check against a
-- specific admin role/claim, e.g.:
--   (auth.jwt() ->> 'role') = 'admin'
-- ============================================================


-- ============================================================================
-- SOURCE MIGRATION: 004_phase3_platform.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 004
-- Phase 3: Media/Storage, Site Settings, SEO, Messages,
-- Subscribers, Activity Log.
--
-- Purely additive: does not modify 001/002/003 or drop/rename
-- anything on the six existing tables — only adds three nullable
-- image columns to them, plus six new tables and a storage bucket.
-- Safe to re-run (every statement is if-not-exists / drop-if-exists).
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Image columns on existing tables (nullable — every existing
--    row simply has NULL until an admin uploads something, so the
--    public site's current appearance is unaffected by default).
-- ---------------------------------------------------------------
alter table hero add column if not exists image_url text;
alter table services add column if not exists icon_url text;
alter table testimonials add column if not exists avatar_url text;
-- portfolio_projects.image_url already existed since Phase 1.

-- ---------------------------------------------------------------
-- 2. Site Settings (singleton row, same pattern as `hero`)
-- ---------------------------------------------------------------
create table if not exists site_settings (
  id int primary key default 1,
  company_name text,
  phone text,
  email text,
  address text,
  whatsapp text,
  social_links jsonb not null default '[]'::jsonb,   -- [{ platform, url }]
  footer_text text,
  copyright_text text,
  google_maps_embed text,
  ga_id text,
  fb_pixel_id text,
  logo_url text,
  favicon_url text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into site_settings (id, company_name, phone, email, address, whatsapp, copyright_text)
values (1, 'CUDFIRM', '+2349056317709', 'info@cudfirm.com', 'Lagos, Nigeria', '+2348028699824', '© 2026 CUDFIRM · Professional Web Design Studio · Lagos, Nigeria')
on conflict (id) do nothing;

alter table site_settings enable row level security;

drop policy if exists "public read site_settings" on site_settings;
create policy "public read site_settings" on site_settings for select using (true);

drop policy if exists "authenticated write site_settings" on site_settings;
create policy "authenticated write site_settings" on site_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 3. SEO Manager — one row per logical page/section
-- ---------------------------------------------------------------
create table if not exists seo_meta (
  id bigint generated always as identity primary key,
  page_key text unique not null,
  title text,
  meta_description text,
  og_image text,
  twitter_image text,
  robots text default 'index, follow',
  canonical_url text,
  updated_at timestamptz not null default now()
);

insert into seo_meta (page_key, title, meta_description, robots, canonical_url)
values ('home', 'CUDFIRM — Professional Web Design Studio in Lagos, Nigeria',
        'CUDFIRM is a professional web design studio in Lagos, Nigeria. We build fast, beautiful, and mobile-ready websites for small businesses, startups, and professionals. Landing pages from ₦50,000. Delivered in 3–7 business days.',
        'index, follow', 'https://cudfirm.netlify.app')
on conflict (page_key) do nothing;

alter table seo_meta enable row level security;

drop policy if exists "public read seo_meta" on seo_meta;
create policy "public read seo_meta" on seo_meta for select using (true);

drop policy if exists "authenticated write seo_meta" on seo_meta;
create policy "authenticated write seo_meta" on seo_meta
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 4. Media Library — one row per uploaded Storage object
-- ---------------------------------------------------------------
create table if not exists media_library (
  id bigint generated always as identity primary key,
  file_name text not null,
  storage_path text not null,
  public_url text not null,
  bucket text not null default 'media',
  category text default 'general',   -- hero, services, portfolio, testimonials, branding, general
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

alter table media_library enable row level security;

drop policy if exists "public read media_library" on media_library;
create policy "public read media_library" on media_library for select using (true);

drop policy if exists "authenticated write media_library" on media_library;
create policy "authenticated write media_library" on media_library
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 5. Contact Messages — the PUBLIC site can only INSERT (submit an
--    enquiry); only an authenticated admin can read/update/delete.
-- ---------------------------------------------------------------
create table if not exists messages (
  id bigint generated always as identity primary key,
  name text,
  contact_info text,
  message text,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "public submit messages" on messages;
create policy "public submit messages" on messages
  for insert with check (true);

drop policy if exists "authenticated manage messages" on messages;
create policy "authenticated manage messages" on messages
  for select using (auth.uid() is not null);

drop policy if exists "authenticated update messages" on messages;
create policy "authenticated update messages" on messages
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "authenticated delete messages" on messages;
create policy "authenticated delete messages" on messages
  for delete using (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 6. Newsletter Subscribers — same public-insert-only pattern
-- ---------------------------------------------------------------
create table if not exists subscribers (
  id bigint generated always as identity primary key,
  email text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

drop policy if exists "public subscribe" on subscribers;
create policy "public subscribe" on subscribers
  for insert with check (true);

drop policy if exists "authenticated read subscribers" on subscribers;
create policy "authenticated read subscribers" on subscribers
  for select using (auth.uid() is not null);

drop policy if exists "authenticated delete subscribers" on subscribers;
create policy "authenticated delete subscribers" on subscribers
  for delete using (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 7. Activity Log — admin-only, append-mostly
-- ---------------------------------------------------------------
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  actor_email text,
  action text not null,        -- e.g. 'created', 'updated', 'deleted', 'signed_in', 'uploaded'
  entity text,                 -- e.g. 'services', 'media', 'hero'
  entity_label text,           -- human-readable label of the affected row
  details jsonb,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

drop policy if exists "authenticated read activity_log" on activity_log;
create policy "authenticated read activity_log" on activity_log
  for select using (auth.uid() is not null);

drop policy if exists "authenticated write activity_log" on activity_log;
create policy "authenticated write activity_log" on activity_log
  for insert with check (auth.uid() is not null);

-- ---------------------------------------------------------------
-- 8. Storage bucket for uploaded media
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read media bucket" on storage.objects;
create policy "public read media bucket" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "authenticated upload media bucket" on storage.objects;
create policy "authenticated upload media bucket" on storage.objects
  for insert with check (bucket_id = 'media' and auth.uid() is not null);

drop policy if exists "authenticated update media bucket" on storage.objects;
create policy "authenticated update media bucket" on storage.objects
  for update using (bucket_id = 'media' and auth.uid() is not null);

drop policy if exists "authenticated delete media bucket" on storage.objects;
create policy "authenticated delete media bucket" on storage.objects
  for delete using (bucket_id = 'media' and auth.uid() is not null);

-- ============================================================
-- After running this file: Supabase → Storage should show a
-- public "media" bucket, and Table Editor should show the six
-- new tables above, plus new (empty) image_url/icon_url/avatar_url
-- columns on hero/services/testimonials.
-- ============================================================


-- ============================================================================
-- SOURCE MIGRATION: 005_content_status_workflow.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 005: Content Status Workflow
-- Run once in Supabase SQL Editor before deploying the Phase 4.5 files.
-- Safe to re-run.
-- ============================================================

-- Add the new lifecycle column without removing the existing is_active
-- compatibility column.
alter table services add column if not exists status text;
alter table portfolio_projects add column if not exists status text;
alter table testimonials add column if not exists status text;
alter table faq add column if not exists status text;
alter table navigation add column if not exists status text;

-- Backfill existing content. Existing visible items become Published;
-- existing inactive items become Hidden.
update services
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update portfolio_projects
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update testimonials
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update faq
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update navigation
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

alter table services alter column status set default 'published';
alter table portfolio_projects alter column status set default 'published';
alter table testimonials alter column status set default 'published';
alter table faq alter column status set default 'published';
alter table navigation alter column status set default 'published';

alter table services alter column status set not null;
alter table portfolio_projects alter column status set not null;
alter table testimonials alter column status set not null;
alter table faq alter column status set not null;
alter table navigation alter column status set not null;

-- Add validated value constraints only when they do not already exist.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_status_check') then
    alter table services add constraint services_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'portfolio_projects_status_check') then
    alter table portfolio_projects add constraint portfolio_projects_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'testimonials_status_check') then
    alter table testimonials add constraint testimonials_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_status_check') then
    alter table faq add constraint faq_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'navigation_status_check') then
    alter table navigation add constraint navigation_status_check check (status in ('draft','published','hidden','archived'));
  end if;
end $$;

-- Helpful indexes for public published-only queries and dashboard filters.
create index if not exists services_status_idx on services(status);
create index if not exists portfolio_projects_status_idx on portfolio_projects(status);
create index if not exists testimonials_status_idx on testimonials(status);
create index if not exists faq_status_idx on faq(status);
create index if not exists navigation_status_idx on navigation(status);

-- Restrict anonymous/public reads to Published content only.
-- Authenticated dashboard users retain access to every status through
-- the existing authenticated write policies from migration 003.
drop policy if exists "public read services" on services;
create policy "public read services" on services
  for select using (status = 'published');

drop policy if exists "public read portfolio_projects" on portfolio_projects;
create policy "public read portfolio_projects" on portfolio_projects
  for select using (status = 'published');

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials
  for select using (status = 'published');

drop policy if exists "public read faq" on faq;
create policy "public read faq" on faq
  for select using (status = 'published');

drop policy if exists "public read navigation" on navigation;
create policy "public read navigation" on navigation
  for select using (status = 'published');


-- ============================================================================
-- SOURCE MIGRATION: 006_message_management.sql
-- ============================================================================
-- CUDFIRM Phase 5.1 — Message Management
-- Safe, additive migration. Keeps legacy is_read/is_archived columns.

alter table messages
  add column if not exists status text not null default 'unread',
  add column if not exists is_important boolean not null default false,
  add column if not exists replied_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Preserve existing message state.
update messages
set status = case
  when is_archived then 'archived'
  when is_read then 'read'
  else 'unread'
end
where status is null
   or status not in ('unread', 'read', 'important', 'replied', 'archived', 'spam');

-- Existing rows receive the correct state even when the new column was
-- added with its default before this migration reached the UPDATE above.
update messages set status = 'archived' where is_archived = true and status = 'unread';
update messages set status = 'read' where is_read = true and is_archived = false and status = 'unread';

alter table messages drop constraint if exists messages_status_check;
alter table messages
  add constraint messages_status_check
  check (status in ('unread', 'read', 'important', 'replied', 'archived', 'spam'));

create index if not exists messages_status_idx on messages(status);
create index if not exists messages_created_at_idx on messages(created_at desc);

-- Keep the legacy booleans synchronized so older dashboard/layout code
-- remains compatible during the transition.
create or replace function sync_message_workflow_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_read := new.status <> 'unread';
  new.is_archived := new.status in ('archived', 'spam');
  new.is_important := new.status = 'important';

  if new.status = 'replied' and new.replied_at is null then
    new.replied_at := now();
  elsif new.status <> 'replied' then
    new.replied_at := null;
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists messages_sync_workflow_fields on messages;
create trigger messages_sync_workflow_fields
before insert or update of status on messages
for each row execute function sync_message_workflow_fields();

-- Normalize all rows through the trigger once.
update messages set status = status;


-- ============================================================================
-- SOURCE MIGRATION: 007_subscriber_management.sql
-- ============================================================================
-- CUDFIRM Phase 5.2 — Subscriber Management
-- Safe, additive migration. Existing subscribers and public signup remain intact.

alter table public.subscribers
  add column if not exists status text,
  add column if not exists source text,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.subscribers
set status = case when coalesce(is_active, true) then 'active' else 'unsubscribed' end
where status is null;

update public.subscribers
set source = 'footer'
where source is null or btrim(source) = '';

alter table public.subscribers
  alter column status set default 'active',
  alter column status set not null,
  alter column source set default 'footer',
  alter column source set not null;

alter table public.subscribers
  drop constraint if exists subscribers_status_check;

alter table public.subscribers
  add constraint subscribers_status_check
  check (status in ('active', 'unsubscribed', 'bounced', 'archived'));

create index if not exists subscribers_status_idx on public.subscribers(status);
create index if not exists subscribers_created_at_idx on public.subscribers(created_at desc);

-- Keep the legacy is_active flag synchronized for backward compatibility.
create or replace function public.sync_subscriber_status_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is null then
    new.status := case when coalesce(new.is_active, true) then 'active' else 'unsubscribed' end;
  end if;

  new.is_active := (new.status = 'active');

  if new.status = 'unsubscribed' and new.unsubscribed_at is null then
    new.unsubscribed_at := now();
  elsif new.status <> 'unsubscribed' then
    new.unsubscribed_at := null;
  end if;

  if new.status = 'bounced' and new.bounced_at is null then
    new.bounced_at := now();
  elsif new.status <> 'bounced' then
    new.bounced_at := null;
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;

  if new.source is null or btrim(new.source) = '' then
    new.source := 'footer';
  end if;

  return new;
end;
$$;

drop trigger if exists subscribers_sync_status_fields on public.subscribers;
create trigger subscribers_sync_status_fields
before insert or update on public.subscribers
for each row execute function public.sync_subscriber_status_fields();

-- Preserve public newsletter signup and allow authenticated admins to manage records.
alter table public.subscribers enable row level security;

drop policy if exists "public subscribe" on public.subscribers;
create policy "public subscribe" on public.subscribers
  for insert to anon, authenticated
  with check (
    status = 'active'
    and is_active = true
    and coalesce(source, 'footer') = 'footer'
  );

drop policy if exists "authenticated read subscribers" on public.subscribers;
create policy "authenticated read subscribers" on public.subscribers
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "authenticated update subscribers" on public.subscribers;
create policy "authenticated update subscribers" on public.subscribers
  for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "authenticated delete subscribers" on public.subscribers;
create policy "authenticated delete subscribers" on public.subscribers
  for delete to authenticated
  using (auth.uid() is not null);


-- ============================================================================
-- SOURCE MIGRATION: 008_backup_restore_permissions.sql
-- ============================================================================
-- CUDFIRM Phase 6.1 — Backup & Restore permissions
-- Adds only the authenticated write permissions required by the
-- dashboard restore tool. Safe to re-run.

-- Subscriber restore may insert archived/unsubscribed/bounced rows.
-- The existing public signup policy remains restricted to active/footer.
drop policy if exists "authenticated insert subscribers" on public.subscribers;
create policy "authenticated insert subscribers" on public.subscribers
  for insert to authenticated
  with check (auth.uid() is not null);

-- Activity Log is normally append-only, but restoring a selected
-- Activity Log backup in Replace mode must be able to clear old rows.
drop policy if exists "authenticated delete activity_log" on public.activity_log;
create policy "authenticated delete activity_log" on public.activity_log
  for delete to authenticated
  using (auth.uid() is not null);


-- ============================================================================
-- SOURCE MIGRATION: 009_user_roles_permissions.sql
-- ============================================================================
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


-- ============================================================================
-- SOURCE MIGRATION: 010_maintenance_mode.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 010
-- Phase 6.3: Maintenance Mode
-- Adds isolated maintenance settings to the existing singleton
-- site_settings row. Safe to re-run; no existing columns or data
-- are removed or renamed.
-- ============================================================

alter table public.site_settings
  add column if not exists maintenance_enabled boolean not null default false,
  add column if not exists maintenance_title text not null default 'We’ll be right back',
  add column if not exists maintenance_message text not null default 'We are making a few improvements to the website. Please check back shortly.',
  add column if not exists maintenance_return_at timestamptz,
  add column if not exists maintenance_contact_url text;

update public.site_settings
set
  maintenance_enabled = coalesce(maintenance_enabled, false),
  maintenance_title = coalesce(nullif(trim(maintenance_title), ''), 'We’ll be right back'),
  maintenance_message = coalesce(nullif(trim(maintenance_message), ''), 'We are making a few improvements to the website. Please check back shortly.')
where id = 1;


-- ============================================================================
-- SOURCE MIGRATION: 011_theme_customization.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 011
-- Phase 6.4: Theme and Custom Styling Controls
-- Additive and safe to re-run.
-- ============================================================

alter table public.site_settings
  add column if not exists theme_preset text not null default 'default',
  add column if not exists theme_mode text not null default 'light',
  add column if not exists theme_primary_color text not null default '#0B3D2E',
  add column if not exists theme_secondary_color text not null default '#1A6B4A',
  add column if not exists theme_accent_color text not null default '#C8922A',
  add column if not exists theme_background_color text not null default '#F5F0E6',
  add column if not exists theme_text_color text not null default '#3A4035',
  add column if not exists theme_heading_font text not null default 'syne',
  add column if not exists theme_body_font text not null default 'dm_sans',
  add column if not exists theme_button_style text not null default 'rounded',
  add column if not exists theme_spacing text not null default 'comfortable',
  add column if not exists theme_shadow text not null default 'medium',
  add column if not exists theme_radius text not null default 'medium',
  add column if not exists theme_container_width text not null default 'standard',
  add column if not exists custom_css text not null default '';

-- Constraints are created conditionally so the migration remains idempotent.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_preset_check') then
    alter table public.site_settings add constraint site_settings_theme_preset_check
      check (theme_preset in ('default','minimal','corporate','creative','dark'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_mode_check') then
    alter table public.site_settings add constraint site_settings_theme_mode_check
      check (theme_mode in ('light','dark','visitor'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_heading_font_check') then
    alter table public.site_settings add constraint site_settings_theme_heading_font_check
      check (theme_heading_font in ('syne','dm_sans','georgia'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_body_font_check') then
    alter table public.site_settings add constraint site_settings_theme_body_font_check
      check (theme_body_font in ('dm_sans','system','georgia'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_button_style_check') then
    alter table public.site_settings add constraint site_settings_theme_button_style_check
      check (theme_button_style in ('square','soft','rounded','pill'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_spacing_check') then
    alter table public.site_settings add constraint site_settings_theme_spacing_check
      check (theme_spacing in ('compact','comfortable','spacious'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_shadow_check') then
    alter table public.site_settings add constraint site_settings_theme_shadow_check
      check (theme_shadow in ('none','soft','medium','strong'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_radius_check') then
    alter table public.site_settings add constraint site_settings_theme_radius_check
      check (theme_radius in ('square','small','medium','large'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_theme_container_width_check') then
    alter table public.site_settings add constraint site_settings_theme_container_width_check
      check (theme_container_width in ('narrow','standard','wide'));
  end if;
end $$;

update public.site_settings
set
  theme_preset = coalesce(nullif(theme_preset, ''), 'default'),
  theme_mode = coalesce(nullif(theme_mode, ''), 'light'),
  theme_primary_color = coalesce(nullif(theme_primary_color, ''), '#0B3D2E'),
  theme_secondary_color = coalesce(nullif(theme_secondary_color, ''), '#1A6B4A'),
  theme_accent_color = coalesce(nullif(theme_accent_color, ''), '#C8922A'),
  theme_background_color = coalesce(nullif(theme_background_color, ''), '#F5F0E6'),
  theme_text_color = coalesce(nullif(theme_text_color, ''), '#3A4035'),
  custom_css = coalesce(custom_css, '')
where id = 1;


-- ============================================================================
-- SOURCE MIGRATION: 012_security_audit.sql
-- ============================================================================
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


-- ============================================================================
-- SOURCE MIGRATION: 013_theme_wide_default_fix.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 013
-- Phase 6.4.1: Restore CUDFIRM's original wide content layout
-- Safe corrective migration for the Theme & Appearance system.
-- ============================================================

-- Make future site_settings rows use CUDFIRM's original wide layout.
alter table public.site_settings
  alter column theme_container_width set default 'wide';

-- Migration 011 introduced "standard" as the initial default. CUDFIRM's
-- original design is wide, so correct the existing singleton settings row.
update public.site_settings
set theme_container_width = 'wide'
where id = 1
  and (theme_container_width is null
       or btrim(theme_container_width) = ''
       or theme_container_width = 'standard');


-- ============================================================================
-- SOURCE MIGRATION: 014_rls_api_security_hardening.sql
-- ============================================================================
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


-- ============================================================================
-- SOURCE MIGRATION: 015_about_contact_content.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 015
-- About and Contact singleton content foundation
-- Run after 014_rls_api_security_hardening.sql.
-- ============================================================

begin;

create table if not exists public.about_content (
  id smallint primary key default 1,
  eyebrow text default '',
  title text not null default 'About Us',
  introduction text default '',
  mission_title text default 'Our Mission',
  mission_text text default '',
  story_title text default 'Our Story',
  story_blocks jsonb not null default '[]'::jsonb,
  values_title text default 'Our Values',
  values jsonb not null default '[]'::jsonb,
  facts_title text default 'Quick Facts',
  facts jsonb not null default '[]'::jsonb,
  image_url text default '',
  image_alt text default '',
  cta_label text default '',
  cta_target text default '',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint about_content_singleton check (id = 1),
  constraint about_content_status_check check (status in ('draft','published','hidden','archived')),
  constraint about_content_story_blocks_array check (jsonb_typeof(story_blocks) = 'array'),
  constraint about_content_values_array check (jsonb_typeof(values) = 'array'),
  constraint about_content_facts_array check (jsonb_typeof(facts) = 'array')
);

create table if not exists public.contact_content (
  id smallint primary key default 1,
  eyebrow text default '',
  title text not null default 'Contact Us',
  introduction text default '',
  assurances jsonb not null default '[]'::jsonb,
  form_config jsonb not null default '{}'::jsonb,
  direct_contact_title text default 'Contact Us Directly',
  direct_contact_description text default '',
  business_hours text default '',
  show_phone boolean not null default true,
  show_email boolean not null default true,
  show_whatsapp boolean not null default true,
  show_address boolean not null default true,
  show_map boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_content_singleton check (id = 1),
  constraint contact_content_status_check check (status in ('draft','published','hidden','archived')),
  constraint contact_content_assurances_array check (jsonb_typeof(assurances) = 'array'),
  constraint contact_content_form_config_object check (jsonb_typeof(form_config) = 'object')
);

create or replace function public.set_content_updated_at()
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

revoke all on function public.set_content_updated_at() from public, anon, authenticated;

drop trigger if exists about_content_updated_at on public.about_content;
create trigger about_content_updated_at
before update on public.about_content
for each row execute function public.set_content_updated_at();

drop trigger if exists contact_content_updated_at on public.contact_content;
create trigger contact_content_updated_at
before update on public.contact_content
for each row execute function public.set_content_updated_at();

insert into public.about_content (
  id, eyebrow, title, introduction, mission_title, mission_text,
  story_title, story_blocks, values_title, values, facts_title, facts,
  cta_label, cta_target, status
) values (
  1,
  'About CUDFIRM',
  'Every Nigerian business deserves a professional website — not just the corporations.',
  'Too many talented people — barbers, photographers, food vendors, coaches, and tailors — are losing customers to competitors simply because they do not have a proper website. CUDFIRM exists to change that, one business at a time.',
  'Our Mission',
  'We build professional websites that are fast, beautiful, and genuinely useful — designed for how Nigerian customers search, browse, and buy.',
  'Our Story',
  '[
    {"id":"story-1","heading":"","text":"CUDFIRM started in Lagos with a simple observation: small Nigerian businesses were spending time and money on social media pages and Canva flyers, but without a proper website, they had no real online presence they owned or controlled.","imageUrl":"","imageAlt":""},
    {"id":"story-2","heading":"","text":"We set out to build professional websites that are fast, beautiful, and genuinely useful — designed specifically for how Nigerian customers search, browse, and buy.","imageUrl":"","imageAlt":""},
    {"id":"story-3","heading":"","text":"Today, CUDFIRM is a focused web design studio. One clear mission. One service. Done properly.","imageUrl":"","imageAlt":""}
  ]'::jsonb,
  'What We Stand For',
  '[
    {"id":"value-1","icon":"bi-people","title":"Client Success First","description":"Every website we build is measured by one thing: does it help your business get more customers?"},
    {"id":"value-2","icon":"bi-geo-alt","title":"Built for Nigeria","description":"We understand the Nigerian market — mobile-first customers, WhatsApp culture, local trust signals, and local payment habits."},
    {"id":"value-3","icon":"bi-eye","title":"Radical Transparency","description":"You know the price, timeline, and deliverables before we start. No surprises."},
    {"id":"value-4","icon":"bi-shield-check","title":"Quality Without Compromise","description":"Fast, secure, mobile-friendly, and built with clean code."}
  ]'::jsonb,
  'Quick Facts',
  '[
    {"id":"fact-1","label":"Based In","value":"Lagos, Nigeria"},
    {"id":"fact-2","label":"Delivery","value":"3–10 Business Days"},
    {"id":"fact-3","label":"Starting Price","value":"₦50,000"},
    {"id":"fact-4","label":"Support Hours","value":"Mon–Sat, 8am–8pm WAT"}
  ]'::jsonb,
  'Work With Us',
  'connect-content',
  'published'
) on conflict (id) do nothing;

insert into public.contact_content (
  id, eyebrow, title, introduction, assurances, form_config,
  direct_contact_title, direct_contact_description, business_hours,
  show_phone, show_email, show_whatsapp, show_address, show_map, status
) values (
  1,
  'Get A Quote',
  'Let''s Build Your Website',
  'Tell us about your business and what you need. We reply within 24 hours with a clear quote and timeline. No jargon, no commitment, no pressure.',
  '[
    {"id":"assurance-1","icon":"bi-clock","title":"Reply within 24 hours","description":""},
    {"id":"assurance-2","icon":"bi-shield-check","title":"No commitment required","description":""},
    {"id":"assurance-3","icon":"bi-cash-coin","title":"Transparent pricing","description":""}
  ]'::jsonb,
  '{
    "nameLabel":"Your Name",
    "namePlaceholder":"e.g. Emeka Okafor",
    "contactLabel":"Your Email or WhatsApp Number",
    "contactPlaceholder":"email@example.com or +234...",
    "messageLabel":"Tell Us About Your Business & What You Need",
    "messagePlaceholder":"Tell us about your business and the website you need.",
    "submitLabel":"Submit Request",
    "submittingLabel":"Sending...",
    "successMessage":"Your message has been sent.",
    "errorMessage":"We could not send your message. Please try again.",
    "whatsappLabel":"Send via WhatsApp (Fastest)",
    "emailLabel":"Email Us",
    "privacyText":"Your details are kept private and never shared."
  }'::jsonb,
  'Talk To Us Directly',
  'WhatsApp is the fastest way to reach us.',
  'Monday–Saturday, 8am to 8pm WAT',
  true, true, true, true, false, 'published'
) on conflict (id) do nothing;

create index if not exists about_content_status_idx on public.about_content(status);
create index if not exists contact_content_status_idx on public.contact_content(status);

alter table public.about_content enable row level security;
alter table public.about_content force row level security;
alter table public.contact_content enable row level security;
alter table public.contact_content force row level security;

-- Public website: published singleton only.
drop policy if exists "public read about_content" on public.about_content;
create policy "public read about_content" on public.about_content
for select to anon using (id = 1 and status = 'published');

drop policy if exists "public read contact_content" on public.contact_content;
create policy "public read contact_content" on public.contact_content
for select to anon using (id = 1 and status = 'published');

-- Dashboard: viewers can read; editors/admins can create and update.
drop policy if exists "permitted read about_content" on public.about_content;
create policy "permitted read about_content" on public.about_content
for select to authenticated using (public.has_permission('view_dashboard'));

drop policy if exists "permitted insert about_content" on public.about_content;
create policy "permitted insert about_content" on public.about_content
for insert to authenticated with check (public.has_permission('create_content'));

drop policy if exists "permitted update about_content" on public.about_content;
create policy "permitted update about_content" on public.about_content
for update to authenticated
using (public.has_permission('edit_content'))
with check (public.has_permission('edit_content'));

drop policy if exists "permitted delete about_content" on public.about_content;
create policy "permitted delete about_content" on public.about_content
for delete to authenticated using (public.has_permission('delete_content'));

drop policy if exists "permitted read contact_content" on public.contact_content;
create policy "permitted read contact_content" on public.contact_content
for select to authenticated using (public.has_permission('view_dashboard'));

drop policy if exists "permitted insert contact_content" on public.contact_content;
create policy "permitted insert contact_content" on public.contact_content
for insert to authenticated with check (public.has_permission('create_content'));

drop policy if exists "permitted update contact_content" on public.contact_content;
create policy "permitted update contact_content" on public.contact_content
for update to authenticated
using (public.has_permission('edit_content'))
with check (public.has_permission('edit_content'));

drop policy if exists "permitted delete contact_content" on public.contact_content;
create policy "permitted delete contact_content" on public.contact_content
for delete to authenticated using (public.has_permission('delete_content'));

-- Least-privilege API grants. RLS remains the row authority.
revoke all on table public.about_content, public.contact_content from anon, authenticated;
grant select on public.about_content, public.contact_content to anon;
grant select, insert, update, delete on public.about_content, public.contact_content to authenticated;

commit;


-- ============================================================================
-- SOURCE MIGRATION: 016_module_permissions_foundation.sql
-- ============================================================================
-- ============================================================
-- CUDFIRM CMS — Migration 016
-- Shared extension-module permission foundation
-- Run after 015_about_contact_content.sql.
-- Do not rewrite after execution; use a later corrective migration.
-- ============================================================

begin;

create table if not exists public.module_permissions (
  module_id text not null,
  permission_id text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module_id, permission_id),
  constraint module_permissions_module_id_check
    check (module_id ~ '^[a-z0-9-]+$'),
  constraint module_permissions_permission_id_check
    check (permission_id ~ '^[a-z][a-z0-9_]*$'),
  constraint module_permissions_description_length_check
    check (char_length(description) <= 500)
);

create table if not exists public.module_role_permissions (
  module_id text not null,
  role text not null,
  permission_id text not null,
  created_at timestamptz not null default now(),
  primary key (module_id, role, permission_id),
  constraint module_role_permissions_role_check
    check (role in ('super_admin','admin','editor','viewer')),
  constraint module_role_permissions_permission_fk
    foreign key (module_id, permission_id)
    references public.module_permissions(module_id, permission_id)
    on update cascade on delete cascade
);

create index if not exists module_permissions_module_idx
  on public.module_permissions(module_id);
create index if not exists module_role_permissions_role_idx
  on public.module_role_permissions(role, module_id);

create or replace function public.set_module_permission_updated_at()
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

revoke all on function public.set_module_permission_updated_at()
from public, anon, authenticated;

drop trigger if exists module_permissions_updated_at on public.module_permissions;
create trigger module_permissions_updated_at
before update on public.module_permissions
for each row execute function public.set_module_permission_updated_at();

-- Additive module permission helper. This intentionally does not modify
-- current_app_role() or has_permission(...), which remain protected core helpers.
create or replace function public.has_module_permission(
  p_module_id text,
  p_permission_id text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when public.current_app_role() is null then false
    when not exists (
      select 1
      from public.module_permissions mp
      where mp.module_id = p_module_id
        and mp.permission_id = p_permission_id
    ) then false
    when public.current_app_role() = 'super_admin' then true
    else exists (
      select 1
      from public.module_role_permissions mrp
      where mrp.module_id = p_module_id
        and mrp.permission_id = p_permission_id
        and mrp.role = public.current_app_role()
    )
  end;
$$;

revoke all on function public.has_module_permission(text, text)
from public, anon;
grant execute on function public.has_module_permission(text, text)
to authenticated;

alter table public.module_permissions enable row level security;
alter table public.module_permissions force row level security;
alter table public.module_role_permissions enable row level security;
alter table public.module_role_permissions force row level security;

-- Active CMS users may read the declared permission catalogue. Only Super Admin
-- may alter module permission declarations or role mappings.
drop policy if exists "active cms users read module permissions" on public.module_permissions;
create policy "active cms users read module permissions"
on public.module_permissions for select to authenticated
using (public.current_app_role() is not null);

drop policy if exists "super admin manages module permissions" on public.module_permissions;
create policy "super admin manages module permissions"
on public.module_permissions for all to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

drop policy if exists "active cms users read module role permissions" on public.module_role_permissions;
create policy "active cms users read module role permissions"
on public.module_role_permissions for select to authenticated
using (public.current_app_role() is not null);

drop policy if exists "super admin manages module role permissions" on public.module_role_permissions;
create policy "super admin manages module role permissions"
on public.module_role_permissions for all to authenticated
using (public.has_permission('manage_users'))
with check (public.has_permission('manage_users'));

revoke all on table public.module_permissions, public.module_role_permissions
from anon, authenticated;
grant select, insert, update, delete
on public.module_permissions, public.module_role_permissions
to authenticated;

commit;


-- ============================================================================
-- FRESH-INSTALL NEUTRALISATION
-- The historical migrations create required singleton rows with CUDFIRM's own
-- production wording. A reusable client installation must not inherit that
-- content, so the fresh installer replaces only those starter values with safe,
-- neutral placeholders. Schema, RLS, functions and migration history are not
-- rewritten by this block.
-- ============================================================================

update public.site_settings
set company_name = 'Client Website',
    phone = '',
    email = '',
    address = '',
    whatsapp = '',
    social_links = '[]'::jsonb,
    footer_text = '',
    copyright_text = '',
    google_maps_embed = '',
    ga_id = null,
    fb_pixel_id = null,
    logo_url = null,
    favicon_url = null,
    updated_at = now()
where id = 1;

update public.seo_meta
set title = 'Client Website',
    meta_description = '',
    og_image = null,
    twitter_image = null,
    robots = 'index, follow',
    canonical_url = null,
    updated_at = now()
where page_key = 'home';

update public.about_content
set eyebrow = 'About',
    title = 'About Us',
    introduction = '',
    mission_title = 'Our Mission',
    mission_text = '',
    story_title = 'Our Story',
    story_blocks = '[]'::jsonb,
    values_title = 'Our Values',
    values = '[]'::jsonb,
    facts_title = 'Quick Facts',
    facts = '[]'::jsonb,
    image_url = '',
    image_alt = '',
    cta_label = '',
    cta_target = '',
    status = 'published',
    updated_at = now()
where id = 1;

update public.contact_content
set eyebrow = 'Contact',
    title = 'Contact Us',
    introduction = '',
    assurances = '[]'::jsonb,
    form_config = '{}'::jsonb,
    direct_contact_title = 'Contact Us Directly',
    direct_contact_description = '',
    business_hours = '',
    show_phone = true,
    show_email = true,
    show_whatsapp = true,
    show_address = true,
    show_map = false,
    status = 'published',
    updated_at = now()
where id = 1;

-- The core is now ready for 02_client_starter_content.example.sql or a
-- client-specific replacement using the same filename position.
