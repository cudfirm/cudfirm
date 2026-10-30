/**
 * CUDFIRM template registry.
 * Only explicitly registered local templates may be activated.
 */
(function () {
  'use strict';

  const templates = new Map();
  const VALID_ID = /^[a-z0-9-]+$/;

  function register(templateId, definition) {
    if (!VALID_ID.test(templateId || '')) {
      throw new Error('Invalid CUDFIRM template ID.');
    }
    if (!definition || !definition.manifest || !definition.adapter) {
      throw new Error(`Template "${templateId}" is missing its manifest or adapter.`);
    }
    if (definition.manifest?.template?.id !== templateId) {
      throw new Error(`Template registration ID "${templateId}" does not match its manifest ID.`);
    }
    if (templates.has(templateId)) {
      throw new Error(`Template "${templateId}" is already registered.`);
    }

    templates.set(templateId, Object.freeze({
      manifest: definition.manifest,
      adapter: definition.adapter,
      metadata: Object.freeze({
        registeredAt: new Date().toISOString(),
        source: definition.metadata?.source || 'local',
        entry: definition.metadata?.entry || '',
      }),
    }));
  }

  function get(templateId) {
    return templates.get(templateId) || null;
  }

  function has(templateId) {
    return templates.has(templateId);
  }

  function list() {
    return Array.from(templates.entries()).map(([id, definition]) => Object.freeze({
      id,
      name: definition.manifest?.template?.name || id,
      version: definition.manifest?.template?.version || '',
      metadata: definition.metadata,
    }));
  }

  window.CUDFIRMTemplateRegistry = Object.freeze({ register, get, has, list });
})();
