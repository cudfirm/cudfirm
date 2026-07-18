# CUDTEMP — Adapter 2

CUDTEMP is a CUDFIRM-owned reusable landing-page template connected to the shared CMS core.

## Entry point

`cudtemp.html`

## Isolated assets

- `css/cudtemp.css`
- `js/cudtemp.js`
- `images/cudtemp-screen-01.webp` through `05.webp`
- `template.config.js`
- `template.manifest.js`
- `template.adapter.js`
- `template.registration.js`

CUDTEMP does not duplicate dashboard CRUD, authentication, Supabase table queries, RLS, roles, backup, security, or Member Accounts logic.

The fixed fallback page preserves the source template's section, feature-row, delivery-card, testimonial-card, capability-tile, FAQ-item, and image counts. CMS-managed text may naturally vary in length after rendering.
