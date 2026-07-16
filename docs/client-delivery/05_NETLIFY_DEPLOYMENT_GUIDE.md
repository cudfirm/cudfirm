# 05 — Netlify Deployment Guide

Deploy the client's website separately from CUDFIRM production and from every other client.

## 1. Identify the exact deploy folder

A delivery package may contain:

```text
client-delivery/
├── client-website/
├── supabase-fresh-install/
└── docs/
```

Deploy only:

```text
client-website
```

Do not deploy the parent delivery folder. Otherwise the live root may not contain `index.html` at the expected path.

## 2. Test the deploy folder locally first

Open the exact deploy folder in VS Code and start Live Server/Live Preview.

Verify:

- [ ] Public homepage loads.
- [ ] Dashboard login loads at `/dashboard/`.
- [ ] Runtime data source is `supabase`.
- [ ] Client content appears.
- [ ] No local-reference errors appear.

## 3. Create a separate Netlify site

1. Sign in to the intended Netlify account.
2. Create a new site for the client.
3. Connect the correct Git repository or deploy the exact client website folder.
4. Use a client-specific site name.
5. Record the temporary `*.netlify.app` URL.

Do not deploy the client package over the CUDFIRM production site.

## 4. Confirm publish settings

For a plain HTML/CSS/JavaScript project:

```text
Build command: none, unless the project explicitly requires one
Publish directory: the folder containing index.html
```

When deploying by drag-and-drop, drag only the contents/folder that places `index.html` at the site root.

## 5. Verify deployment completion

Do not assume the site deployed merely because files were copied locally.

In Netlify:

1. Open the latest deployment.
2. Confirm the status is successful.
3. Use the Deploy file browser when a route returns 404.
4. Confirm paths such as:

```text
index.html
dashboard/index.html
config/client-config.js
templates/<template-id>/template.adapter.js
```

A 404 after a local change may mean the Netlify session, internet connection or deployment did not complete.

## 6. Configure the production domain

- [ ] Add the client domain.
- [ ] Configure DNS.
- [ ] Confirm HTTPS certificate.
- [ ] Decide canonical `www` or non-`www` form.
- [ ] Update Site Settings and SEO canonical URL.
- [ ] Update sitemap/robots files if used.

## 7. Configure Supabase authentication URLs

In the client Supabase project, review Auth URL configuration.

Add the production site URL and any required dashboard/login redirect URL.

Remove obsolete localhost URLs when no longer needed, while retaining approved development URLs if support requires them.

## 8. Production smoke test

Use the production URL and verify:

### Public website

- [ ] Browser title uses the client brand.
- [ ] Header and footer use the client brand.
- [ ] Hero, About, Services and showcase load.
- [ ] Images load.
- [ ] Contact details are correct.
- [ ] Mobile navigation works.
- [ ] No unexpected console errors.

### Forms

- [ ] Contact form creates a new client message.
- [ ] Success and error messages behave correctly.
- [ ] Newsletter creates a new client subscriber.
- [ ] Duplicate or invalid input is handled safely.

### Dashboard

- [ ] `/dashboard/` loads.
- [ ] Client admin can sign in.
- [ ] One public content edit appears publicly.
- [ ] Messages and Subscribers show production submissions.
- [ ] Media upload works.
- [ ] Backup downloads.
- [ ] Security and Activity pages load.

## 9. Verify template compatibility in production

Run:

```javascript
window.CUDFIRM_RUNTIME?.getCompatibilityReport()
```

Record:

```text
compatible:
status:
errors:
warnings:
missingMounts:
missingRenderers:
missingFields:
```

Expected warnings must be documented. Unexpected errors block handover.

## 10. Confirm production isolation

- [ ] Production config points to the client Supabase URL.
- [ ] Production config uses the client's Publishable key.
- [ ] No CUDFIRM production URL/key appears in the client files.
- [ ] Client messages do not appear in CUDFIRM production.
- [ ] CUDFIRM production messages do not appear in the client dashboard.

## 11. Save deployment evidence

Record:

```text
Netlify site name:
Temporary Netlify URL:
Production domain:
Deploy source/repository:
Publish directory:
Deployment ID/date:
Supabase project name:
Compatibility status:
Smoke test completed by:
```

Take screenshots or save notes for:

- public homepage;
- dashboard login/home;
- Contact message;
- subscriber row;
- compatibility report;
- backup confirmation.
