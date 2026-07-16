/**
 * CUDFIRM Member Accounts contract — Phase 2.
 * Public account pages are added in Phase 3. This contract exposes safe module
 * metadata only; all sensitive operations remain in trusted Edge Functions.
 */
(function () {
  'use strict';

  const data = Object.freeze({
    enabled: true,
    version: '1.0.0',
    implementationPhase: 'trusted-server-operations',
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
    serverOperations: Object.freeze({
      registration: 'member-register',
      signIn: 'member-sign-in',
      resendVerification: 'member-resend-verification',
      invitation: 'member-invite',
      acceptInvitation: 'member-accept-invitation',
      memberAction: 'member-admin-action',
      memberRequest: 'member-request',
      requestReview: 'member-request-admin',
      exportReview: 'member-export',
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
