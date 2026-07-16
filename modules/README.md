# CUDFIRM Extension Modules

This directory is reserved for optional, reusable business features that do not belong in the CMS core.

Examples include member accounts, comments, bookings, reviews, commerce, chat, and forums.

## Core rule

A module may extend CUDFIRM, but it must not duplicate or replace authentication for the CMS dashboard, shared role resolution, RLS helpers, media, backup, activity logging, template loading, or the shared CMS data layer.

## Standard module structure

```text
modules/
└── module-id/
    ├── module.manifest.js
    ├── module.runtime.js
    ├── module.api.js
    ├── module.contract.js
    ├── module.registration.js
    ├── dashboard/
    ├── public/
    ├── css/
    ├── migrations/
    ├── tests/
    └── README.md
```

Only the files a module genuinely needs must be present.

## Registration

Installed modules register explicitly:

```javascript
window.CUDFIRMModuleRegistry.register('comments', {
  manifest: window.CUDFIRMCommentsManifest,
  runtime: window.CUDFIRMCommentsRuntime,
  api: window.CUDFIRMCommentsApi,
  contract: window.CUDFIRMCommentsContract,
  metadata: {
    source: 'local',
    entry: 'modules/comments/module.registration.js'
  }
});
```

The shared registry never loads arbitrary remote scripts.

## Contract namespace

Module data is exposed under:

```javascript
window.CMSContract.extensions[moduleNamespace]
```

A template can declare required and optional modules in its manifest:

```javascript
modules: {
  required: [{ id: 'member-accounts', minimumVersion: '1.0.0' }],
  optional: [{ id: 'comments', minimumVersion: '1.0.0' }]
}
```

A missing required module makes the template incompatible. A missing optional module creates a warning and the related UI must hide cleanly.

## Security and migrations

Each module owns additive migrations, RLS policies, Storage policies, constraints, indexes, named permissions, backup coverage, and verification scripts. Completed migrations must never be rewritten.

Modules are installed only in the separate Supabase project belonging to the client who purchased that feature.

## Starter template

`_module-template/` contains examples only. It is not an installed module and must not be loaded by `index.html`.
