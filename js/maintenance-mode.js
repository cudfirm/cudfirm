/**
 * CUDFIRM Phase 6.3 — isolated public maintenance-mode gate.
 * This file intentionally does not modify or depend on js/script.js.
 */
(() => {
  const params = new URLSearchParams(window.location.search);
  const forcePreview = params.get("maintenance-preview") === "1";
  const requestBypass = params.get("maintenance-bypass") === "1";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value, fallback = "") {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(raw)) return raw;
    return fallback;
  }

  async function authenticatedBypassAllowed() {
    const client = typeof supabaseClient !== "undefined" ? supabaseClient : window.supabaseClient;
    if (!requestBypass || !client) return false;
    try {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData && sessionData.session && sessionData.session.user;
      if (!user) return false;

      const { data: profile, error } = await client
        .from("user_profiles")
        .select("role,is_active")
        .eq("id", user.id)
        .single();

      return !error && profile && profile.is_active && ["super_admin", "admin"].includes(profile.role);
    } catch (_) {
      return false;
    }
  }

  function formatReturnTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function render(settings, preview) {
    if (document.getElementById("cudMaintenanceScreen")) return;

    const company = settings.company_name || "CUDFIRM";
    const title = settings.maintenance_title || "We’ll be right back";
    const message = settings.maintenance_message || "We are making a few improvements to the website. Please check back shortly.";
    const returnLabel = formatReturnTime(settings.maintenance_return_at);
    const contactHref = safeUrl(settings.maintenance_contact_url, settings.email ? `mailto:${settings.email}` : "");
    const logo = safeUrl(settings.logo_url);

    const screen = document.createElement("section");
    screen.id = "cudMaintenanceScreen";
    screen.className = "cud-maintenance-screen";
    screen.setAttribute("role", "main");
    screen.setAttribute("aria-labelledby", "cudMaintenanceTitle");
    screen.innerHTML = `
      <div class="cud-maintenance-card">
        <div class="cud-maintenance-brand">
          ${logo ? `<img class="cud-maintenance-logo" src="${esc(logo)}" alt="">` : ""}
          <span>${esc(company)}</span>
        </div>
        <div class="cud-maintenance-icon" aria-hidden="true">🛠</div>
        <h1 class="cud-maintenance-title" id="cudMaintenanceTitle">${esc(title)}</h1>
        <p class="cud-maintenance-message">${esc(message)}</p>
        ${returnLabel ? `<div class="cud-maintenance-return"><span aria-hidden="true">◷</span> Expected back: ${esc(returnLabel)}</div>` : ""}
        <div class="cud-maintenance-actions">
          ${contactHref ? `<a class="cud-maintenance-btn" href="${esc(contactHref)}">Contact us</a>` : ""}
          ${preview ? `<button class="cud-maintenance-btn" type="button" id="cudCloseMaintenancePreview">Close preview</button>` : ""}
        </div>
        ${preview ? `<p class="cud-maintenance-preview-note">Preview only — visitors will see this page when maintenance mode is enabled.</p>` : ""}
      </div>`;

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.dataset.maintenancePrevious = robots.content || "";
    robots.content = "noindex, nofollow";

    document.documentElement.classList.add("cud-maintenance-active");
    document.body.classList.add("cud-maintenance-active");
    document.body.appendChild(screen);

    const close = document.getElementById("cudCloseMaintenancePreview");
    if (close) {
      close.addEventListener("click", () => {
        screen.remove();
        document.documentElement.classList.remove("cud-maintenance-active");
        document.body.classList.remove("cud-maintenance-active");
        if (robots && robots.dataset.maintenancePrevious !== undefined) {
          robots.content = robots.dataset.maintenancePrevious || "index, follow";
          delete robots.dataset.maintenancePrevious;
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("maintenance-preview");
        history.replaceState({}, "", url);
      });
    }
  }

  window.MaintenanceReady = (async () => {
    try {
      if (window.CMSReady) await window.CMSReady;
      const settings = window.CMS && window.CMS.siteSettings;
      if (!settings) return false;

      if (await authenticatedBypassAllowed()) return false;

      const active = Boolean(settings.maintenance_enabled);
      if (!active && !forcePreview) return false;

      if (document.readyState === "loading") {
        await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
      }
      render(settings, forcePreview && !active);
      return true;
    } catch (err) {
      console.warn("[Maintenance] Could not evaluate maintenance mode:", err);
      return false;
    }
  })();
})();
