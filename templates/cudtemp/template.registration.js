/** Explicit local registration for CUDTEMP Adapter 2. */
(function () {
  'use strict';
  if (!window.CUDFIRMTemplateRegistry) throw new Error('CUDFIRM template registry must load before CUDTEMP registration.');
  window.CUDFIRMTemplateRegistry.register('cudtemp', {
    manifest: window.CUDTEMPManifest,
    adapter: window.CUDTEMPAdapter,
    metadata: { source: 'local', entry: 'templates/cudtemp/template.registration.js' },
  });
})();
