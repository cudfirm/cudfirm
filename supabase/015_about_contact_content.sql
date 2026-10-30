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
