# CUDFIRM Framework and Client-Delivery Audit

**Audit date:** 20 July 2026  
**CUDFIRM source:** uploaded `cudfirm.zip`, Git commit `762410e`  
**Reference client delivery:** uploaded `web1-client-delivery.zip`  
**Web1 Supabase project:** `ivvrbalbcqsyejgliazl`  
**Method:** read-only source inspection, automated syntax/reference checks, current-validator compatibility test, live Supabase read-only queries, and supplied deployment screenshots.

No source file, database row, policy, migration, deployment, or client setting was changed during this audit.

---

## 1. Executive verdict

CUDFIRM has already proved the intended delivery model once through Web1:

```text
Reusable CUDFIRM CMS/dashboard foundation
→ client-supplied template adapter
→ separate client website
→ separate client Supabase project
→ separate client dashboard and users
```

Web1 is correctly isolated from `CUDFIRM_DATABASE`. It is not, and should not be, managed through the CUDFIRM production dashboard.

The remaining gap is not “build client delivery from scratch.” The gap is to turn the successful Web1 v1 delivery into one current, versioned, repeatable client-delivery standard before several more templates are attached.

### Readiness assessment

| Area | Status |
|---|---|
| CUDFIRM CMS core | Ready |
| Adapter 1 — CUDFIRM default | Ready |
| Adapter 2 — CUDTEMP | Ready |
| First isolated client delivery — Web1 | Working v1 |
| Current framework compatibility for Web1 | Not yet compatible |
| Generic current fresh-install package | Not yet complete |
| Empty-project installation proof for current core | Not yet complete |
| Client-delivery playbook | Present, but partly stale |
| Routine attachment of several new client templates | Not ready yet |

---

## 2. Evidence verified

### CUDFIRM source

- 69 JavaScript files checked with `node --check`; 0 failures.
- 269 local HTML references checked; 0 missing.
- 2 CSS-local URL references checked; 0 missing.
- All five framework tests passed:
  - CMS contract verification
  - CUDFIRM Default Adapter 1 verification
  - CUDTEMP Adapter 2 verification
  - Template manifest verification
  - Template runtime verification
- Current contract: `1.1.0`.
- Current manifest/runtime family: `1.1.0`.
- Core version: `2.0.0`.

### Web1 source

- 47 JavaScript files checked with `node --check`; 0 failures.
- 228 local HTML references checked; 0 missing.
- No frontend `service_role` or secret Supabase key found.
- All 21 dashboard HTML pages load `config/client-config.js` before `js/supabase.js`.
- The dashboard is mostly the verified CUDFIRM dashboard core:
  - 31 files are byte-identical to CUDFIRM.
  - 26 files differ mainly for Web1 branding/configuration.
  - Functional dashboard difference totals are small: 57 insertions and 36 deletions.

### Live Web1 Supabase project

Read-only audit confirmed:

- 16 expected application tables exist.
- RLS is enabled on all 16.
- 64 public/storage policies exist.
- `media` bucket exists and is public for intended media delivery.
- Exactly 1 active Super Admin exists.
- Anonymous users have no `SELECT` grant on:
  - Messages
  - Subscribers
  - User Profiles
  - Activity Log
  - Security Events
- Anonymous policies are limited to intended public reads and Contact/Newsletter inserts.
- Current content counts match the dashboard screenshots:
  - 3 services
  - 3 portfolio records
  - 2 testimonials
  - 3 FAQ records
  - 6 navigation records
  - 1 message
  - 1 subscriber

---

## 3. Roadmap phase status

| Original delivery phase | Audit result |
|---|---|
| Audit CMS fields and add About/Contact | Completed |
| Define CMS data contract | Completed — contract `1.1.0` |
| Define template manifest | Completed — schema `1.1.0` |
| Build shared adapter runtime | Completed — runtime `1.1.0` |
| Convert CUDFIRM to Adapter 1 | Completed and tested |
| Connect CUDTEMP as Adapter 2 | Completed and tested |
| Connect client-supplied template | Completed once through Web1 v1 |
| Build fresh-install Supabase setup | Completed for Web1 v1, not yet canonical for current core |
| Create onboarding/deployment/handover docs | Completed, with stale sections |
| Test full delivery workflow | Completed once through Web1; not yet repeated from a blank project using current core |

---

## 4. Main architecture gap: two public-core implementations

CUDFIRM current core uses:

```text
js/supabase.js
js/cms-api.js
js/cms-loader.js
js/cms-contract.js
js/template-registry.js
js/template-validator.js
js/template-runtime.js
```

Web1 v1 uses its own copies:

```text
config/client-config.js
js/supabase.js
js/supabase-loader.js
js/template-registry.js
js/template-validator.js
js/template-runtime.js
```

The Web1 solution was useful for proving client isolation, but it created a second public data/runtime stack. Future templates should not receive another independent fork.

### Important detail

The current CUDFIRM `js/supabase.js` still hardcodes the CUDFIRM production project. Web1 solved client configuration safely through `config/client-config.js`, but its public loader/runtime then diverged from the current core.

