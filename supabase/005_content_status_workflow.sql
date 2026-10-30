-- ============================================================
-- CUDFIRM CMS — Migration 005: Content Status Workflow
-- Run once in Supabase SQL Editor before deploying the Phase 4.5 files.
-- Safe to re-run.
-- ============================================================

-- Add the new lifecycle column without removing the existing is_active
-- compatibility column.
alter table services add column if not exists status text;
alter table portfolio_projects add column if not exists status text;
alter table testimonials add column if not exists status text;
alter table faq add column if not exists status text;
alter table navigation add column if not exists status text;

-- Backfill existing content. Existing visible items become Published;
-- existing inactive items become Hidden.
update services
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update portfolio_projects
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update testimonials
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update faq
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

update navigation
set status = case when coalesce(is_active, true) then 'published' else 'hidden' end
where status is null or status not in ('draft','published','hidden','archived');

alter table services alter column status set default 'published';
alter table portfolio_projects alter column status set default 'published';
alter table testimonials alter column status set default 'published';
alter table faq alter column status set default 'published';
alter table navigation alter column status set default 'published';

alter table services alter column status set not null;
alter table portfolio_projects alter column status set not null;
alter table testimonials alter column status set not null;
alter table faq alter column status set not null;
alter table navigation alter column status set not null;

-- Add validated value constraints only when they do not already exist.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_status_check') then
    alter table services add constraint services_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'portfolio_projects_status_check') then
    alter table portfolio_projects add constraint portfolio_projects_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'testimonials_status_check') then
    alter table testimonials add constraint testimonials_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'faq_status_check') then
    alter table faq add constraint faq_status_check check (status in ('draft','published','hidden','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'navigation_status_check') then
    alter table navigation add constraint navigation_status_check check (status in ('draft','published','hidden','archived'));
  end if;
end $$;

-- Helpful indexes for public published-only queries and dashboard filters.
create index if not exists services_status_idx on services(status);
create index if not exists portfolio_projects_status_idx on portfolio_projects(status);
create index if not exists testimonials_status_idx on testimonials(status);
create index if not exists faq_status_idx on faq(status);
create index if not exists navigation_status_idx on navigation(status);

-- Restrict anonymous/public reads to Published content only.
-- Authenticated dashboard users retain access to every status through
-- the existing authenticated write policies from migration 003.
drop policy if exists "public read services" on services;
create policy "public read services" on services
  for select using (status = 'published');

drop policy if exists "public read portfolio_projects" on portfolio_projects;
create policy "public read portfolio_projects" on portfolio_projects
  for select using (status = 'published');

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials
  for select using (status = 'published');

drop policy if exists "public read faq" on faq;
create policy "public read faq" on faq
  for select using (status = 'published');

drop policy if exists "public read navigation" on navigation;
create policy "public read navigation" on navigation
  for select using (status = 'published');
