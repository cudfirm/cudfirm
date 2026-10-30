/**
 * CUDFIRM Phase 5.1 — Message Management
 * A focused inbox workflow layered on the existing messages table.
 */
const MessagesPage = (() => {
  const PAGE_SIZES = [10, 20, 50];
  const STATUSES = ["all", "unread", "read", "important", "replied", "archived", "spam"];
  const STATUS_LABELS = {
    all: "All",
    unread: "Unread",
    read: "Read",
    important: "Important",
    replied: "Replied",
    archived: "Archived",
    spam: "Spam",
  };

  let allRows = [];
  let deletingIds = [];
  let selectedIds = new Set();
  let searchTimer = null;
  let state = { search: "", status: "all", sort: "newest", page: 1, pageSize: 10 };

  async function init() {
    renderShell();
    ensureModals();
    bindStaticEvents();
    await reload();
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-hint mb-3">Manage enquiries submitted through the public contact form.</div>

      <section class="message-controls" aria-label="Message controls">
        <div class="message-search-wrap">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="messageSearch" class="form-control" type="search"
            placeholder="Search name, contact or message…" autocomplete="off" />
        </div>
        <select id="messageSort" class="form-select" aria-label="Sort messages">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-az">Name A–Z</option>
          <option value="name-za">Name Z–A</option>
        </select>
        <button id="exportMessagesBtn" type="button" class="btn btn-outline-secondary">
          <i class="bi bi-download" aria-hidden="true"></i> Export CSV
        </button>
      </section>

      <div id="messageStatusTabs" class="filter-tabs message-status-tabs" role="tablist" aria-label="Filter messages by status">
        ${STATUSES.map((status) => `
          <button type="button" class="filter-tab${status === "all" ? " active" : ""}"
            data-status="${status}" role="tab" aria-selected="${status === "all"}">
            ${STATUS_LABELS[status]} <span class="message-tab-count" data-count-for="${status}">0</span>
          </button>`).join("")}
      </div>

      <div id="messageBulkBar" class="message-bulk-bar" hidden>
        <strong><span id="messageSelectedCount">0</span> selected</strong>
        <select id="messageBulkAction" class="form-select" aria-label="Bulk action">
          <option value="">Choose action…</option>
          <option value="read">Mark read</option>
          <option value="unread">Mark unread</option>
          <option value="important">Mark important</option>
          <option value="replied">Mark replied</option>
          <option value="archived">Archive</option>
          <option value="spam">Mark spam</option>
          <option value="delete">Delete permanently</option>
        </select>
        <button id="applyMessageBulkBtn" class="btn btn-primary" type="button">Apply</button>
        <button id="clearMessageSelectionBtn" class="btn btn-light" type="button">Clear</button>
      </div>

      <div id="messagesList" aria-live="polite"></div>
      <div id="messagePagination"></div>
    `;
  }

  function ensureModals() {
    if (!document.getElementById("messageDetailModal")) {
      const detail = document.createElement("div");
      detail.innerHTML = `
        <div class="modal fade" id="messageDetailModal" tabindex="-1" aria-labelledby="messageDetailTitle" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h5 class="modal-title" id="messageDetailTitle">Message</h5>
                  <div id="messageDetailMeta" class="small text-muted mt-1"></div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div id="messageDetailBody" class="message-detail-body"></div>
              </div>
              <div class="modal-footer message-detail-footer">
                <button id="copyMessageContactBtn" type="button" class="btn btn-light"><i class="bi bi-copy"></i> Copy contact</button>
                <a id="replyMessageBtn" class="btn btn-primary" href="#"><i class="bi bi-reply"></i> Reply by email</a>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(detail);
    }

    if (!document.getElementById("msgDeleteModal")) {
      const remove = document.createElement("div");
      remove.innerHTML = `
        <div class="modal fade" id="msgDeleteModal" tabindex="-1" aria-labelledby="msgDeleteTitle" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="msgDeleteTitle">Delete message?</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body"><p id="msgDeleteText" class="mb-0">This permanently deletes the message. This cannot be undone.</p></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="msgConfirmDeleteBtn">
                  <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(remove);
    }
  }

  function bindStaticEvents() {
    const search = document.getElementById("messageSearch");
    search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = search.value.trim().toLowerCase();
        state.page = 1;
        clearSelection();
        render();
      }, 200);
    });

    document.getElementById("messageSort").addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.page = 1;
      clearSelection();
      render();
    });

    document.getElementById("messageStatusTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-status]");
      if (!button) return;
      state.status = button.dataset.status;
      state.page = 1;
      clearSelection();
      document.querySelectorAll("#messageStatusTabs [data-status]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      render();
    });

    document.getElementById("exportMessagesBtn").addEventListener("click", exportCsv);
    document.getElementById("clearMessageSelectionBtn").addEventListener("click", clearSelection);
    document.getElementById("applyMessageBulkBtn").addEventListener("click", applyBulkAction);
    document.getElementById("msgConfirmDeleteBtn").addEventListener("click", confirmDelete);
  }

  async function reload() {
    const list = document.getElementById("messagesList");
    list.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>`;
    const { data, error } = await AdminApi.list("messages", "created_at", false);
    if (error) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load messages.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load messages."));
      return;
    }
    allRows = (data || []).map(normalizeRow);
    render();
  }

  function normalizeRow(row) {
    if (row.status) return row;
    return { ...row, status: row.is_archived ? "archived" : row.is_read ? "read" : "unread" };
  }

  function filteredRows() {
    let rows = allRows.filter((row) => state.status === "all" || row.status === state.status);
    if (state.search) {
      rows = rows.filter((row) => [row.name, row.contact_info, row.message]
        .some((value) => String(value || "").toLowerCase().includes(state.search)));
    }
    rows = [...rows].sort((a, b) => {
      if (state.sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (state.sort === "name-az") return String(a.name || "").localeCompare(String(b.name || ""));
      if (state.sort === "name-za") return String(b.name || "").localeCompare(String(a.name || ""));
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return rows;
  }

  function render() {
    updateCounts();
    const rows = filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    renderList(rows.slice(start, start + state.pageSize));
    renderPagination(rows.length, start);
    renderBulkBar();
  }

  function updateCounts() {
    const counts = { all: allRows.length };
    STATUSES.slice(1).forEach((status) => { counts[status] = allRows.filter((r) => r.status === status).length; });
    Object.entries(counts).forEach(([status, count]) => {
      const el = document.querySelector(`[data-count-for="${status}"]`);
      if (el) el.textContent = count;
    });
  }

  function renderList(rows) {
    const list = document.getElementById("messagesList");
    if (!rows.length) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-envelope-open" aria-hidden="true"></i>No matching messages.</div>`;
      return;
    }

    list.innerHTML = `
      <div class="message-select-page">
        <label><input id="selectVisibleMessages" type="checkbox" /> Select this page</label>
      </div>
      ${rows.map((row) => messageCard(row)).join("")}`;

    const selectVisible = document.getElementById("selectVisibleMessages");
    const ids = rows.map((row) => Number(row.id));
    selectVisible.checked = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    selectVisible.indeterminate = ids.some((id) => selectedIds.has(id)) && !selectVisible.checked;
    selectVisible.addEventListener("change", () => {
      ids.forEach((id) => selectVisible.checked ? selectedIds.add(id) : selectedIds.delete(id));
      render();
    });

    list.querySelectorAll(".message-select").forEach((box) => {
      box.addEventListener("change", () => {
        const id = Number(box.dataset.id);
        box.checked ? selectedIds.add(id) : selectedIds.delete(id);
        renderBulkBar();
        updateSelectPageState(rows);
      });
    });

    list.querySelectorAll("[data-message-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button.dataset.messageAction, Number(button.dataset.id)));
    });
    list.querySelectorAll("[data-open-message]").forEach((button) => {
      button.addEventListener("click", () => openDetail(Number(button.dataset.openMessage)));
    });
  }

  function messageCard(row) {
    const status = row.status || "unread";
    return `
      <article class="list-row-card message-card ${status === "unread" ? "unread" : ""}" data-id="${row.id}">
        <input class="message-select" data-id="${row.id}" type="checkbox" aria-label="Select message from ${esc(row.name || "Anonymous")}" ${selectedIds.has(Number(row.id)) ? "checked" : ""} />
        <button class="message-card-open" type="button" data-open-message="${row.id}">
          <div class="list-row-main">
            <div class="message-title-line">
              <div class="list-row-title">${esc(row.name || "Anonymous")}</div>
              <span class="message-status status-${status}">${esc(STATUS_LABELS[status] || status)}</span>
            </div>
            <div class="list-row-sub">${esc(row.contact_info || "No contact supplied")} · ${formatDate(row.created_at)}</div>
            <div class="list-row-body">${esc(truncate(row.message || "", 220))}</div>
          </div>
        </button>
        <div class="list-row-actions message-actions">
          ${status !== "important" ? actionButton(row.id, "important", "bi-star", "Mark important") : actionButton(row.id, "read", "bi-star-fill", "Remove important")}
          ${status === "unread" ? actionButton(row.id, "read", "bi-envelope-open", "Mark read") : actionButton(row.id, "unread", "bi-envelope", "Mark unread")}
          ${status !== "archived" ? actionButton(row.id, "archived", "bi-archive", "Archive") : actionButton(row.id, "read", "bi-arrow-counterclockwise", "Move to inbox")}
          ${actionButton(row.id, "delete", "bi-trash3", "Delete", true)}
        </div>
      </article>`;
  }

  function actionButton(id, action, icon, label, danger = false) {
    return `<button class="btn${danger ? " text-danger" : ""}" type="button" data-message-action="${action}" data-id="${id}" aria-label="${label}" title="${label}"><i class="bi ${icon}" aria-hidden="true"></i></button>`;
  }

  function updateSelectPageState(rows) {
    const box = document.getElementById("selectVisibleMessages");
    if (!box) return;
    const ids = rows.map((row) => Number(row.id));
    box.checked = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    box.indeterminate = ids.some((id) => selectedIds.has(id)) && !box.checked;
  }

  function renderBulkBar() {
    const bar = document.getElementById("messageBulkBar");
    const count = selectedIds.size;
    bar.hidden = count === 0;
    document.getElementById("messageSelectedCount").textContent = count;
  }

  function renderPagination(total, start) {
    const host = document.getElementById("messagePagination");
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const end = Math.min(start + state.pageSize, total);
    const pages = pageWindow(state.page, totalPages);
    host.innerHTML = `
      <div class="list-pagination message-pagination">
        <div class="pagination-size">Show
          <select id="messagePageSize" class="form-select" aria-label="Messages per page">
            ${PAGE_SIZES.map((size) => `<option value="${size}" ${size === state.pageSize ? "selected" : ""}>${size}</option>`).join("")}
          </select> per page
        </div>
        <div class="pagination-summary">${total ? `Showing ${start + 1}–${end} of ${total}` : "No matching records"}</div>
        <nav class="pagination-buttons" aria-label="Message pages">
          <button type="button" class="pagination-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i> Previous</button>
          ${pages.map((page) => page === "…" ? `<span class="pagination-ellipsis">…</span>` : `<button type="button" class="pagination-btn ${page === state.page ? "active" : ""}" data-page="${page}" ${page === state.page ? 'aria-current="page"' : ""}>${page}</button>`).join("")}
          <button type="button" class="pagination-btn" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}>Next <i class="bi bi-chevron-right"></i></button>
        </nav>
      </div>`;

    document.getElementById("messagePageSize").addEventListener("change", (event) => {
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
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
    if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "…", current - 1, current, current + 1, "…", total];
  }

  async function handleAction(action, id) {
    if (action === "delete") return openDelete([id]);
    await setStatuses([id], action);
  }

  async function setStatuses(ids, status) {
    let succeeded = 0;
    for (const id of ids) {
      const payload = statusPayload(status);
      const { data, error } = await AdminApi.update("messages", id, payload);
      if (error) {
        DashToast.error(DashError.friendly(error, "Some messages could not be updated."));
        continue;
      }
      const index = allRows.findIndex((row) => Number(row.id) === Number(id));
      if (index !== -1) allRows[index] = normalizeRow(data);
      succeeded += 1;
    }
    if (succeeded) {
      DashToast.success(`${succeeded} message${succeeded === 1 ? "" : "s"} updated.`);
      DashActivity.log("updated", "messages", `${succeeded} message${succeeded === 1 ? "" : "s"}: ${status}`);
    }
    selectedIds.clear();
    render();
  }

  function statusPayload(status) {
    return {
      status,
      is_read: status !== "unread",
      is_archived: status === "archived" || status === "spam",
      is_important: status === "important",
      replied_at: status === "replied" ? new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    };
  }

  async function applyBulkAction() {
    const select = document.getElementById("messageBulkAction");
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
    document.querySelectorAll(".message-select, #selectVisibleMessages").forEach((box) => { box.checked = false; box.indeterminate = false; });
  }

  function openDelete(ids) {
    deletingIds = ids;
    document.getElementById("msgDeleteTitle").textContent = ids.length > 1 ? `Delete ${ids.length} messages?` : "Delete message?";
    document.getElementById("msgDeleteText").textContent = ids.length > 1
      ? "These messages will be permanently deleted. This cannot be undone."
      : "This message will be permanently deleted. This cannot be undone.";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("msgDeleteModal")).show();
  }

  async function confirmDelete() {
    if (!deletingIds.length) return;
    const button = document.getElementById("msgConfirmDeleteBtn");
    button.disabled = true;
    button.querySelector(".btn-label").textContent = "Deleting…";
    let deleted = 0;
    for (const id of deletingIds) {
      const { error } = await AdminApi.remove("messages", id);
      if (error) {
        DashToast.error(DashError.friendly(error, "Some messages could not be deleted."));
        continue;
      }
      allRows = allRows.filter((row) => Number(row.id) !== Number(id));
      selectedIds.delete(Number(id));
      deleted += 1;
    }
    button.disabled = false;
    button.querySelector(".btn-label").textContent = "Delete permanently";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("msgDeleteModal")).hide();
    if (deleted) {
      DashToast.success(`${deleted} message${deleted === 1 ? "" : "s"} deleted.`);
      DashActivity.log("deleted", "messages", `${deleted} message${deleted === 1 ? "" : "s"}`);
    }
    deletingIds = [];
    render();
  }

  async function openDetail(id) {
    let row = allRows.find((item) => Number(item.id) === id);
    if (!row) return;
    if (row.status === "unread") {
      const { data, error } = await AdminApi.update("messages", id, statusPayload("read"));
      if (!error && data) {
        row = normalizeRow(data);
        const index = allRows.findIndex((item) => Number(item.id) === id);
        allRows[index] = row;
      }
    }
    document.getElementById("messageDetailTitle").textContent = row.name || "Anonymous";
    document.getElementById("messageDetailMeta").textContent = `${row.contact_info || "No contact supplied"} · ${new Date(row.created_at).toLocaleString()}`;
    document.getElementById("messageDetailBody").textContent = row.message || "";

    const copy = document.getElementById("copyMessageContactBtn");
    copy.onclick = async () => {
      try {
        await DashClipboard.writeText(row.contact_info || "");
        DashToast.success("Contact copied.");
      } catch (_) {
        DashToast.error("Could not copy the contact information.");
      }
    };

    const reply = document.getElementById("replyMessageBtn");
    const email = extractEmail(row.contact_info || "");
    reply.hidden = !email;
    reply.href = email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: Your CUDFIRM enquiry")}` : "#";
    reply.onclick = email ? async () => { await setStatuses([id], "replied"); } : null;

    bootstrap.Modal.getOrCreateInstance(document.getElementById("messageDetailModal")).show();
    render();
  }

  function exportCsv() {
    const rows = filteredRows();
    if (!rows.length) return DashToast.error("There are no matching messages to export.");
    const headers = ["ID", "Name", "Contact", "Message", "Status", "Created at", "Replied at", "Archived at"];
    const csv = [headers, ...rows.map((r) => [r.id, r.name, r.contact_info, r.message, r.status, r.created_at, r.replied_at, r.archived_at])]
      .map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    DashDownload.blob(blob, `cudfirm-messages-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
  function extractEmail(value) { return (String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0]; }
  function truncate(value, max) { return value.length > max ? `${value.slice(0, max).trim()}…` : value; }
  function formatDate(value) { return value ? new Date(value).toLocaleString() : ""; }

  return { init };
})();
