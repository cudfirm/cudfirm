/**
 * dashboard/js/pages/subscribers-page.js
 * ------------------------------------------------------------------
 * Read-mostly list over `subscribers` (populated by the public
 * site's footer newsletter signup — see submitNewsletterSignup() in
 * js/script.js). Admins can search, export to CSV, and delete.
 * ------------------------------------------------------------------
 */

const SubscribersPage = (() => {
  let allRows = [];
  let deletingId = null;

  async function init() {
    renderShell();
    ensureDeleteModal();
    await reload();
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-toolbar">
        <div class="crud-hint">People who signed up via the footer newsletter form.</div>
        <button class="btn btn-brand" id="exportCsvBtn" type="button"><i class="bi bi-download" aria-hidden="true"></i> Export CSV</button>
      </div>
      <input type="text" class="form-control mb-3" id="subSearch" placeholder="Search by email…" aria-label="Search subscribers" style="max-width:320px">
      <div class="table-card"><div id="subTableWrap" aria-live="polite"></div></div>
    `;
    document.getElementById("subSearch").addEventListener("input", (e) => renderTable(e.target.value));
    document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  }

  function ensureDeleteModal() {
    if (document.getElementById("subDeleteModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="subDeleteModal" tabindex="-1" aria-labelledby="subDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="subDeleteTitle">Remove subscriber?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"><p class="mb-0" id="subDeleteBody">This removes them permanently.</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="subConfirmDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.getElementById("subConfirmDeleteBtn").addEventListener("click", onConfirmDelete);
  }

  async function reload() {
    const wrap = document.getElementById("subTableWrap");
    wrap.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>`;

    const { data, error } = await AdminApi.list("subscribers", "created_at", false);
    if (error) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load subscribers.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load subscribers."));
      return;
    }
    allRows = data || [];
    renderTable("");
  }

  function renderTable(filterText) {
    const wrap = document.getElementById("subTableWrap");
    const term = (filterText || "").trim().toLowerCase();
    const rows = term ? allRows.filter((r) => (r.email || "").toLowerCase().includes(term)) : allRows;

    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-people" aria-hidden="true"></i>${term ? "No subscribers match that search." : "No subscribers yet."}</div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-responsive-x">
        <table class="dash-table">
          <thead><tr><th scope="col">Email</th><th scope="col">Subscribed</th><th scope="col" style="width:1%">Actions</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr data-id="${r.id}">
                <td class="col-primary">${esc(r.email)}</td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn text-danger" data-action="delete" aria-label="Remove ${esc(r.email)}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                  </div>
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    wrap.querySelectorAll("[data-action='delete']").forEach((btn) => {
      btn.addEventListener("click", () => openDelete(Number(btn.closest("tr").dataset.id)));
    });
  }

  function openDelete(id) {
    deletingId = id;
    const row = allRows.find((r) => r.id === id);
    document.getElementById("subDeleteBody").textContent = row
      ? `Remove "${row.email}" from the subscriber list? This can't be undone.`
      : "This removes them permanently.";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("subDeleteModal")).show();
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    const btn = document.getElementById("subConfirmDeleteBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Removing…";

    const { error } = await AdminApi.remove("subscribers", deletingId);

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Remove";

    if (error) {
      DashToast.error(DashError.friendly(error, "Could not remove that subscriber."));
      return;
    }

    allRows = allRows.filter((r) => r.id !== deletingId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("subDeleteModal")).hide();
    DashToast.success("Removed.");
    DashActivity.log("deleted", "subscribers", `#${deletingId}`);
    deletingId = null;
    renderTable(document.getElementById("subSearch").value);
  }

  function exportCsv() {
    if (!allRows.length) {
      DashToast.error("There are no subscribers to export yet.");
      return;
    }
    const header = "email,subscribed_at\n";
    const body = allRows.map((r) => `${(r.email || "").replace(/"/g, '""')},${r.created_at || ""}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cudfirm-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { init };
})();
