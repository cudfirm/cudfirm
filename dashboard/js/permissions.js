/**
 * Role/permission helper for the CUDFIRM dashboard.
 * The database remains the final authority through RLS; this module
 * keeps the interface aligned with those server-side rules.
 */
const DashPermissions = (() => {
  const ROLE_LABELS = {
    super_admin: "Super Admin",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };

  const MATRIX = {
    super_admin: ["*"],
    admin: [
      "view_dashboard", "create_content", "edit_content", "delete_content", "publish_content",
      "view_messages", "manage_messages", "view_subscribers", "manage_subscribers",
      "view_seo", "manage_seo", "view_media", "manage_media", "run_site_health",
      "export_data", "view_activity", "manage_settings"
    ],
    editor: [
      "view_dashboard", "create_content", "edit_content", "publish_content",
      "view_messages", "view_subscribers", "view_seo", "manage_seo",
      "view_media", "manage_media", "run_site_health", "view_activity"
    ],
    viewer: [
      "view_dashboard", "view_messages", "view_subscribers", "view_seo",
      "view_media", "run_site_health", "view_activity"
    ],
  };

  const PAGE_RULES = {
    "home.html": "view_dashboard",
    "hero.html": "view_dashboard",
    "services.html": "view_dashboard",
    "portfolio.html": "view_dashboard",
    "testimonials.html": "view_dashboard",
    "faq.html": "view_dashboard",
    "navigation.html": "view_dashboard",
    "media.html": "view_media",
    "settings.html": "manage_settings",
    "seo.html": "view_seo",
    "site-health.html": "run_site_health",
    "backup.html": "backup_restore",
    "messages.html": "view_messages",
    "subscribers.html": "view_subscribers",
    "activity.html": "view_activity",
    "security.html": "view_security",
    "users.html": "manage_users",
  };

  let profile = null;

  function setProfile(value) {
    profile = value || null;
    window.dashProfile = profile;
    const role = getRole();
    document.documentElement.dataset.dashRole = role;
    window.setTimeout(startUiEnforcement, 0);
  }

  let observerStarted = false;
  function startUiEnforcement() {
    enforceUi();
    if (observerStarted || !document.body) return;
    observerStarted = true;
    const observer = new MutationObserver(() => enforceUi());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function hideAll(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      el.hidden = true;
      el.setAttribute("aria-hidden", "true");
    });
  }

  function enforceUi() {
    const page = currentPage();
    if (page === "hero.html" && !can("edit_content")) {
      document.querySelectorAll("#heroForm input, #heroForm textarea, #heroForm select, #heroForm button").forEach((el) => el.disabled = true);
      hideAll("#heroSaveBtn, #addTrustItem, [data-remove]");
    }
    if (page === "media.html" && !can("manage_media")) {
      hideAll("#mediaUploadInput, label[for='mediaUploadInput'], [data-action='rename'], [data-action='delete']");
    }
    if (page === "messages.html" && !can("manage_messages")) {
      hideAll("#messageBulkBar, #selectVisibleMessages, [data-message-action], #applyMessageBulkBtn");
      document.querySelectorAll(".message-row-select").forEach((el) => el.hidden = true);
    }
    if (page === "subscribers.html" && !can("manage_subscribers")) {
      hideAll("#subscriberBulkBar, #selectVisibleSubscribers, [data-subscriber-action], #applySubscriberBulkBtn");
      document.querySelectorAll(".subscriber-row-select").forEach((el) => el.hidden = true);
    }
    if (page === "seo.html" && !can("manage_seo")) {
      hideAll("#btnAddNew, #btnAddNewEmpty, [data-action='edit'], [data-action='delete'], [data-bulk-status], [data-bulk-action='delete']");
    }
  }

  function getProfile() { return profile; }
  function getRole() { return (profile && profile.role) || "viewer"; }
  function roleLabel(role = getRole()) { return ROLE_LABELS[role] || role; }
  function can(permission) {
    const allowed = MATRIX[getRole()] || [];
    return allowed.includes("*") || allowed.includes(permission);
  }

  function currentPage() {
    return (location.pathname.split("/").pop() || "home.html").toLowerCase();
  }

  function canAccessPage(page = currentPage()) {
    const required = PAGE_RULES[page];
    return !required || can(required);
  }

  function require(permission, message = "You don't have permission to do that.") {
    if (can(permission)) return true;
    if (window.DashToast) DashToast.error(message);
    return false;
  }

  return { MATRIX, PAGE_RULES, setProfile, getProfile, getRole, roleLabel, can, require, canAccessPage, currentPage };
})();

// Expose the permission helper on window because the authentication,
// layout, and page scripts deliberately use window.DashPermissions
// to detect whether the shared permission system is available.
window.DashPermissions = DashPermissions;
