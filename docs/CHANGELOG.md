# CUDFIRM Changelog

## 2.0.0 — Business-Ready Production Baseline (July 2026)

### Template Integration Framework

- Added CMS Data Contract 1.1.0
- Added Template Manifest schema 1.1.0
- Added shared Template Runtime 1.1.0
- Converted the CUDFIRM public website into Adapter 1
- Added CUDTEMP as Adapter 2
- Added manifest, adapter and runtime verification scripts
- Completed one independent client-template delivery through Web1

### Shared client-delivery core

- Added configuration-aware Supabase bootstrap
- Added client configuration example
- Added protection against accidental CUDFIRM production connections
- Rejected browser use of `service_role` and `sb_secret_*` credentials
- Added shared Contact and Newsletter submission services
- Added Subject support without exposing workflow fields
- Added shared-client-core verification

### Canonical fresh installer

- Added reusable fresh installer through migration 016
- Separated reusable schema from client starter content
- Excluded CUDFIRM-specific seed and migration 017 content
- Added read-only installation verification SQL
- Added first-Super-Admin recovery script
- Added installer verification test
- Recorded empty-project execution as blocked pending a spare Supabase project or local Docker environment

### Automated client-delivery verification

- Added package-level delivery verifier
- Added configuration, secret, manifest, asset and reference checks
- Added support for deployable website subfolders
- Added client-delivery verification specification and tests

### Web1 framework migration

- Migrated a protected Web1 copy to framework compatibility 1.1.0
- Passed 40 client-delivery checks with 0 errors
- Verified complex navigation and hero-slider selectors in a browser
- Deployed the migrated build to a separate temporary Netlify site
- Replaced the original Web1 production frontend with the verified migrated build
- Preserved Web1's separate Supabase project, users, authentication and dashboard data

### Client delivery documentation

- Finalised onboarding, template integration, Supabase setup, dashboard setup, Netlify deployment, handover and support guides
- Added a final delivery closeout checklist
- Added the CUDFIRM business-launch baseline
- Updated project context, roadmap, release checklist and master instructions for the business-delivery phase

### Public messaging refresh

- Updated CUDFIRM public website messaging to describe the current product accurately
- Corrected public email, telephone and WhatsApp details
- Updated SEO description
- Added migration `017_public_messaging_refresh.sql`
- Deployed and verified the public website update

### Member Accounts module

- Added module manifest, contract and registration
- Added shared module-permission foundation in migration 016
- Added member database schema, constraints, RLS and private export Storage
- Added trusted registration, sign-in, invitation, status, closure and export operations
- Added nine Supabase Edge Functions
- Public account pages and dashboard member-management pages remain pending

### Core CMS and platform

- Supabase-powered public content management
- About and Contact content support
- Search, filters, sorting and pagination
- Bulk actions and drag-and-drop ordering
- Draft, Published, Hidden and Archived workflow
- Message and subscriber management
- CSV exports and dashboard analytics
- SEO Health and Site Health
- Backup and selective restore
- User roles and permissions
- Maintenance Mode
- Theme and Custom CSS controls
- Security and audit event tracking
- RLS and API hardening

## 1.0.0 — Core CMS

- Public landing page and authenticated dashboard
- Supabase database, authentication, Storage and CRUD
- Media Library, SEO Manager, Messages, Subscribers and Activity Log
