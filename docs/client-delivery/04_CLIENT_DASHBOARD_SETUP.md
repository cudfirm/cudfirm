# 04 — Client Dashboard Setup

The client dashboard must connect only to the client's Supabase project.

It must not access CUDFIRM production or another client's data.

## 1. Add the verified dashboard core

Copy the latest verified CUDFIRM dashboard into the client website package.

Expected structure:

```text
client-website/
├── dashboard/
├── config/
├── js/
├── templates/
└── index.html
```

Preserve the existing dashboard authentication, CRUD, roles, security, backup and activity systems.

Do not rebuild these systems inside the template adapter.

## 2. Connect the dashboard to client configuration

Every dashboard page must load the same client configuration used by the public website.

Example relative path from a dashboard page:

```html
<script src="../config/client-config.js"></script>
```

Then load the client-aware Supabase bootstrap before dashboard modules that use it.

Verify all dashboard pages reference the intended configuration path.

## 3. Align dashboard branding

Update visible client-facing labels such as:

- login-page title;
- dashboard title;
- sidebar brand;
- browser title;
- help text;
- footer/version label where applicable.

Do not rename shared technical functions or database tables only for branding.

The dashboard should identify the client project clearly enough to prevent an administrator from editing the wrong installation.

## 4. Verify authentication

1. Open the local dashboard login page.
2. Sign in with the client project's Auth user.
3. Confirm the dashboard opens.
4. Confirm the displayed email and role are correct.
5. Confirm the account does not authenticate against CUDFIRM production.

Expected first-admin result:

```text
Role: Super Admin
Status: Active
```

## 5. Verify role behavior

Test the roles that will be issued:

### Viewer

- can read permitted dashboard data;
- cannot modify content;
- cannot access protected administrative operations.

### Editor

- can create/edit/publish content where allowed;
- cannot manage users, security, backup/restore or critical deletes.

### Admin

- can manage operational content, Messages, Subscribers and settings;
- cannot take over Super Admin permissions.

### Super Admin

- can manage users, roles, backup/restore, security and critical settings.

RLS must enforce the result even if a user manually calls the API.

## 6. Verify every client dashboard module

Use one small, reversible test for each module.

### Public content editors

- [ ] Hero edit saves and appears publicly.
- [ ] About edit saves and appears publicly.
- [ ] Services edit saves and appears publicly.
- [ ] Portfolio/showcase edit saves and appears publicly.
- [ ] Testimonials edit saves and appears publicly.
- [ ] FAQ edit saves and appears publicly, if used.
- [ ] Navigation edit saves and works, if adapter-controlled.
- [ ] Contact Content edit saves and appears publicly.

Use fields the template actually displays. Do not test an eyebrow field when the template deliberately hides it.

### Business and SEO

- [ ] Site Settings change appears publicly.
- [ ] SEO Manager saves the client page metadata.
- [ ] Theme settings behave as declared by the template.
- [ ] Maintenance Mode behaves as expected.

### Operations

- [ ] Messages displays a real public-form submission.
- [ ] Subscribers displays a real newsletter subscription.
- [ ] Media Library uploads and displays a test image.
- [ ] Activity Log records recent edits.
- [ ] Security & Audit records authentication activity.
- [ ] Users & Roles displays the client Auth profile.
- [ ] Backup & Restore downloads a client-only JSON backup.

## 7. Verify branding consistency

Compare:

```text
public header
browser title
footer
Site Settings
dashboard title
SEO Manager
template manifest
client config
starter SQL/database content
```

If old template branding appears publicly after code is renamed, check the database. Supabase content may override static fallback text.

## 8. Verify client isolation

Confirm:

- [ ] Dashboard counts match the client project.
- [ ] Test Contact message is visible only in the client dashboard.
- [ ] Test subscriber is visible only in the client dashboard.
- [ ] Uploaded media is stored only in the client project.
- [ ] Activity and Security logs contain only client-project events.
- [ ] Backups contain only client-project content.

## 9. Dashboard completion record

```text
Dashboard URL:
Initial administrator:
Initial role:
Hero verified:
About verified:
Services verified:
Showcase verified:
Contact Content verified:
SEO verified:
Site Settings verified:
Messages verified:
Subscribers verified:
Media verified:
Activity verified:
Security verified:
Users/Roles verified:
Backup verified:
Client isolation verified:
Verified by:
Date:
```
