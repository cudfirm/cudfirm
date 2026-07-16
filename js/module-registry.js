/**
 * CUDFIRM extension-module registry.
 * Only explicitly registered local modules may be initialized.
 */
(function () {
  'use strict';

  const modules = new Map();
  const VALID_ID = /^[a-z0-9-]+$/;

  function register(moduleId, definition) {
    if (!VALID_ID.test(moduleId || '')) {
      throw new Error('Invalid CUDFIRM module ID.');
    }
    if (!definition || !definition.manifest) {
      throw new Error(`Module "${moduleId}" is missing its manifest.`);
    }
    if (definition.manifest?.module?.id !== moduleId) {
      throw new Error(`Module registration ID "${moduleId}" does not match its manifest ID.`);
    }
    if (modules.has(moduleId)) {
      throw new Error(`Module "${moduleId}" is already registered.`);
    }

    modules.set(moduleId, Object.freeze({
      manifest: definition.manifest,
      runtime: definition.runtime || null,
      api: definition.api || null,
      contract: definition.contract || null,
      metadata: Object.freeze({
        registeredAt: new Date().toISOString(),
        source: definition.metadata?.source || 'local',
        entry: definition.metadata?.entry || '',
      }),
    }));
  }

  function get(moduleId) {
    return modules.get(moduleId) || null;
  }

  function has(moduleId) {
    return modules.has(moduleId);
  }

  function list() {
    return Array.from(modules.entries()).map(([id, definition]) => Object.freeze({
      id,
      name: definition.manifest?.module?.name || id,
      version: definition.manifest?.module?.version || '',
      category: definition.manifest?.module?.category || '',
      metadata: definition.metadata,
    }));
  }

  function entries() {
    return Array.from(modules.entries()).map(([id, definition]) => Object.freeze({ id, definition }));
  }

  window.CUDFIRMModuleRegistry = Object.freeze({ register, get, has, list, entries });
})();
