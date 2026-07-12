/**
 * CUDFIRM template registry.
 * Only explicitly registered local templates may be activated.
 */
(function () {
  'use strict';

  const templates = new Map();

  function register(templateId, definition) {
    if (!/^[a-z0-9-]+$/.test(templateId || '')) {
      throw new Error('Invalid CUDFIRM template ID.');
    }
    if (!definition || !definition.manifest || !definition.adapter) {
      throw new Error(`Template "${templateId}" is missing its manifest or adapter.`);
    }
    templates.set(templateId, Object.freeze({ ...definition }));
  }

  function get(templateId) {
    return templates.get(templateId) || null;
  }

  function has(templateId) {
    return templates.has(templateId);
  }

  window.CUDFIRMTemplateRegistry = Object.freeze({ register, get, has });
})();
