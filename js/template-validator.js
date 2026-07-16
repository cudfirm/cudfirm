/**
 * CUDFIRM template manifest and runtime compatibility validator.
 */
(function () {
  'use strict';

  const VALID_ID = /^[a-z0-9-]+$/;
  const VALID_VERSION = /^\d+\.\d+\.\d+$/;
  const VALID_ROUTE_MODES = new Set(['single-page', 'single-page-tabs', 'multi-page', 'hybrid']);
  const VALID_FALLBACKS = {
    missingRequiredSection: new Set(['error', 'show-fallback', 'warn-and-hide']),
    missingOptionalSection: new Set(['ignore', 'hide']),
    missingRequiredField: new Set(['error', 'warn-and-hide', 'keep-legacy']),
    missingOptionalField: new Set(['ignore', 'keep-legacy']),
    missingImage: new Set(['hide-image', 'use-placeholder', 'keep-legacy']),
    emptyList: new Set(['hide-section', 'show-empty-state', 'keep-legacy']),
    rendererFailure: new Set(['show-safe-error', 'keep-legacy', 'warn-and-hide']),
  };

  function getPath(object, path) {
    return String(path || '').split('.').reduce((value, key) => (
      value == null ? undefined : value[key]
    ), object);
  }

  function isEmpty(value) {
    return value === undefined || value === null || value === '';
  }

  function parseVersion(value) {
    const match = String(value || '').match(/^(\d+)\.(\d+)\.(\d+)$/);
    return match ? match.slice(1).map(Number) : null;
  }

  function compareVersions(left, right) {
    const a = parseVersion(left);
    const b = parseVersion(right);
    if (!a || !b) return null;
    for (let index = 0; index < 3; index += 1) {
      if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
    }
    return 0;
  }

  function matchesVersionRange(version, minimum, maximum) {
    if (!parseVersion(version)) return false;
    if (minimum && compareVersions(version, minimum) < 0) return false;
    if (!maximum) return true;
    if (/^\d+\.x$/.test(maximum)) return Number(version.split('.')[0]) === Number(maximum.split('.')[0]);
    if (/^\d+\.\d+\.x$/.test(maximum)) {
      const [major, minor] = maximum.split('.').map(Number);
      const [actualMajor, actualMinor] = version.split('.').map(Number);
      return actualMajor === major && actualMinor === minor;
    }
    return compareVersions(version, maximum) <= 0;
  }

  function validate(manifest, adapter, data, context = {}) {
    const errors = [];
    const warnings = [];
    const missingMounts = [];
    const missingRenderers = [];
    const missingFields = [];
    const missingItemFields = [];
    const unsupportedFeatures = [];
    const invalidSettings = [];

    if (!manifest || typeof manifest !== 'object') errors.push('Manifest is missing.');
    if (!manifest?.template?.id || !VALID_ID.test(manifest.template.id)) errors.push('Template ID is invalid.');
    if (!VALID_VERSION.test(manifest?.template?.version || '')) errors.push('Template version must use semantic versioning (x.y.z).');
    if (!VALID_VERSION.test(manifest?.schemaVersion || '')) errors.push('Manifest schemaVersion must use semantic versioning (x.y.z).');
    if (!manifest?.sections || typeof manifest.sections !== 'object') errors.push('Manifest sections are missing.');

    const contractVersion = data?.meta?.contractVersion || '';
    const coreVersion = context.coreVersion || '';
    const compatibility = manifest?.compatibility || {};

    if (!matchesVersionRange(contractVersion, compatibility.minimumContractVersion, compatibility.maximumContractVersion)) {
      errors.push(`CMS contract ${contractVersion || '(missing)'} is outside the supported range ${compatibility.minimumContractVersion || '*'}–${compatibility.maximumContractVersion || '*'}.`);
    }
    if (compatibility.requiredCoreVersion && compareVersions(coreVersion, compatibility.requiredCoreVersion) < 0) {
      errors.push(`CUDFIRM core ${coreVersion || '(missing)'} does not satisfy required version ${compatibility.requiredCoreVersion}.`);
    }
    if (Array.isArray(compatibility.supportedLocales) && compatibility.supportedLocales.length) {
      const locale = data?.meta?.locale || '';
      if (locale && !compatibility.supportedLocales.includes(locale)) {
        warnings.push(`Locale ${locale} is not declared as supported by this template.`);
      }
    }

    if (manifest?.routes) {
      if (!VALID_ROUTE_MODES.has(manifest.routes.mode)) {
        errors.push(`Route mode "${manifest.routes.mode || '(missing)'}" is invalid.`);
        invalidSettings.push('routes.mode');
      }
      if (!manifest.routes.pages || typeof manifest.routes.pages !== 'object') {
        errors.push('Route page mappings are missing.');
        invalidSettings.push('routes.pages');
      }
    }

    Object.entries(manifest?.fallbacks || {}).forEach(([key, value]) => {
      if (VALID_FALLBACKS[key] && !VALID_FALLBACKS[key].has(value)) {
        errors.push(`Fallback ${key} has unsupported value "${value}".`);
        invalidSettings.push(`fallbacks.${key}`);
      }
    });

    Object.entries(manifest?.sections || {}).forEach(([sectionName, section]) => {
      if (!section?.enabled) return;
      const managedBy = section.managedBy || 'adapter';
      const sectionData = getPath(data, section.source || sectionName);

      if (managedBy === 'adapter') {
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
      } else if (managedBy !== 'legacy-core' && managedBy !== 'shared-core') {
        errors.push(`${sectionName}: managedBy value "${managedBy}" is unsupported.`);
        invalidSettings.push(`sections.${sectionName}.managedBy`);
      }

      (section.requiredFields || []).forEach((field) => {
        const value = getPath(sectionData, field);
        if (isEmpty(value)) {
          (section.required ? errors : warnings).push(`${sectionName}: required field ${field} is empty.`);
          missingFields.push(`${sectionName}.${field}`);
        }
      });

      if (Array.isArray(sectionData) && Array.isArray(section.itemRequiredFields)) {
        sectionData.forEach((item, index) => {
          section.itemRequiredFields.forEach((field) => {
            if (isEmpty(getPath(item, field))) {
              warnings.push(`${sectionName}[${index}]: required item field ${field} is empty; the adapter may skip this item.`);
              missingItemFields.push(`${sectionName}[${index}].${field}`);
            }
          });
        });
      }
    });

    if (manifest?.seo?.enabled) {
      if (!manifest.seo.pageResolution?.fallbackPageKey) {
        warnings.push('SEO fallback page key is not declared.');
        invalidSettings.push('seo.pageResolution.fallbackPageKey');
      }
      if (!Array.isArray(manifest.seo.supportedFields) || !manifest.seo.supportedFields.length) {
        warnings.push('SEO supportedFields are not declared.');
      }
    }

    if (manifest?.theme?.enabled && (!manifest.theme.cssVariableMap || typeof manifest.theme.cssVariableMap !== 'object')) {
      warnings.push('Theme CSS variable mapping is missing.');
      invalidSettings.push('theme.cssVariableMap');
    }

    Object.entries(manifest?.forms || {}).forEach(([formName, form]) => {
      if (!form?.managedBy) warnings.push(`${formName} form does not declare which core layer manages submission.`);
      if (form?.formSelector && !document.querySelector(form.formSelector)) {
        warnings.push(`${formName} form selector ${form.formSelector} was not found on the initial page state.`);
      }
    });

    Object.entries(manifest?.features || {}).forEach(([feature, supported]) => {
      if (supported === false) unsupportedFeatures.push(feature);
    });

    const moduleCompatibility = context.moduleCompatibility || {
      compatible: true,
      status: 'compatible',
      required: [],
      optional: [],
      installed: [],
      errors: [],
      warnings: [],
    };
    errors.push(...(moduleCompatibility.errors || []));
    warnings.push(...(moduleCompatibility.warnings || []));

    return {
      compatible: errors.length === 0,
      status: errors.length ? 'incompatible' : warnings.length ? 'compatible-with-warnings' : 'compatible',
      template: {
        id: manifest?.template?.id || '',
        version: manifest?.template?.version || '',
        registration: context.registration || null,
      },
      versions: {
        manifestSchema: manifest?.schemaVersion || '',
        contract: contractVersion,
        core: coreVersion,
        requiredCore: compatibility.requiredCoreVersion || '',
        contractRange: {
          minimum: compatibility.minimumContractVersion || '',
          maximum: compatibility.maximumContractVersion || '',
        },
      },
      capabilities: {
        routes: manifest?.routes || null,
        seo: manifest?.seo || null,
        theme: manifest?.theme || null,
        navigation: manifest?.sections?.navigation || null,
        modules: {
          requirements: manifest?.modules || { required: [], optional: [] },
          compatibility: moduleCompatibility,
        },
      },
      errors,
      warnings,
      missingMounts,
      missingRenderers,
      missingFields,
      missingItemFields,
      unsupportedFeatures,
      invalidSettings,
    };
  }

  window.CUDFIRMTemplateValidator = Object.freeze({ validate });
})();
