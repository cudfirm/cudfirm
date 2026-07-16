/**
 * CUDFIRM shared template runtime — Adapter 1 compatibility phase.
 */
(function () {
  'use strict';

  const CORE_VERSION = '2.0.0';
  const state = {
    status: 'idle',
    template: null,
    manifest: null,
    adapter: null,
    registration: null,
    data: null,
    compatibility: null,
    renderedSections: [],
    skippedSections: [],
    warnings: [],
    errors: [],
  };

  function waitForSelector(selector, timeoutMs = 5000) {
    return new Promise((resolve) => {
      const immediate = document.querySelector(selector);
      if (immediate) return resolve(immediate);

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeoutMs);
    });
  }

  async function initialize() {
    try {
      state.status = 'loading-template';
      const templateId = window.CUDFIRM_CONFIG?.templateId || 'cudfirm-default';
      const registered = window.CUDFIRMTemplateRegistry?.get(templateId);
      if (!registered) throw new Error(`Template "${templateId}" is not registered.`);

      state.template = templateId;
      state.manifest = registered.manifest;
      state.adapter = registered.adapter;
      state.registration = registered.metadata || null;

      state.status = 'loading-data';
      await (window.CMSReady || Promise.resolve());
      await (window.CUDFIRMModulesReady || Promise.resolve());

      const baseContract = window.CMSContract || null;
      if (!baseContract) throw new Error('The normalized CMS data contract is unavailable.');
      state.data = {
        ...baseContract,
        extensions: window.CUDFIRMModuleRuntime?.getExtensions?.() || baseContract.extensions || {},
      };

      const mounts = Object.values(state.manifest.sections || {})
        .filter((section) => section.enabled && (section.managedBy || 'adapter') === 'adapter' && section.mount)
        .map((section) => waitForSelector(section.mount));
      await Promise.all(mounts);

      state.status = 'validating';
      const moduleCompatibility = window.CUDFIRMModuleRuntime?.checkTemplateRequirements?.(
        state.manifest.modules || { required: [], optional: [] },
      ) || {
        compatible: true,
        status: 'compatible',
        required: [],
        optional: [],
        installed: [],
        errors: [],
        warnings: [],
      };
      state.compatibility = window.CUDFIRMTemplateValidator.validate(
        state.manifest,
        state.adapter,
        state.data,
        {
          coreVersion: CORE_VERSION,
          registration: state.registration,
          moduleCompatibility,
        },
      );
      state.warnings.push(...state.compatibility.warnings);
      state.errors.push(...state.compatibility.errors);

      if (!state.compatibility.compatible) {
        state.status = 'failed';
        console.error('[CUDFIRM Runtime] Template compatibility failed.', state.compatibility);
        return;
      }

      state.status = 'rendering';
      for (const [sectionName, sectionConfig] of Object.entries(state.manifest.sections || {})) {
        if (!sectionConfig.enabled) continue;
        if ((sectionConfig.managedBy || 'adapter') !== 'adapter') {
          state.skippedSections.push(sectionName);
          continue;
        }

        const mount = document.querySelector(sectionConfig.mount);
        const renderer = state.adapter[sectionConfig.renderer];
        const data = state.data[sectionConfig.source || sectionName];

        if (!mount || typeof renderer !== 'function' || !data) {
          state.skippedSections.push(sectionName);
          continue;
        }

        try {
          const rendered = renderer({
            mount,
            data,
            site: state.data.site,
            theme: state.data.theme,
            contract: state.data,
            sectionConfig,
            manifest: state.manifest,
            runtime: Object.freeze({ templateId, sectionName, coreVersion: CORE_VERSION }),
          });
          (rendered === false ? state.skippedSections : state.renderedSections).push(sectionName);
        } catch (error) {
          state.errors.push(`${sectionName}: ${error.message}`);
          state.skippedSections.push(sectionName);
          console.error(`[CUDFIRM Runtime] ${sectionName} renderer failed.`, error);
        }
      }

      state.status = state.errors.length ? 'degraded' : 'ready';
      console.info('[CUDFIRM Runtime] Adapter 1 ready.', {
        template: templateId,
        version: state.manifest.template.version,
        status: state.compatibility.status,
        renderedSections: [...state.renderedSections],
        externallyManagedSections: Object.entries(state.manifest.sections || {})
          .filter(([, section]) => section.enabled && (section.managedBy || 'adapter') !== 'adapter')
          .map(([name]) => name),
        installedModules: window.CUDFIRMModuleRuntime?.list?.() || [],
        warnings: [...state.warnings],
      });
    } catch (error) {
      state.status = 'failed';
      state.errors.push(error.message);
      console.error('[CUDFIRM Runtime] Initialization failed.', error);
    }
  }

  window.CUDFIRM_CORE_VERSION = CORE_VERSION;
  window.CUDFIRM_RUNTIME = Object.freeze({
    getStatus: () => state.status,
    getTemplate: () => state.template,
    getManifest: () => state.manifest,
    getRegistration: () => state.registration,
    getCompatibilityReport: () => state.compatibility,
    getModuleCompatibilityReport: () => state.compatibility?.capabilities?.modules?.compatibility || null,
    getData: () => state.data,
  });

  document.addEventListener('DOMContentLoaded', initialize);
})();
