# CUDFIRM Member Accounts v1.0 — Phase 1

This module provides the database, permission, RLS, and contract foundation for public website members. It is deliberately separate from CUDFIRM CMS dashboard identities.

```text
Public members -> member_profiles -> /account/
CMS users      -> user_profiles   -> /dashboard/
```

Creating a member must never create a CMS role, and creating a CMS user must never create a member profile automatically.

## Current phase

Phase 1 includes:

- module manifest and registration;
- safe `extensions.members` contract metadata;
- shared database module-permission foundation;
- member tables, constraints, indexes, RLS, and least-privilege grants;
- default public registration disabled;
- helper functions for current member status and display-name updates;
- SQL verification.

Phase 1 does **not** include public login/register pages, invitations, Edge Functions, transactional emails, CAPTCHA, member dashboard pages, or export generation. Those belong to later phases and must not be presented as working yet.

## Installation order

After downloading a fresh CUDFIRM JSON backup and confirming the correct Supabase project:

1. Run `supabase/016_module_permissions_foundation.sql` once.
2. Run `modules/member-accounts/migrations/001_member_accounts.sql` once.
3. Run `modules/member-accounts/tests/001_member_accounts_verification.sql`.
4. Deploy the module JavaScript files and updated `index.html`.

Completed migration files must not be edited or rerun unless a later corrective migration explicitly requires it.

## Approved defaults

- Public registration: disabled and client-configurable.
- Verified members activate automatically unless manual approval is enabled.
- Unverified members cannot access member-only content.
- Required member field: display name only.
- Profiles: private by default.
- Authentication: email and password.
- Public role: `member`.
- Member area: `/account/`; CMS area: `/dashboard/`.

## Security boundaries

RLS and database functions are the final authority. Frontend visibility is never treated as permission enforcement. Secret/service-role keys must remain server-side.
