-- ============================================================================
-- CUDFIRM — Client Starter Content Example
-- Copy this file, rename it to 02_<client>_starter_content.sql, replace every
-- CHANGE_ME value, and run it once after 01_cudfirm_core_fresh_install.sql.
-- ============================================================================

begin;

do $$
declare
  v_placeholders text[] := array[
    'CHANGE_ME_CLIENT_NAME',
    'CHANGE_ME_EYEBROW',
    'CHANGE_ME_HERO_TITLE',
    'CHANGE_ME_HERO_SUBTITLE',
    'CHANGE_ME_PHONE',
    'CHANGE_ME_EMAIL',
    'CHANGE_ME_ADDRESS',
    'CHANGE_ME_WHATSAPP',
    'CHANGE_ME_FOOTER_TEXT',
    'CHANGE_ME_COPYRIGHT',
    'CHANGE_ME_SEO_TITLE',
    'CHANGE_ME_META_DESCRIPTION',
    'CHANGE_ME_CANONICAL_URL',
    'CHANGE_ME_ABOUT_TITLE',
    'CHANGE_ME_ABOUT_INTRODUCTION',
    'CHANGE_ME_MISSION_TEXT',
    'CHANGE_ME_CONTACT_TITLE',
    'CHANGE_ME_CONTACT_INTRODUCTION',
    'CHANGE_ME_DIRECT_CONTACT_TEXT',
    'CHANGE_ME_BUSINESS_HOURS'
  ];
begin
  if exists (
    select 1
    from unnest(v_placeholders) as value
    where value like 'CHANGE\_ME%' escape '\'
  ) then
    raise exception 'Edit every CHANGE_ME starter-content placeholder before running this file.';
  end if;
end $$;

insert into public.hero (
  id, eyebrow, title, subtitle,
  cta_primary_text, cta_primary_target,
  cta_secondary_text, cta_secondary_target,
  trust_items, image_url
) values (
  1,
  'CHANGE_ME_EYEBROW',
  'CHANGE_ME_HERO_TITLE',
  'CHANGE_ME_HERO_SUBTITLE',
  'Contact Us', 'contact',
  'Learn More', 'about',
  '[]'::jsonb,
  null
)
on conflict (id) do update set
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  subtitle = excluded.subtitle,
  cta_primary_text = excluded.cta_primary_text,
  cta_primary_target = excluded.cta_primary_target,
  cta_secondary_text = excluded.cta_secondary_text,
  cta_secondary_target = excluded.cta_secondary_target,
  trust_items = excluded.trust_items,
  image_url = excluded.image_url,
  updated_at = now();

update public.site_settings
set company_name = 'CHANGE_ME_CLIENT_NAME',
    phone = 'CHANGE_ME_PHONE',
    email = 'CHANGE_ME_EMAIL',
    address = 'CHANGE_ME_ADDRESS',
    whatsapp = 'CHANGE_ME_WHATSAPP',
    social_links = '[]'::jsonb,
    footer_text = 'CHANGE_ME_FOOTER_TEXT',
    copyright_text = 'CHANGE_ME_COPYRIGHT',
    google_maps_embed = '',
    updated_at = now()
where id = 1;

update public.seo_meta
set title = 'CHANGE_ME_SEO_TITLE',
    meta_description = 'CHANGE_ME_META_DESCRIPTION',
    robots = 'index, follow',
    canonical_url = 'CHANGE_ME_CANONICAL_URL',
    updated_at = now()
where page_key = 'home';

update public.about_content
set eyebrow = 'About',
    title = 'CHANGE_ME_ABOUT_TITLE',
    introduction = 'CHANGE_ME_ABOUT_INTRODUCTION',
    mission_title = 'Our Mission',
    mission_text = 'CHANGE_ME_MISSION_TEXT',
    story_title = 'Our Story',
    story_blocks = '[]'::jsonb,
    values_title = 'Our Values',
    values = '[]'::jsonb,
    facts_title = 'Quick Facts',
    facts = '[]'::jsonb,
    cta_label = 'Contact Us',
    cta_target = 'contact',
    status = 'published',
    updated_at = now()
where id = 1;

update public.contact_content
set eyebrow = 'Contact',
    title = 'CHANGE_ME_CONTACT_TITLE',
    introduction = 'CHANGE_ME_CONTACT_INTRODUCTION',
    assurances = '[]'::jsonb,
    form_config = jsonb_build_object(
      'nameLabel', 'Your Name',
      'contactLabel', 'Email or Phone',
      'messageLabel', 'How can we help?',
      'submitLabel', 'Send Message',
      'submittingLabel', 'Sending...',
      'successMessage', 'Your message has been sent.',
      'errorMessage', 'We could not send your message. Please try again.'
    ),
    direct_contact_title = 'Contact Us Directly',
    direct_contact_description = 'CHANGE_ME_DIRECT_CONTACT_TEXT',
    business_hours = 'CHANGE_ME_BUSINESS_HOURS',
    show_phone = true,
    show_email = true,
    show_whatsapp = true,
    show_address = true,
    show_map = false,
    status = 'published',
    updated_at = now()
where id = 1;

-- Add client-specific Services, Portfolio, Testimonials, FAQ and Navigation
-- records below. Keep status values within: draft, published, hidden, archived.

commit;