The reusable client core therefore still needs one official configuration-aware bootstrap that:

- reads the client Project URL and Publishable key;
- creates the shared Supabase client;
- uses the shared CMS API/loader/contract;
- supports current manifest/runtime `1.1.0`;
- is copied unchanged between clients except for configuration.

---

## 5. Web1 is not compatible with current runtime `1.1.0`

Running the Web1 manifest through the current CUDFIRM validator produced:

### Errors

```text
Template module requirements are missing.
Template asset requirements are missing.
```

### Warnings

```text
contact form does not declare which core layer manages submission.
newsletter form does not declare which core layer manages submission.
```

This is only the manifest-level result. There is also an adapter-runtime mismatch:

- Web1 lifecycle uses `beforeInitialize`, `bindForms`, and `afterInitialize`.
- Current runtime uses `initialize`, `beforeRender`, `afterRender`, `complete`, and `onError`.
- Web1 renderers expect a custom `helpers` object supplied by its old runtime.
- Current runtime does not pass that Web1-specific helper object.

Therefore, replacing only Web1’s runtime/validator files with current versions would break Web1. The Web1 adapter must be deliberately migrated or wrapped; the live working package must not be blindly overwritten.

---

## 6. Web1 loader field-mapping defects

The Web1 v1 loader was tested with rows shaped exactly like the CUDFIRM schema. It loses several values.

| Database field | Required normalized field | Web1 v1 result |
|---|---|---|
| `site_settings.company_name` | `site.name` | Ignored; falls back to `Web1` |
| `site_settings.google_maps_embed` | `site.mapEmbedUrl` | Ignored |
| `theme_primary_color` and other `theme_*` fields | `theme` | Ignored |
| `navigation.tab_id` | `navigation[].target` | Empty |
| `portfolio_projects.name` | `portfolio[].title` | Empty |
| `portfolio_projects.link` | `portfolio[].destination` | Not mapped through the primary schema name |
| `portfolio_projects.featured_home` | `portfolio[].featured` | Ignored; defaults to `true` |
| status fields | normalized status | Omitted |

The fallback brand happens to be `Web1`, which masks the missing `company_name` mapping in this one project. It would fail as a reusable loader for another client.

### Consequences

- The dynamic navigation cannot reliably use the stored `tab_id` values.
- Vehicle/showcase record names may not render in the intended heading field.
- Dashboard theme changes do not fully reach the public Web1 frontend.
- Map settings do not reach the frontend.
- Featured state is not faithfully respected.

The fix is not to patch each future adapter. The fix is to use the shared `cms-contract.js` normalizer as the single source of truth.

---

## 7. Forms and SEO ownership

### Forms

Web1 form submission works and uses the approved payloads:

```javascript
// Contact
{ name, contact_info, message }

// Newsletter
{ email }
```

However, form submission is implemented inside the Web1 adapter through a generic global `insert(table, payload)` function. That duplicates public data logic at template level.

For the official standard:

- Contact and Newsletter submission should be a shared public-core service.
- The manifest should declare `managedBy: 'shared-core'`.
- The adapter should supply selectors and presentation only.
- The shared API should expose purpose-specific methods, not a generic table insert method.

### SEO

Web1’s public adapter currently applies only:

- document title;
- meta description.

It does not apply the full saved SEO record:

- canonical URL;
- robots value;
- Open Graph image/metadata;
- Twitter image/metadata.

The website package also has no `robots.txt` or `sitemap.xml`.

The SEO Manager saves data, but the Web1 public frontend does not consume the complete SEO contract yet.

---

## 8. Fresh-install package status

Web1 contains a genuine installer and its copied migrations `001`, `003` through `015` are byte-identical to CUDFIRM’s corresponding migration files.

Omitting migration `002_seed.sql` was correct because Web1 supplies its own starter content.

### Missing from Web1’s installer

- `016_module_permissions_foundation.sql`

Migration `017_public_messaging_refresh.sql` must **not** be placed in a generic client core installer because it contains CUDFIRM-specific public content.

### Current documentation conflict

The Web1 package gives different installation sequences:

- Fresh-install README lists 01–04.
- Installation checklist adds 05.
- Root README mentions 06 conditionally.

A single authoritative order is required.

### Repeatability gap

The installer was assembled from proven migrations, but its own documentation correctly states that the consolidated package was not executed against a completely blank Supabase project in that environment.

The current delivery standard cannot be declared repeatable until a blank-project installation has been run and verified using the current core.

---

## 9. Web1 live security status

The project has strong isolation and RLS boundaries. One correctable security warning remains:

```text
sync_message_workflow_fields
Function Search Path Mutable
```

The function is not one of the protected intentional SECURITY DEFINER helpers. It should be corrected through a new numbered Web1 SQL file. Existing migration history must remain unchanged.

The intentional warnings for these functions remain part of the approved design:

```text
record_auth_security_event(...)
current_app_role()
has_permission(...)
record_activity_event(...)
```

---

## 10. Client content and asset handover gaps

Before Web1 is handed to the client as final production content:

