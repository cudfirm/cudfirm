/** Explicit local registration for the Web1 template. */
(function () {
  'use strict';

  if (!window.CUDFIRMTemplateRegistry) {
    throw new Error('CUDFIRM template registry must load before Web1 registration.');
  }

  window.CUDFIRMTemplateRegistry.register('web1', {
    manifest: window.CUDFIRMWeb1Manifest,
    adapter: window.CUDFIRMWeb1Adapter,
    metadata: {
      source: 'local',
      entry: 'templates/web1/template.registration.js',
    },
  });
})();
