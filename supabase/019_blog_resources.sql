-- =====================================================================
-- CUDFIRM 019 — Blog & Resources
--
-- ADDITIVE ONLY. Creates ONE new table (public.blog_posts) with its own
-- RLS policies, grants and two small trigger functions. It does not alter
-- any table, policy or function created by migrations 001–018.
--
-- Run AFTER 018. Back up the project first (Dashboard > Backup & Restore,
-- then download the JSON backup). Never rewrite this file once applied;
-- corrections go in 020+.
--
-- Authorisation model (same pattern as services / portfolio_projects)
--   Public (anon)  -> SELECT published rows only
--   Dashboard      -> view_dashboard / create_content / edit_content /
--                     delete_content through public.has_permission(...)
--   Drafts, hidden and archived rows are never readable by anon.
--
-- ROLLBACK (removes only the blog; nothing else depends on it):
--   drop table if exists public.blog_posts cascade;
--   drop function if exists public.blog_posts_before_write();
-- =====================================================================

create table if not exists public.blog_posts (
  id              bigint generated always as identity primary key,
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title           text not null check (char_length(title) between 1 and 200),
  summary         text check (char_length(summary) <= 400),
  body            text,                                   -- sanitised rich-text HTML
  image_url       text,
  image_alt       text check (char_length(image_alt) <= 200),
  category        text not null default 'Articles',
  content_type    text not null default 'article'
                    check (content_type in (
                      'article','news','guide','tutorial','tool',
                      'case_study','announcement','external','sponsored'
                    )),
  author_name     text check (char_length(author_name) <= 120),  -- only when verified
  tags            jsonb not null default '[]'::jsonb,
  external_url    text check (external_url is null or external_url ~* '^https?://'),
  source_name     text check (char_length(source_name) <= 120),  -- for external items
  disclosure      text check (char_length(disclosure) <= 300),   -- sponsorship / partner note
  featured        boolean not null default false,
  status          text not null default 'draft'
                    check (status in ('draft','published','hidden','archived')),
  is_active       boolean not null default false,         -- kept in sync by the CRUD engine
  sort_order      int not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_public_idx
  on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx
  on public.blog_posts (category);

-- Set published_at the first time a row is published, keep updated_at fresh,
-- and keep the legacy is_active flag aligned with status.
create or replace function public.blog_posts_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.is_active := (new.status = 'published');
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.blog_posts_before_write() from public, anon, authenticated;

drop trigger if exists blog_posts_before_write_trigger on public.blog_posts;
create trigger blog_posts_before_write_trigger
  before insert or update on public.blog_posts
  for each row execute function public.blog_posts_before_write();

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.blog_posts enable row level security;
alter table public.blog_posts force row level security;

drop policy if exists "public read blog_posts" on public.blog_posts;
create policy "public read blog_posts" on public.blog_posts
  for select to anon using (status = 'published');

drop policy if exists "permitted read blog_posts" on public.blog_posts;
create policy "permitted read blog_posts" on public.blog_posts
  for select to authenticated
  using (status = 'published' or public.has_permission('view_dashboard'));

drop policy if exists "permitted insert blog_posts" on public.blog_posts;
create policy "permitted insert blog_posts" on public.blog_posts
  for insert to authenticated with check (public.has_permission('create_content'));

drop policy if exists "permitted update blog_posts" on public.blog_posts;
create policy "permitted update blog_posts" on public.blog_posts
  for update to authenticated
  using (public.has_permission('edit_content'))
  with check (public.has_permission('edit_content'));

drop policy if exists "permitted delete blog_posts" on public.blog_posts;
create policy "permitted delete blog_posts" on public.blog_posts
  for delete to authenticated using (public.has_permission('delete_content'));

-- ---------------------------------------------------------------------
-- Grants (default privileges revoke everything, so grant explicitly)
-- ---------------------------------------------------------------------
revoke all on table public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
