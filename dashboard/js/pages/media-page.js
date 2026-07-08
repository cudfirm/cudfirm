/**
 * dashboard/js/pages/media-page.js
 * ------------------------------------------------------------------
 * Grid view over every row in `media_library`. Backed by StorageApi
 * (Supabase Storage + the metadata table). Supports:
 *   - general upload (category "general")
 *   - client-side search by file name
 *   - renaming metadata (file_name / alt_text — NOT the underlying
 *     storage object key, which stays stable so nothing that already
 *     references the public URL breaks)
 *   - copy public URL to clipboard
 *   - delete (removes both the storage object and the metadata row)
 * ------------------------------------------------------------------
 */

const MediaPage = (() => {
  let allRows = [];
  let renamingId = null;
  let deletingId = null;

  async function init() {
    renderShell();
    await reload();
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="crud-toolbar">
        <div class="crud-hint">Every image uploaded anywhere in the dashboard lands here too.</div>
        <label class="btn btn-brand" role="button">
          <i class="bi bi-upload" aria-hidden="true"></i> Upload File
          <input type="file" accept="image/*" class="visually-hidden" id="mediaUploadInput" aria-label="Upload file">
        </label>
      </div>
      <input type="text" class="form-control mb-3" id="mediaSearch" placeholder="Search files…" aria-label="Search media library" style="max-width:320px">
      <div id="mediaGrid" aria-live="polite"></div>
    `;

    document.getElementById("mediaUploadInput").addEventListener("change", onUpload);
    document.getElementById("mediaSearch").addEventListener("input", (e) => renderGrid(e.target.value));

    ensureRenameModal();
    ensureDeleteModal();
  }

  function ensureRenameModal() {
    if (document.getElementById("mediaRenameModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="mediaRenameModal" tabindex="-1" aria-labelledby="mediaRenameTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="mediaRenameTitle">Edit file details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="mediaRenameForm">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label" for="mr_name">File name</label>
                  <input type="text" class="form-control" id="mr_name" maxlength="150" required>
                  <div class="form-hint">This is a label only — it doesn't change the file's stored URL.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="mr_alt">Alt text</label>
                  <input type="text" class="form-control" id="mr_alt" maxlength="200" placeholder="Describes the image for accessibility &amp; SEO">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-brand" id="mediaRenameSaveBtn">
                  <i class="bi bi-check-lg" aria-hidden="true"></i> <span class="btn-label">Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.getElementById("mediaRenameForm").addEventListener("submit", onSaveRename);
  }

  function ensureDeleteModal() {
    if (document.getElementById("mediaDeleteModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="mediaDeleteModal" tabindex="-1" aria-labelledby="mediaDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="mediaDeleteTitle">Delete file?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0" id="mediaDeleteBody">This permanently deletes the file. Anywhere still referencing it will show a broken image.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="mediaConfirmDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete permanently</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.getElementById("mediaConfirmDeleteBtn").addEventListener("click", onConfirmDelete);
  }

  async function reload() {
    const grid = document.getElementById("mediaGrid");
    grid.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>`;

    const { data, error } = await StorageApi.list();
    if (error) {
      grid.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load the media library.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load the media library."));
      return;
    }
    allRows = data || [];
    renderGrid(document.getElementById("mediaSearch").value);
  }

  function renderGrid(filterText) {
    const grid = document.getElementById("mediaGrid");
    const term = (filterText || "").trim().toLowerCase();
    const rows = term ? allRows.filter((r) => (r.file_name || "").toLowerCase().includes(term)) : allRows;

    if (!rows.length) {
      grid.innerHTML = `<div class="empty-state"><i class="bi bi-images" aria-hidden="true"></i>${term ? "No files match that search." : "No files uploaded yet."}</div>`;
      return;
    }

    grid.innerHTML = `
      <div class="media-grid">
        ${rows
          .map(
            (r) => `
          <div class="media-card" data-id="${r.id}">
            <div class="media-card-thumb"><img src="${esc(r.public_url)}" alt="${esc(r.alt_text || r.file_name)}" loading="lazy"></div>
            <div class="media-card-body">
              <div class="media-card-name" title="${esc(r.file_name)}">${esc(r.file_name)}</div>
              <div class="media-card-meta">${esc(r.category || "general")} · ${formatBytes(r.size_bytes)}</div>
            </div>
            <div class="media-card-actions">
              <button type="button" data-action="copy" aria-label="Copy URL for ${esc(r.file_name)}"><i class="bi bi-clipboard" aria-hidden="true"></i></button>
              <button type="button" data-action="rename" aria-label="Edit details for ${esc(r.file_name)}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
              <button type="button" data-action="delete" aria-label="Delete ${esc(r.file_name)}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
            </div>
          </div>`
          )
          .join("")}
      </div>
    `;

    grid.querySelectorAll(".media-card").forEach((card) => {
      const id = Number(card.dataset.id);
      card.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          if (action === "copy") copyUrl(id);
          if (action === "rename") openRename(id);
          if (action === "delete") openDelete(id);
        });
      });
    });
  }

  function formatBytes(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function copyUrl(id) {
    const row = allRows.find((r) => r.id === id);
    if (!row) return;
    try {
      await navigator.clipboard.writeText(row.public_url);
      DashToast.success("URL copied to clipboard.");
    } catch (err) {
      DashToast.error("Couldn't copy automatically — long-press or select the URL manually.");
    }
  }

  function openRename(id) {
    renamingId = id;
    const row = allRows.find((r) => r.id === id);
    if (!row) return;
    document.getElementById("mr_name").value = row.file_name || "";
    document.getElementById("mr_alt").value = row.alt_text || "";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("mediaRenameModal")).show();
  }

  async function onSaveRename(e) {
    e.preventDefault();
    const btn = document.getElementById("mediaRenameSaveBtn");
    const name = document.getElementById("mr_name").value.trim();
    if (!name) {
      DashToast.error("File name can't be empty.");
      return;
    }
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Saving…";

    const { data, error } = await StorageApi.updateMeta(renamingId, {
      file_name: name,
      alt_text: document.getElementById("mr_alt").value.trim(),
    });

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Save";

    if (error) {
      DashToast.error(DashError.friendly(error, "Could not save those changes."));
      return;
    }

    const idx = allRows.findIndex((r) => r.id === renamingId);
    if (idx !== -1) allRows[idx] = data;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("mediaRenameModal")).hide();
    DashToast.success("Details updated.");
    renderGrid(document.getElementById("mediaSearch").value);
  }

  function openDelete(id) {
    deletingId = id;
    const row = allRows.find((r) => r.id === id);
    document.getElementById("mediaDeleteBody").textContent = row
      ? `Are you sure you want to permanently delete "${row.file_name}"? Anywhere still referencing it will show a broken image.`
      : "Are you sure you want to permanently delete this file?";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("mediaDeleteModal")).show();
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    const row = allRows.find((r) => r.id === deletingId);
    const btn = document.getElementById("mediaConfirmDeleteBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Deleting…";

    const { error } = await StorageApi.remove(row);

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Delete permanently";

    if (error) {
      DashToast.error(DashError.friendly(error, "Could not delete that file."));
      return;
    }

    allRows = allRows.filter((r) => r.id !== deletingId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("mediaDeleteModal")).hide();
    DashToast.success("Deleted.");
    DashActivity.log("deleted", "media", row ? row.file_name : `#${deletingId}`);
    deletingId = null;
    renderGrid(document.getElementById("mediaSearch").value);
  }

  async function onUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";
    DashToast.success("Uploading…");
    const { data, error } = await StorageApi.upload(file, "general");
    if (error) {
      DashToast.error(DashError.friendly(error, "Could not upload that file."));
      return;
    }
    allRows.unshift(data);
    DashToast.success("File uploaded.");
    DashActivity.log("uploaded", "media", data.file_name);
    renderGrid(document.getElementById("mediaSearch").value);
  }

  return { init };
})();
