/**
 * CUDFIRM v2.0 release notes and production-readiness summary.
 * Static by design: no database writes and no extra Supabase requests.
 */
const ChangelogPage = (() => {
  const RELEASES = [
    {
      version: "2.0.0",
      label: "Production Release",
      date: "July 2026",
      current: true,
      groups: [
        ["Content management", ["Live Supabase CMS", "Search, filters and sorting", "Client-side pagination", "Bulk actions", "Drag-and-drop ordering", "Draft, Published, Hidden and Archived workflow"]],
        ["Business tools", ["Message management", "Subscriber management and CSV export", "Dashboard analytics", "SEO health checks", "Site health scanner"]],
        ["Platform controls", ["Backup and selective restore", "User roles and permissions", "Maintenance mode", "Theme and Custom CSS controls", "Security and audit events"]],
        ["Stability", ["Responsive dashboard", "Mobile navigation fixes", "Accessible focus and reduced motion", "Safe clipboard and CSV fallbacks", "Production release labeling"]],
      ],
    },
    {
      version: "1.0.0",
      label: "Core CMS",
      date: "June 2026",
      groups: [["Foundation", ["Public landing page", "Authenticated admin dashboard", "Supabase content CRUD", "Media Library", "SEO Manager", "Messages, subscribers and activity log"]]],
    },
  ];

  const CHECKS = [
    ["Database", "Migrations 001–013 applied in order and current data backed up"],
    ["Authentication", "Super Admin access verified; test roles reviewed"],
    ["Public site", "Published content, forms, lightbox, maintenance and themes tested"],
    ["Dashboard", "CRUD, search, pagination, bulk actions, ordering and exports tested"],
    ["Security", "RLS policies, role restrictions and security audit reviewed"],
    ["Recovery", "A fresh JSON backup downloaded and restore tested on a small section"],
    ["Devices", "Mobile, tablet and desktop regression checks completed"],
    ["Deployment", "Production domain, Supabase redirect URLs and cache refresh verified"],
  ];

  function escText(value) { return typeof esc === "function" ? esc(value) : String(value || ""); }

  function renderRelease(release) {
    return `
      <article class="release-entry ${release.current ? "is-current" : ""}">
        <header class="release-entry-head">
          <div>
            <div class="release-version-row"><span class="release-version">v${escText(release.version)}</span>${release.current ? '<span class="release-current">Current</span>' : ""}</div>
            <h2>${escText(release.label)}</h2>
          </div>
          <time>${escText(release.date)}</time>
        </header>
        <div class="release-groups">
          ${release.groups.map(([title, items]) => `
            <section class="release-group">
              <h3>${escText(title)}</h3>
              <ul>${items.map((item) => `<li><i class="bi bi-check2" aria-hidden="true"></i><span>${escText(item)}</span></li>`).join("")}</ul>
            </section>`).join("")}
        </div>
      </article>`;
  }

  function init() {
    const root = document.getElementById("page-content");
    if (!root) return;
    const app = window.CUDFIRM_APP || { version: "2.0.0", release: "Production Release" };
    root.innerHTML = `
      <section class="release-hero" aria-labelledby="releaseTitle">
        <div>
          <span class="release-kicker"><i class="bi bi-rocket-takeoff" aria-hidden="true"></i> Version ${escText(app.version)}</span>
          <h1 id="releaseTitle">CUDFIRM CMS is production ready</h1>
          <p>This page records the stable release baseline and the checks to complete before each production deployment.</p>
        </div>
        <div class="release-badge"><span>Current release</span><strong>v${escText(app.version)}</strong><small>${escText(app.release)}</small></div>
      </section>

      <div class="release-layout">
        <div class="release-timeline">${RELEASES.map(renderRelease).join("")}</div>
        <aside class="release-checklist-card" aria-labelledby="releaseChecklistTitle">
          <div class="release-checklist-head">
            <i class="bi bi-clipboard2-check" aria-hidden="true"></i>
            <div><h2 id="releaseChecklistTitle">Production checklist</h2><p>Complete these checks for every release.</p></div>
          </div>
          <div class="release-checklist">
            ${CHECKS.map(([title, detail], index) => `
              <label class="release-check-item">
                <input type="checkbox" data-release-check="${index}">
                <span><strong>${escText(title)}</strong><small>${escText(detail)}</small></span>
              </label>`).join("")}
          </div>
          <div class="release-progress"><div><span id="releaseProgressText">0 of ${CHECKS.length} complete</span><strong id="releaseProgressPercent">0%</strong></div><div class="release-progress-track"><span id="releaseProgressBar"></span></div></div>
          <button class="btn btn-outline-brand w-100" id="resetReleaseChecklist" type="button"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset checklist</button>
          <p class="release-local-note"><i class="bi bi-device-hdd" aria-hidden="true"></i> Checklist progress is saved only in this browser.</p>
        </aside>
      </div>`;

    const storageKey = `cudfirm-release-checklist-${app.version}`;
    let state = [];
    try { state = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (_) { state = []; }
    const boxes = [...root.querySelectorAll("[data-release-check]")];
    boxes.forEach((box, index) => { box.checked = Boolean(state[index]); });

    const update = () => {
      state = boxes.map((box) => box.checked);
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {}
      const complete = state.filter(Boolean).length;
      const percent = Math.round((complete / CHECKS.length) * 100);
      document.getElementById("releaseProgressText").textContent = `${complete} of ${CHECKS.length} complete`;
      document.getElementById("releaseProgressPercent").textContent = `${percent}%`;
      document.getElementById("releaseProgressBar").style.width = `${percent}%`;
    };
    boxes.forEach((box) => box.addEventListener("change", update));
    document.getElementById("resetReleaseChecklist").addEventListener("click", () => { boxes.forEach((box) => { box.checked = false; }); update(); });
    update();
  }

  return { init };
})();
