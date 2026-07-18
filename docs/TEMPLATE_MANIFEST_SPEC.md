# CUDFIRM Template Manifest Specification

**Manifest schema version:** `1.1.0`  
**Compatible CMS contract family:** `1.x`  
**Purpose:** Let any CUDFIRM-compatible template declare what it supports and how the shared core should connect CMS data to its markup.

## 1. Architecture boundary

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Manifest
→ Shared Template Runtime
→ Template Adapter
→ Template Markup
```

The manifest is declarative. It describes a template; it does not query Supabase, render HTML, authenticate users, submit forms, or implement dashboard permissions.

Template-specific code must not duplicate authentication, CRUD, roles, RLS, backup, security, Supabase data access, or audit logic.

## 2. Required top-level fields

```javascript
{
  schemaVersion,
  template,
  compatibility,
  modules,
  assets,
  sections,
  routes,
  forms,
  features,
  seo,
  theme,
  fallbacks,
  notes
}
```

The first six fields are required for every compatible template. The remaining capability blocks are required when the template uses those capabilities.

## 3. Identity

```javascript
template: {
  id: 'example-template',
  name: 'Example Template',
  version: '1.0.0',
  author: 'Template Author',
  description: 'Purpose of the template.',
  category: 'agency'
}
```

Rules:

- `id` uses lowercase letters, numbers, and hyphens only.
- `version` uses semantic versioning.
- The registration ID must exactly match `template.id`.
- A template version changes when its manifest, adapter behavior, markup requirements, or assets change.

## 4. Core and contract compatibility

```javascript
compatibility: {
  minimumContractVersion: '1.1.0',
  maximumContractVersion: '1.x',
  requiredCoreVersion: '2.0.0',
  supportedLocales: ['en-NG'],
  requiresJavaScript: true,
  notes: []
}
```

`notes` records limitations, legacy dependencies, browser assumptions, mount timing, or other integration constraints.

## 5. Extension-module requirements

```javascript
modules: {
  required: [],
  optional: ['member-accounts']
}
```

A required module makes the template incompatible when absent. An optional module may enhance the template but must not prevent base rendering.

## 6. Asset requirements

```javascript
assets: {
  required: [
    {
      id: 'template-adapter',
      type: 'script',
      source: 'templates/example/template.adapter.js',
      managedBy: 'template',
      loadOrder: 30,
      notes: 'Maps contract data into template markup.'
    }
  ],
  optional: [],
  notes: []
}
```

### Asset fields

| Field | Required | Meaning |
|---|---:|---|
| `id` | Yes | Unique asset identifier within the manifest |
| `type` | Yes | `stylesheet`, `script`, `font`, `image`, `external-library`, or `other` |
| `source` | Yes | Local path or external URL |
| `managedBy` | Yes | `template`, `host`, `legacy-core`, or `shared-core` |
| `loadOrder` | No | Non-negative relative order hint |
| `notes` | No | Compatibility or loading detail |

Schema `1.1.0` validates and reports asset declarations. It does not automatically inject, remove, or reorder assets. Asset loading remains the host page's responsibility until the shared runtime explicitly adds that feature.

## 7. Sections

Each supported CMS section has one entry under `sections`.

### Adapter-managed object section

```javascript
about: {
  enabled: true,
  required: false,
  managedBy: 'adapter',
  source: 'about',
  mount: '#about',
  renderer: 'renderAbout',
  requiredFields: ['title'],
  optionalFields: ['introduction', 'values'],
  emptyState: 'hide-section',
  compatibilityNotes: []
}
```

### Adapter-managed list section

```javascript
services: {
  enabled: true,
  required: false,
  managedBy: 'adapter',
  source: 'services',
  mount: '#services',
  renderer: 'renderServices',
  itemRequiredFields: ['title', 'description'],
  itemOptionalFields: ['priceText', 'iconUrl'],
  emptyState: 'hide-section'
}
```

### Core-managed section

```javascript
navigation: {
  enabled: true,
  required: true,
  managedBy: 'shared-core',
  source: 'navigation',
  itemRequiredFields: ['label', 'target'],
  itemOptionalFields: ['location', 'badge'],
  compatibilityNotes: []
}
```

### Section rules

- `enabled` and `required` must be explicit booleans.
- `source` is a top-level path in the normalized CMS contract.
- `managedBy` is `adapter`, `legacy-core`, or `shared-core`; omitted means `adapter` for backward compatibility.
- Adapter-managed sections must declare both `mount` and `renderer`.
- Object sections declare `requiredFields` and `optionalFields`.
- List sections declare `itemRequiredFields` and `itemOptionalFields`.
- A renderer receives normalized contract data and must not query Supabase directly.

## 8. Routes

```javascript
routes: {
  mode: 'multi-page',
  pages: {
    home: { target: '/', section: 'home', seoPageKey: 'home' }
  }
}
```

Supported modes:

- `single-page`
- `single-page-tabs`
- `multi-page`
- `hybrid`

A route maps a template destination to a section and SEO page key. The adapter may translate stable navigation targets into template-specific URLs or selectors.

## 9. Forms

```javascript
forms: {
  contact: {
    managedBy: 'shared-core',
    formSelector: '#contact-form',
    fields: {
      name: '[name="name"]',
      contact: '[name="contact"]',
      message: '[name="message"]'
    }
  }
}
```

The manifest declares selectors and ownership. It must not reimplement secure form submission or expose private tables.

## 10. SEO and theme capabilities

`seo` declares page resolution and supported normalized SEO fields.

`theme` declares the template's mapping from normalized theme values to template CSS variables. Custom CSS remains controlled by the shared CUDFIRM theme system.

## 11. Fallback policy

```javascript
fallbacks: {
  missingRequiredSection: 'error',
  missingOptionalSection: 'ignore',
  missingRequiredField: 'warn-and-hide',
  missingOptionalField: 'ignore',
  missingImage: 'use-placeholder',
  emptyList: 'hide-section',
  rendererFailure: 'show-safe-error'
}
```

Fallbacks must use values supported by `js/template-validator.js`. They define compatibility behavior; they do not weaken security or data-access rules.

## 12. Registration contract

A template registration file connects one manifest and one adapter to the shared registry:

```javascript
window.CUDFIRMTemplateRegistry.register('example-template', {
  manifest: window.ExampleTemplateManifest,
  adapter: window.ExampleTemplateAdapter,
  metadata: {
    source: 'local',
    entry: 'templates/example-template/template.registration.js'
  }
});
```

Only explicitly registered templates may be activated.

## 13. Versioning

- **Patch:** documentation or validation fix that does not change the manifest shape.
- **Minor:** backward-compatible fields or capability declarations.
- **Major:** removed or renamed fields, changed ownership semantics, or incompatible section structure.

Template versions and manifest schema versions are independent. A template can release a new version while remaining on the same manifest schema.

## 14. Security invariants

A template manifest or adapter must never:

- disable or bypass RLS;
- expose Messages, Subscribers, User Profiles, Activity Log, or Security Events publicly;
- embed service-role or server-only secrets;
- implement authorization only by hiding buttons;
- duplicate dashboard roles, backup, audit, or Supabase access logic;
- alter protected security-definer functions.
