/** Example only — this file is not loaded by CUDFIRM. */
(function () {
  'use strict';

  window.CUDFIRMModuleRegistry.register('example-module', {
    manifest: window.CUDFIRMExampleModuleManifest,
    runtime: window.CUDFIRMExampleModuleRuntime || null,
    api: window.CUDFIRMExampleModuleApi || null,
    contract: window.CUDFIRMExampleModuleContract || null,
    metadata: {
      source: 'local',
      entry: 'modules/example-module/module.registration.js',
    },
  });
})();
