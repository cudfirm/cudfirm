# 08 — Delivery Closeout Checklist

Use this after deployment and before declaring a client project complete.

## 1. Final technical status

- [ ] Automated client-delivery verifier reports 0 errors
- [ ] Any browser-only warnings were checked
- [ ] Production homepage is Published/Ready
- [ ] Anonymous `/dashboard/` shows only the login page
- [ ] Client administrator can sign in
- [ ] Public site and dashboard use the same client Supabase project
- [ ] No CUDFIRM production credentials are present
- [ ] Previous production deployment is available for rollback

## 2. Final data and security status

- [ ] RLS remains enabled
- [ ] Anonymous users cannot read private tables
- [ ] Contact and Newsletter submissions were verified for a new launch
- [ ] Media upload works
- [ ] Final client JSON backup was downloaded
- [ ] Security Advisor warnings were reviewed
- [ ] Known non-critical warnings are documented

## 3. Final package

- [ ] Website and dashboard source included
- [ ] Template manifest and adapter included
- [ ] Client configuration example included
- [ ] Fresh-install and verification SQL included
- [ ] Verification summary included
- [ ] Temporary files and duplicate folders removed
- [ ] No secret keys included
- [ ] Final ZIP filename recorded

## 4. Client handover

- [ ] Client received the production URL
- [ ] Client received the dashboard URL
- [ ] Access details were transferred securely
- [ ] Client completed one content edit
- [ ] Client understands media, Messages, Subscribers, SEO and backup
- [ ] Known limitations were explained
- [ ] Support scope and dates were agreed
- [ ] Client acceptance was recorded

## 5. Closeout record

```text
Client:
Production URL:
Dashboard URL:
Supabase project:
Netlify project:
Final delivery ZIP:
Final backup file:
Verifier result:
Deployment ID/date:
Known limitations:
Client acceptance date:
Support plan:
Closed by:
```

## 6. Completion rule

Do not keep adding features after acceptance without a new approved scope.

A completed client project moves to support. New modules, redesigns and integrations become separate paid work.
