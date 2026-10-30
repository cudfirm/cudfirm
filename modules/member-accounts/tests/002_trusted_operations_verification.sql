-- ============================================================
-- CUDFIRM Member Accounts — Phase 2 verification
-- Run after migrations 001 and 002. Read-only verification.
-- ============================================================

select
  (
    select count(*)
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'member_settings','member_profiles','member_consents','member_invitations',
        'member_closure_requests','member_export_requests','member_auth_locks',
        'member_rate_limits','module_permissions','module_role_permissions'
      )
  ) as required_tables,
  (
    select count(*)
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = true
      and tablename in (
        'member_settings','member_profiles','member_consents','member_invitations',
        'member_closure_requests','member_export_requests','member_auth_locks',
        'member_rate_limits','module_permissions','module_role_permissions'
      )
  ) as tables_with_rls,
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'member_rate_limit_consume','member_auth_lock_check',
        'member_auth_lock_record_failure','member_auth_lock_clear',
        'member_find_auth_user_by_email','member_finalize_registration',
        'member_prepare_invited_profile','member_accept_invitation_record',
        'sync_member_email_verification','record_member_security_event'
      )
  ) as trusted_functions,
  exists (
    select 1 from pg_trigger
    where tgname = 'sync_member_email_verification_trigger'
      and not tgisinternal
  ) as verification_trigger,
  exists (
    select 1 from storage.buckets
    where id = 'member-exports' and public = false
  ) as private_export_bucket,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'member_profiles'
      and column_name = 'anonymized_at'
  ) as anonymization_columns,
  exists (
    select 1
    from information_schema.role_routine_grants
    where specific_schema = 'public'
      and routine_name = 'member_rate_limit_consume'
      and grantee = 'service_role'
      and privilege_type = 'EXECUTE'
  ) as service_role_execute,
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'member_rate_limits'
      and grantee in ('anon','authenticated')
  ) as no_client_rate_limit_access,
  exists (
    select 1 from pg_constraint
    where conname = 'security_events_type_check'
      and pg_get_constraintdef(oid) like '%member_login_failed%'
  ) as member_audit_events,
  (
    select public_registration = false
       and require_email_verification = true
       and captcha_enabled = true
    from public.member_settings where id = 1
  ) as secure_defaults;
