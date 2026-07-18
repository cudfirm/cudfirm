/** CUDTEMP page-specific template selection. */
(function () {
  'use strict';
  const existing = window.CUDFIRM_CONFIG && typeof window.CUDFIRM_CONFIG === 'object' ? window.CUDFIRM_CONFIG : {};
  window.CUDFIRM_CONFIG = {
    ...existing,
    coreVersion: existing.coreVersion || '2.0.0',
    templateId: 'cudtemp',
    templateRuntime: { ...(existing.templateRuntime || {}), autoStart: true, mountTimeoutMs: 5000 },
  };
})();
