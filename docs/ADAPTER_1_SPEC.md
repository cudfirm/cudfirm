# CUDFIRM Adapter 1 Specification

**Template ID:** `cudfirm-default`  
**Template version:** `1.5.0`  
**Adapter version:** `1.0.0`  
**CMS contract:** `1.1.x`  
**Shared runtime:** `1.1.0`

## Purpose

Adapter 1 converts the existing CUDFIRM public frontend into the first formal consumer of the reusable Template Integration Framework.

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Shared Template Runtime
→ CUDFIRM Default Adapter 1
→ Original CUDFIRM public markup
```

The conversion preserves the working public shell instead of rewriting it. `js/script.js` continues to generate the original tab markup and interactions, while Adapter 1 maps normalized CMS data into the declared mounts.

## Active deployment selection

`js/template-config.js` explicitly selects:

```javascript
templateId: 'cudfirm-default'
```

Changing templates must be done by selecting another explicitly registered compatible template. The shared runtime, Supabase loader, dashboard, authentication, roles, RLS, backup, audit, and security systems remain unchanged.

## Adapter-managed sections

| Section | Contract source | Mount | Renderer |
|---|---|---|---|
| Home | `hero` plus shared Portfolio/Services data | `#tab1` | `renderHome` |
| About | `about` | `#tab20` | `renderAbout` |
| Services | `services` | `#tab3` | `renderServices` |
| Portfolio | `portfolio` | `#tab4` | `renderPortfolio` |
| Testimonials | `testimonials` | `#tab9` | `renderTestimonials` |
| FAQ | `faq` | `#tab13` | `renderFaq` |
| Contact | `contact` | `#connect-content` | `renderContact` |

Adapter 1 also consumes `site.name` for template copy and accessible image descriptions, and supports the normalized About image and story-block images.

## Preserved external capabilities

The manifest intentionally leaves these systems outside the adapter:

- navigation and tab routing: `legacy-core`;
- contact and newsletter submission: `legacy-core`;
- SEO application: `legacy-core`;
- theme application: `shared-core`;
- maintenance mode: shared CUDFIRM core.

This is an ownership boundary, not duplicated template logic.

## Lifecycle

Adapter 1 implements:

```text
initialize
beforeRender
afterRender
complete
onError
```

These hooks expose non-privileged diagnostics through DOM data attributes and `CUDFIRMDefaultAdapter.getState()`. `onError` records errors passed to it by the shared runtime. The hooks do not query or mutate the database.

## Fallback rules

- Empty CMS lists preserve the original fallback markup.
- Missing optional values preserve existing copy where possible.
- Explicit visibility settings may hide Contact methods.
- A failed renderer is isolated by the shared runtime.
- Adapter 1 never disables RLS or bypasses Storage/database policies.

## Protected-file boundary

The Adapter 1 conversion does not rewrite or refactor:

```text
js/script.js
css/styles.css
```

The original shell remains stable. Template-specific mapping stays inside `templates/cudfirm-default/`, while active template selection is isolated in `js/template-config.js`.
