/**
 * CUDFIRM shared template runtime.
 *
 * Resolves one explicitly registered template, validates it against the
 * normalized CMS contract, and invokes its adapter renderers without
 * duplicating Supabase, dashboard, authentication, or security logic.
 */
(function () {
  'use strict';

  const RUNTIME_VERSION = '1.1.0';
  const DEFAULT_CORE_VERSION = '2.0.0';
  const DEFAULT_TEMPLATE_ID = 'cudfirm-default';
  const DEFAULT_MOUNT_TIMEOUT_MS = 5000;

  const state = {
    status: 'idle',
    template: null,
    manifest: null,
    adapter: null,
    registration: null,
    data: null,
    compatibility: null,
    sectionReports: {},
    renderedSections: [],
    skippedSections: [],
    externallyManagedSections: [],
    failedSections: [],
    warnings: [],
    errors: [],
    startedAt: null,
    completedAt: null,
    report: null,
  };

  let activeInitialization = null;
  let readyResolved = false;
  let resolveReady;

  window.CUDFIRMTemplateReady = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function runtimeConfig() {
    const config = window.CUDFIRM_CONFIG?.templateRuntime;
    return config && typeof config === 'object' ? config : {};
  }

  function resolveCoreVersion() {
    return window.CUDFIRM_CONFIG?.coreVersion
      || window.CUDFIRM_CORE_VERSION
      || DEFAULT_CORE_VERSION;
  }

  function resolveMountTimeout(options = {}) {
    const configured = Number(options.mountTimeoutMs ?? runtimeConfig().mountTimeoutMs);
    if (!Number.isFinite(configured)) return DEFAULT_MOUNT_TIMEOUT_MS;
    return Math.max(0, Math.min(configured, 30000));
  }

  function getPath(object, path) {
    if (!path) return undefined;
    return String(path).split('.').reduce((value, key) => (
      value == null ? undefined : value[key]
    ), object);
  }

  function resetState() {
    state.status = 'idle';
    state.template = null;
    state.manifest = null;
    state.adapter = null;
    state.registration = null;
    state.data = null;
    state.compatibility = null;
    state.sectionReports = {};
    state.renderedSections = [];
    state.skippedSections = [];
    state.externallyManagedSections = [];
    state.failedSections = [];
    state.warnings = [];
    state.errors = [];
    state.startedAt = null;
    state.completedAt = null;
    state.report = null;
  }

  function addWarning(message) {
    if (message && !state.warnings.includes(message)) state.warnings.push(message);
  }

  function addError(message) {
    if (message && !state.errors.includes(message)) state.errors.push(message);
  }

  function waitForSelector(selector, timeoutMs) {
    if (!selector || typeof document?.querySelector !== 'function') {
      return Promise.resolve(null);
    }

    const immediate = document.querySelector(selector);
    if (immediate || timeoutMs === 0) return Promise.resolve(immediate);

    return new Promise((resolve) => {
      let settled = false;
      let observer = null;

      const finish = (element) => {
        if (settled) return;
        settled = true;
        observer?.disconnect?.();
        clearTimeout(timer);
        resolve(element || null);
      };

      if (typeof MutationObserver === 'function' && document.documentElement) {
        observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) finish(element);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }

      const timer = setTimeout(() => finish(document.querySelector(selector)), timeoutMs);
    });
  }

  async function resolveMounts(manifest, timeoutMs) {
    const entries = Object.entries(manifest?.sections || {}).filter(([, section]) => (
      section?.enabled
      && (section.managedBy || 'adapter') === 'adapter'
      && typeof section.mount === 'string'
      && section.mount
    ));

    const resolved = await Promise.all(entries.map(async ([sectionName, section]) => [
      sectionName,
      await waitForSelector(section.mount, timeoutMs),
    ]));

    return new Map(resolved);
  }

  function isEmptyList(value) {
    return Array.isArray(value) && value.length === 0;
  }

  function setSectionReport(sectionName, details) {
    const report = Object.freeze({
      name: sectionName,
      status: details.status,
      managedBy: details.managedBy || 'adapter',
      required: Boolean(details.required),
      source: details.source || '',
      mount: details.mount || '',
      renderer: details.renderer || '',
      reason: details.reason || '',
      durationMs: Number.isFinite(details.durationMs) ? details.durationMs : 0,
    });
    state.sectionReports[sectionName] = report;
    return report;
  }

  function markSection(sectionName, section, status, reason = '', durationMs = 0) {
    setSectionReport(sectionName, {
      status,
      managedBy: section?.managedBy || 'adapter',
      required: section?.required,
      source: section?.source || sectionName,
      mount: section?.mount,
      renderer: section?.renderer,
      reason,
      durationMs,
    });

    if (status === 'rendered') state.renderedSections.push(sectionName);
    if (status === 'skipped') state.skippedSections.push(sectionName);
    if (status === 'externally-managed') state.externallyManagedSections.push(sectionName);
    if (status === 'failed') state.failedSections.push(sectionName);
  }

  function createSafeMessage(message, kind) {
    if (typeof document?.createElement !== 'function') return null;
    const element = document.createElement('div');
    element.className = `cudfirm-template-${kind || 'message'}`;
    element.dataset.cudfirmTemplateMessage = kind || 'message';
    element.setAttribute('role', 'status');
    element.textContent = message;
    return element;
  }

  function applyFallback(mount, policy, message) {
    if (!mount || !policy) return;

    if (policy === 'hide' || policy === 'hide-section' || policy === 'warn-and-hide') {
      mount.hidden = true;
      mount.dataset.cudfirmTemplateFallback = policy;
      return;
    }

    if (policy === 'show-empty-state' || policy === 'show-safe-error') {
      const element = createSafeMessage(message, policy === 'show-safe-error' ? 'error' : 'empty');
      if (element && typeof mount.replaceChildren === 'function') {
        mount.replaceChildren(element);
        mount.dataset.cudfirmTemplateFallback = policy;
      }
      return;
    }

    if (policy === 'show-fallback') {
      mount.dataset.cudfirmTemplateFallback = policy;
    }
  }

  function emit(name, detail) {
    if (typeof window.dispatchEvent !== 'function' || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new window.CustomEvent(name, { detail }));
  }

  function runtimeContext(extra = {}) {
    return Object.freeze({
      templateId: state.template,
      coreVersion: resolveCoreVersion(),
      runtimeVersion: RUNTIME_VERSION,
      manifest: state.manifest,
      registration: state.registration,
      contract: state.data,
      data: state.data,
      runtime: window.CUDFIRM_RUNTIME,
      ...extra,
    });
  }

  async function invokeAdapterHook(name, context, options = {}) {
    const hook = state.adapter?.[name];
    if (typeof hook !== 'function') return undefined;

    try {
      return await hook(context);
    } catch (error) {
      const phase = options.phase || name;
      const message = `${phase}: ${error.message}`;
      if (options.warningOnly) addWarning(message);
      else addError(message);

      if (name !== 'onError' && typeof state.adapter?.onError === 'function') {
        try {
          await state.adapter.onError(runtimeContext({
            phase,
            error,
            sectionName: options.sectionName || '',
          }));
        } catch (onErrorFailure) {
          addWarning(`onError: ${onErrorFailure.message}`);
        }
      }

      if (options.rethrow) throw error;
      return undefined;
    }
  }

  function buildReport() {
    return Object.freeze({
      compatible: Boolean(state.compatibility?.compatible) && state.errors.length === 0,
      status: state.status,
      runtimeVersion: RUNTIME_VERSION,
      coreVersion: resolveCoreVersion(),
      template: Object.freeze({
        id: state.template || '',
        name: state.manifest?.template?.name || '',
        version: state.manifest?.template?.version || '',
        registration: state.registration || null,
      }),
      contractVersion: state.data?.meta?.contractVersion || '',
      compatibility: state.compatibility,
      sections: Object.freeze({ ...state.sectionReports }),
      renderedSections: Object.freeze([...state.renderedSections]),
      skippedSections: Object.freeze([...state.skippedSections]),
      externallyManagedSections: Object.freeze([...state.externallyManagedSections]),
      failedSections: Object.freeze([...state.failedSections]),
      warnings: Object.freeze([...state.warnings]),
      errors: Object.freeze([...state.errors]),
      startedAt: state.startedAt,
      completedAt: state.completedAt,
    });
  }

  function finish(status) {
    state.status = status;
    state.completedAt = new Date().toISOString();
    state.report = buildReport();

    if (!readyResolved) {
      readyResolved = true;
      resolveReady(state.report);
    }

    emit(status === 'failed' ? 'cudfirm:template-failed' : 'cudfirm:template-ready', state.report);
    return state.report;
  }

  async function performInitialization(options = {}) {
    resetState();
    state.startedAt = new Date().toISOString();

    try {
      state.status = 'loading-template';
      const templateId = options.templateId
        || window.CUDFIRM_CONFIG?.templateId
        || DEFAULT_TEMPLATE_ID;
      const registered = window.CUDFIRMTemplateRegistry?.get?.(templateId);

      if (!registered) throw new Error(`Template "${templateId}" is not registered.`);
      if (!window.CUDFIRMTemplateValidator?.validate) {
        throw new Error('The CUDFIRM template validator is unavailable.');
      }

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
        extensions: window.CUDFIRMModuleRuntime?.getExtensions?.()
          || baseContract.extensions
          || {},
      };

      state.status = 'waiting-for-mounts';
      const mounts = await resolveMounts(state.manifest, resolveMountTimeout(options));

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
          coreVersion: resolveCoreVersion(),
          registration: state.registration,
          moduleCompatibility,
        },
      );

      (state.compatibility.warnings || []).forEach(addWarning);
      (state.compatibility.errors || []).forEach(addError);

      if (!state.compatibility.compatible) {
        console.error('[CUDFIRM Template Runtime] Compatibility failed.', state.compatibility);
        return finish('failed');
      }

      await invokeAdapterHook('initialize', runtimeContext(), {
        phase: 'adapter.initialize',
        rethrow: true,
      });

      state.status = 'rendering';
      for (const [sectionName, section] of Object.entries(state.manifest.sections || {})) {
        if (!section?.enabled) continue;

        const managedBy = section.managedBy || 'adapter';
        if (managedBy !== 'adapter') {
          markSection(sectionName, section, 'externally-managed', `Managed by ${managedBy}.`);
          continue;
        }

        const started = Date.now();
        const mount = mounts.get(sectionName) || document.querySelector(section.mount);
        const renderer = state.adapter?.[section.renderer];
        const sectionData = getPath(state.data, section.source || sectionName);

        if (!mount) {
          const message = `${sectionName}: mount ${section.mount || '(missing)'} was not found.`;
          section.required ? addError(message) : addWarning(message);
          markSection(sectionName, section, section.required ? 'failed' : 'skipped', 'missing-mount', Date.now() - started);
          continue;
        }

        if (typeof renderer !== 'function') {
          const message = `${sectionName}: renderer ${section.renderer || '(missing)'} is unavailable.`;
          section.required ? addError(message) : addWarning(message);
          applyFallback(mount, state.manifest.fallbacks?.rendererFailure, 'This section is temporarily unavailable.');
          markSection(sectionName, section, section.required ? 'failed' : 'skipped', 'missing-renderer', Date.now() - started);
          continue;
        }

        if (sectionData === undefined || sectionData === null) {
          const message = `${sectionName}: contract source ${section.source || sectionName} is unavailable.`;
          section.required ? addError(message) : addWarning(message);
          const policy = section.required
            ? state.manifest.fallbacks?.missingRequiredSection
            : state.manifest.fallbacks?.missingOptionalSection;
          applyFallback(mount, policy, 'This section is currently unavailable.');
          markSection(sectionName, section, section.required ? 'failed' : 'skipped', 'missing-data', Date.now() - started);
          continue;
        }

        if (isEmptyList(sectionData)) {
          applyFallback(mount, state.manifest.fallbacks?.emptyList, 'No content is available yet.');
          markSection(sectionName, section, 'skipped', 'empty-list', Date.now() - started);
          continue;
        }

        const sectionContext = runtimeContext({
          sectionName,
          sectionConfig: section,
          mount,
          sectionData,
          site: state.data.site,
          theme: state.data.theme,
        });

        try {
          await invokeAdapterHook('beforeRender', sectionContext, {
            phase: `${sectionName}.beforeRender`,
            sectionName,
            rethrow: true,
          });

          const rendered = await renderer({
            mount,
            data: sectionData,
            site: state.data.site,
            theme: state.data.theme,
            contract: state.data,
            sectionConfig: section,
            manifest: state.manifest,
            runtime: Object.freeze({
              templateId,
              sectionName,
              coreVersion: resolveCoreVersion(),
              runtimeVersion: RUNTIME_VERSION,
            }),
          });

          if (rendered === false) {
            markSection(sectionName, section, 'skipped', 'renderer-declined', Date.now() - started);
            continue;
          }

          markSection(sectionName, section, 'rendered', '', Date.now() - started);
          await invokeAdapterHook('afterRender', runtimeContext({
            ...sectionContext,
            result: rendered,
          }), {
            phase: `${sectionName}.afterRender`,
            sectionName,
            warningOnly: true,
          });
        } catch (error) {
          const message = `${sectionName}: ${error.message}`;
          addError(message);
          applyFallback(mount, state.manifest.fallbacks?.rendererFailure, 'This section is temporarily unavailable.');
          markSection(sectionName, section, 'failed', 'renderer-failure', Date.now() - started);
          console.error(`[CUDFIRM Template Runtime] ${sectionName} renderer failed.`, error);
        }
      }

      const provisionalStatus = state.errors.length
        ? 'degraded'
        : state.warnings.length
          ? 'ready-with-warnings'
          : 'ready';

      state.status = provisionalStatus;
      const provisionalReport = buildReport();
      await invokeAdapterHook('complete', runtimeContext({ report: provisionalReport }), {
        phase: 'adapter.complete',
        warningOnly: true,
      });

      const finalStatus = state.errors.length
        ? 'degraded'
        : state.warnings.length
          ? 'ready-with-warnings'
          : 'ready';
      const report = finish(finalStatus);

      console.info('[CUDFIRM Template Runtime] Template ready.', {
        template: state.template,
        version: state.manifest.template.version,
        status: report.status,
        renderedSections: [...state.renderedSections],
        externallyManagedSections: [...state.externallyManagedSections],
        installedModules: window.CUDFIRMModuleRuntime?.list?.() || [],
        warnings: [...state.warnings],
      });
      return report;
    } catch (error) {
      addError(error.message);
      await invokeAdapterHook('onError', runtimeContext({ phase: state.status, error }), {
        phase: state.status,
        warningOnly: true,
      });
      console.error('[CUDFIRM Template Runtime] Initialization failed.', error);
      return finish('failed');
    }
  }

  function initialize(options = {}) {
    const force = Boolean(options.force);
    if (activeInitialization) return activeInitialization;
    if (state.report && !force) return Promise.resolve(state.report);

    activeInitialization = performInitialization(options).finally(() => {
      activeInitialization = null;
    });
    return activeInitialization;
  }

  function getSectionReport(sectionName) {
    return state.sectionReports[sectionName] || null;
  }

  const coreVersion = resolveCoreVersion();
  window.CUDFIRM_CORE_VERSION = coreVersion;
  window.CUDFIRM_TEMPLATE_RUNTIME_VERSION = RUNTIME_VERSION;
  window.CUDFIRM_RUNTIME = Object.freeze({
    initialize,
    reload: (options = {}) => initialize({ ...options, force: true }),
    whenReady: () => activeInitialization
      || (state.report ? Promise.resolve(state.report) : window.CUDFIRMTemplateReady),
    getStatus: () => state.status,
    getTemplate: () => state.template,
    getManifest: () => state.manifest,
    getRegistration: () => state.registration,
    getCompatibilityReport: () => state.compatibility,
    getModuleCompatibilityReport: () => state.compatibility?.capabilities?.modules?.compatibility || null,
    getData: () => state.data,
    getReport: () => state.report,
    getSectionReport,
  });

  if (runtimeConfig().autoStart !== false) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
    } else {
      Promise.resolve().then(() => initialize());
    }
  }
})();
