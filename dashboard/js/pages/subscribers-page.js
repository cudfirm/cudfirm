/**
 * CUDFIRM Phase 5.2 — Subscriber Management
 * Search, status workflow, pagination, bulk actions and CSV export.
 */
const SubscribersPage = (() => {
  const PAGE_SIZES = [10, 20, 50];
  const STATUSES = ["all", "active", "unsubscribed", "bounced", "archived"];
  const STATUS_LABELS = {
    all: "All",
    active: "Active",
    unsubscribed: "Unsubscribed",
    bounced: "Bounced",
    archived: "Archived",
  };

  let allRows = [];
  let selectedIds = new Set();
  let deletingIds = [];
  let searchTimer = null;
  let state = { search: "", status: "all", sort: "newest", page: 1, pageSize: 10 };

  async function init() {
    renderShell();
    ensureDeleteModal();
    bindStaticEvents();
    await reload();
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-hint mb-3">Manage people who signed up through the public newsletter form.</div>

      <section class="subscriber-controls" aria-label="Subscriber controls">
        <div class="subscriber-search-wrap">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="subscriberSearch" class="form-control" type="search"
            placeholder="Search subscriber email…" autocomplete="off" aria-label="Search subscribers" />
        </div>
        <select id="subscriberSort" class="form-select" aria-label="Sort subscribers">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="email-az">Email A–Z</option>
          <option value="email-za">Email Z–A</option>
        </select>
        <button id="exportActiveSubscribersBtn" type="button" class="btn btn-brand">
          <i class="bi bi-download" aria-hidden="true"></i> Export active CSV
        </button>
        <button id="exportFilteredSubscribersBtn" type="button" class="btn btn-outline-secondary">
          <i class="bi bi-filetype-csv" aria-hidden="true"></i> Export current view
        </button>
      </section>

      <div id="subscriberStatusTabs" class="filter-tabs subscriber-status-tabs" role="tablist" aria-label="Filter subscribers by status">
        ${STATUSES.map((status) => `
          <button type="button" class="filter-tab${status === "all" ? " active" : ""}"
            data-status="${status}" role="tab" aria-selected="${status === "all"}">
            ${STATUS_LABELS[status]} <span class="subscriber-tab-count" data-count-for="${status}">0</span>
          </button>`).join("")}
      </div>

      <div id="subscriberBulkBar" class="subscriber-bulk-bar" hidden>
        <strong><span id="subscriberSelectedCount">0</span> selected</strong>
        <select id="subscriberBulkAction" class="form-select" aria-label="Bulk action">
          <option value="">Choose action…</option>
          <option value="active">Activate</option>
          <option value="unsubscribed">Mark unsubscribed</option>
          <option value="bounced">Mark bounced</option>
          <option value="archived">Archive</option>
          <option value="delete">Delete permanently</option>
        </select>
        <button id="applySubscriberBulkBtn" class="btn btn-primary" type="button">Apply</button>
        <button id="clearSubscriberSelectionBtn" class="btn btn-light" type="button">Clear</button>
      </div>

      <div id="subscriberTableWrap" class="table-card" aria-live="polite"></div>
      <div id="subscriberPagination"></div>
    `;
  }

  function ensureDeleteModal() {
    if (document.getElementById("subscriberDeleteModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="subscriberDeleteModal" tabindex="-1" aria-labelledby="subscriberDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="subscriberDeleteTitle">Delete subscriber?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"><p id="subscriberDeleteText" class="mb-0">This permanently removes the subscriber. This cannot be undone.</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="subscriberConfirmDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete permanently</span>
              </button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
  }

  function bindStaticEvents() {
    const search = document.getElementById("subscriberSearch");
    search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = search.value.trim().toLowerCase();
        state.page = 1;
        clearSelection();
        render();
      }, 200);
    });

    document.getElementById("subscriberSort").addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.page = 1;
      clearSelection();
      render();
    });

    document.getElementById("subscriberStatusTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-status]");
      if (!button) return;
      state.status = button.dataset.status;
      state.page = 1;
      clearSelection();
      document.querySelectorAll("#subscriberStatusTabs [data-status]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      render();
    });

    document.getElementById("exportActiveSubscribersBtn").addEventListener("click", () => exportCsv(allRows.filter((row) => row.status === "active"), "active"));
    document.getElementById("exportFilteredSubscribersBtn").addEventListener("click", () => exportCsv(filteredRows(), "current-view"));
    document.getElementById("clearSubscriberSelectionBtn").addEventListener("click", clearSelection);
    document.getElementById("applySubscriberBulkBtn").addEventListener("click", applyBulkAction);
    document.getElementById("subscriberConfirmDeleteBtn").addEventListener("click", confirmDelete);
  }

  async function reload() {
    const wrap = document.getElementById("subscriberTableWrap");
    wrap.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>`;
    const { data, error } = await AdminApi.list("subscribers", "created_at", false);
    if (error) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load subscribers.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load subscribers."));
      return;
    }
    allRows = (data || []).map(normalizeRow);
    render();
  }

  function normalizeRow(row) {
    return {
      ...row,
      status: row.status || (row.is_active === false ? "unsubscribed" : "active"),
      source: row.source || "footer",
    };
  }

  function filteredRows() {
    let rows = allRows.filter((row) => state.status === "all" || row.status === state.status);
    if (state.search) {
      rows = rows.filter((row) => [row.email, row.source]
        .some((value) => String(value || "").toLowerCase().includes(state.search)));
    }
    return [...rows].sort((a, b) => {
      if (state.sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (state.sort === "email-az") return String(a.email || "").localeCompare(String(b.email || ""));
      if (state.sort === "email-za") return String(b.email || "").localeCompare(String(a.email || ""));
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  function render() {
    updateCounts();
    const rows = filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    renderTable(rows.slice(start, start + state.pageSize));
    renderPagination(rows.length, start);
    renderBulkBar();
  }

  function updateCounts() {
    const counts = { all: allRows.length };
    STATUSES.slice(1).forEach((status) => { counts[status] = allRows.filter((row) => row.status === status).length; });
    Object.entries(counts).forEach(([status, count]) => {
      const el = document.querySelector(`[data-count-for="${status}"]`);
      if (el) el.textContent = count;
    });
  }

  function renderTable(rows) {
    const wrap = document.getElementById("subscriberTableWrap");
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-people" aria-hidden="true"></i>No matching subscribers.</div>`;
      return;
    }

    const ids = rows.map((row) => Number(row.id));
    wrap.innerHTML = `
      <div class="table-responsive-x">
        <table class="dash-table subscriber-table">
          <thead>
            <tr>
              <th scope="col" class="col-select"><input id="selectVisibleSubscribers" type="checkbox" aria-label="Select all subscribers on this page" /></th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
              <th scope="col">Source</th>
              <th scope="col">Subscribed</th>
              <th scope="col" style="width:1%">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => subscriberRow(row)).join("")}
          </tbody>
        </table>
      </div>`;

    const selectVisible = document.getElementById("selectVisibleSubscribers");
    selectVisible.checked = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    selectVisible.indeterminate = ids.some((id) => selectedIds.has(id)) && !selectVisible.checked;
    selectVisible.addEventListener("change", () => {
      ids.forEach((id) => selectVisible.checked ? selectedIds.add(id) : selectedIds.delete(id));
      render();
    });

    wrap.querySelectorAll(".subscriber-select").forEach((box) => {
      box.addEventListener("change", () => {
        const id = Number(box.dataset.id);
        box.checked ? selectedIds.add(id) : selectedIds.delete(id);
        renderBulkBar();
        updateSelectPageState(ids);
      });
    });

    wrap.querySelectorAll("[data-subscriber-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button.dataset.subscriberAction, Number(button.dataset.id)));
    });
  }

  function subscriberRow(row) {
    const status = row.status || "active";
    const nextAction = status === "active" ? "unsubscribed" : "active";
    const nextIcon = status === "active" ? "bi-person-dash" : "bi-person-check";
    const nextLabel = status === "active" ? "Mark unsubscribed" : "Activate";
    return `
      <tr data-id="${row.id}">
        <td class="col-select"><input class="subscriber-select" data-id="${row.id}" type="checkbox" aria-label="Select ${esc(row.email)}" ${selectedIds.has(Number(row.id)) ? "checked" : ""} /></td>
        <td class="col-primary">${esc(row.email)}</td>
        <td><span class="subscriber-status status-${status}">${esc(STATUS_LABELS[status] || status)}</span></td>
        <td>${esc(formatSource(row.source))}</td>
        <td>${formatDate(row.created_at)}</td>
        <td>
          <div class="row-actions">
            ${actionButton(row.id, nextAction, nextIcon, nextLabel)}
            ${status !== "archived" ? actionButton(row.id, "archived", "bi-archive", "Archive") : ""}
            ${actionButton(row.id, "delete", "bi-trash3", "Delete permanently", true)}
          </div>
        </td>
      </tr>`;
  }

  function actionButton(id, action, icon, label, danger = false) {
    return `<button class="btn${danger ? " text-danger" : ""}" type="button" data-subscriber-action="${action}" data-id="${id}" aria-label="${label}" title="${label}"><i class="bi ${icon}" aria-hidden="true"></i></button>`;
  }

  function updateSelectPageState(ids) {
    const box = document.getElementById("selectVisibleSubscribers");
    if (!box) return;
    box.checked = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    box.indeterminate = ids.some((id) => selectedIds.has(id)) && !box.checked;
  }

  function renderBulkBar() {
    const bar = document.getElementById("subscriberBulkBar");
    const count = selectedIds.size;
    bar.hidden = count === 0;
    document.getElementById("subscriberSelectedCount").textContent = count;
  }

  function renderPagination(total, start) {
    const host = document.getElementById("subscriberPagination");
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const end = Math.min(start + state.pageSize, total);
    const pages = pageWindow(state.page, totalPages);
    host.innerHTML = `
      <div class="list-pagination subscriber-pagination">
        <div class="pagination-size">Show
          <select id="subscriberPageSize" class="form-select" aria-label="Subscribers per page">
            ${PAGE_SIZES.map((size) => `<option value="${size}" ${size === state.pageSize ? "selected" : ""}>${size}</option>`).join("")}
          </select> per page
        </div>
        <div class="pagination-summary">${total ? `Showing ${start + 1}–${end} of ${total}` : "No matching records"}</div>
        <nav class="pagination-buttons" aria-label="Subscriber pages">
          <button type="button" class="pagination-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i> Previous</button>
          ${pages.map((page) => page === "…" ? `<span class="pagination-ellipsis">…</span>` : `<button type="button" class="pagination-btn ${page === state.page ? "active" : ""}" data-page="${page}" ${page === state.page ? 'aria-current="page"' : ""}>${page}</button>`).join("")}
          <button type="button" class="pagination-btn" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}>Next <i class="bi bi-chevron-right"></i></button>
        </nav>
      </div>`;

    document.getElementById("subscriberPageSize").addEventListener("change", (event) => {
      state.pageSize = Number(event.target.value);
      state.page = 1;
      render();
    });
    host.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
      const page = Number(button.dataset.page);
      if (page >= 1 && page <= totalPages) { state.page = page; render(); }
    }));
  }

  function pageWindow(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
    if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "…", current - 1, current, current + 1, "…", total];
  }

  async function handleAction(action, id) {
    if (action === "delete") return openDelete([id]);
    await setStatuses([id], action);
  }

  function statusPayload(status) {
    const now = new Date().toISOString();
    return {
      status,
      is_active: status === "active",
      unsubscribed_at: status === "unsubscribed" ? now : null,
      bounced_at: status === "bounced" ? now : null,
      archived_at: status === "archived" ? now : null,
    };
  }

  async function setStatuses(ids, status) {
    let succeeded = 0;
    for (const id of ids) {
      const { data, error } = await AdminApi.update("subscribers", id, statusPayload(status));
      if (error) {
        DashToast.error(DashError.friendly(error, "Some subscribers could not be updated."));
        continue;
      }
      const index = allRows.findIndex((row) => Number(row.id) === Number(id));
      if (index !== -1) allRows[index] = normalizeRow(data);
      succeeded += 1;
    }
    if (succeeded) {
      DashToast.success(`${succeeded} subscriber${succeeded === 1 ? "" : "s"} updated.`);
      DashActivity.log("updated", "subscribers", `${succeeded} subscriber${succeeded === 1 ? "" : "s"}: ${status}`);
    }
    selectedIds.clear();
    render();
  }

  async function applyBulkAction() {
    const select = document.getElementById("subscriberBulkAction");
    const action = select.value;
    if (!action || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    if (action === "delete") openDelete(ids);
    else await setStatuses(ids, action);
    select.value = "";
  }

  function clearSelection() {
    selectedIds.clear();
    renderBulkBar();
    document.querySelectorAll(".subscriber-select, #selectVisibleSubscribers").forEach((box) => {
      box.checked = false;
      box.indeterminate = false;
    });
  }

  function openDelete(ids) {
    deletingIds = ids;
    document.getElementById("subscriberDeleteTitle").textContent = ids.length > 1 ? `Delete ${ids.length} subscribers?` : "Delete subscriber?";
    document.getElementById("subscriberDeleteText").textContent = ids.length > 1
      ? "These subscribers will be permanently deleted. This cannot be undone."
      : "This subscriber will be permanently deleted. This cannot be undone.";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("subscriberDeleteModal")).show();
  }

  async function confirmDelete() {
    if (!deletingIds.length) return;
    const button = document.getElementById("subscriberConfirmDeleteBtn");
    button.disabled = true;
    button.querySelector(".btn-label").textContent = "Deleting…";
    let deleted = 0;
    for (const id of deletingIds) {
      const { error } = await AdminApi.remove("subscribers", id);
      if (error) {
        DashToast.error(DashError.friendly(error, "Some subscribers could not be deleted."));
        continue;
      }
      allRows = allRows.filter((row) => Number(row.id) !== Number(id));
      selectedIds.delete(Number(id));
      deleted += 1;
    }
    button.disabled = false;
    button.querySelector(".btn-label").textContent = "Delete permanently";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("subscriberDeleteModal")).hide();
    if (deleted) {
      DashToast.success(`${deleted} subscriber${deleted === 1 ? "" : "s"} deleted.`);
      DashActivity.log("deleted", "subscribers", `${deleted} subscriber${deleted === 1 ? "" : "s"}`);
    }
    deletingIds = [];
    render();
  }

  function exportCsv(rows, label) {
    if (!rows.length) return DashToast.error("There are no subscribers in this export.");
    const headers = ["Email", "Status", "Source", "Subscribed at", "Unsubscribed at", "Bounced at", "Archived at"];
    const csv = [headers, ...rows.map((row) => [row.email, row.status, row.source, row.created_at, row.unsubscribed_at, row.bounced_at, row.archived_at])]
      .map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    DashDownload.blob(blob, `cudfirm-subscribers-${label}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
  function formatDate(value) { return value ? new Date(value).toLocaleDateString() : "—"; }
  function formatSource(value) {
    return String(value || "footer").replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return { init };
})();
