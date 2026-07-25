# CUDFIRM Client Delivery Playbook

This folder is the authoritative process for delivering a client website with CUDFIRM.

It applies to CUDFIRM-made templates and client-supplied HTML/CSS/JavaScript templates.

## Permanent architecture rule

Every client receives an isolated installation:

```text
CUDFIRM reusable CMS core
→ client template adapter
→ client website deployment
→ client Supabase project
→ client dashboard and users
```

A client must never share CUDFIRM production data or another client's data.

### One client normally means

- one Supabase project;
- one public website deployment;
- one dashboard connected to that project;
- one client-specific configuration;
- one media store and data set;
- one backup and handover record.

## Use these documents in order

1. [`01_CLIENT_ONBOARDING_CHECKLIST.md`](01_CLIENT_ONBOARDING_CHECKLIST.md)
2. [`02_TEMPLATE_INTEGRATION_CHECKLIST.md`](02_TEMPLATE_INTEGRATION_CHECKLIST.md)
3. [`03_SUPABASE_PROJECT_SETUP.md`](03_SUPABASE_PROJECT_SETUP.md)
4. [`04_CLIENT_DASHBOARD_SETUP.md`](04_CLIENT_DASHBOARD_SETUP.md)
5. [`05_NETLIFY_DEPLOYMENT_GUIDE.md`](05_NETLIFY_DEPLOYMENT_GUIDE.md)
6. [`06_CLIENT_HANDOVER_CHECKLIST.md`](06_CLIENT_HANDOVER_CHECKLIST.md)
7. [`07_POST_DELIVERY_SUPPORT.md`](07_POST_DELIVERY_SUPPORT.md)
8. [`08_DELIVERY_CLOSEOUT_CHECKLIST.md`](08_DELIVERY_CLOSEOUT_CHECKLIST.md)

## Standard delivery stages

| Stage | Required evidence |
|---|---|
| Onboarding | Approved brand, content, ownership and scope |
| Template audit | Completed section/field mapping |
| Supabase setup | Installer and verification results |
| Dashboard setup | Client admin signs in and edits only the client project |
| Package verification | Automated verifier passes with 0 errors |
| Temporary deployment | Browser-only selectors and layout verified |
| Production deployment | Correct project is Published/Ready |
| Handover | Backup, package, access, training and acceptance recorded |
| Support | Scope, response path and change log recorded |

## Automated package check

From the client delivery folder, run:

```powershell
node ..\cudfirm\tools\verify-client-delivery.js .
```

Expected:

```text
CUDFIRM client delivery verification PASSED.
Errors: 0
```

Warnings that require a browser must be verified on the temporary deployment. Unexpected errors block deployment.

## Non-negotiable security rules

- RLS remains enabled.
- Browser code uses only the client's Publishable or legacy `anon` key.
- Never expose `service_role`, `sb_secret_*` or server-side credentials.
- Never connect a client deployment to CUDFIRM production credentials.
- Never rewrite migration history after it has run.
- Client users normally access their website dashboard, not the CUDFIRM production dashboard.

## Protected CUDFIRM files

```text
js/script.js
css/styles.css
```

Prefer isolated adapter, runtime and override files. Modify protected files only after inspection, with a minimal verified change.

## Definition of complete

A client delivery is complete only when:

- the public website and dashboard use the same client Supabase project;
- a client administrator can edit content and see it publicly;
- Contact and Newsletter submissions reach the client's tables;
- RLS and Storage policies are verified;
- media upload and backup download work;
- the automated delivery verifier reports 0 errors;
- production and anonymous dashboard routes are verified;
- no CUDFIRM production credentials or data are present;
- the final package, backup, deployment and handover are recorded;
- the client accepts the delivery.

## Current installer note

The canonical fresh installer has passed structural verification. A real empty-project execution is pending because no spare Free Supabase project or local Docker environment is available.

The first suitable new client installation must complete and record that controlled test before launch.
