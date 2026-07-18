# CUDFIRM CMS Data Contract

**Contract version:** `1.1.0`  
**Core version reviewed:** `2.0.0`  
**Purpose:** Provide a stable, template-neutral object between the CUDFIRM CMS/Supabase layer and any compatible website template.

## 1. Architecture boundary

```text
Supabase tables
→ js/cms-api.js
→ js/cms-loader.js
→ js/cms-contract.js
→ Template manifest + adapter
→ Public template markup
```

The data contract:

- knows the raw CMS field names;
- converts them to stable camelCase names;
- supplies safe empty values for missing optional data;
- does not query Supabase;
- does not render HTML;
- does not contain template selectors;
- does not implement authentication, RLS, dashboard CRUD, form submission, backup, or security logic.

Template adapters must consume the normalized contract. They must not query CMS tables directly.

## 2. Versioning rules

CUDFIRM uses semantic versioning for the contract.

- **Patch:** fixes normalization without changing the public shape.
- **Minor:** adds backward-compatible fields or sections.
- **Major:** removes or renames fields, changes required-field semantics, or restructures sections incompatibly.

Templates declare their supported range in `template.manifest.js`.

## 3. Top-level shape

```javascript
{
  meta,
  site,
  theme,
  maintenance,
  navigation,
  hero,
  about,
  services,
  portfolio,
  testimonials,
  faq,
  contact,
  seo,
  media,
  extensions
}
```

## 4. Stable section definitions

### `meta`

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `contractVersion` | string | Yes | Semantic contract version |
| `generatedAt` | ISO timestamp | Yes | Time the normalized object was created |
| `locale` | string | Yes | Content locale; currently defaults to `en-NG` |

### `site`

| Contract field | Raw source | Type |
|---|---|---|
| `name` | `site_settings.company_name` | string |
| `logoUrl` | `logo_url` | string |
| `faviconUrl` | `favicon_url` | string |
| `email` | `email` | string |
| `phone` | `phone` | string |
| `whatsapp` | `whatsapp` | string |
| `address` | `address` | string |
| `socialLinks[]` | `social_links` | array of `{ platform, url }` |
| `footerText` | `footer_text` | string |
| `copyrightText` | `copyright_text` | string |
| `mapEmbedUrl` | `google_maps_embed` | string |

Contact details remain centralized in Site Settings. A template must not create a second source of truth for phone, email, WhatsApp, address, or map URL.

### `theme`

The contract maps the existing Site Settings fields exactly:

- `preset` ← `theme_preset`
- `mode` ← `theme_mode`
- `colors.primary` ← `theme_primary_color`
- `colors.secondary` ← `theme_secondary_color`
- `colors.accent` ← `theme_accent_color`
- `colors.background` ← `theme_background_color`
- `colors.text` ← `theme_text_color`
- `typography.heading` ← `theme_heading_font`
- `typography.body` ← `theme_body_font`
- `buttonStyle` ← `theme_button_style`
- `spacing` ← `theme_spacing`
- `shadow` ← `theme_shadow`
- `radius` ← `theme_radius`
- `containerWidth` ← `theme_container_width`
- `customCss` ← `custom_css`

### `maintenance`

| Field | Raw source |
|---|---|
| `enabled` | `maintenance_enabled` |
| `title` | `maintenance_title` |
| `message` | `maintenance_message` |
| `returnAt` | `maintenance_return_at` |
| `contactUrl` | `maintenance_contact_url` |

Maintenance display remains a shared-core responsibility unless a manifest explicitly assigns it to a template adapter.

### `navigation[]`

```javascript
{
  id,
  label,
  target,
  location,
  badge,
  status,
  order
}
```

`target` is normalized from the current `navigation.tab_id`. A template adapter maps that stable target to its own routes, anchors, or mount points.

### `hero`

```javascript
{
  eyebrow,
  title,
  subtitle,
  imageUrl,
  primaryAction: { label, target },
  secondaryAction: { label, target },
  trustItems: [{ icon, label }]
}
```

Required by a template only when its manifest marks the Hero section as required. The CUDFIRM default template requires `title`.

### `about`

```javascript
{
  eyebrow,
  title,
  introduction,
  missionTitle,
  missionText,
  storyTitle,
  storyBlocks: [{ id, heading, text, imageUrl, imageAlt }],
  valuesTitle,
  values: [{ id, icon, title, description }],
  factsTitle,
  facts: [{ id, label, value }],
  imageUrl,
  imageAlt,
  action: { label, target },
  status
}
```

Only `title` is required by the CUDFIRM default manifest. Other templates may declare different required and optional fields without changing the CMS table.

### `services[]`

```javascript
{
  id,
  title,
  description,
  priceText,
  iconUrl,
  tags,
  searchTerms,
  special,
  status,
  order
}
```

