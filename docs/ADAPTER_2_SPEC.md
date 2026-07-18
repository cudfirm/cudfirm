# CUDFIRM Adapter 2 Specification

**Template ID:** `web1`  
**Template version:** `1.1.0`  
**Adapter version:** `1.0.0`  
**CMS contract:** `1.1.x`  
**Shared runtime:** `1.1.0`

## Purpose

Adapter 2 proves that a structurally different automobile template can consume the same CUDFIRM CMS core without copying dashboard, Supabase, authentication, role, RLS, backup, audit, or security logic.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Shared Template Runtime
→ Web1 Adapter 2
→ Web1 markup
```

## Entry point

`web1.html` is the isolated Adapter 2 preview host. The existing `index.html` remains Adapter 1.

The preview host loads the same shared core files as Adapter 1, then registers `web1` and selects it through `templates/web1/template.config.js`.

## Ownership boundaries

### Adapter-managed

- Navigation mapping to Web1 anchors
- Hero and carousel markup
- About and facts
- Portfolio-as-showcase cards
- Services
- Testimonials
- CTA and Contact copy
- Footer
- SEO tags
- Web1 CSS-variable mapping

### Shared-core managed

- Supabase connection
- Public CMS queries
- Contract normalization
- Contact and Newsletter inserts
- Extension modules
- Maintenance mode
- Dashboard and permissions
- RLS and Storage security
- Backup, audit, and activity systems

## Shared public submissions

`js/public-submissions.js` is a template-neutral bridge. Templates declare form selectors in their manifest and the bridge performs only the anonymous inserts already permitted by RLS:

- `messages`
- `subscribers`

It does not contain service-role credentials and cannot read private Messages or Subscribers data.

## Source-package handling

The uploaded Web1 delivery package was used only as a visual and template-asset source. The following old delivery components are intentionally not copied:

- duplicated dashboard files;
- duplicated template runtime and validator;
- old Contract/Manifest `1.0.0` files;
- old fresh-install migrations;
- client-specific Supabase configuration;
- sample-data runtime.

## Protected files

Adapter 2 does not change or load:

```text
js/script.js
css/styles.css
```

Web1-specific behavior stays inside `templates/web1/`.
