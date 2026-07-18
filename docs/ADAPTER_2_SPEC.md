# CUDFIRM Adapter 2 — CUDTEMP

Version: 1.0.0

CUDTEMP proves that the CUDFIRM CMS core can power a second, materially different public frontend without duplicating protected systems.

## Architecture

CUDFIRM CMS Core → CMS Data Contract 1.1.0 → Shared Template Runtime 1.1.0 → CUDTEMP Adapter 2

## Preserved systems

CUDTEMP consumes the existing public CMS contract. It does not replace or duplicate authentication, dashboard CRUD, role enforcement, PostgreSQL RLS, Storage policies, Supabase data access, backup and restore, security auditing, activity logging, or extension-module logic.

## Template identity

The public and framework identity is `CUDTEMP`. The isolated stylesheet and interaction script are `cudtemp.css` and `cudtemp.js`. Source attribution is retained privately in `templates/cudtemp/LICENSE-NOTICE.md`.

## Structural preservation

The adapter keeps the original template's:

- 3 feature rows
- 4 statistics cards
- 3 delivery cards
- 5 testimonial cards
- 16 platform tiles
- 6 FAQ items
- 5 carousel images

Fixed fallback copy is rewritten to describe verified CUDFIRM capabilities. Runtime CMS content is allowed to vary naturally while the layout structure remains fixed.

## Entry point and activation

`cudtemp.html` loads `templates/cudtemp/template.config.js`, which selects `templateId: "cudtemp"` for that page only. Adapter 1 remains the active template on `index.html`.