`featured` is intentionally not part of the current Services contract because the `services` table has no `featured_home` column. `special` is backed by `services.is_special`.

### `portfolio[]`

```javascript
{
  id,
  title,
  industry,
  projectType,
  imageUrl,
  destination,
  problem,
  solution,
  tags,
  live,
  featured,
  status,
  order
}
```

### `testimonials[]`

```javascript
{
  id,
  name,
  role,
  quote,
  avatarUrl,
  accentColor,
  placeholder,
  status,
  order
}
```

### `faq[]`

```javascript
{
  id,
  question,
  answer,
  status,
  order
}
```

### `contact`

```javascript
{
  eyebrow,
  title,
  introduction,
  assurances: [{ id, icon, title, description }],
  form: {
    nameLabel,
    namePlaceholder,
    contactLabel,
    contactPlaceholder,
    messageLabel,
    messagePlaceholder,
    submitLabel,
    submittingLabel,
    successMessage,
    errorMessage,
    whatsappLabel,
    emailLabel,
    privacyText
  },
  directContact: {
    title,
    description,
    businessHours,
    showPhone,
    showEmail,
    showWhatsapp,
    showAddress,
    showMap,
    phone,
    email,
    whatsapp,
    address,
    mapEmbedUrl
  },
  status
}
```

The Contact contract controls presentation. Contact submission remains shared CMS-core behavior and is still restricted to the approved `messages` payload.

### `seo.pages`

SEO is keyed by `seo_meta.page_key`:

```javascript
{
  pages: {
    home: {
      key,
      title,
      description,
      canonicalUrl,
      robots,
      openGraphImage,
      twitterImage
    }
  }
}
```

The normalizer accepts either one SEO row or an array of rows. This lets the loader expand from homepage-only loading to route-aware loading later without another contract change.

### `media.items[]`

```javascript
{
  id,
  fileName,
  storagePath,
  publicUrl,
  bucket,
  category,
  mimeType,
  sizeBytes,
  altText,
  createdAt
}
```

### `extensions`

Optional Extension Modules attach namespaced data here. Template-specific modules must not add unrelated fields to the core sections.

## 5. About and Contact field audit

The audit compared:

- migrations `001` through `016`;
- `dashboard/js/pages/about-page.js`;
- `dashboard/js/pages/contact-page.js`;
- `dashboard/js/pages/settings-page.js`;
- `js/cms-api.js` and `js/cms-loader.js`;
- the existing contract, manifest, runtime, and CUDFIRM default adapter;
- the relevant legacy markup in `js/script.js` without modifying it.

### About result

The `about_content` table and About dashboard editor cover the same reusable content model:

- main copy;
- mission;
- structured story blocks;
- values;
- facts/statistics;
- image and alt text;
- CTA;
- publication status.

**No essential new About database column is required for the core contract.** Team members, timelines, awards, or industry-specific facts should remain optional template sections or Extension Modules unless repeated client use proves they belong in the core.

Current Adapter 1 does not yet display every available About field. In particular, `missionTitle`, `missionText`, the main About image, and story-block images require a later adapter-only rendering correction. That is a renderer gap, not a schema gap.

### Contact result

The `contact_content` table, Contact dashboard editor, and Site Settings together cover:

- section heading and introduction;
- assurances;
- form labels, placeholders, status copy, and privacy copy;
- direct-contact heading, description, and hours;
- visibility controls for phone, email, WhatsApp, address, and map;
- centralized contact values and map URL;
- publication status.

**No essential new Contact database column is required for the core contract.** Additional template-specific form fields must not be added casually because public submission columns and RLS are intentionally restricted.

Current Adapter 1 does not yet use every available Contact field. `showWhatsapp`, `showMap`, `submittingLabel`, `successMessage`, and `errorMessage` require a later adapter/shared-form integration review. That work must preserve the existing secure submission path.

## 6. Corrections made in contract `1.1.0`

The previous normalizer had several source-name mismatches:

1. Site name read `site_name`/`business_name` instead of the actual `company_name` column.
2. Map URL read `map_embed_url` instead of `google_maps_embed`.
3. Theme spacing, shadow, and radius read non-existent column names.
4. Services exposed a `featured` property backed by a non-existent Services column.
5. SEO returned the raw homepage row instead of normalized page-keyed fields.
6. Nested About, Contact, social-link, and media objects were not consistently normalized.

Version `1.1.0` corrects these mappings while keeping Adapter 1's existing required fields compatible.

## 7. Out of scope for this contract patch

This patch does not change:

- database tables or migration history;
- RLS, grants, Storage policies, or SECURITY DEFINER functions;
- dashboard forms or CRUD behavior;
- contact/newsletter submission behavior;
- `js/script.js` or `css/styles.css`;
- template manifests, adapter rendering, or mount selectors;
- Member Accounts or any other Extension Module.
