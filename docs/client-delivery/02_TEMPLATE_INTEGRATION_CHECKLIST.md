# 02 — Template Integration Checklist

Use this checklist to connect a template to the CUDFIRM CMS contract without duplicating the CMS core.

## 1. Work from complete source files

Before changing code:

- [ ] Obtain the latest complete template ZIP.
- [ ] Obtain the latest verified CUDFIRM core/dashboard source.
- [ ] Keep an untouched copy of both ZIP files.
- [ ] Extract into separate folders.
- [ ] Ignore non-project folders such as `__MACOSX`.

Do not overwrite the CUDFIRM production website with a client template.

## 2. Audit the template structure

Inspect:

```text
index.html
CSS files
JavaScript files
asset folders
forms
section IDs/classes
dynamic widgets
third-party dependencies
```

Record every visible section and selector:

| Template section | Selector/mount | CMS source | CMS-controlled? | Notes |
|---|---|---|---|---|
| Hero |  | `hero` | Yes/No |  |
| About |  | `about` | Yes/No |  |
| Services |  | `services` | Yes/No |  |
| Showcase |  | `portfolio` | Yes/No |  |
| Testimonials |  | `testimonials` | Yes/No |  |
| FAQ |  | `faq` | Yes/No |  |
| Contact |  | `contact` + `site` | Yes/No |  |
| Footer |  | `site` | Yes/No |  |

## 3. Audit template-specific data gaps

Compare the template's expected fields with the stable CMS contract.

Examples of legitimate gaps:

- automobile year, mileage, engine and transmission;
- property bedrooms and bathrooms;
- event date and venue;
- product variants and stock.

For each gap, decide one:

- [ ] Map safely to an existing generic field.
- [ ] Preserve the section as static.
- [ ] Hide the unsupported part.
- [ ] Design an optional vertical module later.

Do not invent values. Do not add unrelated database features just to make one template look complete.

## 4. Create the template package

Recommended structure:

```text
templates/
└── <template-id>/
    ├── template.manifest.js
    ├── template.adapter.js
    ├── template.registration.js
    ├── README.md
    ├── css/
    │   ├── styles.css
    │   └── theme-overrides.css
    ├── js/
    │   └── script.js
    └── assets/
```

Keep client-template files isolated. Do not merge its `styles.css` or `script.js` into the CUDFIRM default template files.

## 5. Define stable identity

Set:

```javascript
template: {
  id: "<stable-template-id>",
  name: "<Public Template Name>",
  version: "1.0.0"
}
```

Rules:

- lowercase stable ID;
- no spaces;
- use only letters, numbers and hyphens where needed;
- do not rename after production unless every path and reference is migrated and tested.

## 6. Define the manifest

The manifest must declare:

- [ ] Template ID and version
- [ ] Manifest schema version
- [ ] Supported CMS contract range
- [ ] Required CUDFIRM core version
- [ ] Supported sections
- [ ] Required and optional fields
- [ ] Mount selectors
- [ ] Renderer names
- [ ] Route/page mode
- [ ] Form selectors
- [ ] SEO capability
- [ ] Theme variable map
- [ ] Asset requirements
- [ ] Fallback behavior
- [ ] Compatibility notes and warnings

The manifest contains configuration. It must not query Supabase.

## 7. Build the adapter

The adapter may:

- create or update template-specific DOM markup;
- map normalized contract fields into the template;
- hide empty optional elements;
- initialize carousels, tabs, lightboxes or animations;
- preserve template-specific layout.

The adapter must not:

- query Supabase directly;
- contain authentication logic;
- implement roles or RLS;
- access private dashboard tables;
- duplicate Contact or Newsletter database logic;
- include a secret key.

## 8. Handle forms safely

### Contact

The approved public payload is based on the current schema:

```javascript
{
  name,
  contact_info,
  message
}
```

A template may display a Subject field, but Subject should be merged into `message` unless the shared schema intentionally changes.

Never allow the template to submit workflow fields such as:

```text
status
is_read
is_archived
assigned_to
```

### Newsletter

Submit only:

```javascript
{
  email
}
```

## 9. Preserve static sections deliberately

Not every template section must become CMS-controlled immediately.

For each static section, document:

```text
Section:
Why it remains static:
Whether it is hidden or visible:
Future CMS plan, if any:
```

Static placeholder content must not contradict the approved client brand or business information.

## 10. Align branding in both code and database

Search template files for the old placeholder brand:

```text
old brand name
old title
old footer copyright
old template name
old folder/template ID
```

Then align database fields such as:

```text
site_settings
hero
about_content
contact_content
seo_meta
navigation
```

Changing files alone is insufficient when Supabase content overrides them.

## 11. Test in sample mode first

Before using client credentials:

- [ ] Public page loads locally.
- [ ] All required mounts exist.
- [ ] Compatibility report is available.
- [ ] Required renderers exist.
- [ ] Expected warnings are documented.
- [ ] No unexpected console errors appear.

Run:

```javascript
window.CUDFIRM_RUNTIME?.getCompatibilityReport()
```

Expected result:

- `compatible`, or
- `compatible-with-warnings` when the warnings are intentional.

## 12. Test with the client Supabase project

After configuration:

- [ ] Runtime data source reports `supabase`.
- [ ] Hero content comes from the client database.
- [ ] Services/showcase/testimonials come from the client database.
- [ ] Site Settings control public contact/footer details.
- [ ] Contact title comes from `contact_content`.
- [ ] Images load from approved URLs or client storage.
- [ ] Contact insert reaches the client `messages` table.
- [ ] Newsletter insert reaches the client `subscribers` table.

## 13. Run technical checks

- [ ] JavaScript syntax check
- [ ] Local HTML script/style reference check
- [ ] No missing assets
- [ ] No browser console errors
- [ ] Mobile, tablet and desktop check
- [ ] No secret/service-role key in source
- [ ] Patch/package contains only intended files
- [ ] Protected CUDFIRM files unchanged unless explicitly approved

## 14. Template completion record

```text
Template ID:
Template version:
Contract version:
Core version:
Compatibility status:
Expected warnings:
Static sections:
Known limitations:
Verified by:
Date:
```
