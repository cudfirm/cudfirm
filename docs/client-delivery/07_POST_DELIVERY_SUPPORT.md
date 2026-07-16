# 07 — Post-Delivery Support

This document defines the safe process for supporting a delivered CUDFIRM client website.

## 1. Record the support scope

For each client, define:

```text
Support plan:
Start date:
End/renewal date:
Included hours or requests:
Response target:
Emergency contact method:
Billable work outside scope:
```

Separate support from new feature development.

## 2. Classify requests

### Critical

Examples:

- website unavailable;
- dashboard login unavailable for all admins;
- client data exposed across projects;
- Contact/Newsletter submissions failing completely;
- destructive security incident.

Action: investigate immediately according to the support agreement.

### High

Examples:

- major public section missing;
- media upload failing;
- dashboard editor cannot save;
- production deployment broken after an approved change.

### Normal

Examples:

- content correction;
- new user role assignment;
- minor layout issue;
- SEO text update;
- replacement image.

### Enhancement

Examples:

- new CMS module;
- new template;
- automobile-specific inventory fields;
- booking/payment integration;
- redesign.

Enhancements require separate scope and approval.

## 3. Support intake record

For every issue, collect:

```text
Client:
Production URL:
Dashboard URL:
Affected page/module:
Exact problem:
Expected behavior:
When it started:
User/role affected:
Browser/device:
Screenshot or error text:
Recent deployment or database change:
```

Do not ask the client to disable RLS or share secret keys.

## 4. Safe change process

Before modifying code or database:

1. Confirm the exact client project.
2. Download a fresh client JSON backup.
3. Save the latest complete deployed ZIP/repository state.
4. Inspect the current files and migrations.
5. Identify the minimum files or SQL required.
6. State what will and will not change.
7. Test locally or in a safe staging copy where practical.

After the change:

1. Run syntax/reference checks.
2. Apply SQL only to the correct client project.
3. Do not rewrite executed migration history.
4. Verify the exact affected feature.
5. Check unrelated critical flows.
6. Save a new backup when appropriate.
7. Record the change.

## 5. Database correction rule

If a migration or installation file needs correction after it has run:

```text
keep the old file unchanged
→ create the next numbered corrective SQL file
→ back up first
→ run once in the correct client project
→ verify the result
```

Never “fix” history by editing an already executed migration.

## 6. Deployment rollback preparation

Before production deployment:

- [ ] Save the currently deployed ZIP or Git commit.
- [ ] Record the current Netlify deployment ID.
- [ ] Confirm the client Supabase project name.
- [ ] Confirm configuration points to the client project.
- [ ] Keep the previous package available for rollback.

If a deployment fails, use Netlify's prior deployment only after confirming it uses the correct client configuration.

## 7. Security incident response

For suspected credential or data exposure:

1. Stop sharing screenshots/files containing credentials.
2. Identify whether the exposed value is Publishable or secret.
3. Rotate secret/private keys immediately when applicable.
4. Review Auth and Security Events.
5. Review RLS and table grants.
6. Check Messages, Subscribers, Profiles, Activity and Security tables for unauthorized access.
7. Preserve evidence and record actions.
8. Notify the client according to the agreement and applicable obligations.

A Publishable key is intended for frontend use, but it still relies on correct RLS. Never treat RLS verification as optional.

## 8. Routine maintenance

Recommended periodic checks:

- client backup downloaded;
- production site loads;
- Contact and Newsletter forms work;
- dashboard login works;
- Security & Audit shows no unexpected events;
- Supabase Security Advisor reviewed;
- domain/SSL valid;
- dependency/CDN links still available;
- media storage usage reviewed;
- client administrator list reviewed.

## 9. Offboarding or ownership transfer

When support ends or ownership changes:

- [ ] Confirm who owns the domain.
- [ ] Confirm who owns Netlify and Supabase projects.
- [ ] Transfer or remove CUDFIRM access according to the agreement.
- [ ] Provide the latest delivery ZIP and backup.
- [ ] Rotate credentials where required.
- [ ] Remove obsolete administrators.
- [ ] Record the final support date and transfer acceptance.

Do not delete CUDFIRM recovery access until the transfer is confirmed and documented.

## 10. Support change log

```text
Date:
Client:
Issue/request:
Classification:
Backup completed:
Files changed:
SQL file applied:
Deployment ID:
Tests run:
Outcome:
Handled by:
Client confirmation:
```
