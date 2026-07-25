# 05 — Netlify Deployment Guide

Deploy every client separately from CUDFIRM production and every other client.

## A. Identify the correct folder

A delivery package may look like:

```text
client-delivery/
├── client-website/
├── supabase-fresh-install/
├── docs/
└── verification/
```

Deploy only the folder that directly contains:

```text
index.html
dashboard/
config/
js/
templates/
```

In the example above, deploy `client-website`.

Do not deploy the outer `client-delivery` folder.

## B. Create a new client site

Use this only when the client does not already have a Netlify site.

1. Open Netlify.
2. Choose **Add new project** or open Netlify Drop.
3. Confirm the intended Netlify account/team.
4. Select or drag the exact website folder that directly contains `index.html`.
5. Wait until Netlify shows **Published** or **Ready**.
6. Record the generated `netlify.app` URL.

Do not upload a client website to the CUDFIRM production site.

## C. Update an existing manual Netlify site

Use this for a site originally deployed with Netlify Drop.

1. Open the existing Netlify project.
2. Read the project name at the top and confirm it is the correct client.
3. Open **Deploys**.
4. Find the box that says **Drag and drop your project folder**.
5. Choose the exact website folder that directly contains `index.html`.
6. Wait until the new deployment shows **Published** or **Ready**.
7. Keep the previous deployment in Netlify history for rollback.

Do not select the parent delivery folder.

## D. Verify the temporary deployment

Before replacing production, open the temporary URL and verify:

- [ ] Homepage loads
- [ ] CMS content and images load
- [ ] Navigation works
- [ ] Carousels/sliders work
- [ ] Responsive layout is acceptable
- [ ] `/dashboard/` shows the login page in incognito mode
- [ ] No visible framework error appears

Run the automated package verifier before deployment. Browser-only selector warnings must be checked here.

## E. Verify the production deployment

After publishing:

1. Open the production URL in an incognito window.
2. Press `Ctrl + Shift + R` for a hard refresh.
3. Confirm the homepage uses the new deployment.
4. Open `/dashboard/` in incognito mode and confirm only the login page appears.
5. Sign in only when an authenticated dashboard check is required.

Do not repeat Contact, Newsletter or database tests for a frontend-only replacement when those systems were already verified and the relevant submission code did not change.

## F. Production smoke test for a new client

For a first launch, verify:

### Public site

- [ ] Brand, title and footer are correct
- [ ] Hero, About, Services and showcase load
- [ ] Images load
- [ ] Mobile navigation works
- [ ] Contact details are correct
- [ ] No unexpected console errors

### Forms

- [ ] Contact creates a new client message
- [ ] Newsletter creates a new client subscriber
- [ ] Success/error feedback works

### Dashboard

- [ ] Client admin can sign in
- [ ] One reversible content edit appears publicly
- [ ] Messages and Subscribers show production submissions
- [ ] Media upload works
- [ ] Backup downloads

## G. Domain and authentication settings

For a custom domain:

- [ ] Add the domain in Netlify
- [ ] Configure DNS
- [ ] Confirm HTTPS
- [ ] Choose canonical `www` or non-`www`
- [ ] Update SEO canonical URL
- [ ] Update sitemap/robots files when used
- [ ] Add production URLs to Supabase Auth URL settings

## H. Record deployment evidence

```text
Client:
Netlify project name:
Temporary URL:
Production URL/domain:
Deploy folder:
Deployment ID/date:
Supabase project:
Automated verifier result:
Browser warnings verified:
Production smoke test completed by:
Rollback deployment retained: Yes/No
```
