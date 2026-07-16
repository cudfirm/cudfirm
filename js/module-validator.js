/**
 * CUDFIRM extension-module manifest and dependency validator.
 */
(function () {
  'use strict';

  const VALID_ID = /^[a-z0-9-]+$/;
  const VALID_NAMESPACE = /^[a-z][a-z0-9-]*$/;
  const VALID_VERSION = /^\d+\.\d+\.\d+$/;
  const VALID_PERMISSION = /^[a-z][a-z0-9_]*$/;
  const VALID_REMOVAL_MODES = new Set(['disable', 'preserve-data', 'full-removal']);

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
    if (/^\d+\.x$/.test(maximum)) {
      return Number(version.split('.')[0]) === Number(maximum.split('.')[0]);
    }
    if (/^\d+\.\d+\.x$/.test(maximum)) {
      const [major, minor] = maximum.split('.').map(Number);
      const [actualMajor, actualMinor] = version.split('.').map(Number);
      return actualMajor === major && actualMinor === minor;
    }
    return compareVersions(version, maximum) <= 0;
  }

  function normalizeDependency(item) {
    if (typeof item === 'string') return { id: item, minimumVersion: '' };
    if (!item || typeof item !== 'object') return { id: '', minimumVersion: '' };
    return {
      id: String(item.id || ''),
      minimumVersion: String(item.minimumVersion || ''),
    };
  }

  function getPermissionId(item) {
    return typeof item === 'string' ? item : String(item?.id || '');
  }

  function findDuplicates(values) {
    const seen = new Set();
    const duplicates = new Set();
    values.forEach((value) => {
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    });
    return Array.from(duplicates);
  }

  function validateManifest(manifest, context = {}) {
    const errors = [];
    const warnings = [];
    const invalidSettings = [];

    if (!manifest || typeof manifest !== 'object') {
      return {
        valid: false,
        status: 'invalid',
        module: { id: '', version: '' },
        errors: ['Module manifest is missing.'],
        warnings,
        invalidSettings: ['manifest'],
      };
    }

    const moduleId = manifest?.module?.id || '';
    const moduleVersion = manifest?.module?.version || '';
    const compatibility = manifest.compatibility || {};

    if (!VALID_VERSION.test(manifest.schemaVersion || '')) {
      errors.push('Module manifest schemaVersion must use semantic versioning (x.y.z).');
      invalidSettings.push('schemaVersion');
    }
    if (!VALID_ID.test(moduleId)) {
      errors.push('Module ID is invalid.');
      invalidSettings.push('module.id');
    }
    if (!manifest?.module?.name) {
      errors.push('Module name is required.');
      invalidSettings.push('module.name');
    }
    if (!VALID_VERSION.test(moduleVersion)) {
      errors.push('Module version must use semantic versioning (x.y.z).');
      invalidSettings.push('module.version');
    }
    if (!manifest?.module?.author) warnings.push('Module author is not declared.');

    const coreVersion = context.coreVersion || '';
    const contractVersion = context.contractVersion || '';
    if (coreVersion && !matchesVersionRange(
      coreVersion,
      compatibility.minimumCoreVersion,
      compatibility.maximumCoreVersion,
    )) {
      errors.push(`CUDFIRM core ${coreVersion} is outside this module's supported range.`);
    }
    if (contractVersion && !matchesVersionRange(
      contractVersion,
      compatibility.minimumContractVersion,
      compatibility.maximumContractVersion,
    )) {
      errors.push(`CMS contract ${contractVersion} is outside this module's supported range.`);
    }

    const requiredDependencies = (manifest.dependencies?.required || []).map(normalizeDependency);
    const optionalDependencies = (manifest.dependencies?.optional || []).map(normalizeDependency);
    const allDependencies = [...requiredDependencies, ...optionalDependencies];

    allDependencies.forEach((dependency, index) => {
      if (!VALID_ID.test(dependency.id)) {
        errors.push(`Dependency at index ${index} has an invalid module ID.`);
        invalidSettings.push(`dependencies[${index}].id`);
      }
      if (dependency.id === moduleId) errors.push('A module cannot depend on itself.');
      if (dependency.minimumVersion && !VALID_VERSION.test(dependency.minimumVersion)) {
        errors.push(`Dependency ${dependency.id || index} has an invalid minimumVersion.`);
      }
    });

    findDuplicates(allDependencies.map((item) => item.id).filter(Boolean)).forEach((duplicate) => {
      errors.push(`Dependency "${duplicate}" is declared more than once.`);
    });

    const migrations = Array.isArray(manifest.database?.migrations) ? manifest.database.migrations : [];
    const tables = Array.isArray(manifest.database?.tables) ? manifest.database.tables : [];
    migrations.forEach((path, index) => {
      if (typeof path !== 'string' || !path.trim()) {
        errors.push(`Database migration at index ${index} is invalid.`);
      }
    });
    tables.forEach((table, index) => {
      if (typeof table !== 'string' || !table.trim()) {
        errors.push(`Database table at index ${index} is invalid.`);
      }
    });
    findDuplicates(migrations).forEach((duplicate) => warnings.push(`Migration "${duplicate}" is listed more than once.`));
    findDuplicates(tables).forEach((duplicate) => warnings.push(`Table "${duplicate}" is listed more than once.`));

    const permissions = Array.isArray(manifest.permissions) ? manifest.permissions.map(getPermissionId) : [];
    permissions.forEach((permission, index) => {
      if (!VALID_PERMISSION.test(permission)) {
        errors.push(`Permission at index ${index} has an invalid ID.`);
      }
    });
    findDuplicates(permissions).forEach((duplicate) => errors.push(`Permission "${duplicate}" is declared more than once.`));

    const namespace = manifest.contract?.namespace || '';
    if (!VALID_NAMESPACE.test(namespace)) {
      errors.push('Module contract namespace is invalid or missing.');
      invalidSettings.push('contract.namespace');
    }

    const pages = Array.isArray(manifest.dashboard?.pages) ? manifest.dashboard.pages : [];
    pages.forEach((page, index) => {
      if (!page?.id || !VALID_ID.test(page.id)) errors.push(`Dashboard page at index ${index} has an invalid ID.`);
      if (!page?.path || typeof page.path !== 'string') errors.push(`Dashboard page ${page?.id || index} is missing its path.`);
      if (page?.permission && !permissions.includes(page.permission)) {
        warnings.push(`Dashboard page ${page.id || index} uses undeclared permission "${page.permission}".`);
      }
    });

    const components = Array.isArray(manifest.public?.components) ? manifest.public.components : [];
    components.forEach((component, index) => {
      if (!component?.id || !VALID_ID.test(component.id)) {
        errors.push(`Public component at index ${index} has an invalid ID.`);
      }
    });

    if (typeof manifest.installation?.removable !== 'boolean') {
      warnings.push('installation.removable is not explicitly declared.');
    }
    if (manifest.installation?.removalMode && !VALID_REMOVAL_MODES.has(manifest.installation.removalMode)) {
      errors.push(`Removal mode "${manifest.installation.removalMode}" is unsupported.`);
      invalidSettings.push('installation.removalMode');
    }

    const backupTables = Array.isArray(manifest.backup?.tables) ? manifest.backup.tables : [];
    backupTables.forEach((table) => {
      if (!tables.includes(table)) warnings.push(`Backup table "${table}" is not declared in database.tables.`);
    });

    return {
      valid: errors.length === 0,
      status: errors.length ? 'invalid' : warnings.length ? 'valid-with-warnings' : 'valid',
      module: { id: moduleId, version: moduleVersion },
      versions: {
        manifestSchema: manifest.schemaVersion || '',
        core: coreVersion,
        contract: contractVersion,
      },
      dependencies: {
        required: requiredDependencies,
        optional: optionalDependencies,
      },
      errors,
      warnings,
      invalidSettings,
    };
  }

  function validateDefinition(definition, context = {}) {
    const report = validateManifest(definition?.manifest, context);
    const errors = [...report.errors];
    const warnings = [...report.warnings];

    if (definition?.runtime && typeof definition.runtime !== 'object') {
      errors.push('Module runtime must be an object when provided.');
    }
    if (definition?.api && typeof definition.api !== 'object') {
      errors.push('Module API must be an object when provided.');
    }
    if (definition?.contract && typeof definition.contract !== 'object') {
      errors.push('Module contract implementation must be an object when provided.');
    }

    return {
      ...report,
      valid: errors.length === 0,
      status: errors.length ? 'invalid' : warnings.length ? 'valid-with-warnings' : 'valid',
      errors,
      warnings,
    };
  }

  window.CUDFIRMModuleValidator = Object.freeze({
    validateManifest,
    validateDefinition,
    parseVersion,
    compareVersions,
    matchesVersionRange,
    normalizeDependency,
  });
})();
