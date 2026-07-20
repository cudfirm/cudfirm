# CUDFIRM Project Master Instructions

## Core purpose

CUDFIRM is a reusable, template-agnostic CMS platform.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Template Adapter
→ Independent Client Installation
```

Do not reduce CUDFIRM to copying one website template for every client.

Each client website must normally use its own Supabase project, dashboard, authentication, users, Storage and data. A project may belong to the CUDFIRM Supabase organisation while remaining completely independent from `CUDFIRM_DATABASE`.

## Current baseline

```text
CUDFIRM core: 2.0.0
CMS contract: 1.1.0
Template runtime: 1.1.0
```

Completed:

- Public website and Supabase CMS rendering
- Authentication and dashboard
- Content, media, SEO, messages and subscribers
- Activity, analytics, health, backup and restore
- Roles, permissions, maintenance, theme and security
- RLS/API hardening
- CMS Data Contract
- Template Manifest
- Shared Template Runtime
- CUDFIRM Default Adapter 1
- CUDTEMP Adapter 2
- One independent client delivery: Web1
- Member Accounts Phases 1 and 2

Web1 is a separate client platform and must remain managed from its own dashboard and Supabase project.

## Current priority

Standardise the successful Web1 delivery into a repeatable current client-delivery process.

Development order:

1. Maintain accurate project documentation
2. Define one configuration-aware shared client core
3. Build the canonical fresh installer through migration 016
4. Add automated client-delivery verification
5. Migrate a protected copy of Web1 to the current framework
6. Test the installer against an empty Supabase project
7. Use the tested process for additional client templates

Do not add unrelated features unless fixing a critical bug or security issue.

## Template rules

Each template must declare:

- Template ID and version
- Manifest schema version
- Supported sections
- Required and optional fields
- Mount targets
- Renderer functions
- Asset requirements
- Module requirements
- Compatibility range
- Core ownership of public forms where applicable

Template-specific code must control markup and presentation only.

It must not duplicate:

- Authentication
- Dashboard CRUD
- Role logic
- RLS
- Backup and Restore
- Security
- Shared Supabase data logic

## Security rules

RLS must remain enabled.

Anonymous users may only read intended published/public data, submit permitted Contact and Newsletter fields, and load intended public media.

Anonymous users must not read private operational tables or modify CMS content.

Viewer, Editor, Admin and Super Admin permissions must be enforced in PostgreSQL RLS and Storage.

Do not change these intentional `SECURITY DEFINER` functions without a complete redesign:

- `record_auth_security_event(...)`
- `current_app_role()`
- `has_permission(...)`
- `record_activity_event(...)`

Leaked Password Protection may remain unavailable on Supabase Free.

## Protected files

High-risk files:

```text
js/script.js
css/styles.css
```

Do not rewrite, refactor, rename or reorganise them unless the exact code has been inspected, no isolated alternative exists, the user is warned first, and the change is minimal and tested.

Prefer isolated files.

## Stability rule

If a feature works:

- Extend it
- Do not replace it
- Do not redesign it
- Do not refactor unrelated code

## Code change process

Before changing code:

1. Inspect the latest complete ZIP
2. Confirm the architecture
3. Identify the minimum files
4. State what will change
5. State what will remain untouched

After changing code:

1. Run applicable syntax checks
2. Run relevant verification tests
3. Validate CSS where applicable
4. Check local references
5. Confirm only intended files changed
6. Return a focused patch
7. Explain the exact cause and fix

Never claim a test passed unless it was run.

## Migration rules

Never rewrite migration history after it has been applied.

Corrections require a new migration using the next number.

Before a production migration:

- Back up the project
- Download a CUDFIRM JSON backup
- Confirm the correct Supabase project

Migration 017 is CUDFIRM-specific messaging and must not be included automatically in generic client installations.

## Working method

For user-performed tasks:

1. Give one clear task
2. Stop
3. Inspect the result
4. Give the next task

When writing a prompt for another coding model, include context, objective, allowed files, forbidden files, systems to preserve, exact behaviour, tests and output requirements.

## Current next task

Create the canonical client fresh-install specification and file plan using migrations 001–016 and lessons from Web1. Do not change production or Web1 during the specification stage.
