/**
 * CUDFIRM Member Accounts module manifest.
 * Phase 1 installs identity schema, permissions, RLS, and contract metadata only.
 */
(function () {
  'use strict';

  window.CUDFIRMMemberAccountsManifest = Object.freeze({
    schemaVersion: '1.0.0',
    module: {
      id: 'member-accounts',
      name: 'CUDFIRM Member Accounts',
      version: '1.0.0',
      description: 'Public member identity foundation, separate from CUDFIRM CMS dashboard roles.',
      author: 'CUDFIRM Limited',
      category: 'identity',
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
      migrations: [
        'modules/member-accounts/migrations/001_member_accounts.sql',
      ],
      tables: [
        'member_settings',
        'member_profiles',
        'member_consents',
        'member_invitations',
        'member_closure_requests',
        'member_export_requests',
        'member_auth_locks',
      ],
    },
    permissions: [
      { id: 'view_members', description: 'View permitted member records.' },
      { id: 'invite_members', description: 'Invite public members.' },
      { id: 'approve_members', description: 'Approve pending public members.' },
      { id: 'suspend_members', description: 'Suspend public member access.' },
      { id: 'reactivate_members', description: 'Reactivate suspended members.' },
      { id: 'archive_members', description: 'Archive public member accounts.' },
      { id: 'manage_member_closure_requests', description: 'Review member account-closure requests.' },
      { id: 'manage_member_exports', description: 'Review and generate member data exports.' },
      { id: 'manage_member_settings', description: 'Manage Member Accounts module settings.' },
      { id: 'anonymize_members', description: 'Anonymize member personal data.' },
      { id: 'delete_members', description: 'Permanently delete eligible member accounts.' },
    ],
    dashboard: {
      pages: [],
      navigation: [],
    },
    public: {
      components: [],
      routes: [],
    },
    contract: {
      namespace: 'members',
    },
    backup: {
      tables: [
        'member_settings',
        'member_profiles',
        'member_consents',
        'member_invitations',
        'member_closure_requests',
        'member_export_requests',
      ],
      storagePaths: [],
      restoreOrder: [
        'member_settings',
        'member_profiles',
        'member_consents',
        'member_invitations',
        'member_closure_requests',
        'member_export_requests',
      ],
    },
    installation: {
      removable: true,
      removalMode: 'preserve-data',
    },
    defaults: {
      publicRegistration: false,
      requireEmailVerification: true,
      activationMode: 'automatic-after-verification',
      profileVisibility: 'private',
      signInMethod: 'email-password',
      mfaMode: 'disabled',
      invitationExpiryDays: 7,
      failedSignInLimit: 5,
      temporaryLockMinutes: 15,
      requireTermsConsent: true,
      requirePrivacyConsent: true,
      captchaEnabled: true,
    },
  });
})();
