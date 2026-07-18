# Web1 — CUDFIRM Adapter 2

**Template ID:** `web1`  
**Template version:** `1.1.0`  
**Adapter version:** `1.0.0`  
**CMS contract:** `1.1.x`  
**Shared runtime:** `1.1.0`

Web1 is the second formal template connected to the reusable CUDFIRM CMS core.

## Preview entry

Serve the CUDFIRM project over HTTP and open:

```text
/web1.html
```

The regular `/index.html` remains Adapter 1. Web1 does not replace the main CUDFIRM deployment during framework verification.

## Shared systems reused

Web1 consumes the existing shared CMS loader, normalized data contract, template registry, validator, runtime, module runtime, Supabase client, theme manager, maintenance mode, dashboard, roles, RLS, backup, audit, and security controls.

Contact and Newsletter forms are declared as `shared-core` and use `js/public-submissions.js`. The Web1 adapter does not query Supabase directly.

## Contract mapping

- Navigation → `navigation`
- Hero copy → `hero`
- Hero carousel → `portfolio`
- About → `about`
- Counters → `about.facts`
- Vehicle/showcase grid → `portfolio`
- Services → `services`
- Testimonials → `testimonials`
- CTA and Contact → `contact`
- Footer → `site`
- SEO → `seo.pages.home`
- Theme → `theme`

## Compatibility notes

- Portfolio remains the generic showcase source; the CMS core does not gain automotive-only database fields.
- The Blog section remains static in Adapter 2.
- Web1-specific CSS and interaction code remain isolated in `templates/web1/`.
- `js/script.js` and `css/styles.css` are not used or modified by Web1.
