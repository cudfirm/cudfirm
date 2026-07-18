# CUDFIRM Shared Template Runtime

**Runtime version:** `1.1.0`  
**Core version:** `2.0.0`  
**Purpose:** Connect one explicitly registered template adapter to the normalized CMS contract through a reusable, template-neutral lifecycle.

## 1. Architecture boundary

```text
CUDFIRM CMS Core
→ CMS Data Contract
→ Template Registry
→ Template Manifest Validator
→ Shared Template Runtime
→ Template Adapter
→ Template Markup
```

The runtime does not query Supabase, authenticate users, submit forms, implement dashboard CRUD, change RLS, or duplicate security and role logic.

## 2. Initialization sequence

The runtime performs these operations in order:

1. Resolve `CUDFIRM_CONFIG.templateId`, falling back to `cudfirm-default`.
2. Load the matching definition from `CUDFIRMTemplateRegistry`.
3. Wait for `CMSReady` and `CUDFIRMModulesReady`.
4. Merge namespaced module extensions into the normalized contract snapshot.
5. Wait for enabled adapter-managed mount selectors.
6. Validate the manifest, adapter, contract, core version, and module requirements.
7. Initialize the adapter when it exposes an optional `initialize` hook.
8. Render enabled adapter-managed sections in manifest order.
9. Report externally managed sections without rendering them.
10. Produce an immutable runtime report and dispatch a completion event.

A compatibility failure prevents adapter rendering but does not weaken or bypass any core security rule.

## 3. Template selection

```javascript
window.CUDFIRM_CONFIG = {
  templateId: 'example-template',
};
```

Only a template already registered through `CUDFIRMTemplateRegistry.register()` can be activated.

## 4. Runtime configuration

```javascript
window.CUDFIRM_CONFIG = {
  templateId: 'example-template',
  coreVersion: '2.0.0',
  templateRuntime: {
    autoStart: true,
    mountTimeoutMs: 5000,
  },
};
```

- `autoStart: false` disables automatic initialization.
- `mountTimeoutMs` is clamped between `0` and `30000` milliseconds.
- Asset declarations remain descriptive; runtime `1.1.0` does not inject or reorder assets.

## 5. Renderer contract

A section renderer receives:

```javascript
{
  mount,
  data,
  site,
  theme,
  contract,
  sectionConfig,
  manifest,
  runtime: {
    templateId,
    sectionName,
    coreVersion,
    runtimeVersion
  }
}
```

Renderers may be synchronous or asynchronous.

- Return `false` to decline rendering and keep the existing fallback markup.
- Return any other value, including `undefined`, to mark the section as rendered.
- Throwing an error isolates that section and applies the declared renderer-failure policy.
- A renderer must not query Supabase directly.

The runtime resolves dotted contract paths such as `extensions.memberAccounts.profile`, so extension-backed templates do not need a second data loader.

## 6. Optional adapter lifecycle hooks

An adapter may expose these optional functions:

```javascript
{
  async initialize(context) {},
  async beforeRender(sectionContext) {},
  async afterRender(sectionContext) {},
  async complete(context) {},
  async onError(errorContext) {}
}
```

- `initialize` runs once before section rendering.
- `beforeRender` runs before each adapter-managed renderer.
- `afterRender` runs after each successful renderer.
- `complete` runs after the section loop.
- `onError` receives initialization or hook errors when available.

Hooks receive normalized contract data and runtime metadata. They do not receive privileged database credentials.

## 7. Section outcomes

Each enabled section is reported as one of:

- `rendered`
- `skipped`
- `externally-managed`
- `failed`

Reports include the section source, selector, renderer, ownership, reason, and rendering duration.

## 8. Fallback handling

Runtime `1.1.0` applies these declared policies when relevant:

- `hide` / `hide-section` / `warn-and-hide`
- `show-empty-state`
- `show-safe-error`
- `show-fallback`
- `keep-legacy`
- `ignore`

`keep-legacy` and `ignore` leave existing markup unchanged. A renderer should avoid partial DOM mutation before operations that may throw because the runtime does not reconstruct removed event listeners.

## 9. Public API

```javascript
window.CUDFIRM_RUNTIME.initialize()
window.CUDFIRM_RUNTIME.reload()
window.CUDFIRM_RUNTIME.whenReady()
window.CUDFIRM_RUNTIME.getStatus()
window.CUDFIRM_RUNTIME.getTemplate()
window.CUDFIRM_RUNTIME.getManifest()
window.CUDFIRM_RUNTIME.getRegistration()
window.CUDFIRM_RUNTIME.getCompatibilityReport()
window.CUDFIRM_RUNTIME.getModuleCompatibilityReport()
window.CUDFIRM_RUNTIME.getData()
window.CUDFIRM_RUNTIME.getReport()
window.CUDFIRM_RUNTIME.getSectionReport('services')
```

For first-load coordination:

```javascript
await window.CUDFIRMTemplateReady;
```

`reload()` reruns validation and rendering against the current registered template and current contract snapshot. It should be used deliberately because adapters may update existing DOM.

## 10. Events

The runtime dispatches one of these window events after each run:

```text
cudfirm:template-ready
cudfirm:template-failed
```

The event `detail` contains the runtime report.

## 11. Status values

```text
idle
loading-template
loading-data
waiting-for-mounts
validating
rendering
ready
ready-with-warnings
degraded
failed
```

`degraded` means initialization completed but one or more isolated rendering operations failed. `failed` means the selected template could not safely enter the rendering phase.

## 12. Security invariants

The runtime and every adapter must preserve these rules:

- RLS remains enabled.
- Public data comes only from the normalized public CMS contract and intended public extension namespaces.
- Service-role and server-only secrets are never embedded in template code.
- Authorization remains enforced in PostgreSQL RLS and Storage policies.
- Templates do not duplicate authentication, dashboard roles, backup, audit, or Supabase data logic.
- Protected security-definer functions are not altered by template integration.
