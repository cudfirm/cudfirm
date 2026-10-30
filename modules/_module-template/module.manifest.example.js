/** Example only — copy into a real module folder and rename its global. */
(function () {
  'use strict';

  window.CUDFIRMExampleModuleManifest = Object.freeze({
    schemaVersion: '1.0.0',
    module: {
      id: 'example-module',
      name: 'CUDFIRM Example Module',
      version: '1.0.0',
      description: 'Replace this example with a reusable module description.',
      author: 'CUDFIRM Limited',
      category: 'example',
    },
    compatibility: {
      minimumCoreVersion: '2.0.0',
      maximumCoreVersion: '2.x',
      minimumContractVersion: '1.0.0',
      maximumContractVersion: '1.x',
    },
    dependencies: {
      required: [],
      optional: [],
    },
    database: {
      migrations: [],
      tables: [],
    },
    permissions: [],
    dashboard: {
      pages: [],
      navigation: [],
    },
    public: {
      components: [],
      routes: [],
    },
    contract: {
      namespace: 'example-module',
    },
    backup: {
      tables: [],
      storagePaths: [],
      restoreOrder: [],
    },
    installation: {
      removable: true,
      removalMode: 'preserve-data',
    },
  });
})();
