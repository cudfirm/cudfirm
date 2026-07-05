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