- Replace the two `Sample Customer` testimonials with approved testimonials or hide them.
- Remove or clearly retain CUDFIRM test message/subscriber records according to handover policy.
- Replace placeholder contact details.
- Replace the externally generated favicon.
- Move final client images away from third-party `raw.githubusercontent.com` URLs into client-controlled storage or the delivered package.
- Confirm the static Blog/Journal content is approved, since it is not CMS-controlled.
- Record the generic Portfolio-as-vehicle-showcase limitation.

These are Web1 handover items, not blockers for the reusable core architecture.

---

## 11. Documentation drift in the main CUDFIRM project

The following files do not accurately describe the current project:

- `docs/PROJECT_CONTEXT.md` still describes the early dashboard-building phase.
- `docs/CUDFIRM_ROADMAP.md` says the next task is to begin work that is already complete.
- `docs/CHANGELOG.md` omits the template framework, Adapter 1, CUDTEMP, client-delivery playbook, and Member Accounts foundation.
- `docs/RELEASE_CHECKLIST.md` refers to migrations only through 013.
- `docs/client-delivery/03_SUPABASE_PROJECT_SETUP.md` still shows contract version `1.0.0`.
- Web1’s template README says `dataMode: "sample"`, but production configuration uses Supabase.
- Web1 calls itself “Adapter 2,” although CUDTEMP is the official Adapter 2. Web1 should be described as the first client adapter/reference delivery.

This documentation drift is directly contributing to continuity and memory confusion.

---

## 12. Member Accounts position

Member Accounts is a separate optional module stream. Its foundation and trusted operations exist, while public account pages, dashboard member-management pages, backup integration, and full end-to-end module testing remain unfinished.

It does not block ordinary brochure, portfolio, agency, fashion, restaurant, or service-business templates. It blocks only templates that require customer/member authentication or member-owned data.

Do not resume unrelated Member Accounts phases before the client-delivery core is standardized, unless the next client contract specifically requires it.

---

## 13. Required work before attaching several more client templates

### Blocker 1 — Create one canonical client public core

The main CUDFIRM project needs a reusable client-facing core package containing:

- configuration-aware Supabase bootstrap;
- shared CMS API;
- shared contract `1.1.0`;
- shared loader;
- shared Contact/Newsletter submission service;
- module runtime foundation;
- template registry/validator/runtime `1.1.0`;
- dashboard core that reads the same client configuration.

Template packages must contain presentation and adapter logic only.

### Blocker 2 — Create the canonical fresh installer

Create a generic current installer from:

```text
001_schema.sql
003_admin_write_policies.sql
004_phase3_platform.sql
005_content_status_workflow.sql
006_message_management.sql
007_subscriber_management.sql
008_backup_restore_permissions.sql
009_user_roles_permissions.sql
010_maintenance_mode.sql
011_theme_customization.sql
012_security_audit.sql
013_theme_wide_default_fix.sql
014_rls_api_security_hardening.sql
015_about_contact_content.sql
016_module_permissions_foundation.sql
```

Client content must remain a separate file. CUDFIRM migration 017 is not generic core content.

### Blocker 3 — Add client-template compatibility verification

A client package must have an automated verification covering:

- current manifest validation;
- current adapter lifecycle;
- renderer presence;
- asset/module declarations;
- no direct table query inside adapter;
- no privileged secrets/tokens;
- safe script order;
- local file references;
- form ownership declaration.

### Blocker 4 — Prove a clean installation

Run the canonical installer against a brand-new test Supabase project, then verify:

- schema;
- RLS and grants;
- Storage;
- first Super Admin;
- public reads;
- Contact/Newsletter inserts;
- dashboard roles;
- media;
- backup/restore;
- one template deployment.

### Blocker 5 — Correct project records

Update project context, roadmap, changelog, release checklist, and delivery documentation before more implementation begins.

---

## 14. Recommended implementation order

1. Update documentation to establish the verified baseline and prevent more drift.
2. Define the canonical client-core file list and configuration contract.
3. Build the configuration-aware shared Supabase/data/form layer in isolated files.
4. Build the generic fresh installer through migration 016.
5. Add a generic client-template compatibility test harness.
6. Create a protected copy of Web1 and migrate that copy to current contract/runtime `1.1.0`.
7. Test the migrated copy against the existing Web1 Supabase project without changing the live delivery.
8. Create a blank Supabase test project and run the full fresh-install workflow.
9. Apply a new Web1 corrective migration for the mutable search path only after backup and approval.
10. Use the validated standard for the next client-supplied template.

---

## 15. Files that should remain untouched during the next framework phase

```text
css/styles.css
js/script.js
```

The Web1 template’s original visual CSS/JavaScript should also remain unchanged unless a verified integration defect cannot be solved in the adapter or shared core.

---

## Final conclusion

CUDFIRM has completed the difficult proof-of-concept: Web1 shows that a client-supplied template can receive an isolated CMS, dashboard, authentication, roles, RLS, media, forms, backup, and deployment package.

The platform is now one standardization phase away from routine client-template delivery. The next work must consolidate the shared client core and fresh installer, not add more unrelated CMS features and not merge any client into the CUDFIRM production dashboard.
