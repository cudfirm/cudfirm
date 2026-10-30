// js/supabase.js
//
// Shared configuration-aware Supabase bootstrap.
//
// Client deployments load config/client-config.js BEFORE this file. The
// configuration supplies a browser-safe Project URL and Publishable/anon key.
// When no configuration exists, the CUDFIRM production defaults below are used
// so the existing CUDFIRM website and dashboard keep their current behaviour.
//
// Never place a service_role, sb_secret_*, or other server-side secret here.

const CUDFIRM_DEFAULT_SUPABASE_URL = "https://wefncrkzugezvduzejzf.supabase.co";
const CUDFIRM_DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_dC3QHBaoJ7qb2jJUGXepsA_uKeQtofO";

const CUDFIRM_SUPABASE_CONFIG = (() => {
  const config = window.CUDFIRM_CONFIG && typeof window.CUDFIRM_CONFIG === "object"
    ? window.CUDFIRM_CONFIG
    : null;
  const hasDeploymentConfig = Boolean(config);
  const dataMode = String(config?.dataMode || "supabase").toLowerCase();

  function decodeJwtRole(key) {
    if (typeof key !== "string" || key.split(".").length !== 3 || typeof atob !== "function") {
      return "";
    }

    try {
      const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
      return String(JSON.parse(atob(padded))?.role || "");
    } catch (_error) {
      return "";
    }
  }

  function isForbiddenBrowserKey(key) {
    const value = String(key || "");
    return /service[_-]?role/i.test(value)
      || /^sb_secret_/i.test(value)
      || decodeJwtRole(value) === "service_role";
  }

  if (dataMode !== "supabase") {
    return Object.freeze({
      enabled: false,
      valid: true,
      source: "disabled",
      dataMode,
      url: "",
      anonKey: "",
      reason: `Data mode is ${dataMode}.`,
    });
  }

  const url = String(
    hasDeploymentConfig ? config.supabaseUrl || "" : CUDFIRM_DEFAULT_SUPABASE_URL
  ).trim();
  const anonKey = String(
    hasDeploymentConfig ? config.supabaseAnonKey || "" : CUDFIRM_DEFAULT_SUPABASE_ANON_KEY
  ).trim();
  const source = hasDeploymentConfig ? "configured" : "cudfirm-default";

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
    return Object.freeze({
      enabled: false,
      valid: false,
      source,
      dataMode,
      url: "",
      anonKey: "",
      reason: "A valid Supabase Project URL is required.",
    });
  }

  if (!anonKey || isForbiddenBrowserKey(anonKey)) {
    return Object.freeze({
      enabled: false,
      valid: false,
      source,
      dataMode,
      url: "",
      anonKey: "",
      reason: "A browser-safe Supabase Publishable/anon key is required.",
    });
  }

  return Object.freeze({
    enabled: true,
    valid: true,
    source,
    dataMode,
    url: url.replace(/\/$/, ""),
    anonKey,
    reason: "",
  });
})();

const SUPABASE_URL = CUDFIRM_SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = CUDFIRM_SUPABASE_CONFIG.anonKey;
const supabaseClient = CUDFIRM_SUPABASE_CONFIG.enabled && window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!CUDFIRM_SUPABASE_CONFIG.valid) {
  console.error(`[CUDFIRM Supabase] ${CUDFIRM_SUPABASE_CONFIG.reason}`);
} else if (CUDFIRM_SUPABASE_CONFIG.enabled && !window.supabase?.createClient) {
  console.error("[CUDFIRM Supabase] The Supabase browser library is unavailable.");
}

window.supabaseClient = supabaseClient;
window.CUDFIRMSupabase = Object.freeze({
  version: "1.0.0",
  source: CUDFIRM_SUPABASE_CONFIG.source,
  dataMode: CUDFIRM_SUPABASE_CONFIG.dataMode,
  configured: CUDFIRM_SUPABASE_CONFIG.enabled,
  valid: CUDFIRM_SUPABASE_CONFIG.valid,
  reason: CUDFIRM_SUPABASE_CONFIG.reason,
  projectUrl: CUDFIRM_SUPABASE_CONFIG.url,
  getClient: () => supabaseClient,
});
