-- ============================================================================
-- CUDFIRM — Canonical Fresh-Install Verification
-- Run after the core installer and client starter-content file.
-- This file is read-only. Review every result set before deployment.
-- ============================================================================

-- 1. Missing required tables. Expected result: zero rows.
with required(table_name) as (
  values
    ('hero'), ('services'), ('portfolio_projects'), ('testimonials'),
    ('faq'), ('navigation'), ('site_settings'), ('seo_meta'),
    ('media_library'), ('messages'), ('subscribers'), ('activity_log'),
    ('user_profiles'), ('security_events'), ('about_content'),
    ('contact_content'), ('module_permissions'), ('module_role_permissions')
)
select r.table_name as missing_table
from required r
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = r.table_name
where t.table_name is null
order by r.table_name;

-- 2. RLS status. Expected: rowsecurity=true for every row; module tables also
--    show force_rowsecurity=true.
select c.relname as table_name,
       c.relrowsecurity as rowsecurity,
       c.relforcerowsecurity as force_rowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'hero','services','portfolio_projects','testimonials','faq','navigation',
    'site_settings','seo_meta','media_library','messages','subscribers',
    'activity_log','user_profiles','security_events','about_content',
    'contact_content','module_permissions','module_role_permissions'
  )
order by c.relname;

-- 3. Anonymous table grants. Review carefully: public content reads and exact
--    form inserts only. Private tables must not have anonymous SELECT grants.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
order by table_name, privilege_type;

-- 4. Private tables with anonymous SELECT grants. Expected result: zero rows.
select table_name
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and privilege_type = 'SELECT'
  and table_name in (
    'messages','subscribers','user_profiles','activity_log','security_events',
    'module_permissions','module_role_permissions'
  )
order by table_name;

-- 5. Anonymous policies. Verify that messages/subscribers allow INSERT only and
--    that public content SELECT policies are published/singleton scoped.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and 'anon' = any(roles)
order by tablename, policyname;

-- 6. Required protected functions and search_path configuration.
select p.proname,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'record_auth_security_event','current_app_role','has_permission',
    'record_activity_event','has_module_permission',
    'sync_message_workflow_fields','sync_subscriber_status_fields',
    'set_content_updated_at','set_module_permission_updated_at'
  )
order by p.proname, arguments;

-- 7. Media bucket. Expected: one public media bucket.
select id, name, public
from storage.buckets
where id = 'media';

-- 8. Active Super Admins. Expected: one or more rows before handover.
select id, email, full_name, role, is_active, created_at
from public.user_profiles
where role = 'super_admin' and is_active = true
order by created_at;

-- 9. Required singleton records. Expected: one row for each section.
select 'hero' as section, count(*) as row_count from public.hero where id = 1
union all select 'site_settings', count(*) from public.site_settings where id = 1
union all select 'seo_home', count(*) from public.seo_meta where page_key = 'home'
union all select 'about_content', count(*) from public.about_content where id = 1
union all select 'contact_content', count(*) from public.contact_content where id = 1;

-- 10. Current public-content counts for delivery review.
select 'services' as section, count(*) from public.services
union all select 'portfolio', count(*) from public.portfolio_projects
union all select 'testimonials', count(*) from public.testimonials
union all select 'faq', count(*) from public.faq
union all select 'navigation', count(*) from public.navigation
order by section;
