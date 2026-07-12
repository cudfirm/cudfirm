# Phase 6.7 Installation and Rollback

## Before installation

1. Download a fresh CUDFIRM JSON backup.
2. Export the current database schema or take a Supabase backup.
3. Keep the currently deployed frontend ZIP.
4. Do not delete or edit policies manually.

## Installation order

1. Open Supabase **SQL Editor**.
2. Run `supabase/014_rls_api_security_hardening.sql` once.
3. Confirm the query ends successfully; do not deploy the JavaScript patch if SQL failed.
4. Deploy the patch files.
5. Hard-refresh, then sign out and sign back in.
6. Run `supabase/tests/rls_security_verification.sql`.
7. Complete the runtime role/form tests from the audit report.

## Expected behavior changes

- Viewer and Editor no longer see Messages, Subscribers, or Activity Log.
- Anonymous users cannot list media metadata or Storage object rows.
- Public message/subscriber submissions accept only intended fields.
- Activity logging uses an RPC rather than direct client inserts.
- The unused `public.content` table is quarantined.

## Rollback strategy

Migration 014 changes policies and grants, so the safest rollback is **not** an improvised reverse SQL script. Use one of these:

1. Restore the Supabase database/schema backup taken immediately before installation; or
2. Re-run the previous canonical migrations (`009_user_roles_permissions.sql`, `012_security_audit.sql`) and redeploy the prior frontend, then manually restore any grants/policies reported by your pre-install schema export.

A database backup is strongly preferred because policy/grant state may include live-only changes not represented in the repository.

## Emergency recovery

If dashboard access is unexpectedly blocked:

1. Do not disable RLS globally.
2. Confirm the signed-in user exists in `public.user_profiles` with `role='super_admin'` and `is_active=true`.
3. Check that `current_app_role()` and `has_permission(text)` are executable by `authenticated`.
4. Review the policy inventory query in the verification script.
5. Restore the pre-install schema backup only if the issue cannot be corrected safely.
