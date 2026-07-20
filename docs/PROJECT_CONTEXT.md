# CUDFIRM Project Context

## Product identity

CUDFIRM is a reusable, template-agnostic CMS platform, not only one agency website.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Template Adapter
→ Independent Client Website
```

Each client installation must have its own website, dashboard, authentication, Supabase project, users, Storage and data unless a different architecture is explicitly approved.

A client website must never be managed from the CUDFIRM production dashboard merely because its Supabase project belongs to the CUDFIRM organisation.

## Current version

```text
Core version: 2.0.0
CMS contract: 1.1.0
Template runtime: 1.1.0
```

## Current verified baseline

The following systems are implemented in the CUDFIRM core:

- Public Supabase CMS rendering
- Dashboard authentication and CRUD
- Hero, About, Services, Portfolio, Testimonials, FAQ and Navigation
- Contact content, Site Settings and SEO
- Media Library
- Messages and Subscribers
- Search, filtering, sorting, pagination and bulk actions
- Drag-and-drop ordering
- Draft, Published, Hidden and Archived workflow
- Analytics, SEO Health and Site Health
- Backup and Restore
- Roles and Permissions
- Maintenance Mode
- Theme customisation
- Security and Audit
- RLS and API hardening
- Secured backup workflow

## Template Integration Framework

Completed:

1. CMS field audit, including About and Contact content
2. CMS Data Contract 1.1.0
3. Template Manifest schema 1.1.0
4. Shared Template Runtime 1.1.0
5. CUDFIRM Default as Adapter 1
6. CUDTEMP as Adapter 2
7. One client-supplied template delivered as Web1

The framework verification scripts currently cover:

- CMS contract
- CUDFIRM Default Adapter 1
- CUDTEMP Adapter 2
- Template manifest
- Template runtime

## Web1 client delivery

Web1 is the first completed client-delivery example.

It is an independent platform using its own Supabase project:

```text
Project name: Web1
Project reference: ivvrbalbcqsyejgliazl
```

Web1 has its own:

- Public website
- Dashboard
- Authentication and Super Admin
- Database and RLS policies
- Storage
- Messages and Subscribers
- Backup and handover package

Web1 must remain separate from `CUDFIRM_DATABASE`.

Web1 proves the client-delivery model, but it uses an earlier framework generation. Its working production files must not be replaced directly. Any alignment with the current runtime must first be performed on a protected copy and verified.

## Supabase migrations

The CUDFIRM production history currently contains:

```text
001_schema.sql
002_seed.sql
003_admin_write_policies.sql
004_phase3_platform.sql
005_content_status_workflow.sql
006_message_management.sql
007_subscriber_management.sql
008_backup_restore_permissions.sql
009_user_roles_permissions.sql
010_maintenance_mode.sql
011_theme_customization.sql
012_security_audit.sql
013_theme_wide_default_fix.sql
014_rls_api_security_hardening.sql
015_about_contact_content.sql
016_module_permissions_foundation.sql
017_public_messaging_refresh.sql
```

Migration history is append-only. Never rewrite or renumber a migration that has already been applied.

Migration 017 contains CUDFIRM-specific public messaging and must not be included automatically in generic client installations.

## Member Accounts module

Completed:

- Phase 1: module foundation, permissions, schema and RLS
- Phase 2: trusted server operations and Edge Functions

Not yet complete:

- Public `/account/` pages
- Dashboard member-management pages
- Backup and Restore integration
- Full template integration
- End-to-end module verification

Member Accounts does not block ordinary business, agency, portfolio or brochure client websites. It blocks only templates that require customer accounts or member-owned data.

## Current delivery gap

The next priority is to standardise the successful Web1 delivery into a repeatable current process:

1. Create the canonical fresh-install core through migration 016
2. Keep client starter content separate from the reusable core
3. Add automated client-template compatibility checks
4. Test the installer against an empty Supabase project
5. Migrate a protected Web1 copy to the current framework
6. Finalise one authoritative onboarding, deployment and handover process

Do not add unrelated CMS features before this work unless fixing a critical bug or security issue.

## Security rules

RLS must remain enabled.

Anonymous users may only:

- Read published public content
- Read intended public settings and SEO data
- Submit permitted Contact fields
- Submit a newsletter email
- Load intended public media

Anonymous users must not read Messages, Subscribers, User Profiles, Activity Log or Security Events, and must not modify or delete CMS content.

Permissions must be enforced in PostgreSQL RLS and Storage, not only through dashboard buttons.

The following functions intentionally remain `SECURITY DEFINER` and must not be changed without a complete redesign:

- `record_auth_security_event(...)`
- `current_app_role()`
- `has_permission(...)`
- `record_activity_event(...)`

Leaked Password Protection may remain unavailable on the Supabase Free plan.

## Protected files

Treat these as high risk:

```text
js/script.js
css/styles.css
```

Do not rewrite, rename, reorganise or broadly refactor them. Prefer isolated files and the smallest safe change.

## Working method

Before changing code:

1. Inspect the latest complete ZIP
2. Confirm the current architecture
3. Identify the minimum files
4. State what will and will not change

After changing code:

1. Run applicable syntax and verification checks
2. Check references
3. Confirm only intended files changed
4. Return a focused patch
5. Never claim an unperformed test passed

For user-performed deployment or migration work, give one clear task at a time.
