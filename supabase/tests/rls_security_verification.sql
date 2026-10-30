-- ============================================================
-- CUDFIRM RLS/API Security Verification (read-only catalogue tests)
-- Run AFTER migration 014 in Supabase SQL Editor.
-- This script does not modify application data.
-- ============================================================

-- 1. Table RLS inventory.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2. Policies and target roles.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- 3. Direct grants exposed to anon/authenticated.
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where grantee in ('anon','authenticated')
  and table_schema = 'public'
order by grantee, table_name, privilege_type;

-- 4. Column-level grants for public forms and role management.
select grantee, table_schema, table_name, column_name, privilege_type
from information_schema.role_column_grants
where grantee in ('anon','authenticated')
  and table_schema = 'public'
order by grantee, table_name, column_name, privilege_type;

-- 5. Security-definer functions and their fixed search_path.
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;

-- 6. Assertions. Any failure raises an exception.
do $$
declare
  t text;
  bad_count int;
begin
  foreach t in array array[
    'hero','services','portfolio_projects','testimonials','faq','navigation',
    'site_settings','seo_meta','media_library','messages','subscribers',
    'activity_log','user_profiles','security_events'
  ] loop
    if to_regclass('public.' || t) is null then
      raise exception 'Missing expected table public.%', t;
    end if;

    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t
        and c.relrowsecurity and c.relforcerowsecurity
    ) then
      raise exception 'RLS is not enabled and forced on public.%', t;
    end if;
  end loop;

  select count(*) into bad_count
  from pg_policies
  where schemaname='public'
    and tablename in ('messages','subscribers','activity_log','user_profiles','security_events')
    and (
      coalesce(qual,'') ~* 'auth\.uid\(\)\s+is\s+not\s+null'
      or coalesce(with_check,'') ~* 'auth\.uid\(\)\s+is\s+not\s+null'
      or coalesce(qual,'') = 'true'
      or coalesce(with_check,'') = 'true'
    );
  if bad_count > 0 then
    raise exception 'Found % broad policy expression(s) on sensitive tables.', bad_count;
  end if;

  if has_table_privilege('anon','public.messages','SELECT') then
    raise exception 'anon still has SELECT on public.messages';
  end if;
  if has_table_privilege('anon','public.subscribers','SELECT') then
    raise exception 'anon still has SELECT on public.subscribers';
  end if;
  if has_table_privilege('anon','public.media_library','SELECT') then
    raise exception 'anon still has SELECT on public.media_library';
  end if;
  if has_table_privilege('anon','public.user_profiles','SELECT') then
    raise exception 'anon still has SELECT on public.user_profiles';
  end if;
  if has_table_privilege('anon','public.security_events','SELECT') then
    raise exception 'anon still has SELECT on public.security_events';
  end if;

  if to_regclass('public.content') is not null
     and (has_table_privilege('anon','public.content','SELECT')
          or has_table_privilege('authenticated','public.content','SELECT')) then
    raise exception 'Legacy public.content is still exposed.';
  end if;

  raise notice 'CUDFIRM catalogue security assertions passed.';
end $$;

-- 7. Expected public policy summary.
select
  'Expected anon access' as check_group,
  'SELECT published CMS content + singleton settings/SEO; INSERT only public form columns' as expected;

-- Manual behavioral tests are documented in docs/RLS_SECURITY_AUDIT.md.
