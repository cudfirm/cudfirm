# CUDFIRM Admin Dashboard (Phase 2)

A standalone admin panel for editing the Supabase content that powers
the public CUDFIRM site. Lives entirely inside `/dashboard` and does
not modify anything in the public site (`index.html`, `css/styles.css`,
`js/script.js`, `js/cms-api.js`, etc.).

## Stack

HTML + CSS + Bootstrap 5 + vanilla JavaScript + Supabase JS v2.
No React/Vue/Angular/Next/TypeScript/Tailwind — matches the
constraints in `docs/PROJECT_CONTEXT.md`.

## One-time setup

1. **Run the new SQL migration.** Open Supabase → SQL Editor and run
   `supabase/003_admin_write_policies.sql`. This is additive — it does
   not touch `001_schema.sql` or `002_seed.sql`, and it does not
   recreate any table. Right now the existing tables only allow public
   **read** access; this migration adds write access for logged-in
   users so the dashboard can actually save changes.

2. **Create an admin user.** Supabase → Authentication → Users →
   "Add user". There is no public sign-up screen in the dashboard —
   accounts are provisioned manually, on purpose.

3. **Open `/dashboard/index.html`** (e.g. `https://your-site/dashboard/`)
   and sign in with that user's email/password.

## Pages

| Page | File | Table(s) |
|---|---|---|
| Login | `index.html` | Supabase Auth |
| Dashboard Home | `home.html` | counts across all tables |
| Hero Section | `hero.html` | `hero` (singleton, id = 1) |
| Services | `services.html` | `services` |
| Portfolio | `portfolio.html` | `portfolio_projects` |
| Testimonials | `testimonials.html` | `testimonials` |
| FAQ | `faq.html` | `faq` |
| Navigation | `navigation.html` | `navigation` |

## How it's put together

- `js/auth-guard.js` — runs on every page except the login screen;
  redirects to login if there's no active Supabase session.
- `js/layout.js` — builds the shared sidebar/topbar chrome and a small
  toast helper (`DashToast.success(...)` / `DashToast.error(...)`),
  so the six content pages don't duplicate that markup.
- `js/dashboard-api.js` — the admin data-access layer (`AdminApi.list`,
  `.create`, `.update`, `.remove`, `.count`). This is the write-capable
  counterpart to the public, read-only `js/cms-api.js` — that file is
  untouched and still powers the live site.
- `js/crud-engine.js` — one generic engine (table + add/edit modal +
  delete confirm + up/down reordering) driven entirely by a config
  object. Five of the six editors (`services`, `portfolio_projects`,
  `testimonials`, `faq`, `navigation`) are just config files under
  `js/pages/*-page.js`.
- `js/pages/hero-page.js` — the one hand-written page, because `hero`
  is a singleton row with a nested JSON array (`trust_items`) rather
  than a normal list of rows.

## Adding a new field to an existing editor

Open the relevant `js/pages/<name>-page.js` file and add an entry to
its `fields` array (and, if you want it in the table view, `columns`
too). No other file needs to change — the engine builds the form and
table from that config automatically.

## Security note

Row Level Security still applies. The write policies added in
migration `003` grant write access to **any** authenticated Supabase
user — fine for a single-admin setup. If you add more accounts later
that shouldn't have admin rights, tighten those policies to check a
specific role/claim (see the note at the bottom of the SQL file).
