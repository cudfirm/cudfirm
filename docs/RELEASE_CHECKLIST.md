# CUDFIRM Release and Client-Delivery Checklist

## Before any release

- [ ] Confirm the exact repository, branch and Supabase project
- [ ] Back up project files
- [ ] Download a fresh JSON CMS backup
- [ ] Confirm the working tree contains only intended changes
- [ ] Confirm no private or service-role key is present in browser files

## CUDFIRM core checks

- [ ] Confirm migrations 001–017 are recorded in order for CUDFIRM production
- [ ] Do not include migration 017 in generic client installations
- [ ] Run JavaScript syntax checks
- [ ] Run CMS contract verification
- [ ] Run Adapter 1 verification
- [ ] Run Adapter 2 verification
- [ ] Run Template Manifest verification
- [ ] Run Template Runtime verification
- [ ] Check local HTML, CSS, JavaScript and image references

## Public website checks

- [ ] Verify published Hero, About, Services, Portfolio, Testimonials, FAQ and Navigation
- [ ] Verify Contact content, Site Settings and SEO
- [ ] Test Contact submission
- [ ] Test Newsletter subscription
- [ ] Test intended public media loading
- [ ] Check mobile, tablet and desktop layouts
- [ ] Check the browser console for errors

## Dashboard checks

- [ ] Verify Super Admin access
- [ ] Verify Viewer, Editor and Admin restrictions
- [ ] Test content CRUD and workflow
- [ ] Test search, filters, pagination, bulk actions and ordering
- [ ] Test Messages and Subscribers
- [ ] Test Media, SEO, Analytics and Site Health
- [ ] Test a small Backup and Restore operation
- [ ] Test Maintenance Mode and authorised bypass
- [ ] Review Activity Log and Security Events

## Security checks

- [ ] Confirm RLS remains enabled on application tables
- [ ] Confirm anonymous users cannot read private operational tables
- [ ] Confirm public insert policies expose only intended Contact and Newsletter operations
- [ ] Review Supabase Security Advisor warnings
- [ ] Preserve intentional `SECURITY DEFINER` functions unless a redesign is approved
- [ ] Add corrective migrations for newly discovered non-intentional warnings

## Client delivery checks

- [ ] Confirm the client uses an independent Supabase project
- [ ] Confirm the client dashboard connects only to that client project
- [ ] Validate the template manifest against the current schema
- [ ] Confirm module and asset declarations
- [ ] Confirm public form ownership is declared
- [ ] Confirm the template does not duplicate authentication, roles, RLS, backup or shared data logic
- [ ] Run the canonical fresh installer on an empty test project
- [ ] Run verification SQL
- [ ] Promote the first authorised administrator safely
- [ ] Verify Storage policies and media upload
- [ ] Deploy the client frontend independently
- [ ] Verify anonymous dashboard-route protection
- [ ] Complete handover documentation

## Deployment checks

- [ ] Push only the approved commit
- [ ] Confirm the hosting deployment succeeded
- [ ] Hard-refresh the production site
- [ ] Verify the public site and dashboard routes
- [ ] Record the release commit and deployment result

## Current known limitation

The canonical reusable fresh installer through migration 016 still requires final assembly and empty-project verification. Web1 has a working client-specific installer, but it must not yet be treated as the universal current installer.
