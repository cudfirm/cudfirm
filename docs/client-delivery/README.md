# CUDFIRM Client Delivery Playbook

This folder defines the repeatable process for delivering a client website with the CUDFIRM CMS platform.

The process is template-agnostic. It applies to CUDFIRM-made templates and client-supplied HTML/CSS/JavaScript templates.

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

### One client means

- one Supabase project;
- one public website deployment;
- one dashboard connected to that project;
- one client-specific configuration;
- one media bucket and data set;
- one backup and handover record.

Client projects may be managed under the CUDFIRM Supabase organization, but each project remains independent.

## Required documents

Use these files in order:

1. [`01_CLIENT_ONBOARDING_CHECKLIST.md`](01_CLIENT_ONBOARDING_CHECKLIST.md)
2. [`02_TEMPLATE_INTEGRATION_CHECKLIST.md`](02_TEMPLATE_INTEGRATION_CHECKLIST.md)
3. [`03_SUPABASE_PROJECT_SETUP.md`](03_SUPABASE_PROJECT_SETUP.md)
4. [`04_CLIENT_DASHBOARD_SETUP.md`](04_CLIENT_DASHBOARD_SETUP.md)
5. [`05_NETLIFY_DEPLOYMENT_GUIDE.md`](05_NETLIFY_DEPLOYMENT_GUIDE.md)
6. [`06_CLIENT_HANDOVER_CHECKLIST.md`](06_CLIENT_HANDOVER_CHECKLIST.md)
7. [`07_POST_DELIVERY_SUPPORT.md`](07_POST_DELIVERY_SUPPORT.md)

## Delivery stages

| Stage | Completion evidence |
|---|---|
| Client onboarding | Approved content, branding, features and ownership details |
| Template audit | Completed mapping between CMS contract and template sections |
| Supabase setup | Fresh-install verification passed with RLS enabled |
| Dashboard setup | Client admin can sign in and edit only the client project |
| Local verification | Public site, forms, images and dashboard tested locally |
| Deployment | Production site and dashboard load from the client project |
| Handover | Backup, credentials record, guide and acceptance completed |
| Support | Support scope, update process and incident path documented |

## Non-negotiable security rules

- RLS must remain enabled.
- Never use a `service_role` or secret key in browser code.
- Frontend code may use only the client project's Publishable key or legacy `anon` key.
- Do not connect a client deployment to CUDFIRM production credentials.
- Do not add a client to the CUDFIRM Supabase organization unless project access has been deliberately reviewed.
- Client users should normally access only their website dashboard.
- Never rewrite migration history after it has been run.
- Keep recovery SQL files, but run them only when their documented condition applies.

## Protected CUDFIRM files

When adapting the CUDFIRM default template, treat these files as high risk:

```text
js/script.js
css/styles.css
```

Prefer isolated adapter, runtime and override files. Modify protected files only after inspection, with a minimal verified change.

## Naming standard

Record three names before work begins:

| Name | Example | Rule |
|---|---|---|
| Public brand name | `Web1` | Exact text shown to visitors |
| Stable template ID | `web1` | Lowercase, no spaces, do not change after launch |
| Delivery folder | `web1-client-delivery` | Clear client-specific package name |

The public brand name, browser title, header, footer, dashboard title, SEO data, Site Settings and starter SQL must all agree.

## Definition of complete

A client delivery is complete only when:

- the public website reads the client's Supabase project;
- the dashboard reads the same client project;
- a client admin can edit content and see it publicly;
- Contact and Newsletter submissions reach the client's tables;
- RLS and Storage policies are verified;
- media upload and backup download work;
- no CUDFIRM production credentials or data are present;
- the final deploy folder and handover package are recorded.
