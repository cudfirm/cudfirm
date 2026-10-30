# CUDFIRM Admin Dashboard (Phase 3)

A standalone admin panel for editing the Supabase content that powers
the public CUDFIRM site, plus a small set of Supabase-backed features
on the public site itself (contact form storage, newsletter signup,
dynamic SEO tags, site-wide settings). Lives mostly inside `/dashboard`;
the public-site touch points are called out explicitly below.

## Stack

HTML + CSS + Bootstrap 5 + vanilla JavaScript + Supabase JS v2
(Auth + Database + Storage). No React/Vue/Angular/Next/TypeScript/
Tailwind — matches the project's original constraints.

## One-time setup

1. **Run the SQL migrations, in order**, in Supabase → SQL Editor:
   - `supabase/003_admin_write_policies.sql` (Phase 2, if not already run)
   - `supabase/004_phase3_platform.sql` (Phase 3 — new tables, new
     image columns, RLS, and the `media` Storage bucket)

   Both are additive and safe to re-run.

2. **Confirm the Storage bucket exists.** Supabase → Storage should
   show a **public** bucket named `media` after running 004. If for
   some reason it wasn't created automatically, add it manually
   (Storage → New bucket → name `media` → Public bucket) and re-run
   the storage policy statements at the bottom of `004_phase3_platform.sql`.

3. **Create an admin user** (Supabase → Authentication → Users →
   "Add user") if you haven't already. No public sign-up screen exists,
   on purpose.

4. **Open `/dashboard/index.html`** and sign in.

## Pages

| Page | File | Backs |
|---|---|---|
| Login | `index.html` | Supabase Auth |
| Dashboard Home | `home.html` | stats + recent activity across every table |
| Hero Section | `hero.html` | `hero` (singleton) — now includes an optional hero image |
| Services | `services.html` | `services` — now includes an icon/image and a rich-text description |
| Portfolio | `portfolio.html` | `portfolio_projects` — image field now uses the Media Library picker |
| Testimonials | `testimonials.html` | `testimonials` — now includes an optional avatar |
| FAQ | `faq.html` | `faq` — answer is now rich text |
| Navigation | `navigation.html` | `navigation` |
| **Media Library** | `media.html` | `media_library` + Storage bucket `media` |
| **Site Settings** | `settings.html` | `site_settings` (singleton) |
| **SEO Manager** | `seo.html` | `seo_meta` |
| **Messages** | `messages.html` | `messages` (populated by the public contact form) |
| **Subscribers** | `subscribers.html` | `subscribers` (populated by the public newsletter form) |
| **Activity Log** | `activity.html` | `activity_log` (read-only, written by every other page) |

## How the new pieces fit together

- `js/storage-api.js` — uploads to the `media` Storage bucket and
  keeps `media_library` in sync (one row per uploaded object). Used
  by the image picker and the Media Library page.
- `js/image-field.js` — the reusable "pick an image" control (upload
  new / browse the library / remove). Mounted wherever a field's
  `type` is `"image"`, plus directly on the Site Settings page for
  the logo and favicon.
- `js/rich-text.js` — a small, dependency-free rich text editor
  (`contenteditable` + `document.execCommand`, no external library).
  Mounted wherever a field's `type` is `"richtext"` — currently
  Services → Description and FAQ → Answer. Output is sanitized on
  every read (script/style/iframe tags and `javascript:`/`data:`
  URLs stripped) before it's ever saved.
- `js/crud-engine.js` — gained the `"image"` and `"richtext"` field
  types (in addition to the existing text/textarea/number/checkbox/
  color/select/tags/url) and now calls `DashActivity.log(...)` after
  every create/update/delete.
- `js/dash-utils.js` — gained `DashActivity.log(action, entity, label)`,
  a fire-and-forget helper that writes to `activity_log`. A logging
  failure never blocks the action it's describing.
- `media.html`, `settings.html`, `messages.html`, `subscribers.html`,
  `activity.html` are hand-written pages (not CrudEngine) since each
  has a shape CrudEngine doesn't fit: a grid instead of a table
  (Media), a singleton form (Settings), or triage actions instead of
  add/edit (Messages, Subscribers). `seo.html` **does** use CrudEngine
  — `seo_meta` is a normal list of rows.

