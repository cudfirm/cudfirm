# CUDFIRM Member Accounts v1.0 — Phase 2

This module provides public website member identities separately from CUDFIRM CMS dashboard identities.

```text
Public members -> member_profiles -> /account/
CMS users      -> user_profiles   -> /dashboard/
```

Creating a member never creates a CMS role. Creating a CMS user never creates a member profile automatically.

## Completed phases

### Phase 1

- module manifest, registration, and safe contract metadata;
- shared module-permission foundation;
- member tables, constraints, indexes, RLS, and least-privilege grants;
- default public registration disabled;
- member status and controlled display-name helpers.

### Phase 2

- trusted self-registration enforcement;
- email/password sign-in with five-attempt temporary locking;
- verification-email resend protection;
- administrator invitations and invitation acceptance;
- approval, suspension, reactivation, archival, anonymization, and guarded deletion;
- closure and personal-data export requests;
- private JSON export generation and temporary signed downloads;
- backend rate limiting;
- member audit/security events;
- provider-agnostic transactional-email webhook hooks.

Phase 2 does **not** add public `/account/` pages or dashboard member-management pages. Those belong to Phases 3 and 4 and must not be presented as working yet.

## Migration order

Completed migrations must remain unchanged.

1. `supabase/016_module_permissions_foundation.sql`
2. `modules/member-accounts/migrations/001_member_accounts.sql`
3. `modules/member-accounts/migrations/002_trusted_operations.sql`
4. `modules/member-accounts/tests/001_member_accounts_verification.sql`
5. `modules/member-accounts/tests/002_trusted_operations_verification.sql`

Never rerun completed migrations merely because their files were copied into another folder.

## Edge Functions

```text
member-register                 public endpoint
member-sign-in                  public endpoint
member-resend-verification      public endpoint
member-invite                   authenticated CMS Admin/Super Admin
member-accept-invitation        authenticated member
member-admin-action             authenticated CMS Admin/Super Admin
member-request                  authenticated active member
member-request-admin            authenticated CMS Admin/Super Admin
member-export                   authenticated CMS Admin/Super Admin
```

### Required secrets

Supabase provides the project URL and key secrets to hosted Edge Functions. CUDFIRM also requires:

```text
MEMBER_SITE_URL=https://your-client-site.example
MEMBER_ALLOWED_ORIGINS=https://your-client-site.example
```

For local development, add exact local origins as comma-separated values. Do not use `*`.

Existing-account invitations and non-Auth transactional notices use an optional client-specific webhook:

```text
MEMBER_EMAIL_WEBHOOK_URL=https://your-server.example/member-email
MEMBER_EMAIL_WEBHOOK_SECRET=<server-only-secret>
```

Provider credentials and Supabase secret/service-role keys must never appear in browser files.

### Deployment JWT rules

The three pre-authentication functions must be deployed without gateway JWT verification because they authenticate or create the member themselves:

```bash
supabase functions deploy member-register --no-verify-jwt
supabase functions deploy member-sign-in --no-verify-jwt
supabase functions deploy member-resend-verification --no-verify-jwt
```

All remaining functions must keep JWT verification enabled:

```bash
supabase functions deploy member-invite
supabase functions deploy member-accept-invitation
supabase functions deploy member-admin-action
supabase functions deploy member-request
supabase functions deploy member-request-admin
supabase functions deploy member-export
```

The function code performs an additional user and module-permission check for every protected operation.

## CAPTCHA

When `member_settings.captcha_enabled` is true, registration, sign-in, and verification resend require a CAPTCHA token. Configure hCaptcha or Cloudflare Turnstile under Supabase Authentication bot protection before enabling public account pages.

## Security boundaries

- RLS and trusted server operations are the final authority.
- Browser visibility is never treated as permission enforcement.
- Public functions return generic duplicate-account and invalid-credential responses.
- Passwords, Auth tokens, invitation links, and recovery links are never written to general logs.
- Suspended and archived member profiles remain blocked even if an Auth session exists.
- A dual CMS/member identity cannot be anonymized or hard-deleted through the member workflow until CMS access is resolved.
- Member exports are stored only in the private `member-exports` bucket and exposed through five-minute signed URLs.
