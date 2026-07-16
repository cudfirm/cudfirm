/**
 * CUDFIRM extension-module runtime foundation.
 * Initializes explicitly registered modules and exposes namespaced extension data.
 */
(function () {
  'use strict';

  const RUNTIME_VERSION = '1.0.0';
  const state = {
    status: 'idle',
    modules: new Map(),
    initializationOrder: [],
    extensions: {},
    warnings: [],
    errors: [],
    report: null,
  };

  let resolveReady;
  window.CUDFIRMModulesReady = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function dependencyList(manifest, type) {
    return (manifest?.dependencies?.[type] || []).map(
      window.CUDFIRMModuleValidator.normalizeDependency,
    );
  }

  function buildInitializationOrder(definitions) {
    const validIds = new Set(definitions.keys());
    const indegree = new Map();
    const dependents = new Map();

    validIds.forEach((id) => {
      indegree.set(id, 0);
      dependents.set(id, []);
    });

    definitions.forEach((definition, id) => {
      dependencyList(definition.manifest, 'required').forEach((dependency) => {
        if (!validIds.has(dependency.id)) return;
        indegree.set(id, (indegree.get(id) || 0) + 1);
        dependents.get(dependency.id).push(id);
      });
    });

    const queue = Array.from(validIds).filter((id) => indegree.get(id) === 0).sort();
    const order = [];
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      dependents.get(id).forEach((dependentId) => {
        indegree.set(dependentId, indegree.get(dependentId) - 1);
        if (indegree.get(dependentId) === 0) {
          queue.push(dependentId);
          queue.sort();
        }
      });
    }

    return {
      order,
      cycles: Array.from(validIds).filter((id) => !order.includes(id)),
    };
  }

  function moduleSnapshot(moduleState) {
    if (!moduleState) return null;
    return Object.freeze({
      manifest: moduleState.manifest,
      registration: moduleState.registration,
      validation: moduleState.validation,
      status: moduleState.status,
      warnings: Object.freeze([...moduleState.warnings]),
      errors: Object.freeze([...moduleState.errors]),
    });
  }

  function moduleVersion(moduleId) {
    return state.modules.get(moduleId)?.manifest?.module?.version || '';
  }

  function checkDependencyVersion(dependency) {
    const installedVersion = moduleVersion(dependency.id);
    if (!installedVersion) return false;
    if (!dependency.minimumVersion) return true;
    return window.CUDFIRMModuleValidator.compareVersions(installedVersion, dependency.minimumVersion) >= 0;
  }

  function attachExtensionsToContract() {
    window.CUDFIRM_EXTENSIONS = state.extensions;
    if (!window.CMSContract || typeof window.CMSContract !== 'object') return;

    try {
      if (Object.isExtensible(window.CMSContract) || Object.hasOwn(window.CMSContract, 'extensions')) {
        window.CMSContract.extensions = state.extensions;
      } else {
        state.warnings.push('The CMS contract is not extensible; module data remains available through CUDFIRMModuleRuntime.');
      }
    } catch (error) {
      state.warnings.push(`Module data could not be attached to CMSContract: ${error.message}`);
    }
  }

  async function getContractData(definition, context) {
    if (typeof definition.contract?.getData === 'function') {
      return (await definition.contract.getData(context)) || {};
    }
    if (definition.contract?.data && typeof definition.contract.data === 'object') {
      return definition.contract.data;
    }
    if (typeof definition.runtime?.getContractData === 'function') {
      return (await definition.runtime.getContractData(context)) || {};
    }
    return {};
  }

  async function initializeModule(moduleId, definition, context) {
    const moduleState = state.modules.get(moduleId);
    moduleState.status = 'initializing';

    const missingRequired = dependencyList(definition.manifest, 'required').filter(
      (dependency) => !checkDependencyVersion(dependency) || state.modules.get(dependency.id)?.status !== 'ready',
    );
    if (missingRequired.length) {
      moduleState.status = 'skipped';
      const message = `${moduleId}: required dependencies are unavailable (${missingRequired.map((item) => item.id).join(', ')}).`;
      moduleState.errors.push(message);
      state.errors.push(message);
      return;
    }

    try {
      if (typeof definition.runtime?.initialize === 'function') {
        await definition.runtime.initialize(Object.freeze({
          ...context,
          moduleId,
          manifest: definition.manifest,
          api: definition.api,
          getModule: (id) => moduleSnapshot(state.modules.get(id)),
        }));
      }

      const namespace = definition.manifest.contract.namespace;
      state.extensions[namespace] = await getContractData(definition, Object.freeze({
        ...context,
        moduleId,
        manifest: definition.manifest,
        api: definition.api,
      }));
      moduleState.status = 'ready';
    } catch (error) {
      moduleState.status = 'failed';
      const message = `${moduleId}: ${error.message}`;
      moduleState.errors.push(message);
      state.errors.push(message);
      console.error(`[CUDFIRM Modules] ${moduleId} initialization failed.`, error);
    }
  }

  function buildReport(coreVersion, contractVersion) {
    const modules = Array.from(state.modules.entries()).map(([id, moduleState]) => ({
      id,
      name: moduleState.manifest?.module?.name || id,
      version: moduleState.manifest?.module?.version || '',
      namespace: moduleState.manifest?.contract?.namespace || '',
      status: moduleState.status,
      validation: moduleState.validation,
      warnings: [...moduleState.warnings],
      errors: [...moduleState.errors],
      registration: moduleState.registration,
    }));

    return {
      compatible: state.errors.length === 0,
      status: state.errors.length ? 'degraded' : state.warnings.length ? 'ready-with-warnings' : 'ready',
      runtimeVersion: RUNTIME_VERSION,
      coreVersion,
      contractVersion,
      installedCount: modules.length,
      initializationOrder: [...state.initializationOrder],
      modules,
      warnings: [...state.warnings],
      errors: [...state.errors],
    };
  }

  async function initialize() {
    try {
      state.status = 'loading';
      await (window.CMSReady || Promise.resolve());

      const coreVersion = window.CUDFIRM_CORE_VERSION || window.CUDFIRM_CONFIG?.coreVersion || '2.0.0';
      const contractVersion = window.CMSContract?.meta?.contractVersion
        || window.CUDFIRMContract?.CONTRACT_VERSION
        || '';
      const registered = window.CUDFIRMModuleRegistry?.entries?.() || [];
      const validDefinitions = new Map();

      state.status = 'validating';
      registered.forEach(({ id, definition }) => {
        const validation = window.CUDFIRMModuleValidator.validateDefinition(definition, {
          coreVersion,
          contractVersion,
        });
        state.modules.set(id, {
          manifest: definition.manifest,
          definition,
          registration: definition.metadata || null,
          validation,
          status: validation.valid ? 'registered' : 'invalid',
          warnings: [...validation.warnings],
          errors: [...validation.errors],
        });
        state.warnings.push(...validation.warnings.map((warning) => `${id}: ${warning}`));
        if (validation.valid) validDefinitions.set(id, definition);
        else state.errors.push(...validation.errors.map((error) => `${id}: ${error}`));
      });

      const namespaceOwners = new Map();
      const tableOwners = new Map();
      const permissionOwners = new Map();
      const addOwnershipError = (id, message) => {
        state.modules.get(id).errors.push(message);
        state.errors.push(message);
      };

      validDefinitions.forEach((definition, id) => {
        const namespace = definition.manifest.contract.namespace;
        if (namespaceOwners.has(namespace)) {
          const owner = namespaceOwners.get(namespace);
          addOwnershipError(id, `${id}: contract namespace "${namespace}" is already owned by "${owner}".`);
          addOwnershipError(owner, `${owner}: contract namespace "${namespace}" is also declared by "${id}".`);
        } else {
          namespaceOwners.set(namespace, id);
        }

        (definition.manifest.database?.tables || []).forEach((table) => {
          if (tableOwners.has(table)) {
            const owner = tableOwners.get(table);
            addOwnershipError(id, `${id}: database table "${table}" is already owned by "${owner}".`);
            addOwnershipError(owner, `${owner}: database table "${table}" is also declared by "${id}".`);
          } else {
            tableOwners.set(table, id);
          }
        });

        (definition.manifest.permissions || []).forEach((permissionDefinition) => {
          const permission = typeof permissionDefinition === 'string'
            ? permissionDefinition
            : permissionDefinition?.id;
          if (!permission) return;
          if (permissionOwners.has(permission)) {
            const owner = permissionOwners.get(permission);
            addOwnershipError(id, `${id}: permission "${permission}" is already owned by "${owner}".`);
            addOwnershipError(owner, `${owner}: permission "${permission}" is also declared by "${id}".`);
          } else {
            permissionOwners.set(permission, id);
          }
        });

        dependencyList(definition.manifest, 'required').forEach((dependency) => {
          const registeredDependency = validDefinitions.get(dependency.id);
          if (!registeredDependency) {
            const message = `${id}: required module "${dependency.id}" is not installed or is invalid.`;
            state.modules.get(id).errors.push(message);
            state.errors.push(message);
          } else if (dependency.minimumVersion && !window.CUDFIRMModuleValidator.matchesVersionRange(
            registeredDependency.manifest.module.version,
            dependency.minimumVersion,
            '',
          )) {
            const message = `${id}: module "${dependency.id}" does not satisfy minimum version ${dependency.minimumVersion}.`;
            state.modules.get(id).errors.push(message);
            state.errors.push(message);
          }
        });

        dependencyList(definition.manifest, 'optional').forEach((dependency) => {
          const optionalDefinition = validDefinitions.get(dependency.id);
          if (!optionalDefinition) {
            const message = `${id}: optional module "${dependency.id}" is not installed.`;
            state.modules.get(id).warnings.push(message);
            state.warnings.push(message);
          } else if (dependency.minimumVersion && !window.CUDFIRMModuleValidator.matchesVersionRange(
            optionalDefinition.manifest.module.version,
            dependency.minimumVersion,
            '',
          )) {
            const message = `${id}: optional module "${dependency.id}" is below version ${dependency.minimumVersion}.`;
            state.modules.get(id).warnings.push(message);
            state.warnings.push(message);
          }
        });
      });

      const dependencyOrder = buildInitializationOrder(validDefinitions);
      state.initializationOrder = dependencyOrder.order;
      dependencyOrder.cycles.forEach((id) => {
        const message = `${id}: circular module dependency detected.`;
        state.modules.get(id).status = 'invalid';
        state.modules.get(id).errors.push(message);
        state.errors.push(message);
      });

      state.status = 'initializing';
      for (const moduleId of dependencyOrder.order) {
        const moduleState = state.modules.get(moduleId);
        if (moduleState.errors.length) {
          moduleState.status = 'skipped';
          continue;
        }
        await initializeModule(moduleId, validDefinitions.get(moduleId), {
          coreVersion,
          contractVersion,
          cms: window.CMSContract || null,
        });
      }

      attachExtensionsToContract();
      state.report = buildReport(coreVersion, contractVersion);
      state.status = state.errors.length ? 'degraded' : 'ready';

      console.info('[CUDFIRM Modules] Runtime ready.', {
        status: state.status,
        installed: state.report.installedCount,
        order: state.report.initializationOrder,
        warnings: state.report.warnings,
      });
    } catch (error) {
      state.status = 'failed';
      state.errors.push(error.message);
      state.report = buildReport(
        window.CUDFIRM_CORE_VERSION || '2.0.0',
        window.CMSContract?.meta?.contractVersion || '',
      );
      console.error('[CUDFIRM Modules] Runtime initialization failed.', error);
    } finally {
      resolveReady(state.report);
    }
  }

  function checkTemplateRequirements(requirements = {}) {
    const errors = [];
    const warnings = [];
    const required = (requirements.required || []).map(window.CUDFIRMModuleValidator.normalizeDependency);
    const optional = (requirements.optional || []).map(window.CUDFIRMModuleValidator.normalizeDependency);
    const requirementIds = [...required, ...optional].map((item) => item.id);

    requirementIds.forEach((id) => {
      if (!/^[a-z0-9-]+$/.test(id || '')) errors.push(`Template module requirement "${id || '(missing)'}" is invalid.`);
    });
    requirementIds.filter((id, index) => id && requirementIds.indexOf(id) !== index)
      .forEach((id) => errors.push(`Template module requirement "${id}" is declared more than once.`));
    [...required, ...optional].forEach((dependency) => {
      if (dependency.minimumVersion && !window.CUDFIRMModuleValidator.parseVersion(dependency.minimumVersion)) {
        errors.push(`Template module requirement "${dependency.id}" has an invalid minimumVersion.`);
      }
    });

    required.forEach((dependency) => {
      const installed = state.modules.get(dependency.id);
      if (!installed || installed.status !== 'ready') {
        errors.push(`Required module "${dependency.id}" is not ready.`);
        return;
      }
      if (dependency.minimumVersion && window.CUDFIRMModuleValidator.compareVersions(
        installed.manifest.module.version,
        dependency.minimumVersion,
      ) < 0) {
        errors.push(`Required module "${dependency.id}" must be at least version ${dependency.minimumVersion}.`);
      }
    });

    optional.forEach((dependency) => {
      const installed = state.modules.get(dependency.id);
      if (!installed || installed.status !== 'ready') {
        warnings.push(`Optional module "${dependency.id}" is not installed.`);
        return;
      }
      if (dependency.minimumVersion && window.CUDFIRMModuleValidator.compareVersions(
        installed.manifest.module.version,
        dependency.minimumVersion,
      ) < 0) {
        warnings.push(`Optional module "${dependency.id}" is below version ${dependency.minimumVersion}.`);
      }
    });

    return {
      compatible: errors.length === 0,
      status: errors.length ? 'incompatible' : warnings.length ? 'compatible-with-warnings' : 'compatible',
      required,
      optional,
      installed: Array.from(state.modules.keys()),
      errors,
      warnings,
    };
  }

  window.CUDFIRM_MODULE_RUNTIME_VERSION = RUNTIME_VERSION;
  window.CUDFIRMModuleRuntime = Object.freeze({
    getStatus: () => state.status,
    list: () => Array.from(state.modules.keys()),
    has: (moduleId) => state.modules.get(moduleId)?.status === 'ready',
    get: (moduleId) => moduleSnapshot(state.modules.get(moduleId)),
    getExtensions: () => state.extensions,
    getCompatibilityReport: () => state.report,
    checkTemplateRequirements,
  });

  document.addEventListener('DOMContentLoaded', initialize);
})();
