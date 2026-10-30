# CUDFIRM RLS & API Security Audit

**Audit target:** CUDFIRM v2.0 backup supplied for Phase 6.7  
**Scope:** SQL migrations 001–013, dashboard data access, public Supabase calls, RPC functions, and Storage policies.

## Executive summary

The application had a solid role-aware foundation from migration 009, but it was **not yet least-privilege secure**. Historical policies and grants accumulated across earlier phases, several public policies targeted every role implicitly, private metadata remained anonymously enumerable, public form inserts were too broad, and dashboard activity records could be forged by any active dashboard user.

Migration `014_rls_api_security_hardening.sql` corrects those issues while preserving the working public website, contact form, newsletter form, dashboard role system, backup/restore, media uploads, and security audit.

## Important limitation

This audit is based on the supplied source archive and migration history. It cannot see undocumented objects created manually in the live Supabase project. Run `supabase/tests/rls_security_verification.sql` after migration 014 and review Supabase **Security Advisor** to catch live-only objects, views, functions, or grants.

## Findings

### Critical — legacy `public.content` table was unrestricted

The earlier Supabase screenshot showed `public.content` as **UNRESTRICTED**, while the audited application contains no query or reference to that table. An unused exposed table increases attack surface and can leak data later if records are added.

**Correction:** migration 014 enables and forces RLS, removes all policies, revokes `anon`/`authenticated` privileges, and marks the table as quarantined when it exists.

### High — historical broad authenticated policies existed

Migrations 003, 004, 007, and 008 created policies based only on `auth.uid() is not null`. Migration 009 removed most of them, but security depends on every historical policy being dropped correctly because permissive policies are OR-combined.

**Correction:** migration 014 explicitly drops every known broad policy and recreates a canonical policy set.

### High — grants were not rebuilt as least privilege

RLS and SQL grants are separate controls. Earlier migrations primarily focused on policies and relied on Supabase defaults. That made it difficult to prove exactly what `anon` and `authenticated` could call.

**Correction:** migration 014 revokes all privileges on known tables and grants only the operations required by the application.

### High — public message insertion accepted arbitrary columns

The original message policy used `WITH CHECK (true)`. A caller could provide workflow fields such as `status`, `is_read`, or archive timestamps.

**Correction:** anonymous users receive INSERT privilege only on `name`, `contact_info`, and `message`; RLS verifies lengths and default workflow state.

### Medium — public subscriber insertion allowed more fields than necessary

The subscriber policy restricted status/source, but callers could still submit columns beyond the public form’s intended `email` input.

**Correction:** anonymous users receive INSERT privilege only on `email`, with format/length and normalized-state checks.

### Medium — `media_library` metadata was publicly enumerable

The website uses media URLs stored in public content records; it does not need anonymous access to the entire media catalogue. The public policy exposed storage paths, uploader metadata, sizes, categories, and all file URLs.

**Correction:** anonymous database access to `media_library` is removed. Direct assets remain available because the `media` Storage bucket is intentionally public.

### Medium — Storage object listing was public

A `storage.objects` SELECT policy allowed anonymous enumeration of the media bucket.

**Correction:** the anonymous metadata-listing policy is removed. Public object delivery remains through public URLs; uploads/updates/deletes require `manage_media`.

### Medium — activity log entries were client-forgeable

Any active dashboard user could insert arbitrary `actor_email`, action, entity, and details into `activity_log`.

**Correction:** normal logging now uses `record_activity_event()`, which derives the actor from `auth.uid()`. Direct insert/delete remains only for Super Admin backup/restore.

### Medium — Viewer/Editor private-data access was too broad

The SQL and frontend permission matrices allowed Viewers and Editors to read Messages, Subscribers, and Activity Log. Those tables contain personal/business data unrelated to content editing.

**Correction:** migration 014 limits Messages, Subscribers, and Activity Log to Admin/Super Admin. The included `permissions.js` update keeps the interface consistent with RLS.

### Medium — anonymous failed-login audit could be flooded

The failed-login RPC rate-limited only a caller-controlled email/user-agent pair, which could be varied.

**Correction:** a global rolling cap and stricter per-email cap were added. A truly strong IP-based limiter still requires a Supabase Edge Function or server endpoint.

### Low — SECURITY DEFINER trigger functions retained default EXECUTE grants

Several trigger functions did not explicitly revoke execution from API roles.

**Correction:** migration 014 revokes direct execution from `public`, `anon`, and `authenticated` for trigger-only functions and fixes function `search_path` where applicable.

## Final intended access model

| Resource | Anonymous | Viewer | Editor | Admin | Super Admin |
|---|---|---|---|---|---|
| Published content | Read | Read all dashboard content | Read/create/edit/publish | Full CRUD | Full CRUD |
| Hero/settings/SEO public data | Read | Read | SEO edit, content edit | Manage | Manage |
| Media catalogue | No | Read | Manage | Manage | Manage |
| Messages | Insert only | No | No | Read/manage | Read/manage/backup |
| Subscribers | Insert email only | No | No | Read/manage | Read/manage/backup |
| Activity Log | No | No | No | Read | Read/restore |
| User profiles | No | Own row | Own row | Own row | All/manage |
| Security events | Failed-login RPC only | No | No | No | Read |
| Backup/Restore | No | No | No | No | Full |
| Storage writes | No | No | Manage | Manage | Manage |

## Files changed by the hardening patch

- `supabase/014_rls_api_security_hardening.sql`
- `supabase/tests/rls_security_verification.sql`
- `dashboard/js/dash-utils.js`
- `dashboard/js/permissions.js`
- `docs/RLS_SECURITY_AUDIT.md`
- `docs/RLS_INSTALL_ROLLBACK.md`

No public page HTML, `js/script.js`, `css/styles.css`, theme, maintenance, or CMS rendering files were changed.

## Required post-install checks

1. Run migration 014.
2. Deploy the two dashboard JavaScript changes.
3. Sign out and sign back in.
4. Run `supabase/tests/rls_security_verification.sql`.
5. Test the public contact form and newsletter form.
6. Test Admin access to Messages/Subscribers.
7. Confirm Editor/Viewer cannot open or query those private sections.
8. Test media upload/delete with Editor or Admin.
9. Test Super Admin backup and restore of one small section.
10. Review Supabase Security Advisor.

## Runtime test matrix

Create one test user for each role and verify:

- **Viewer:** can read content pages; cannot access Messages, Subscribers, Activity, Settings, Users, Backup, or Security.
- **Editor:** can edit/publish content and media/SEO; cannot read Messages/Subscribers/Activity or delete content.
- **Admin:** can manage Messages/Subscribers/Settings and delete content; cannot manage users, security, or backup.
- **Super Admin:** can perform all supported operations.

