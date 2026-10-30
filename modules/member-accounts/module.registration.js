/** Register the local CUDFIRM Member Accounts module. */
(function () {
  'use strict';

  window.CUDFIRMModuleRegistry.register('member-accounts', {
    manifest: window.CUDFIRMMemberAccountsManifest,
    runtime: null,
    api: null,
    contract: window.CUDFIRMMemberAccountsContract,
    metadata: {
      source: 'local',
      entry: 'modules/member-accounts/module.registration.js',
    },
  });
})();
