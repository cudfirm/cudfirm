/**
 * dashboard/js/dash-utils.js
 * ------------------------------------------------------------------
 * Small shared helpers used by every dashboard page/script. Pulled
 * out of crud-engine.js / hero-page.js (where esc() used to be
 * duplicated) so there's one place to maintain them.
 *
 * Exposes three globals:
 *   - esc(str)                 HTML-escape a value before inserting
 *                               it into innerHTML.
 *   - DashError.friendly(err)  Turn a raw Supabase/PostgREST/network
 *                               error into a short, non-technical
 *                               message safe to show an admin. The
 *                               full technical error always still
 *                               goes to console.error for debugging.
 *   - DashUnsaved               Tracks whether an open form has
 *                               unsaved edits, warns on tab close/
 *                               reload/navigation, and lets a modal
 *                               confirm before discarding changes.
 * ------------------------------------------------------------------
 */

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DashError = (() => {
  /**
   * Never show raw Supabase/PostgREST/network error text to an
   * admin — it can leak schema details and it's rarely meaningful
   * to a non-technical user. Log the real thing, return a short,
   * calm message instead.
   */
  function friendly(error, fallback = "Something went wrong. Please try again.") {
    const raw = (error && (error.message || error.error_description || String(error))) || "";
    console.error("[dashboard] operation failed:", error);

    const text = raw.toLowerCase();

    if (!navigator.onLine) {
      return "You appear to be offline. Check your connection and try again.";
    }
    if (text.includes("failed to fetch") || text.includes("networkerror") || text.includes("load failed")) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (text.includes("jwt") || text.includes("expired") || text.includes("session") || (error && error.status === 401)) {
      return "Your session has expired. Please sign in again.";
    }
    if (text.includes("row-level security") || text.includes("permission denied") || (error && error.status === 403)) {
      return "You don't have permission to do that.";
    }
    if (text.includes("coerce") || text.includes("no rows") || text.includes("0 rows")) {
      return "That item couldn't be found — it may have already been changed or removed. Refresh and try again.";
    }
    if (text.includes("duplicate key") || text.includes("already exists")) {
      return "That already exists. Please use a different value.";
    }
    if (text.includes("violates") || text.includes("null value") || text.includes("required")) {
      return "Please check the required fields and try again.";
    }
    if (error && error.status >= 500) {
      return "The database is temporarily unavailable. Please try again shortly.";
    }
    return fallback;
  }

  /** True if this looks like an expired/invalid session, so callers can redirect to login. */
  function isAuthExpired(error) {
    const raw = (error && (error.message || "")).toLowerCase();
    return raw.includes("jwt") || raw.includes("expired") || (error && error.status === 401);
  }

  return { friendly, isAuthExpired };
})();

const DashUnsaved = (() => {
  let dirty = false;

  function set(value) {
    dirty = value;
  }

  function isDirty() {
    return dirty;
  }

  /** Ask the admin to confirm before discarding — no-op (returns true) if nothing changed. */
  function confirmDiscard(message = "You have unsaved changes. Discard them?") {
    if (!dirty) return true;
    return window.confirm(message);
  }

  // Covers reload, tab close, and any real navigation (this dashboard
  // is a traditional multi-page site, so clicking to another page in
  // the sidebar triggers this too — no extra per-link handling needed).
  window.addEventListener("beforeunload", (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  return { set, isDirty, confirmDiscard };
})();

const DashValidate = (() => {
  const UNSAFE_URL_SCHEME = /^\s*(javascript|data|vbscript):/i;

  /**
   * Validates a single field value against its config. Returns an
   * error string, or null if valid. Kept deliberately small — this
   * mirrors the handful of constraints the CMS fields actually need.
   */
  function validateField(field, value) {
    const trimmed = typeof value === "string" ? value.trim() : value;

    if (field.required && (trimmed === "" || trimmed === null || trimmed === undefined)) {
      return `${field.label} is required.`;
    }
    if (field.type === "number" && trimmed !== "" && trimmed !== null && isNaN(Number(trimmed))) {
      return `${field.label} must be a number.`;
    }
    if (field.maxLength && typeof trimmed === "string" && trimmed.length > field.maxLength) {
      return `${field.label} must be ${field.maxLength} characters or fewer.`;
    }
    if (field.type === "url" && typeof trimmed === "string" && trimmed !== "") {
      if (UNSAFE_URL_SCHEME.test(trimmed)) {
        return `${field.label} can't use that link type. Use a normal web address or file path.`;
      }
      if (/\s/.test(trimmed)) {
        return `${field.label} can't contain spaces.`;
      }
    }
    return null;
  }

  return { validateField, UNSAFE_URL_SCHEME };
})();
