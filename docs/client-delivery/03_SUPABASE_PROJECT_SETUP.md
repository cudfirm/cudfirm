# 03 — Supabase Project Setup

Every client receives a separate Supabase project.

The project may be created inside the CUDFIRM Supabase organization, but it must not share CUDFIRM production data or credentials.

## 1. Create the client project

In Supabase:

1. Open the CUDFIRM organization.
2. Create a new project.
3. Use the approved client project name.
4. Save the database password in the approved credential manager.
5. Confirm the project name before running any SQL.

Record:

```text
Supabase project name:
Project reference ID:
Region:
Created by:
Date:
```

## 2. Create the first Auth user

Before or immediately after the core install:

1. Open **Authentication → Users**.
2. Create the initial client administrator.
3. Use the approved client email.
4. Use a temporary secure password.
5. Require the client to change the password through the agreed process.

Do not use a CUDFIRM production user account for the client project.

## 3. Back up before changing an existing project

For a fresh project, record that no data exists yet.

For an existing client project:

- [ ] Download the current client JSON backup.
- [ ] Save the current website ZIP.
- [ ] Confirm the correct Supabase project name.
- [ ] Record the last applied migration/setup file.

Never run client SQL against CUDFIRM production by mistake.

## 4. Run the fresh-install SQL in order

A client installation package should normally contain files such as:

```text
01_core_fresh_install.sql
02_<client>_starter_content.sql
03_verify_fresh_install.sql
04_promote_first_admin_if_needed.sql
```

Additional corrective or branding files may follow with the next numbers.

### Required sequence

1. Run `01_core_fresh_install.sql` once.
2. Wait for a successful result.
3. Run the client starter-content file once.
4. Run the verification file.
5. Review every verification result before continuing.

### Recovery script rule

Run `04_promote_first_admin_if_needed.sql` only when verification shows no active Super Admin.

Example condition:

```text
active_super_admins = 0
```

If verification already shows one or more active Super Admins, keep the file but do not run it.

## 5. Never rewrite installation history

After a SQL file has run:

- do not edit it to pretend the original install was different;
- do not rerun it unless the file is explicitly idempotent and rerunning is necessary;
- add a new corrective SQL file with the next number.

Example:

```text
05_client_image_fix.sql
06_branding_alignment.sql
```

## 6. Verify required security boundaries

Verification must confirm:

- [ ] Required public tables exist.
- [ ] RLS is enabled on all protected tables.
- [ ] The media bucket exists.
- [ ] At least one active Super Admin exists.
- [ ] Starter singleton records exist.
- [ ] Anonymous users can read only intended published content.
- [ ] Anonymous users can insert only approved Contact/Newsletter payloads.
- [ ] Anonymous users cannot read Messages, Subscribers, Profiles, Activity or Security Events.
- [ ] Authenticated writes are controlled by role-aware RLS.

Do not rely only on hidden dashboard buttons.

## 7. Confirm intentional security functions

The following functions are intentionally SECURITY DEFINER in the current CUDFIRM core:

```text
record_auth_security_event(...)
current_app_role()
has_permission(...)
record_activity_event(...)
```

Do not convert or revoke them without a complete security redesign.

## 8. Obtain browser-safe API values

In the client Supabase project:

- **Data API** → copy the Project URL.
- **API Keys** → copy the Publishable key.

The Publishable key commonly begins with:

```text
sb_publishable_
```

Do not copy or expose:

```text
service_role
secret key
server-side private key
```

## 9. Configure the client website

Create the real configuration by copying the example:

```text
config/client-config.example.js
→ config/client-config.js
```

Example:

```javascript
window.CUDFIRM_CONFIG = Object.freeze({
  templateId: "client-template-id",
  coreVersion: "2.0.0",
  contractVersion: "1.1.0",
  dataMode: "supabase",
  supabaseUrl: "https://CLIENT_PROJECT.supabase.co",
  supabaseAnonKey: "sb_publishable_...",
  clientProject: "Client Public Name"
});
```

Only one configuration file should be loaded by `index.html`.

The example file may remain in the folder, but it must not override the real file.

## 10. Test the API connection

Use the public website locally and confirm:

```javascript
window.CUDFIRM_CONFIG
```

Expected:

```text
dataMode: "supabase"
templateId: approved client template ID
supabaseUrl: non-empty
supabaseAnonKey: non-empty Publishable key
```

Then confirm the runtime source:

```javascript
window.CUDFIRM_RUNTIME?.getData?.().meta
```

Expected:

```text
dataSource: "supabase"
```

## 11. Verify forms and images

- [ ] Contact form creates a client `messages` row.
- [ ] The payload uses the actual schema column names.
- [ ] Newsletter creates a client `subscribers` row.
- [ ] Hero, About, showcase and testimonial image fields are populated.
- [ ] Media files belong to the client project.

A successful API read does not prove forms or storage work. Test each separately.

## 12. Final Supabase record

```text
Project name:
Project URL stored securely: Yes/No
Publishable key configured: Yes/No
Secret/service-role exposed in frontend: No
Core install completed:
Starter content completed:
Verification completed:
Active Super Admin count:
RLS verified:
Storage verified:
Contact insert verified:
Newsletter insert verified:
Backup downloaded:
Verified by:
Date:
```
