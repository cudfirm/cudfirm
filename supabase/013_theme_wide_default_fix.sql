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
