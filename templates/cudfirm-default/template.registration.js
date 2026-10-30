/** Explicit local registration for the CUDFIRM Default template. */
(function () {
  'use strict';

  if (!window.CUDFIRMTemplateRegistry) {
    throw new Error('CUDFIRM template registry must load before template registration.');
  }

  window.CUDFIRMTemplateRegistry.register('cudfirm-default', {
    manifest: window.CUDFIRMDefaultManifest,
    adapter: window.CUDFIRMDefaultAdapter,
    metadata: {
      source: 'local',
      entry: 'templates/cudfirm-default/template.registration.js',
    },
  });
})();
