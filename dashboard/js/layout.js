/**
 * dashboard/js/layout.js
 * ------------------------------------------------------------------
 * Builds the sidebar + topbar chrome shared by every protected page,
 * so we don't hand-duplicate that markup six times. Each page just
 * needs:
 *
 *   <div id="dash-shell"></div>
 *   <script>DashLayout.render({ active: 'services', title: 'Services', icon: 'bi-grid' });</script>
 *
 * and its own content goes inside <main id="page-content"> which
 * DashLayout creates for you.
 * ------------------------------------------------------------------
 */

window.CUDFIRM_APP = Object.freeze({
  name: "CUDFIRM CMS",
  version: "2.0.0",
  release: "Production Release",
});

const DashLayout = (() => {
  const NAV_ITEMS = [
    { key: "home", permission: "view_dashboard", href: "home.html", label: "Dashboard Home", icon: "bi-house-door" },
    { key: "hero", href: "hero.html", label: "Hero Section", icon: "bi-flag", permission: "view_dashboard" },
    { key: "services", permission: "view_dashboard", href: "services.html", label: "Services", icon: "bi-grid-3x3-gap" },
    { key: "portfolio", permission: "view_dashboard", href: "portfolio.html", label: "Portfolio", icon: "bi-briefcase" },
    { key: "testimonials", permission: "view_dashboard", href: "testimonials.html", label: "Testimonials", icon: "bi-chat-quote" },
    { key: "faq", permission: "view_dashboard", href: "faq.html", label: "FAQ", icon: "bi-question-circle" },
    { key: "navigation", permission: "view_dashboard", href: "navigation.html", label: "Navigation", icon: "bi-list-ul" },
  ];

  const PLATFORM_NAV_ITEMS = [
    { key: "media", permission: "view_media", href: "media.html", label: "Media Library", icon: "bi-images" },
    { key: "settings", permission: "manage_settings", href: "settings.html", label: "Site Settings", icon: "bi-gear" },
    { key: "seo", permission: "view_seo", href: "seo.html", label: "SEO Manager", icon: "bi-search" },
    { key: "site-health", permission: "run_site_health", href: "site-health.html", label: "Site Health", icon: "bi-shield-check" },
    { key: "backup", permission: "backup_restore", href: "backup.html", label: "Backup & Restore", icon: "bi-database-check" },
    { key: "messages", permission: "view_messages", href: "messages.html", label: "Messages", icon: "bi-envelope" },
    { key: "subscribers", permission: "view_subscribers", href: "subscribers.html", label: "Subscribers", icon: "bi-people" },
    { key: "activity", permission: "view_activity", href: "activity.html", label: "Activity Log", icon: "bi-clock-history" },
    { key: "security", permission: "view_security", href: "security.html", label: "Security & Audit", icon: "bi-shield-lock" },
    { key: "changelog", permission: "view_dashboard", href: "changelog.html", label: "Release Notes", icon: "bi-journal-text" },
    { key: "users", permission: "manage_users", href: "users.html", label: "Users & Roles", icon: "bi-person-gear" },
  ];

  function initials(email) {
    if (!email) return "A";
    return email.slice(0, 2).toUpperCase();
  }

  function render({ active, title, icon }) {
    const shell = document.getElementById("dash-shell");
    if (!shell) return;

    const user = window.dashUser || {};
    const email = user.email || "Admin";
    const profile = (window.DashPermissions && DashPermissions.getProfile()) || {};
    const roleLabel = window.DashPermissions ? DashPermissions.roleLabel() : "Admin";

    const navHtml = (items) =>
      items
        .filter((item) => !item.permission || !window.DashPermissions || DashPermissions.can(item.permission))
        .map((item) => {
          return `
        <a href="${esc(item.href)}" class="${item.key === active ? "active" : ""}" ${item.key === active ? 'aria-current="page"' : ""}>
          <i class="bi ${item.icon}" aria-hidden="true"></i> ${esc(item.label)}
        </a>`;
        })
        .join("");

    shell.innerHTML = `
      <a href="#page-content" class="skip-link">Skip to content</a>

      <aside class="dash-sidebar" id="dashSidebar">
        <div class="side-brand">
          <div class="mark" aria-hidden="true">C</div>
          <div>
            <div class="name">CUDFIRM</div>
            <span class="tag">Admin Dashboard</span>
          </div>
        </div>
        <nav class="dash-nav" aria-label="Dashboard sections">
          <div class="nav-section-label">Content</div>
          ${navHtml(NAV_ITEMS)}
          <div class="nav-section-label">Platform</div>
          ${navHtml(PLATFORM_NAV_ITEMS)}
        </nav>
        <div class="side-foot">
          <div class="side-user">
            <div class="avatar" aria-hidden="true">${esc(initials(email))}</div>
            <div><div class="email">${esc(email)}</div><div class="side-role">${esc(roleLabel)}</div></div>
          </div>
          <div class="side-version" aria-label="Application version">
            <span>CUDFIRM CMS</span><strong>v${esc(window.CUDFIRM_APP.version)}</strong>
          </div>
          <button class="btn-signout" id="signOutBtn" type="button">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sign out
          </button>
        </div>
      </aside>
      <button class="dash-sidebar-backdrop" id="sidebarBackdrop" type="button" aria-label="Close navigation menu" tabindex="-1"></button>

      <div class="dash-main">
        <header class="dash-topbar">
          <div class="d-flex align-items-center gap-2">
            <button class="btn-menu-toggle" id="menuToggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="dashSidebar">
              <i class="bi bi-list" aria-hidden="true"></i>
            </button>
            <div class="page-title"><i class="bi ${icon || "bi-grid"}" aria-hidden="true"></i> ${esc(title || "")}</div>
          </div>
          <a href="../index.html" target="_blank" rel="noopener" class="view-site">
            <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> View live site
          </a>
        </header>
        <main class="dash-content" id="page-content" tabindex="-1"></main>
      </div>

      <div class="dash-toast-stack" id="toastStack" role="status" aria-live="polite"></div>
    `;

    document.getElementById("signOutBtn").addEventListener("click", async () => {
      try {
        await supabaseClient.rpc("record_auth_security_event", {
          p_event_type: "logout",
          p_email: email,
          p_success: true,
          p_details: {},
          p_user_agent: navigator.userAgent || null,
        });
      } catch (error) {
        console.warn("[security] logout event was not recorded:", error);
      }
      await supabaseClient.auth.signOut();
      window.location.replace("index.html");
    });

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("dashSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    const setSidebarOpen = (open) => {
      sidebar.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      document.body.classList.toggle("dash-nav-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
    };

    menuToggle.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("open")));
    backdrop.addEventListener("click", () => setSidebarOpen(false));
    sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setSidebarOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar.classList.contains("open")) {
        setSidebarOpen(false);
        menuToggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && sidebar.classList.contains("open")) setSidebarOpen(false);
    });

    refreshUnreadBadge(shell);
  }

  /**
   * Patches an unread-count badge onto the "Messages" nav link.
   * Self-contained on purpose: every protected page calls
   * DashLayout.render(), so this runs everywhere automatically
   * without any page needing to fetch or pass a count. Fails
   * silently — a badge that doesn't appear is not worth surfacing
   * an error toast for.
   */
  async function refreshUnreadBadge(shell) {
    try {
      const { count, error } = await supabaseClient
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "unread");
      if (error || !count) return;

      const link = shell.querySelector('a[href="messages.html"]');
      if (!link) return;
      let badge = link.querySelector(".nav-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "nav-badge";
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
    } catch (err) {
      // Silent — a missing badge isn't worth interrupting the admin over.
    }
  }

  return { render };
})();

/**
 * Small toast helper used across every admin page.
 * DashToast.success('Saved!') / DashToast.error('Could not save')
 *
 * Messages are always HTML-escaped before insertion — even though
 * today's callers pass their own fixed strings, a toast should never
 * become a place raw text can turn into markup.
 */
const DashToast = (() => {
  function show(message, type = "success") {
    const stack = document.getElementById("toastStack");
    if (!stack) {
      alert(message);
      return;
    }
    const el = document.createElement("div");
    el.className = `dash-toast ${type}`;
    const iconClass = type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill";
    el.innerHTML = `
      <i class="bi ${iconClass}" aria-hidden="true"></i>
      <span>${esc(message)}</span>
      <button type="button" class="toast-dismiss" aria-label="Dismiss notification">&times;</button>
    `;
    el.querySelector(".toast-dismiss").addEventListener("click", () => el.remove());
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s ease";
      setTimeout(() => el.remove(), 300);
    }, 4200);
  }
  return {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
  };
})();
