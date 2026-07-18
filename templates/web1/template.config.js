/** Web1 host-page selection for CUDFIRM Adapter 2. */
(function () {
  'use strict';

  const existing = window.CUDFIRM_CONFIG && typeof window.CUDFIRM_CONFIG === 'object'
    ? window.CUDFIRM_CONFIG
    : {};

  window.CUDFIRM_CONFIG = {
    ...existing,
    templateId: 'web1',
  };
})();
