# CUDFIRM Release and Client-Delivery Checklist

## Before any release

- [ ] Confirm the exact repository, branch, client and Supabase project
- [ ] Back up project files
- [ ] Download a fresh client JSON backup when data already exists
- [ ] Confirm the working tree contains only intended changes
- [ ] Confirm no private, secret or service-role key is present in browser files

## CUDFIRM core checks

- [ ] Run JavaScript syntax checks
- [ ] Run CMS contract verification
- [ ] Run Adapter 1 verification
- [ ] Run Adapter 2 verification
- [ ] Run Template Manifest verification
- [ ] Run Template Runtime verification
- [ ] Run Shared Client Core verification
- [ ] Run Fresh Installer structural verification
- [ ] Run Client Delivery verification tests
- [ ] Check local HTML, CSS, JavaScript and image references

## Client package verification

From the client delivery folder, run:

```powershell
node ..\cudfirm\tools\verify-client-delivery.js .
```

Expected:

```text
CUDFIRM client delivery verification PASSED.
Errors: 0
```

Document browser-only selector warnings and verify them on the temporary deployment.

## Public website checks

- [ ] Verify published Hero, About, Services, Portfolio, Testimonials, FAQ and Navigation
- [ ] Verify Contact Content, Site Settings and SEO
- [ ] Test Contact submission once for a new delivery
- [ ] Test Newsletter subscription once for a new delivery
- [ ] Test intended public media loading
- [ ] Check mobile, tablet and desktop layouts
- [ ] Check the browser console for unexpected errors

Do not repeat completed tests during routine documentation-only or frontend-only updates unless the affected code requires them.

## Dashboard checks

- [ ] Verify anonymous `/dashboard/` access shows only the login page
- [ ] Verify the authorised client administrator can sign in
- [ ] Verify Viewer, Editor, Admin and Super Admin restrictions when those roles are issued
- [ ] Test one reversible public content edit
- [ ] Verify Messages, Subscribers, Media and Backup
- [ ] Review Activity Log and Security Events

## Security checks

- [ ] Confirm RLS remains enabled on application tables
- [ ] Confirm anonymous users cannot read private operational tables
- [ ] Confirm public insert policies expose only intended Contact and Newsletter operations
- [ ] Review Supabase Security Advisor warnings
- [ ] Preserve intentional `SECURITY DEFINER` functions unless a redesign is approved
- [ ] Add corrective migrations for newly discovered non-intentional warnings

## Fresh client Supabase setup

- [ ] Confirm the project is new and empty before using the canonical installer
- [ ] Create the first Auth user
- [ ] Run `01_cudfirm_core_fresh_install.sql` once
- [ ] Run the completed client starter-content SQL once
- [ ] Run `03_verify_fresh_install.sql`
- [ ] Run `04_promote_first_admin_if_needed.sql` only when required
- [ ] Verify RLS, Storage, public reads, public form inserts and backup

The first suitable new client installation also completes the pending real empty-project execution test. Stop the launch if verification produces an unexpected failure.

## Deployment checks

- [ ] Deploy only the folder that directly contains `index.html`
- [ ] Confirm the correct Netlify project name before uploading
- [ ] Confirm the deployment status is Published/Ready
- [ ] Hard-refresh the production site
- [ ] Verify the public homepage and anonymous dashboard route
- [ ] Record the deployment ID/date
- [ ] Keep the previous Netlify deployment available for rollback

## Handover checks

- [ ] Create the final delivery ZIP
- [ ] Download the final client JSON backup
- [ ] Deliver the dashboard URL and approved access details securely
- [ ] Demonstrate one content edit and backup download
- [ ] Record known limitations
- [ ] Obtain client acceptance
- [ ] Record support scope and dates

## Current known limitation

The canonical reusable installer through migration 016 has passed structural verification but has not yet been executed against a completely empty Supabase project. The test is blocked by the current Free-project limit and absence of Docker, not by a known installer failure.

Member Accounts public pages and dashboard management are incomplete and must not be included in ordinary client scope unless separately completed and verified.
