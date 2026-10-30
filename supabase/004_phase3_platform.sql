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
