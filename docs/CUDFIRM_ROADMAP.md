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

Each client receives an independent installation and manages content from that client's own dashboard.

## Completed platform foundation

- [x] Public Supabase CMS rendering
- [x] Authentication and dashboard
- [x] Content CRUD and workflow
- [x] Media, SEO, Messages and Subscribers
- [x] Analytics, SEO Health and Site Health
- [x] Backup and Restore
- [x] Roles and Permissions
- [x] Maintenance Mode
- [x] Theme customisation
- [x] Security and Audit
- [x] RLS and API hardening

## Completed Template Integration Framework

- [x] Audit CMS fields and add About/Contact support
- [x] Define CMS Data Contract 1.1.0
- [x] Define Template Manifest schema 1.1.0
- [x] Build shared Template Runtime 1.1.0
- [x] Convert CUDFIRM frontend into Adapter 1
- [x] Connect CUDTEMP as Adapter 2
- [x] Deliver one client-supplied template as Web1
- [x] Build a configuration-aware shared client core
- [x] Build the canonical fresh installer through migration 016
- [x] Separate generic core from client starter content
- [x] Add automated client-delivery verification
- [x] Migrate a protected Web1 copy to framework 1.1.0
- [x] Verify the migrated Web1 package with 40 checks and 0 errors
- [x] Verify browser-only selectors on a temporary deployment
- [x] Replace the Web1 production frontend with the verified migrated build
- [x] Finalise onboarding, deployment, handover and support documentation

## Remaining controlled verification

### Empty-project installer execution

Status: **blocked, not failed**.

The reusable installer has passed structural verification but has not yet been executed against a truly empty Supabase project because the Free organisation has reached its two-project limit and Docker is unavailable locally.

This test will be completed during the first suitable new client setup or when a dedicated test environment becomes available.

Required evidence:

- [ ] Core installer runs once on an empty project
- [ ] Client starter content runs once
- [ ] Verification SQL returns acceptable results
- [ ] At least one authorised Super Admin exists
- [ ] RLS, Storage, public reads and public form inserts are verified
- [ ] Dashboard login and backup are verified

A failure during that controlled test blocks that client launch and requires an additive correction. It does not permit rewriting migration history.

## Business delivery phase

CUDFIRM can now be sold and delivered for ordinary business, agency, portfolio, brochure and service websites.

For each new client:

- [ ] Complete onboarding
- [ ] Select or audit the template
- [ ] Create an independent Supabase project
- [ ] Configure the shared client core
- [ ] Run the automated package verifier
- [ ] Deploy to a separate Netlify site
- [ ] Complete production smoke testing
- [ ] Complete handover and support records

## Deferred product work

These are not business-launch blockers and require separate scope:

- Member Accounts public pages
- Dashboard member management
- Member backup/restore integration
- Payments or booking systems
- Vertical inventory modules
- Additional ready-made templates
- Git-based automated deployment pipeline

Do not resume deferred work merely to keep building. Prioritise paid client requirements and critical fixes.

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

## Non-negotiable rules

- RLS remains enabled
- Client data stays isolated
- Migration history is append-only
- Working features are extended, not replaced
- `js/script.js` and `css/styles.css` remain protected
- No test is reported as passed unless it was actually run
- No unrelated feature expansion without a real client requirement

## Current next task

Begin business delivery using the completed playbook. Treat the first new empty Supabase client installation as the controlled installer execution test and record the result.
