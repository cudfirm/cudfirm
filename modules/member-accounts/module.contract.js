/**
 * CUDFIRM Member Accounts contract — Phase 1.
 * Public/member data loading is added in later phases; this file exposes only
 * safe capability metadata and approved defaults.
 */
(function () {
  'use strict';

  const data = Object.freeze({
    enabled: true,
    version: '1.0.0',
    implementationPhase: 'database-foundation',
    registration: Object.freeze({
      publicEnabled: false,
      requireEmailVerification: true,
      activationMode: 'automatic-after-verification',
      captchaEnabled: true,
    }),
    profileVisibility: 'private',
    signInMethod: 'email-password',
    mfaMode: 'disabled',
    currentUser: Object.freeze({
      authenticated: false,
      active: false,
      displayName: '',
      status: '',
      role: '',
    }),
    capabilities: Object.freeze({
      canRegister: false,
      canAccessMemberContent: false,
      canEditProfile: false,
      canRequestClosure: false,
      canRequestExport: false,
    }),
  });

  window.CUDFIRMMemberAccountsContract = Object.freeze({
    data,
    getData: async () => data,
  });
})();
