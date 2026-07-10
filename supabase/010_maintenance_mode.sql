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
