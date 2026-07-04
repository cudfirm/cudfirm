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
