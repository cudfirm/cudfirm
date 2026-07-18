/**
 * Active CUDFIRM template selection for this deployment.
 *
 * Client deployments may replace `templateId` with another explicitly
 * registered compatible template without changing the shared runtime.
 */
(function () {
  'use strict';

  const existing = window.CUDFIRM_CONFIG && typeof window.CUDFIRM_CONFIG === 'object'
    ? window.CUDFIRM_CONFIG
    : {};
  const existingRuntime = existing.templateRuntime && typeof existing.templateRuntime === 'object'
    ? existing.templateRuntime
    : {};

  window.CUDFIRM_CONFIG = Object.freeze({
    ...existing,
    coreVersion: existing.coreVersion || '2.0.0',
    templateId: existing.templateId || 'cudfirm-default',
    templateRuntime: Object.freeze({
      ...existingRuntime,
      autoStart: existingRuntime.autoStart !== false,
      mountTimeoutMs: existingRuntime.mountTimeoutMs ?? 5000,
    }),
  });
})();
