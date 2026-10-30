# CUDFIRM Business Launch Baseline

## Decision

CUDFIRM is ready to enter normal business delivery for ordinary business, agency, portfolio, brochure and service websites.

Months of framework work have produced a repeatable delivery system rather than one fixed website.

## What can be sold now

- Business websites
- Agency websites
- Service websites
- Portfolio websites
- Brochure websites
- Lead-generation landing pages
- Client-supplied template integration
- CUDFIRM template deployment
- CMS dashboard setup
- Content, media and SEO management
- Contact and newsletter capture
- Roles, backup, security and audit tools
- Ongoing support and content maintenance

## What is not included by default

The following require separate scope, price and verification:

- Customer/member accounts
- Payments
- Booking systems
- E-commerce checkout
- Private customer data areas
- Automobile-specific inventory systems
- Property-specific inventory systems
- Product variants and stock
- Complex blog/news publishing workflows
- New custom CMS modules

Do not promise unfinished Member Accounts work as part of the standard package.

## Standard sale-to-delivery flow

```text
Lead
→ Scope and content collection
→ Template choice
→ Separate Supabase project
→ Template adapter/configuration
→ Automated verification
→ Temporary deployment
→ Production deployment
→ Client training and handover
→ Support plan
```

## Required technical boundaries

- Each client gets an independent Supabase project.
- Each client gets an independent Netlify site.
- Each client dashboard connects only to that client's project.
- Client templates consume the shared contract and runtime.
- Browser code contains no secret or service-role key.
- RLS remains enabled.
- Existing migrations are never rewritten.

## Current proof

Web1 demonstrates the complete model:

- independent client Supabase project;
- independent website and dashboard;
- protected framework migration to 1.1.0;
- 40 delivery checks with 0 errors;
- browser verification of navigation and hero slider;
- successful production frontend replacement;
- anonymous dashboard-route protection.

## Controlled limitation

The canonical fresh installer has not yet been executed against a brand-new empty Supabase project because the current Free organisation has reached its project limit and Docker is unavailable.

This does not require further months of pre-business development. The first suitable new client setup must complete this test under a controlled process before that client's launch.

## Operating rule

From this baseline onward:

- build only for a real client need;
- fix only verified bugs or security issues;
- avoid unrelated redesigns;
- use the playbook and verifier for every delivery;
- record lessons after delivery;
- charge separately for enhancements outside the standard package.
