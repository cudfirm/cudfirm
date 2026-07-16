-- CUDFIRM Member Accounts v1.0 — Phase 1 verification summary
-- Run after migration 016 and module migration 001.

select
  (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'module_permissions',
        'module_role_permissions',
        'member_settings',
        'member_profiles',
        'member_consents',
        'member_invitations',
        'member_closure_requests',
        'member_export_requests',
        'member_auth_locks'
      )
  ) as required_tables_found,
  (
    select count(*)
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'module_permissions',
        'module_role_permissions',
        'member_settings',
        'member_profiles',
        'member_consents',
        'member_invitations',
        'member_closure_requests',
        'member_export_requests',
        'member_auth_locks'
      )
      and rowsecurity = true
  ) as tables_with_rls,
  (
    select count(*)
    from public.module_permissions
    where module_id = 'member-accounts'
  ) as declared_permissions,
  (
    select count(*)
    from public.module_role_permissions
    where module_id = 'member-accounts' and role = 'viewer'
  ) as viewer_permissions,
  (
    select count(*)
    from public.module_role_permissions
    where module_id = 'member-accounts' and role = 'editor'
  ) as editor_permissions,
  (
    select count(*)
    from public.module_role_permissions
    where module_id = 'member-accounts' and role = 'admin'
  ) as admin_permissions,
  (
    select count(*)
    from public.member_settings
    where id = 1
      and enabled = true
      and public_registration = false
      and require_email_verification = true
      and activation_mode = 'automatic_after_verification'
      and profile_visibility = 'private'
      and sign_in_method = 'email_password'
      and mfa_mode = 'disabled'
  ) as valid_default_settings,
  (to_regprocedure('public.has_module_permission(text,text)') is not null) as module_permission_helper_found,
  (to_regprocedure('public.current_member_status()') is not null) as member_status_helper_found,
  (to_regprocedure('public.is_active_member()') is not null) as active_member_helper_found,
  (to_regprocedure('public.update_own_member_display_name(text)') is not null) as display_name_helper_found;

-- Expected:
-- required_tables_found = 9
-- tables_with_rls = 9
-- declared_permissions = 11
-- viewer_permissions = 1
-- editor_permissions = 0
-- admin_permissions = 8
-- valid_default_settings = 1
-- all *_found values = true
