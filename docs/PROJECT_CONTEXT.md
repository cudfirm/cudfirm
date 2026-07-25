# CUDFIRM Project Context

## Product identity

CUDFIRM is a reusable, template-agnostic CMS platform.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Template Adapter
→ Independent Client Website
```

Each client normally receives a separate website, dashboard, authentication system, Supabase project, users, Storage and data.

A client project may belong to the CUDFIRM Supabase organisation, but it must remain independent from `CUDFIRM_DATABASE` and every other client project.

## Current version

```text
Core version: 2.0.0
CMS contract: 1.1.0
Template runtime: 1.1.0
```

## Verified production baseline

The CUDFIRM core includes:

- Public Supabase CMS rendering
- Dashboard authentication and CRUD
- Hero, About, Services, Portfolio, Testimonials, FAQ and Navigation
- Contact Content, Site Settings and SEO
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

1. CMS field audit, including About and Contact support
2. CMS Data Contract 1.1.0
3. Template Manifest schema 1.1.0
4. Shared Template Runtime 1.1.0
5. CUDFIRM Default as Adapter 1
6. CUDTEMP as Adapter 2
7. Shared configuration-aware client core
8. Canonical fresh installer through migration 016
9. Automated client-delivery verification
10. One client-supplied template delivered and migrated: Web1

Current verification scripts cover:

- CMS contract
- CUDFIRM Default Adapter 1
- CUDTEMP Adapter 2
- Template manifest
- Template runtime
- Shared client core
- Canonical fresh installer structure
- Client-delivery package verification

## Web1 reference delivery

Web1 is the first completed independent client-delivery example.

```text
Supabase project: Web1
Project reference: ivvrbalbcqsyejgliazl
Production URL: https://cud-web1.netlify.app
Temporary migration test URL: https://web1b.netlify.app
```

Web1 has its own:

- Public website
- Dashboard
- Authentication and Super Admin
- Database and RLS policies
- Storage
- Messages and Subscribers
- Backup and handover package

Web1 was migrated on a protected copy to framework compatibility 1.1.0. The migrated package passed 40 automated delivery checks with 0 errors. The two browser-selector warnings were then verified successfully in a real browser. The migrated frontend was deployed to the original production Netlify site.

Web1 remains separate from `CUDFIRM_DATABASE`.

## Shared client-delivery standard

A standard client package now contains:

```text
<client>-client-delivery/
├── <client>-website/
├── supabase-fresh-install/
├── docs/
├── verification/
└── client-delivery.json
```

The public website and dashboard load one client-specific configuration and connect only to that client's Supabase project.

Template adapters may control markup and presentation. They must not duplicate authentication, dashboard CRUD, roles, RLS, backup, security or shared Supabase data logic.

## Canonical fresh installer status

The reusable installer through migration 016 has been assembled and structurally verified. It deliberately excludes:

```text
002_seed.sql
017_public_messaging_refresh.sql
```

Those files contain CUDFIRM-specific content and are not generic client installation files.

A true empty-project execution test has not yet been completed because:

- the CUDFIRM Supabase organisation reached its two active Free-project limit; and
- Docker is not installed for a local Supabase environment.

This is a blocked test, not a failed test. The first new client installation must therefore be treated as the controlled empty-project execution test: run the installer once, run verification SQL, record results and stop immediately if any check fails.

## Business readiness

CUDFIRM is ready to sell and deliver ordinary business, agency, portfolio, brochure and service websites using the current shared contract.

The following should be separately scoped and must not be promised as included by default:

- Public customer/member accounts
- Member-owned private data
- Payments
- Booking systems
- Vertical inventory fields such as mileage, bedrooms, stock variants or event schedules
- New custom CMS modules

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

Member Accounts does not block ordinary client websites.

## Supabase migration rules

CUDFIRM production migrations currently run from 001 through 017.

Migration history is append-only. Never rewrite or renumber a migration that has already been applied.

Before a production migration:

- back up the project;
- download a client JSON backup;
- confirm the exact Supabase project;
- use the next numbered corrective migration when needed.

## Security rules

RLS must remain enabled.

Anonymous users may only:

- read intended published/public data;
- submit approved Contact fields;
- submit a newsletter email;
- load intended public media.

Anonymous users must not read Messages, Subscribers, User Profiles, Activity Log or Security Events, and must not modify or delete CMS content.

Permissions must be enforced in PostgreSQL RLS and Storage, not only through hidden dashboard buttons.

Do not change these intentional `SECURITY DEFINER` functions without a complete redesign:

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

## Current priority

Stop expanding the framework without a real client requirement.

The current priority is business delivery:

1. Qualify the client and select a suitable template.
2. Follow the client-delivery playbook.
3. Create a separate Supabase project and Netlify site.
4. Run the automated verifier before deployment.
5. Complete handover and support records.
6. Record lessons from each paid delivery without redesigning unrelated systems.
