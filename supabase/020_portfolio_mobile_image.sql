-- =====================================================================
-- CUDFIRM 020 — Portfolio: optional mobile screenshot
--
-- ADDITIVE ONLY. image_url stays the DESKTOP screenshot (so every existing
-- card keeps working). mobile_image_url is optional; when both exist the
-- card shows the mobile shot and flips to desktop on hover.
-- Run AFTER 019. Back up first. Never rewrite once applied.
--
-- ROLLBACK:  alter table public.portfolio_projects drop column if exists mobile_image_url;
-- =====================================================================
alter table public.portfolio_projects
  add column if not exists mobile_image_url text;
