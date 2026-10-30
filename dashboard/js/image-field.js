/**
 * dashboard/js/image-field.js
 * ------------------------------------------------------------------
 * A small, self-contained "pick an image" control:
 *   - shows a thumbnail (or a placeholder) of the current value
 *   - Upload button -> uploads straight to Supabase Storage via
 *     StorageApi.upload() and adopts the new public URL
 *   - Browse Library button -> opens a shared modal listing
 *     media_library rows to pick an existing file instead of
 *     uploading a duplicate
 *   - Remove button -> clears the value
 *
 * Mount it into any container:
 *   ImageField.mount(containerEl, {
 *     value: currentUrl,
 *     category: 'services',
 *     onChange: (newUrl) => { ... }
 *   });
 *
 * The control keeps no state of its own beyond the DOM — callers
 * read the current value from the hidden input it renders, or rely
 * on onChange.
 * ------------------------------------------------------------------
 */

const ImageField = (() => {
  let libraryModalBuilt = false;
  let activeOnPick = null;
  let libraryRows = [];

  function ensureLibraryModal() {
    if (libraryModalBuilt) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="imageLibraryModal" tabindex="-1" aria-labelledby="imageLibraryTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="imageLibraryTitle">Choose from Media Library</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <input type="text" class="form-control mb-3" id="imageLibrarySearch" placeholder="Search files…" aria-label="Search media library">
              <div id="imageLibraryGrid" class="media-picker-grid" aria-live="polite"></div>
            </div>
            <div class="modal-footer">
              <a href="media.html" target="_blank" class="me-auto form-hint">Manage all media &rarr;</a>
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    document.getElementById("imageLibrarySearch").addEventListener("input", (e) => renderLibraryGrid(e.target.value));
    libraryModalBuilt = true;
  }

  async function openLibrary(onPick) {
    ensureLibraryModal();
    activeOnPick = onPick;
    document.getElementById("imageLibrarySearch").value = "";
    const grid = document.getElementById("imageLibraryGrid");
    grid.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading…</div>`;

    bootstrap.Modal.getOrCreateInstance(document.getElementById("imageLibraryModal")).show();

    const { data, error } = await StorageApi.list();
    if (error) {
      grid.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load the media library.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load the media library."));
      return;
    }
    libraryRows = data || [];
    renderLibraryGrid("");
  }

  function renderLibraryGrid(filterText) {
    const grid = document.getElementById("imageLibraryGrid");
    const term = (filterText || "").trim().toLowerCase();
    let rows = libraryRows;
    if (term) rows = rows.filter((r) => (r.file_name || "").toLowerCase().includes(term));

    if (!rows.length) {
      grid.innerHTML = `<div class="empty-state"><i class="bi bi-images" aria-hidden="true"></i>No files ${term ? "match that search" : "yet"}.</div>`;
      return;
    }

    grid.innerHTML = rows
      .map(
        (r) => `
        <button type="button" class="media-picker-item" data-id="${r.id}" aria-label="Use ${esc(r.file_name)}">
          <img src="${esc(r.public_url)}" alt="${esc(r.alt_text || r.file_name)}" loading="lazy">
          <span class="media-picker-name">${esc(r.file_name)}</span>
        </button>`
      )
      .join("");

    grid.querySelectorAll(".media-picker-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = libraryRows.find((r) => String(r.id) === btn.dataset.id);
        if (row && activeOnPick) activeOnPick(row.public_url);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("imageLibraryModal")).hide();
      });
    });
  }

  function mount(container, { value, category = "general", label = "Image", onChange } = {}) {
    const fieldId = `img_${Math.random().toString(36).slice(2, 8)}`;
    let current = value || "";

    container.innerHTML = `
      <div class="image-field">
        <div class="image-field-preview" id="${fieldId}_preview">
          ${current ? `<img src="${esc(current)}" alt="">` : `<i class="bi bi-image" aria-hidden="true"></i>`}
        </div>
        <div class="image-field-controls">
          <label class="btn btn-light btn-sm image-field-upload-btn">
            <i class="bi bi-upload" aria-hidden="true"></i> Upload
            <input type="file" accept="image/*" class="visually-hidden" id="${fieldId}_file" aria-label="Upload ${esc(label)}">
          </label>
          <button type="button" class="btn btn-light btn-sm" id="${fieldId}_browse"><i class="bi bi-images" aria-hidden="true"></i> Browse Library</button>
          <button type="button" class="btn btn-light btn-sm text-danger" id="${fieldId}_clear" ${current ? "" : "disabled"}><i class="bi bi-x-lg" aria-hidden="true"></i> Remove</button>
          <span class="image-field-status" id="${fieldId}_status" role="status" aria-live="polite"></span>
        </div>
        <input type="hidden" id="${fieldId}_value" value="${esc(current)}">
      </div>
    `;

    const preview = container.querySelector(`#${fieldId}_preview`);
    const hidden = container.querySelector(`#${fieldId}_value`);
    const clearBtn = container.querySelector(`#${fieldId}_clear`);
    const status = container.querySelector(`#${fieldId}_status`);

    function setValue(url) {
      current = url || "";
      hidden.value = current;
      preview.innerHTML = current ? `<img src="${esc(current)}" alt="">` : `<i class="bi bi-image" aria-hidden="true"></i>`;
      clearBtn.disabled = !current;
      if (onChange) onChange(current);
    }

    container.querySelector(`#${fieldId}_file`).addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      status.textContent = "Uploading…";
      const { data, error } = await StorageApi.upload(file, category);
      status.textContent = "";
      e.target.value = "";
      if (error) {
        DashToast.error(DashError.friendly(error, "Could not upload that image."));
        return;
      }
      setValue(data.public_url);
      DashToast.success("Image uploaded.");
    });

    container.querySelector(`#${fieldId}_browse`).addEventListener("click", () => {
      openLibrary((url) => setValue(url));
    });

    clearBtn.addEventListener("click", () => setValue(""));

    return {
      getValue: () => hidden.value,
      setValue,
    };
  }

  return { mount };
})();
