# 06 — Client Handover Checklist

Handover is complete only after the client can access the intended systems and CUDFIRM has retained an approved recovery path.

## 1. Prepare the delivery package

Recommended structure:

```text
<client>-client-delivery/
├── <client>-website/
├── supabase-fresh-install/
└── docs/
```

The package should contain:

- [ ] Final website and dashboard source
- [ ] Client template adapter and manifest
- [ ] Configuration example
- [ ] Fresh-install SQL package
- [ ] Verification SQL
- [ ] Recovery/admin-promotion SQL
- [ ] Branding/corrective SQL files
- [ ] Installation checklist
- [ ] Handover notes
- [ ] Verification summary

## 2. Clean the final package

Before delivery:

- [ ] Remove temporary ZIPs and duplicate extraction folders.
- [ ] Remove `__MACOSX` and editor/cache files.
- [ ] Remove test screenshots unless they are part of documentation.
- [ ] Remove unused sample credentials.
- [ ] Confirm no `service_role` or secret key exists.
- [ ] Confirm all local file references resolve.
- [ ] Run JavaScript syntax checks.
- [ ] Confirm the final folder names match the approved client brand.

The Publishable key may exist in browser configuration because RLS protects access, but secret/server-side keys must not.

## 3. Align final branding

Verify the exact client name in:

- [ ] Delivery folder
- [ ] Website folder
- [ ] Template folder/ID where applicable
- [ ] Public header/logo text
- [ ] Browser title
- [ ] Footer copyright
- [ ] “Created by CUDFIRM Limited” credit, if agreed
- [ ] Dashboard title/sidebar
- [ ] Site Settings
- [ ] SEO Manager
- [ ] Starter SQL
- [ ] Documentation

Search for the old placeholder brand before delivery.

## 4. Create the final client backup

From the client dashboard:

1. Open **Backup & Restore**.
2. Select all available client sections.
3. Download the JSON backup.
4. Store one copy in the client handover archive.
5. Store one CUDFIRM support copy according to the agreement.

The backup must contain only the client's project data.

## 5. Prepare access details

Transfer credentials through an approved secure channel, not plain public chat.

Record ownership and access for:

```text
Production domain
Netlify site/account
Git repository
Supabase project
Client dashboard URL
Primary dashboard administrator
Business email account
Analytics/search tools, if used
```

Do not send secret database credentials to users who do not need them.

Clients normally need the website dashboard, not Supabase organization access.

## 6. Demonstrate the dashboard

Show the client how to:

- sign in and sign out;
- change password through the agreed process;
- edit Hero, About, Services and showcase content;
- publish/hide content;
- upload media;
- review Messages;
- review/export Subscribers;
- update Site Settings and SEO;
- download a backup;
- identify their support contact.

Also explain what they must not do:

- upload unlicensed assets;
- share administrator credentials;
- place secret keys in website fields;
- disable RLS;
- run SQL or migrations without authorization;
- delete critical records without a backup.

## 7. Confirm client acceptance

Use a short acceptance review:

- [ ] Brand name and content are correct.
- [ ] Contact details are correct.
- [ ] Forms reach the client dashboard.
- [ ] Images are approved.
- [ ] Website works on mobile and desktop.
- [ ] Client can sign in.
- [ ] Client can perform one content edit.
- [ ] Client understands backup and support procedures.

## 8. Record known limitations

Examples:

- generic Portfolio contract is being used for a vertical showcase;
- a Blog section remains static;
- a template does not display certain optional CMS fields;
- leaked-password protection is unavailable on the current Supabase plan;
- specific third-party assets require internet access.

Known limitations must be written plainly. Do not present future work as completed.

## 9. Handover record

```text
Client:
Public website URL:
Dashboard URL:
Supabase project:
Netlify site:
Final package filename:
Final backup filename:
Primary client administrator:
CUDFIRM recovery administrator:
Documentation delivered:
Known limitations delivered:
Client training completed:
Accepted by:
Acceptance date:
Support start/end date:
```
