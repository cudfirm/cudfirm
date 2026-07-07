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

const DashLayout = (() => {
  const NAV_ITEMS = [
    { key: "home", href: "home.html", label: "Dashboard Home", icon: "bi-house-door" },
    { key: "hero", href: "hero.html", label: "Hero Section", icon: "bi-flag" },
    { key: "services", href: "services.html", label: "Services", icon: "bi-grid-3x3-gap" },
    { key: "portfolio", href: "portfolio.html", label: "Portfolio", icon: "bi-briefcase" },
    { key: "testimonials", href: "testimonials.html", label: "Testimonials", icon: "bi-chat-quote" },
    { key: "faq", href: "faq.html", label: "FAQ", icon: "bi-question-circle" },
    { key: "navigation", href: "navigation.html", label: "Navigation", icon: "bi-list-ul" },
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

    const navHtml = NAV_ITEMS.map(
      (item) => `
        <a href="${esc(item.href)}" class="${item.key === active ? "active" : ""}" ${item.key === active ? 'aria-current="page"' : ""}>
          <i class="bi ${item.icon}" aria-hidden="true"></i> ${esc(item.label)}
        </a>`
    ).join("");

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
          ${navHtml}
        </nav>
        <div class="side-foot">
          <div class="side-user">
            <div class="avatar" aria-hidden="true">${esc(initials(email))}</div>
            <div class="email">${esc(email)}</div>
          </div>
          <button class="btn-signout" id="signOutBtn" type="button">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sign out
          </button>
        </div>
      </aside>

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
      await supabaseClient.auth.signOut();
      window.location.replace("index.html");
    });

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("dashSidebar");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });
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
