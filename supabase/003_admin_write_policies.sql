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
-- ============================================================

-- ---------- HERO ----------
drop policy if exists "authenticated write hero" on hero;
create policy "authenticated write hero" on hero
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- SERVICES ----------
drop policy if exists "authenticated write services" on services;
create policy "authenticated write services" on services
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- PORTFOLIO PROJECTS ----------
drop policy if exists "authenticated write portfolio_projects" on portfolio_projects;
create policy "authenticated write portfolio_projects" on portfolio_projects
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- TESTIMONIALS ----------
drop policy if exists "authenticated write testimonials" on testimonials;
create policy "authenticated write testimonials" on testimonials
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- FAQ ----------
drop policy if exists "authenticated write faq" on faq;
create policy "authenticated write faq" on faq
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- NAVIGATION ----------
drop policy if exists "authenticated write navigation" on navigation;
create policy "authenticated write navigation" on navigation
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- NOTE ON FUTURE HARDENING
-- This grants write access to ANY authenticated user. Since the
-- dashboard has no public sign-up (accounts are created manually
-- in Supabase), this is safe for a single-admin setup. If you
-- later add more Auth users who should NOT have admin rights,
-- replace `auth.role() = 'authenticated'` with a check against
-- a specific admin role/claim, e.g.:
--   auth.jwt() ->> 'role' = 'admin'
-- ============================================================
