# CUDFIRM Shared Client Core Specification

**Version:** 1.0.0  
**Core compatibility:** CUDFIRM 2.0.0  
**CMS contract:** 1.1.0

## Purpose

The shared client core is copied unchanged into each client delivery. Only the client configuration, template manifest, template adapter, template markup, and approved client content should vary.

```text
Client configuration
→ Shared Supabase bootstrap
→ Shared CMS API
→ CMS contract 1.1.0
→ Shared loader/runtime/forms
→ Client template adapter
```

A client deployment must never fall back to `CUDFIRM_DATABASE`. Loading an explicit `window.CUDFIRM_CONFIG` disables the CUDFIRM production fallback and requires that client’s own Project URL and browser-safe key.

## Canonical public-core files

```text
config/client-config.js
js/supabase.js
js/cms-api.js
js/cms-contract.js
js/cms-loader.js
js/public-forms.js
js/module-registry.js
js/module-validator.js
js/module-runtime.js
js/template-config.js
js/template-registry.js
js/template-validator.js
js/template-runtime.js
```

## Configuration contract

`config/client-config.js` must load before `js/supabase.js` on the public website and every dashboard page.

Required client values:

```javascript
window.CUDFIRM_CONFIG = Object.freeze({
  deploymentType: "client",
  clientProject: "Client Name",
  templateId: "client-template-id",
  coreVersion: "2.0.0",
  contractVersion: "1.1.0",
  dataMode: "supabase",
  supabaseUrl: "https://PROJECT_REF.supabase.co",
  supabaseAnonKey: "sb_publishable_..."
});
```

The bootstrap rejects obvious `service_role`, `sb_secret_*`, and legacy JWT service-role keys.

## Public data ownership

Only `js/cms-api.js` knows public table names. Templates and adapters consume normalized contract data and must not call `supabaseClient.from(...)`.

Approved shared writes are purpose-specific:

```javascript
CMSApi.submitContactMessage({ name, contactInfo, message });
CMSApi.subscribeNewsletter(email);
```

No generic public `insert(table, payload)` method is exposed.

## Form ownership

A template opts into shared form handling through its manifest:

```javascript
forms: {
  contact: {
    managedBy: "shared-core",
    formSelector: "#contact-form",
    submitSelector: "button[type='submit']",
    statusSelector: "[data-contact-status]",
    fields: {
      name: "[name='name']",
      contact: "[name='contact']",
      subject: "[name='subject']", // optional; merged into the stored message
      message: "[name='message']"
    },
    messages: {
      submitting: "Sending…",
      success: "Message sent.",
      error: "Message could not be sent.",
      invalid: "Complete all required fields."
    }
  },
  newsletter: {
    managedBy: "shared-core",
    formSelector: ".newsletter-form",
    fields: { email: "[name='email']" }
  }
}
```

The shared core owns validation and database submission. When an optional subject selector is declared, the subject is safely merged into the stored message before submission. The template owns markup, selectors, wording, and styling.

## Compatibility position

The current CUDFIRM Default Adapter keeps `legacy-core` form ownership because its working form handlers remain inside protected `js/script.js`. CUDTEMP declares no public forms. No existing live behavior changes in this foundation patch.

A migrated client template may use `shared-core` immediately after its manifest and markup have been verified.