## Public-site integration

A few files outside `/dashboard` needed small, additive changes so
the new features actually take effect on the live site. In every
case, the change only **patches or extends** existing behavior — if
the corresponding Supabase table/row is empty, the site renders
exactly as it did before Phase 3.

- **`js/cms-api.js`** — two new read-only getters, `getSiteSettings()`
  and `getSeoMeta(pageKey)`, following the exact same `safeQuery`
  pattern as every existing getter in that file.
- **`js/cms-loader.js`** — `siteSettings` and `seo` added to
  `window.CMS`, fetched in the same `Promise.all` with the same
  2.5s timeout/fallback safety as everything else.
- **`js/script.js`**:
  - `submitEnquiryToSupabase()` — new function, called from all three
    contact-form submit paths (Admin/WhatsApp/Email) alongside the
    existing Google Sheets submission. Every enquiry is now stored in
    `messages` regardless of which button the visitor uses.
  - `submitNewsletterSignup()` / `onNewsletterSubmit()` — a small
    newsletter form is now appended to each footer instance
    (`applySiteSettings()`) and submits to `subscribers`.
  - `applySiteSettings()` — runs once after the tabs are built; patches
    footer copyright/tagline text, social icon links, the favicon, the
    contact email/phone links, and injects GA/Meta Pixel snippets —
    but only for whichever fields an admin has actually filled in.
  - `applySeoMeta()` — updates the page's existing `<title>` and
    meta/OG/Twitter/canonical/robots tags from the `seo_meta` row keyed
    `"home"`. It only ever sets `content`/`href` on tags that already
    exist in `index.html` — it never creates new ones.
  - Hero/Service/Testimonial rendering now checks for
    `hero.image_url` / `service.icon_url` / `testimonial.avatar_url`
    and shows an image instead of the current text/initials — only
    when that field is actually set.
- **`index.html`** — one new `<link rel="icon" id="siteFavicon">` tag
  (a stable place for `applySiteSettings()` to update); everything
  else it reads (title, description, canonical, OG/Twitter tags) was
  already present.
- **`css/styles.css`** — one new block at the end of the file styling
  the hero image, service icon image, and newsletter form. Nothing
  existing was changed.

### What's intentionally **not** wired into the public site

- **Company logo** — storable and uploadable in Site Settings, but
  not auto-inserted into the nav bar. The current header is
  text-only branding; placing a logo well is a design decision, not
  something to make unilaterally as a data-patch. Manually add an
  `<img>` reading `window.CMS.siteSettings.logo_url` wherever you'd
  like it once you're happy with the placement.
- **Google Maps embed** — stored and manageable in Site Settings, but
  no iframe exists in `index.html` today to patch. Add one where you
  want the map and point its `src` at `window.CMS.siteSettings.google_maps_embed`.
- **Per-tab SEO** — `seo_meta` supports multiple `page_key` rows, but
  since this is a single-page app (all "pages" are tabs within
  `index.html`), only the `"home"` row is applied, once, on initial
  load — which is what search engines and social-media scrapers
  actually see for a static SPA. Switching `<title>`/meta tags live
  as the visitor changes tabs would need hooking into `openTab()`;
  a reasonable Phase 4 item if you want it.

## Security notes

- Storage/RLS: the `media` bucket is public-read (needed so uploaded
  images actually display on the live site) and authenticated-write
  only. Same `auth.uid() is not null` pattern as every other table.
- `messages` and `subscribers` allow **public INSERT only** — an
  anonymous visitor can submit the contact form or subscribe, but
  reading, updating, or deleting requires a signed-in admin.
- Rich text is sanitized (script/style/iframe stripped, `on*`
  attributes stripped, `javascript:`/`data:` URLs stripped) before
  it's ever saved — but it's still admin-authored HTML rendered with
  `innerHTML` on the live site, the same trust model as any
  single-admin CMS.

## Adding a new field to an existing editor

Open the relevant `js/pages/<name>-page.js` file and add an entry to
its `fields` array (and, if you want it in the table view, `columns`
too). Field `type` can be `text`, `textarea`, `number`, `checkbox`,
`color`, `select`, `tags`, `url`, `image`, or `richtext`. No other
file needs to change — the engine builds the form and table from
that config automatically.
