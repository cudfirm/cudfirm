# CUDFIRM Client Delivery Verification Specification

## Purpose

The client-delivery verifier checks a prepared client website package before deployment or handover. It is a local, read-only verification tool. It does not connect to Supabase, modify files, submit forms, deploy a site, or alter a dashboard.

The verifier protects the CUDFIRM delivery model:

```text
CUDFIRM shared core
→ current CMS contract and runtime
→ client template adapter
→ independent client Supabase project
→ independent client dashboard and deployment
```

## Required descriptor

Every client delivery root must contain:

```text
client-delivery.json
```

Copy `config/client-delivery.example.json` to the client delivery root, rename it to `client-delivery.json`, and replace every placeholder.

The descriptor declares:

- Client ID and name
- Core, contract and runtime versions
- Template ID and manifest global
- Independent Supabase project reference
- Entry page and dashboard login page
- Client configuration file
- Template manifest and adapter
- Canonical fresh installer and verification SQL
- Additional files that must exist

## Run the verifier

From the CUDFIRM repository:

```powershell
node tools/verify-client-delivery.js "C:\path\to\client-delivery"
```

A successful package ends with:

```text
CUDFIRM client delivery verification PASSED.
Errors: 0
```

Warnings require review but do not automatically fail the package. Any error blocks delivery.

## Verification rules

The verifier checks:

1. `client-delivery.json` uses schema `1.0.0`.
2. The delivery is explicitly marked as a client deployment.
3. Core `2.0.0`, CMS contract `1.1.0`, and runtime `1.1.0` are declared.
4. Every required file exists inside the delivery root.
5. The public site and dashboard load the client configuration before `js/supabase.js`.
6. The client configuration points to the declared client Supabase project.
7. The client project is not `CUDFIRM_DATABASE` or another forbidden project.
8. Browser files do not contain `service_role` or `sb_secret_*` credentials.
9. The template manifest declares modules, assets, sections, compatibility and form ownership.
10. Template-owned local assets exist.
11. Adapter-managed mounts are present when they use simple ID, class or tag selectors.
12. Declared renderer names appear in the adapter source.
13. The adapter does not create a Supabase client or query database tables directly.
14. Local `src` and `href` references from the public entry page and dashboard login page exist.
15. The canonical installer and its read-only verification SQL are included.

## Important limitations

This verifier does not replace:

- Running the canonical installer against an empty Supabase project
- PostgreSQL RLS and Storage policy review
- Browser rendering checks
- Authenticated role testing
- Contact and newsletter submission testing
- Backup and restore testing
- Final deployment and handover checks

Complex CSS selectors are reported as warnings because a static Node verifier cannot reliably prove them without a browser.

## Security rule

Do not weaken or remove a failing rule simply to make a package pass. Correct the delivery package, configuration, manifest, adapter or missing files instead.
