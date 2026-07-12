/**
 * Minimal manifest/runtime validator for the Adapter 1 compatibility phase.
 */
(function () {
  'use strict';

  const VALID_ID = /^[a-z0-9-]+$/;

  function getPath(object, path) {
    return String(path || '').split('.').reduce((value, key) => (
      value == null ? undefined : value[key]
    ), object);
  }

  function validate(manifest, adapter, data) {
    const errors = [];
    const warnings = [];
    const missingMounts = [];
    const missingRenderers = [];
    const missingFields = [];

    if (!manifest || typeof manifest !== 'object') errors.push('Manifest is missing.');
    if (!manifest?.template?.id || !VALID_ID.test(manifest.template.id)) errors.push('Template ID is invalid.');
    if (!manifest?.schemaVersion) errors.push('Manifest schemaVersion is missing.');
    if (!manifest?.sections || typeof manifest.sections !== 'object') errors.push('Manifest sections are missing.');

    Object.entries(manifest?.sections || {}).forEach(([sectionName, section]) => {
      if (!section?.enabled) return;

      if (!section.mount || typeof section.mount !== 'string') {
        errors.push(`${sectionName}: mount selector is missing.`);
      } else if (!document.querySelector(section.mount)) {
        (section.required ? errors : warnings).push(`${sectionName}: mount ${section.mount} was not found.`);
        missingMounts.push(sectionName);
      }

      if (!section.renderer || typeof adapter?.[section.renderer] !== 'function') {
        (section.required ? errors : warnings).push(`${sectionName}: renderer ${section.renderer || '(missing)'} is unavailable.`);
        missingRenderers.push(sectionName);
      }

      const sectionData = getPath(data, section.source || sectionName);
      (section.requiredFields || []).forEach((field) => {
        const value = getPath(sectionData, field);
        if (value === undefined || value === null || value === '') {
          (section.required ? errors : warnings).push(`${sectionName}: required field ${field} is empty.`);
          missingFields.push(`${sectionName}.${field}`);
        }
      });
    });

    return {
      compatible: errors.length === 0,
      status: errors.length ? 'incompatible' : warnings.length ? 'compatible-with-warnings' : 'compatible',
      errors,
      warnings,
      missingMounts,
      missingRenderers,
      missingFields,
      unsupportedFeatures: [],
    };
  }

  window.CUDFIRMTemplateValidator = Object.freeze({ validate });
})();
