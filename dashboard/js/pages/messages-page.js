/**
 * dashboard/js/pages/messages-page.js
 * ------------------------------------------------------------------
 * Inbox for rows in `messages` (populated by the public site's
 * contact form — see submitEnquiryToSupabase() in js/script.js).
 * There's no "add" here — admins only triage: mark read/unread,
 * archive/unarchive, delete.
 * ------------------------------------------------------------------
 */

const MessagesPage = (() => {
  let allRows = [];
  let filter = "inbox"; // inbox | unread | archived
  let deletingId = null;

  async function init() {
    renderShell();
    ensureDeleteModal();
    await reload();
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-hint mb-3">Enquiries submitted through the site's contact form land here.</div>
      <div class="filter-tabs" role="tablist" aria-label="Filter messages">
        <button type="button" class="filter-tab active" data-filter="inbox" role="tab" aria-selected="true">Inbox</button>
        <button type="button" class="filter-tab" data-filter="unread" role="tab" aria-selected="false">Unread</button>
        <button type="button" class="filter-tab" data-filter="archived" role="tab" aria-selected="false">Archived</button>
      </div>
      <div id="messagesList" aria-live="polite"></div>
    `;
    root.querySelectorAll(".filter-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.filter;
        root.querySelectorAll(".filter-tab").forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        renderList();
      });
    });
  }

  function ensureDeleteModal() {
    if (document.getElementById("msgDeleteModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="msgDeleteModal" tabindex="-1" aria-labelledby="msgDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="msgDeleteTitle">Delete message?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"><p class="mb-0">This permanently deletes the message. This can't be undone.</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="msgConfirmDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete permanently</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.getElementById("msgConfirmDeleteBtn").addEventListener("click", onConfirmDelete);
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
    allRows = data || [];
    renderList();
  }

  function visibleRows() {
    if (filter === "unread") return allRows.filter((r) => !r.is_read && !r.is_archived);
    if (filter === "archived") return allRows.filter((r) => r.is_archived);
    return allRows.filter((r) => !r.is_archived);
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  function renderList() {
    const list = document.getElementById("messagesList");
    const rows = visibleRows();

    if (!rows.length) {
      list.innerHTML = `<div class="empty-state"><i class="bi bi-envelope-open" aria-hidden="true"></i>No ${filter === "archived" ? "archived" : filter === "unread" ? "unread" : ""} messages.</div>`;
      return;
    }

    list.innerHTML = rows
      .map(
        (r) => `
      <div class="list-row-card ${!r.is_read && !r.is_archived ? "unread" : ""}" data-id="${r.id}">
        <div class="list-row-main">
          <div class="list-row-title">${esc(r.name || "Anonymous")}</div>
          <div class="list-row-sub">${esc(r.contact_info || "")} · ${timeAgo(r.created_at)}</div>
          <div class="list-row-body">${esc(r.message || "")}</div>
        </div>
        <div class="list-row-actions">
          ${
            !r.is_archived
              ? `<button class="btn" data-action="toggle-read" aria-label="${r.is_read ? "Mark unread" : "Mark read"}" title="${r.is_read ? "Mark unread" : "Mark read"}"><i class="bi ${r.is_read ? "bi-envelope" : "bi-envelope-open"}" aria-hidden="true"></i></button>
                 <button class="btn" data-action="archive" aria-label="Archive" title="Archive"><i class="bi bi-archive" aria-hidden="true"></i></button>`
              : `<button class="btn" data-action="unarchive" aria-label="Move back to inbox" title="Move back to inbox"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i></button>`
          }
          <button class="btn text-danger" data-action="delete" aria-label="Delete message from ${esc(r.name || "this contact")}" title="Delete"><i class="bi bi-trash3" aria-hidden="true"></i></button>
        </div>
      </div>`
      )
      .join("");

    list.querySelectorAll(".list-row-card").forEach((card) => {
      const id = Number(card.dataset.id);
      card.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          if (action === "toggle-read") toggleRead(id);
          if (action === "archive") setArchived(id, true);
          if (action === "unarchive") setArchived(id, false);
          if (action === "delete") openDelete(id);
        });
      });
    });
  }

  async function patchRow(id, payload) {
    const { data, error } = await AdminApi.update("messages", id, payload);
    if (error) {
      DashToast.error(DashError.friendly(error, "Could not update that message."));
      return false;
    }
    const idx = allRows.findIndex((r) => r.id === id);
    if (idx !== -1) allRows[idx] = data;
    return true;
  }

  async function toggleRead(id) {
    const row = allRows.find((r) => r.id === id);
    if (!row) return;
    if (await patchRow(id, { is_read: !row.is_read })) renderList();
  }

  async function setArchived(id, archived) {
    if (await patchRow(id, { is_archived: archived, is_read: true })) {
      DashToast.success(archived ? "Archived." : "Moved back to inbox.");
      renderList();
    }
  }

  function openDelete(id) {
    deletingId = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("msgDeleteModal")).show();
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    const btn = document.getElementById("msgConfirmDeleteBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Deleting…";

    const { error } = await AdminApi.remove("messages", deletingId);

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Delete permanently";

    if (error) {
      DashToast.error(DashError.friendly(error, "Could not delete that message."));
      return;
    }

    allRows = allRows.filter((r) => r.id !== deletingId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("msgDeleteModal")).hide();
    DashToast.success("Deleted.");
    DashActivity.log("deleted", "messages", `#${deletingId}`);
    deletingId = null;
    renderList();
  }

  return { init };
})();
