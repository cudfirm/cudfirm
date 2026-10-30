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
