# CUDFIRM Canonical Supabase Fresh Installer

This folder is the reusable database installation baseline for a **new and separate client Supabase project**.

## Included baseline

- CUDFIRM CMS Core `2.0.0`
- Schema and security history through migration `016`
- About and Contact singleton content
- Roles, permissions, RLS, Storage, backup and audit foundations
- Shared module-permission foundation

The installer deliberately excludes:

- `002_seed.sql` — CUDFIRM website content
- `017_public_messaging_refresh.sql` — CUDFIRM-specific public messaging

## Before running SQL

1. Confirm the correct client Supabase project name and reference ID.
2. Confirm it is not `CUDFIRM_DATABASE` and not another client's project.
3. Create the first client administrator in **Authentication → Users**.
4. Save the client project URL and publishable key securely.
5. For an existing project, stop and use migrations instead of this fresh installer.

## Run order

1. `01_cudfirm_core_fresh_install.sql`
2. A completed client copy of `02_client_starter_content.example.sql`
3. `03_verify_fresh_install.sql`
4. `04_promote_first_admin_if_needed.sql` only when verification shows zero active Super Admins

Run one file at a time in Supabase SQL Editor. Do not continue after an error.

## Important

The installer is generated from the existing append-only migration files; it does not replace or rewrite them. Once used for a client, keep the delivered SQL files unchanged and add later corrections with the next number.

A local static verification test confirms file composition and required security declarations. A true installation is not considered proven until these files are run against an empty Supabase project and the SQL verification results are reviewed.
