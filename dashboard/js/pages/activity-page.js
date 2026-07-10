/**
 * dashboard/js/pages/activity-page.js
 * ------------------------------------------------------------------
 * Read-only feed of `activity_log`, written to by DashActivity.log()
 * from crud-engine.js, hero-page.js, settings-page.js, and
 * media-page.js after every successful write.
 * ------------------------------------------------------------------
 */

const ActivityPage = (() => {
  const ICONS = {
    created: "bi-plus-circle",
    updated: "bi-pencil",
    deleted: "bi-trash3",
    uploaded: "bi-upload",
    "backed up": "bi-cloud-arrow-down",
    restored: "bi-arrow-counterclockwise",
  };

  async function init() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-hint mb-3">A running record of admin changes across the dashboard.</div>
      <div class="table-card p-4" id="activityList" aria-live="polite">
        <div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>
      </div>
    `;

    const { data, error } = await AdminApi.list("activity_log", "created_at", false);
    const list = document.getElementById("activityList");

    if (error) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load the activity log.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load the activity log."));
      return;
    }

    const rows = (data || []).slice(0, 200);
    if (!rows.length) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-clock-history" aria-hidden="true"></i>No activity recorded yet.</div>`;
      return;
    }

    list.innerHTML = rows
      .map(
        (r) => `
      <div class="activity-item">
        <div class="activity-icon"><i class="bi ${ICONS[r.action] || "bi-dot"}" aria-hidden="true"></i></div>
        <div>
          <div class="activity-text"><strong>${esc(r.actor_email || "Someone")}</strong> ${esc(r.action)} ${esc(r.entity || "")}${r.entity_label ? ` — "${esc(r.entity_label)}"` : ""}</div>
          <div class="activity-time">${r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
        </div>
      </div>`
      )
      .join("");
  }

  return { init };
})();
