/**
 * Copy this file to config/client-config.js for a client deployment.
 * Load it before js/supabase.js on the public site and every dashboard page.
 *
 * Only use the browser-safe Project URL and Publishable/anon key.
 * Never expose service_role, sb_secret_*, or server-side credentials.
 */
window.CUDFIRM_CONFIG = Object.freeze({
  deploymentType: "client",
  clientProject: "CLIENT PUBLIC NAME",
  templateId: "client-template-id",
  coreVersion: "2.0.0",
  contractVersion: "1.1.0",
  dataMode: "supabase",
  supabaseUrl: "https://CLIENT_PROJECT_REF.supabase.co",
  supabaseAnonKey: "sb_publishable_REPLACE_ME",
  templateRuntime: Object.freeze({
    autoStart: true,
    mountTimeoutMs: 5000,
  }),
});
