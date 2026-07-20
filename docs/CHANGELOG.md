# CUDFIRM Changelog

## 2.0.0 — Current Production Baseline (July 2026)

### Template Integration Framework

- Added CMS Data Contract 1.1.0
- Added Template Manifest schema 1.1.0
- Added shared Template Runtime 1.1.0
- Converted the CUDFIRM public website into Adapter 1
- Added CUDTEMP as Adapter 2
- Added manifest, adapter and runtime verification scripts
- Completed one independent client-template delivery through Web1

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

### CMS and content

- Supabase-powered public content management
- About and Contact content support
- Search, filters, sorting and pagination
- Bulk actions and drag-and-drop ordering
- Draft, Published, Hidden and Archived workflow

### Business tools

- Message and subscriber management
- CSV exports and dashboard analytics
- SEO health checks and Site Health scanner

### Platform

- Backup and selective restore
- User roles and permissions
- Maintenance mode
- Theme and Custom CSS controls
- Security and audit event tracking
- RLS and API hardening

### Documentation baseline

- Corrected the project context and roadmap to reflect completed adapter work
- Recorded Web1 as an independent client-delivery example
- Identified the canonical fresh installer and repeatable delivery workflow as the next priority
- Removed the outdated statement that the template framework had not started
- Replaced the inaccurate “Security Advisor: 0 errors” wording with the current reviewed-warning position

## 1.0.0 — Core CMS

- Public landing page and authenticated dashboard
- Supabase database, authentication, Storage and CRUD
- Media Library, SEO Manager, Messages, Subscribers and Activity Log
