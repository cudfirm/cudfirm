# CUDFIRM Roadmap

## Product goal

CUDFIRM is a reusable, template-agnostic CMS platform.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Template Adapter
→ Independent Client Installation
```

The reusable core includes the database model, authentication, roles, RLS, dashboard, media, SEO, messages, subscribers, backup, audit and security systems.

Each client receives an independent installation and manages content from that client's own dashboard.

## Completed platform foundation

- Public Supabase CMS rendering
- Authentication and dashboard
- Full content CRUD and workflow
- Media, SEO, Messages and Subscribers
- Analytics, SEO Health and Site Health
- Backup and Restore
- Roles and Permissions
- Maintenance Mode
- Theme customisation
- Security and Audit
- RLS and API hardening
- Secured backup

## Completed Template Integration Framework work

- [x] Audit CMS fields and add About/Contact support
- [x] Define CMS Data Contract 1.1.0
- [x] Define Template Manifest schema 1.1.0
- [x] Build shared Template Runtime 1.1.0
- [x] Convert CUDFIRM frontend into Adapter 1
- [x] Connect CUDTEMP as Adapter 2
- [x] Deliver one client-supplied template as Web1
- [x] Create a Web1-specific fresh-install and handover package
- [x] Verify the isolated Web1 website/dashboard model

## Current gap

Web1 proves the business model, but it was created using an earlier framework generation. The next task is to convert the successful delivery into one current, repeatable standard without merging Web1 into the CUDFIRM dashboard.

## Current development order

### Phase A — Documentation baseline

- [x] Correct Project Context
- [x] Correct Roadmap
- [x] Correct Changelog
- [x] Correct Release Checklist
- [x] Preserve the framework/delivery audit in the project documentation

### Phase B — Canonical client core

- [ ] Define one configuration-aware public client core
- [ ] Centralise data fetching, normalisation, SEO and public form submission
- [ ] Prevent future templates from copying Supabase loading logic
- [ ] Preserve independent client Supabase projects and dashboards

### Phase C — Canonical fresh installer

- [ ] Build reusable core installer through migration 016
- [ ] Keep CUDFIRM-specific migration 017 out of generic client setup
- [ ] Separate reusable schema from client starter content
- [ ] Add verification and first-admin scripts
- [ ] Document one authoritative execution order

### Phase D — Automated delivery verification

- [ ] Add client-template manifest compatibility checks
- [ ] Add local-reference checks
- [ ] Add syntax checks
- [ ] Add configuration and secret-exposure checks
- [ ] Add installation verification requirements

### Phase E — Web1 protected migration test

- [ ] Copy Web1 into a protected test workspace
- [ ] Upgrade its manifest declarations to the current schema
- [ ] Align it with the shared client core
- [ ] Correct the `sync_message_workflow_fields` search path through a new migration
- [ ] Preserve the working live Web1 installation
- [ ] Run full regression tests

### Phase F — Empty-project delivery test

- [ ] Create or use an empty Supabase test project after explicit approval
- [ ] Run the canonical installer from zero
- [ ] Verify RLS, Storage, forms, authentication, roles and backup
- [ ] Deploy a test client frontend
- [ ] Complete the delivery and handover checklist

### Phase G — Additional client templates

- [ ] Attach the next client-supplied template using the tested standard
- [ ] Confirm no authentication, dashboard, role, RLS, backup or Supabase logic is duplicated
- [ ] Repeat the delivery workflow and record lessons

## Member Accounts roadmap

Completed:

- [x] Phase 1 — Foundation, schema, permissions and RLS
- [x] Phase 2 — Trusted server operations

Remaining:

- [ ] Phase 3 — Public account pages
- [ ] Phase 4 — Dashboard member management
- [ ] Phase 5 — Backup and Restore integration
- [ ] Phase 6 — Template integration
- [ ] Phase 7 — End-to-end verification

Do not resume this module ahead of the client-delivery standard unless a real client template requires member accounts.

## Non-negotiable rules

- RLS remains enabled
- Client data stays isolated
- Migration history is append-only
- Working features are extended, not replaced
- `js/script.js` and `css/styles.css` remain protected
- No unrelated feature expansion before delivery standardisation
- No test may be reported as passed unless it was actually run

## Current next task

Build the **canonical client fresh-install specification and file plan** from migrations 001–016 and the working Web1 package. Do not execute it against production and do not modify Web1 yet.
