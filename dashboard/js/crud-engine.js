/**
 * dashboard/js/crud-engine.js
 * ------------------------------------------------------------------
 * One generic engine that powers the Services, Portfolio,
 * Testimonials, FAQ and Navigation editors. Each of those pages is
 * just a small config object describing its table + fields — this
 * file does the actual rendering, modal building, and Supabase calls
 * via AdminApi.
 *
 * Hero is NOT powered by this engine (it's a singleton row with a
 * nested JSON list) — it has its own small script, hero-page.js.
 *
 * Supported field types: text, textarea, number, checkbox, color,
 * select, tags (comma-separated <-> jsonb string array), url.
 *
 * Phase 2.5 additions:
 *  - Errors shown to the admin are always DashError.friendly() text;
 *    the raw Supabase/PostgREST error only ever goes to console.
 *  - After create/update/delete/reorder we patch the in-memory
 *    `rows` array and re-render instead of re-fetching the whole
 *    list — one fewer network round trip per action.
 *  - The add/edit modal tracks whether anything changed (DashUnsaved)
 *    and confirms before it's closed with unsaved edits, and the
 *    Save button guards against double submission.
 *  - Inline field validation (required / maxLength / numeric / unsafe
 *    URL schemes) runs before any network call.
 *
 * Phase 4.1 addition:
 *  - Search/filter/sort toolbar, delegated entirely to the reusable
 *    DashListControls module (list-controls.js).
 *
 * Phase 4.2 addition:
 *  - Client-side pagination layered after search/filter/sort. The
 *    current page and page size live in `listState`; page navigation
 *    only slices the already-loaded rows and makes no new Supabase
 *    requests.
 *
 * Phase 4.5 addition:
 *  - Four-state content workflow (Draft / Published / Hidden / Archived)
 *    with status badges, form control, filtering and bulk transitions.
 *
 * Phase 4.4 addition:
 *  - Drag-and-drop manual ordering in the default list view. Existing
 *    up/down buttons remain as keyboard, touch and cross-page fallback.
 * ------------------------------------------------------------------
 */

const CrudEngine = (() => {
  let cfg = null;
  let rows = [];
  let editingId = null;
  let deletingId = null;
  let isSaving = false;
  let isDeleting = false;
  let isBulkWorking = false;
  let bulkDeleteIds = [];
  let selectedIds = new Set();
  let listState = DashListControls.defaultState();
  let draggedId = null;
  let isReordering = false;

  function tagsToText(val) {
    if (Array.isArray(val)) return val.join(", ");
    return val || "";
  }

  function textToTags(str) {
    return (str || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function init(config) {
    cfg = config;
    rows = [];
    selectedIds = new Set();
    bulkDeleteIds = [];
    listState = DashListControls.defaultState();
    draggedId = null;
    isReordering = false;
    renderToolbar();
    renderModalShell();
    await reload();
  }

  function renderToolbar() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      ${cfg.note ? `<div class="singleton-note"><i class="bi bi-info-circle-fill mt-1" aria-hidden="true"></i><span>${esc(cfg.note)}</span></div>` : ""}
      <div class="crud-toolbar">
        <div class="crud-hint">${esc(cfg.hint || `Manage the ${cfg.title.toLowerCase()} shown on the live site.`)}</div>
        <button class="btn btn-brand" id="btnAddNew" type="button">
          <i class="bi bi-plus-lg" aria-hidden="true"></i> Add ${esc(cfg.singularLabel || cfg.title)}
        </button>
      </div>
      <div id="crudFiltersBarWrap"></div>
      <div class="table-card">
        <div id="crudBulkBarWrap"></div>
        <div id="crudTableWrap" aria-live="polite"></div>
      </div>
    `;
    document.getElementById("btnAddNew").addEventListener("click", () => openForm(null));
  }

  /**
   * Renders the search/filter/sort toolbar (once rows are loaded, so
   * any "dynamic" filter — e.g. Portfolio's Industry — has real
   * values to build its options from) and wires its controls. Called
   * once from reload(); never re-rendered afterward, so the search
   * box keeps focus/cursor position across saves, deletes, and
   * reorders (those only call renderTable()).
   */
  function renderFiltersBar() {
    const wrap = document.getElementById("crudFiltersBarWrap");
    if (!wrap) return;
    wrap.innerHTML = DashListControls.renderHtml(cfg, listState, rows);

    const searchInput = document.getElementById("listSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        listState.search = e.target.value;
        listState.page = 1;
        selectedIds.clear();
        renderTable();
      });
    }

    wrap.querySelectorAll("[data-filter-key]").forEach((select) => {
      select.addEventListener("change", (e) => {
        listState.filters[e.target.dataset.filterKey] = e.target.value;
        listState.page = 1;
        selectedIds.clear();
        renderTable();
      });
    });

    const sortSelect = document.getElementById("listSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        listState.sort = e.target.value;
        listState.page = 1;
        selectedIds.clear();
        renderTable();
      });
    }
  }

  function renderModalShell() {
    if (document.getElementById("crudFormModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="crudFormModal" tabindex="-1" aria-labelledby="crudFormTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="crudFormTitle">Add item</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="crudForm" novalidate>
              <div class="modal-body" id="crudFormFields"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-brand" id="crudSaveBtn">
                  <i class="bi bi-check-lg" aria-hidden="true"></i> <span class="btn-label">Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal fade" id="crudDeleteModal" tabindex="-1" aria-labelledby="crudDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="crudDeleteTitle">Delete item?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0" id="crudDeleteBody">This permanently deletes the item. This can't be undone.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="crudConfirmDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete permanently</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="crudBulkDeleteModal" tabindex="-1" aria-labelledby="crudBulkDeleteTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="crudBulkDeleteTitle">Delete selected items?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0" id="crudBulkDeleteBody">This permanently deletes the selected items. This can't be undone.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="crudConfirmBulkDeleteBtn">
                <i class="bi bi-trash3" aria-hidden="true"></i> <span class="btn-label">Delete selected</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById("crudForm").addEventListener("submit", onSubmitForm);
    document.getElementById("crudConfirmDeleteBtn").addEventListener("click", onConfirmDelete);
    document.getElementById("crudConfirmBulkDeleteBtn").addEventListener("click", onConfirmBulkDelete);

    // Guard against closing the modal (X, Cancel, backdrop click, Esc)
    // while there are unsaved edits.
    document.getElementById("crudFormModal").addEventListener("hide.bs.modal", (e) => {
      if (!DashUnsaved.confirmDiscard("You have unsaved changes. Discard them?")) {
        e.preventDefault();
      } else {
        DashUnsaved.set(false);
      }
    });
  }

  function renderSkeletonRows() {
    const cols = cfg.columns.length + 2;
    const rowsHtml = Array.from({ length: 4 })
      .map(
        () => `<tr>${Array.from({ length: cols }).map(() => `<td><div class="skeleton-bar"></div></td>`).join("")}</tr>`
      )
      .join("");
    return `
      <table class="dash-table" aria-hidden="true">
        <tbody>${rowsHtml}</tbody>
      </table>`;
  }

  async function reload() {
    const wrap = document.getElementById("crudTableWrap");
    wrap.innerHTML = renderSkeletonRows();

    const { data, error } = await AdminApi.list(cfg.table, cfg.orderCol || "sort_order");
    if (error) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load data.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load this section."));
      if (DashError.isAuthExpired(error)) redirectToLogin();
      return;
    }
    rows = data || [];
    pruneSelection();
    renderFiltersBar();
    renderTable();
  }

  function redirectToLogin() {
    setTimeout(() => window.location.replace("index.html"), 1200);
  }

  function renderTable() {
    const wrap = document.getElementById("crudTableWrap");
    const countEl = document.getElementById("crudResultsCount");

    if (!rows.length) {
      selectedIds.clear();
      renderBulkBar([]);
      if (countEl) countEl.textContent = "";
      wrap.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox" aria-hidden="true"></i>
          No ${esc(cfg.title.toLowerCase())} yet.
          <div class="mt-3">
            <button class="btn btn-brand" id="btnAddNewEmpty" type="button">
              <i class="bi bi-plus-lg" aria-hidden="true"></i> Add ${esc(cfg.singularLabel || cfg.title)}
            </button>
          </div>
        </div>`;
      document.getElementById("btnAddNewEmpty").addEventListener("click", () => openForm(null));
      return;
    }

    const filteredRows = DashListControls.apply(rows, cfg, listState);
    const defaultView = DashListControls.isDefaultView(listState);

    if (!filteredRows.length) {
      renderBulkBar([]);
      if (countEl) countEl.textContent = "No matching records";
      wrap.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-search" aria-hidden="true"></i>
          No ${esc(cfg.title.toLowerCase())} match your search or filters.
          <div class="mt-3">
            <button class="btn btn-light" id="btnClearFilters" type="button">Clear search &amp; filters</button>
          </div>
        </div>`;
      document.getElementById("btnClearFilters").addEventListener("click", () => {
        listState = DashListControls.defaultState();
        renderFiltersBar();
        renderTable();
      });
      return;
    }

    const pagination = DashListControls.paginate(filteredRows, listState);
    listState.page = pagination.page;
    listState.pageSize = pagination.pageSize;
    const visibleRows = pagination.rows;
    renderBulkBar(visibleRows);

    if (countEl) {
      const range = `Showing ${pagination.startIndex + 1}–${pagination.endIndex} of ${pagination.totalItems}`;
      countEl.textContent = pagination.totalItems === rows.length ? range : `${range} matching records`;
    }

    const pageIds = visibleRows.map((row) => row.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const somePageSelected = pageIds.some((id) => selectedIds.has(id));
    const selectHead = `<th scope="col" class="col-select">
      <input class="form-check-input" type="checkbox" id="crudSelectPage" aria-label="Select all items on this page" ${allPageSelected ? "checked" : ""}>
    </th>`;
    const headCells = cfg.columns.map((c) => `<th scope="col">${esc(c.label)}</th>`).join("");
    const bodyRows = visibleRows
      .map((row) => {
        const cells = cfg.columns
          .map((c) => {
            const val = row[c.key];
            if (c.type === "status") {
              const status = String(val || "draft").toLowerCase();
              const labels = { draft: "Draft", published: "Published", hidden: "Hidden", archived: "Archived" };
              const label = labels[status] || status;
              return `<td><span class="badge badge-soft badge-status badge-status-${esc(status)}">${esc(label)}</span></td>`;
            }
            if (c.type === "bool") {
              return `<td><span class="badge badge-soft ${val ? "badge-active" : "badge-inactive"}">${esc(val ? c.trueLabel || "Yes" : c.falseLabel || "No")}</span></td>`;
            }
            if (c.type === "tags") {
              const arr = Array.isArray(val) ? val : [];
              return `<td>${arr.map((t) => `<span class="badge badge-soft badge-active me-1">${esc(t)}</span>`).join("") || "—"}</td>`;
            }
            const display = val === null || val === undefined || val === "" ? "—" : esc(val);
            return `<td class="${c.primary ? "col-primary" : "truncate"}">${display}</td>`;
          })
          .join("");

        const itemLabel = esc(row[cfg.deleteLabelField || cfg.columns[0].key] || `#${row.id}`);
        const canReorder = cfg.orderable !== false && defaultView;
        const fullIndex = rows.findIndex((candidate) => candidate.id === row.id);
        return `
          <tr data-id="${row.id}" class="${selectedIds.has(row.id) ? "is-selected" : ""}${canReorder ? " is-draggable" : ""}">
            <td class="col-select">
              <input class="form-check-input crud-row-select" type="checkbox" data-select-id="${row.id}" aria-label="Select ${itemLabel}" ${selectedIds.has(row.id) ? "checked" : ""}>
            </td>
            ${cells}
            <td>
              <div class="row-actions">
                ${
                  canReorder
                    ? `<button class="btn crud-drag-handle" type="button" draggable="true" data-drag-id="${row.id}" aria-label="Drag ${itemLabel} to reorder" title="Drag to reorder"><i class="bi bi-grip-vertical" aria-hidden="true"></i></button>
                       <button class="btn" data-action="up" aria-label="Move ${itemLabel} up" ${fullIndex === 0 || isReordering ? "disabled" : ""}><i class="bi bi-arrow-up" aria-hidden="true"></i></button>
                       <button class="btn" data-action="down" aria-label="Move ${itemLabel} down" ${fullIndex === rows.length - 1 || isReordering ? "disabled" : ""}><i class="bi bi-arrow-down" aria-hidden="true"></i></button>`
                    : ""
                }
                <button class="btn" data-action="edit" aria-label="Edit ${itemLabel}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                <button class="btn text-danger" data-action="delete" aria-label="Delete ${itemLabel}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    const reorderHint =
      cfg.orderable !== false && !defaultView
        ? `<div class="form-hint mb-2">Switch to Manual Order with no search or filters active to reorder items.</div>`
        : cfg.orderable !== false && defaultView
          ? `<div class="form-hint crud-reorder-hint mb-2"><i class="bi bi-grip-vertical" aria-hidden="true"></i> Drag the handle to reorder items on this page. Use the arrow buttons for keyboard, touch, or cross-page moves.</div>`
          : "";

    wrap.innerHTML = `
      ${reorderHint}
      <div class="table-responsive-x">
        <table class="dash-table">
          <thead><tr>${selectHead}${headCells}<th scope="col" style="width:1%">Actions</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
      ${DashListControls.renderPaginationHtml(pagination)}
    `;

    const selectPage = document.getElementById("crudSelectPage");
    if (selectPage) {
      selectPage.indeterminate = !allPageSelected && somePageSelected;
      selectPage.addEventListener("change", () => {
        pageIds.forEach((id) => {
          if (selectPage.checked) selectedIds.add(id);
          else selectedIds.delete(id);
        });
        renderTable();
      });
    }

    wrap.querySelectorAll("[data-select-id]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const id = Number(checkbox.dataset.selectId);
        if (checkbox.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        renderTable();
      });
    });

    wrap.querySelectorAll("tr[data-id]").forEach((tr) => {
      const id = Number(tr.dataset.id);
      tr.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          if (action === "edit") openForm(id);
          if (action === "delete") openDelete(id);
          if (action === "up") reorder(id, -1);
          if (action === "down") reorder(id, 1);
        });
      });
    });

    if (cfg.orderable !== false && defaultView) {
      wireDragAndDrop(wrap);
    }

    const pageSizeSelect = document.getElementById("crudPageSizeSelect");
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (e) => {
        listState.pageSize = Number(e.target.value);
        listState.page = 1;
        renderTable();
      });
    }

    wrap.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        listState.page = Number(button.dataset.page);
        renderTable();
        wrap.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function wireDragAndDrop(wrap) {
    const handles = wrap.querySelectorAll("[data-drag-id]");
    const tableRows = wrap.querySelectorAll("tr[data-id]");

    handles.forEach((handle) => {
      handle.addEventListener("dragstart", (event) => {
        if (isReordering) {
          event.preventDefault();
          return;
        }
        draggedId = Number(handle.dataset.dragId);
        const row = handle.closest("tr[data-id]");
        if (row) row.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedId));
      });

      handle.addEventListener("dragend", () => {
        draggedId = null;
        tableRows.forEach((row) => row.classList.remove("is-dragging", "is-drag-over"));
      });
    });

    tableRows.forEach((row) => {
      row.addEventListener("dragover", (event) => {
        if (!draggedId || Number(row.dataset.id) === draggedId || isReordering) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        tableRows.forEach((candidate) => candidate.classList.remove("is-drag-over"));
        row.classList.add("is-drag-over");
      });

      row.addEventListener("dragleave", (event) => {
        if (!row.contains(event.relatedTarget)) row.classList.remove("is-drag-over");
      });

      row.addEventListener("drop", async (event) => {
        event.preventDefault();
        const targetId = Number(row.dataset.id);
        row.classList.remove("is-drag-over");
        if (!draggedId || draggedId === targetId || isReordering) return;
        const sourceId = draggedId;
        draggedId = null;
        await moveItemToPosition(sourceId, targetId);
      });
    });
  }

  async function moveItemToPosition(sourceId, targetId) {
    const sourceIndex = rows.findIndex((row) => row.id === sourceId);
    const targetIndex = rows.findIndex((row) => row.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const orderCol = cfg.orderCol || "sort_order";
    const rangeStart = Math.min(sourceIndex, targetIndex);
    const rangeEnd = Math.max(sourceIndex, targetIndex);
    const originalRows = rows.slice();
    const orderValues = originalRows
      .slice(rangeStart, rangeEnd + 1)
      .map((row, index) => row[orderCol] ?? rangeStart + index + 1);

    const nextRows = rows.slice();
    const [movedRow] = nextRows.splice(sourceIndex, 1);
    nextRows.splice(targetIndex, 0, movedRow);

    const changedRows = nextRows.slice(rangeStart, rangeEnd + 1).map((row, index) => ({
      row,
      nextOrder: orderValues[index],
    }));

    isReordering = true;
    renderTable();

    const results = await Promise.all(
      changedRows.map(({ row, nextOrder }) => AdminApi.update(cfg.table, row.id, { [orderCol]: nextOrder }))
    );
    const failed = results.find((result) => result.error);

    if (failed) {
      rows = originalRows;
      isReordering = false;
      renderTable();
      DashToast.error(DashError.friendly(failed.error, "Could not save the new order."));
      if (DashError.isAuthExpired(failed.error)) redirectToLogin();
      return;
    }

    changedRows.forEach(({ row, nextOrder }) => {
      row[orderCol] = nextOrder;
    });
    rows = nextRows;
    isReordering = false;
    renderTable();
    DashToast.success("Order updated.");
    DashActivity.log("reordered", cfg.table, `${changedRows.length} items`);
  }

  async function reorder(id, direction) {
    if (isReordering) return;
    const idx = rows.findIndex((r) => r.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= rows.length) return;

    const a = rows[idx];
    const b = rows[swapIdx];
    const orderCol = cfg.orderCol || "sort_order";
    const aOrder = a[orderCol];
    const bOrder = b[orderCol];

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      AdminApi.update(cfg.table, a.id, { [orderCol]: bOrder }),
      AdminApi.update(cfg.table, b.id, { [orderCol]: aOrder }),
    ]);

    if (e1 || e2) {
      DashToast.error(DashError.friendly(e1 || e2, "Could not reorder that item."));
      return;
    }

    // Patch in memory instead of re-fetching the whole list.
    a[orderCol] = bOrder;
    b[orderCol] = aOrder;
    rows.sort((x, y) => (x[orderCol] || 0) - (y[orderCol] || 0));
    renderTable();
  }

  function fieldValueFromRow(field, row) {
    if (!row) return field.default !== undefined ? field.default : "";
    const val = row[field.key];
    if (field.type === "tags") return tagsToText(val);
    return val === null || val === undefined ? "" : val;
  }

  function renderField(field, row) {
    const value = fieldValueFromRow(field, row);
    const required = field.required ? `<span class="req" aria-hidden="true">*</span>` : "";
    const idAttr = `id="f_${field.key}"`;
    const describedBy = field.hint ? `aria-describedby="hint_${field.key}"` : "";
    const requiredAttr = field.required ? 'required aria-required="true"' : "";
    const maxLenAttr = field.maxLength ? `maxlength="${field.maxLength}"` : "";

    if (field.type === "textarea") {
      return `
        <div class="mb-3">
          <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
          <textarea class="form-control" ${idAttr} rows="${field.rows || 3}" ${requiredAttr} ${maxLenAttr} ${describedBy}>${esc(value)}</textarea>
          <div class="invalid-feedback" id="err_${field.key}"></div>
          ${field.hint ? `<div class="form-hint" id="hint_${field.key}">${esc(field.hint)}</div>` : ""}
        </div>`;
    }
    if (field.type === "checkbox") {
      return `
        <div class="mb-3 form-check form-switch">
          <input class="form-check-input" type="checkbox" ${idAttr} ${value ? "checked" : ""}>
          <label class="form-check-label form-label mb-0" for="f_${field.key}">${esc(field.label)}</label>
        </div>`;
    }
    if (field.type === "select") {
      const opts = field.options
        .map((o) => `<option value="${esc(o.value)}" ${o.value === value ? "selected" : ""}>${esc(o.label)}</option>`)
        .join("");
      return `
        <div class="mb-3">
          <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
          <select class="form-select" ${idAttr} ${requiredAttr}>${opts}</select>
          <div class="invalid-feedback" id="err_${field.key}"></div>
        </div>`;
    }
    if (field.type === "color") {
      return `
        <div class="mb-3">
          <label class="form-label" for="f_${field.key}">${esc(field.label)}</label>
          <input type="color" class="form-control form-control-color" ${idAttr} value="${esc(value || "#0B3D2E")}">
        </div>`;
    }
    if (field.type === "number") {
      return `
        <div class="mb-3">
          <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
          <input type="number" inputmode="numeric" class="form-control" ${idAttr} value="${esc(value)}" ${requiredAttr} min="${field.min !== undefined ? field.min : 0}">
          <div class="invalid-feedback" id="err_${field.key}"></div>
        </div>`;
    }
    if (field.type === "url") {
      return `
        <div class="mb-3">
          <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
          <input type="text" inputmode="url" class="form-control" ${idAttr} value="${esc(value)}" ${requiredAttr} ${maxLenAttr} placeholder="${esc(field.placeholder || "")}" ${describedBy}>
          <div class="invalid-feedback" id="err_${field.key}"></div>
          ${field.hint ? `<div class="form-hint" id="hint_${field.key}">${esc(field.hint)}</div>` : ""}
        </div>`;
    }
    if (field.type === "image") {
      return `
        <div class="mb-3">
          <label class="form-label" id="lbl_${field.key}">${esc(field.label)} ${required}</label>
          <div id="mount_${field.key}"></div>
          <div class="invalid-feedback" id="err_${field.key}"></div>
          ${field.hint ? `<div class="form-hint" id="hint_${field.key}">${esc(field.hint)}</div>` : ""}
        </div>`;
    }
    if (field.type === "richtext") {
      return `
        <div class="mb-3">
          <label class="form-label" id="lbl_${field.key}">${esc(field.label)} ${required}</label>
          <div id="mount_${field.key}"></div>
          <div class="invalid-feedback" id="err_${field.key}"></div>
        </div>`;
    }
    // text / tags default to text input
    return `
      <div class="mb-3">
        <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
        <input type="text" class="form-control" ${idAttr} value="${esc(value)}" ${requiredAttr} ${maxLenAttr} placeholder="${esc(field.placeholder || "")}" ${describedBy}>
        <div class="invalid-feedback" id="err_${field.key}"></div>
        ${field.hint ? `<div class="form-hint" id="hint_${field.key}">${esc(field.hint)}</div>` : ""}
      </div>`;
  }

  let fieldWidgets = {};

  function mountWidgetFields(row) {
    fieldWidgets = {};
    cfg.fields.forEach((field) => {
      const mountEl = document.getElementById(`mount_${field.key}`);
      if (!mountEl) return;
      if (field.type === "image") {
        fieldWidgets[field.key] = ImageField.mount(mountEl, {
          value: fieldValueFromRow(field, row),
          category: field.category || cfg.table,
          label: field.label,
          onChange: () => DashUnsaved.set(true),
        });
      } else if (field.type === "richtext") {
        fieldWidgets[field.key] = RichText.mount(mountEl, {
          value: fieldValueFromRow(field, row),
          maxLength: field.maxLength,
          onChange: () => DashUnsaved.set(true),
        });
      }
    });
  }

  function openForm(id) {
    editingId = id;
    const row = id ? rows.find((r) => r.id === id) : null;
    document.getElementById("crudFormTitle").textContent = row ? `Edit ${cfg.singularLabel || cfg.title}` : `Add ${cfg.singularLabel || cfg.title}`;
    const form = document.getElementById("crudForm");
    form.classList.remove("was-validated");
    document.getElementById("crudFormFields").innerHTML = cfg.fields.map((f) => renderField(f, row)).join("");
    mountWidgetFields(row);

    DashUnsaved.set(false);
    form.querySelectorAll("input, textarea, select").forEach((el) => {
      const evt = el.type === "checkbox" ? "change" : "input";
      el.addEventListener(evt, () => DashUnsaved.set(true));
    });

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("crudFormModal"));
    modal.show();

    // Focus the first field once the modal transition finishes, for
    // keyboard users.
    document.getElementById("crudFormModal").addEventListener(
      "shown.bs.modal",
      () => {
        const first = form.querySelector("input, textarea, select");
        if (first) first.focus();
      },
      { once: true }
    );
  }

  function clearFieldErrors() {
    document.querySelectorAll("#crudFormFields .invalid-feedback").forEach((el) => (el.textContent = ""));
    document.querySelectorAll("#crudFormFields .is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  function showFieldError(field, message) {
    const input = document.getElementById(`f_${field.key}`);
    const errEl = document.getElementById(`err_${field.key}`);
    if (input) input.classList.add("is-invalid");
    if (errEl) errEl.textContent = message;
  }

  function readFormValues() {
    const payload = {};
    cfg.fields.forEach((field) => {
      if (field.type === "image" || field.type === "richtext") {
        payload[field.key] = fieldWidgets[field.key] ? fieldWidgets[field.key].getValue() : "";
        return;
      }
      const el = document.getElementById(`f_${field.key}`);
      if (!el) return;
      if (field.type === "checkbox") {
        payload[field.key] = el.checked;
      } else if (field.type === "number") {
        payload[field.key] = el.value === "" ? null : Number(el.value);
      } else if (field.type === "tags") {
        payload[field.key] = textToTags(el.value);
      } else {
        payload[field.key] = el.value;
      }
    });
    if (cfg.statusWorkflow && payload.status) {
      // Keep the legacy compatibility flag synchronized while all public
      // rendering now uses the richer status column.
      payload.is_active = payload.status === "published";
    }
    return payload;
  }

  /** Returns true if valid; otherwise shows inline errors and returns false. */
  function validateForm(payload) {
    clearFieldErrors();
    let firstInvalid = null;
    let ok = true;

    cfg.fields.forEach((field) => {
      const message = DashValidate.validateField(field, payload[field.key]);
      if (message) {
        ok = false;
        showFieldError(field, message);
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!ok && firstInvalid) {
      const el = document.getElementById(`f_${firstInvalid.key}`);
      if (el) el.focus();
    }
    return ok;
  }

  function setSaving(saving) {
    isSaving = saving;
    const btn = document.getElementById("crudSaveBtn");
    btn.disabled = saving;
    btn.querySelector(".btn-label").textContent = saving ? "Saving…" : "Save";
    btn.classList.toggle("is-loading", saving);
  }

  async function onSubmitForm(e) {
    e.preventDefault();
    if (isSaving) return; // guard against double submit (Enter + click, slow double-click, etc.)

    const payload = readFormValues();
    if (!validateForm(payload)) {
      DashToast.error("Please fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);

    let result;
    if (editingId) {
      result = await AdminApi.update(cfg.table, editingId, payload);
    } else {
      if (cfg.orderable !== false && (payload.sort_order === null || payload.sort_order === undefined)) {
        payload.sort_order = rows.length ? Math.max(...rows.map((r) => r.sort_order || 0)) + 1 : 1;
      }
      result = await AdminApi.create(cfg.table, payload);
    }

    setSaving(false);

    if (result.error) {
      DashToast.error(DashError.friendly(result.error, "Unable to save your changes. Please try again."));
      if (DashError.isAuthExpired(result.error)) redirectToLogin();
      return;
    }

    const wasEditing = !!editingId;
    // Patch the in-memory list instead of re-fetching everything.
    if (editingId) {
      const idx = rows.findIndex((r) => r.id === editingId);
      if (idx !== -1) rows[idx] = result.data;
    } else {
      rows.push(result.data);
    }
    const orderCol = cfg.orderCol || "sort_order";
    rows.sort((a, b) => (a[orderCol] || 0) - (b[orderCol] || 0));

    DashUnsaved.set(false);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudFormModal")).hide();
    DashToast.success(wasEditing ? "Changes saved." : `${esc(cfg.singularLabel || "Item")} added.`);
    renderTable();

    const label = result.data[cfg.deleteLabelField || cfg.columns[0].key] || `#${result.data.id}`;
    DashActivity.log(wasEditing ? "updated" : "created", cfg.table, label);
  }

  function openDelete(id) {
    deletingId = id;
    const row = rows.find((r) => r.id === id);
    const itemLabel = row ? row[cfg.deleteLabelField || cfg.columns[0].key] : null;
    document.getElementById("crudDeleteBody").textContent = itemLabel
      ? `Are you sure you want to permanently delete "${itemLabel}"? This can't be undone.`
      : "Are you sure you want to permanently delete this item? This can't be undone.";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudDeleteModal")).show();
  }

  async function onConfirmDelete() {
    if (!deletingId || isDeleting) return;
    isDeleting = true;
    const btn = document.getElementById("crudConfirmDeleteBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Deleting…";

    const { error } = await AdminApi.remove(cfg.table, deletingId);

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Delete permanently";
    isDeleting = false;

    if (error) {
      DashToast.error(DashError.friendly(error, "Unable to delete this item. Please try again."));
      if (DashError.isAuthExpired(error)) redirectToLogin();
      return;
    }

    const deletedRow = rows.find((r) => r.id === deletingId);
    rows = rows.filter((r) => r.id !== deletingId);
    selectedIds.delete(deletingId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudDeleteModal")).hide();
    DashToast.success("Deleted.");
    const label = deletedRow ? deletedRow[cfg.deleteLabelField || cfg.columns[0].key] : `#${deletingId}`;
    DashActivity.log("deleted", cfg.table, label);
    deletingId = null;
    renderTable();
  }


  function hasStatusWorkflow() {
    return cfg.statusWorkflow === true && Array.isArray(cfg.fields) && cfg.fields.some((field) => field.key === "status");
  }

  function statusPayload(status) {
    return {
      status,
      // Preserve backwards compatibility with any older consumer that still
      // reads is_active. Only Published is publicly visible.
      is_active: status === "published",
    };
  }

  function pruneSelection() {
    const validIds = new Set(rows.map((row) => row.id));
    selectedIds.forEach((id) => {
      if (!validIds.has(id)) selectedIds.delete(id);
    });
  }

  function renderBulkBar(visibleRows) {
    const wrap = document.getElementById("crudBulkBarWrap");
    if (!wrap) return;

    pruneSelection();
    const selectedCount = selectedIds.size;
    if (!selectedCount) {
      wrap.innerHTML = "";
      return;
    }

    const statusActions = hasStatusWorkflow()
      ? `<button type="button" class="btn btn-light btn-sm" data-bulk-status="published">
           <i class="bi bi-send-check" aria-hidden="true"></i> Publish
         </button>
         <button type="button" class="btn btn-light btn-sm" data-bulk-status="draft">
           <i class="bi bi-file-earmark" aria-hidden="true"></i> Draft
         </button>
         <button type="button" class="btn btn-light btn-sm" data-bulk-status="hidden">
           <i class="bi bi-eye-slash" aria-hidden="true"></i> Hide
         </button>
         <button type="button" class="btn btn-light btn-sm" data-bulk-status="archived">
           <i class="bi bi-archive" aria-hidden="true"></i> Archive
         </button>`
      : "";

    wrap.innerHTML = `
      <div class="crud-bulk-bar" role="region" aria-label="Bulk actions">
        <div class="crud-bulk-summary">
          <strong>${selectedCount}</strong> selected
          <button type="button" class="crud-clear-selection" data-bulk-action="clear">Clear</button>
        </div>
        <div class="crud-bulk-actions">
          ${statusActions}
          <button type="button" class="btn btn-danger btn-sm" data-bulk-action="delete">
            <i class="bi bi-trash3" aria-hidden="true"></i> Delete
          </button>
        </div>
      </div>`;

    wrap.querySelectorAll("[data-bulk-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.bulkAction;
        if (action === "clear") {
          selectedIds.clear();
          renderTable();
        } else if (action === "delete") {
          openBulkDelete();
        }
      });
    });

    wrap.querySelectorAll("[data-bulk-status]").forEach((button) => {
      button.addEventListener("click", () => runBulkStatus(button.dataset.bulkStatus));
    });
  }

  async function runBulkStatus(status) {
    const allowed = ["draft", "published", "hidden", "archived"];
    if (isBulkWorking || !selectedIds.size || !hasStatusWorkflow() || !allowed.includes(status)) return;
    isBulkWorking = true;
    const ids = Array.from(selectedIds);
    setBulkButtonsDisabled(true);

    const payload = statusPayload(status);
    const results = await Promise.all(ids.map((id) => AdminApi.update(cfg.table, id, payload)));
    const failed = results
      .map((result, index) => ({ result, id: ids[index] }))
      .filter(({ result }) => result.error);
    const succeededIds = new Set(
      results
        .map((result, index) => (result.error ? null : ids[index]))
        .filter((id) => id !== null)
    );

    rows = rows.map((row) => (succeededIds.has(row.id) ? { ...row, ...payload } : row));
    succeededIds.forEach((id) => selectedIds.delete(id));

    setBulkButtonsDisabled(false);
    isBulkWorking = false;

    if (failed.length) {
      DashToast.error(`${failed.length} item${failed.length === 1 ? "" : "s"} could not be updated.`);
      if (failed.some(({ result }) => DashError.isAuthExpired(result.error))) redirectToLogin();
    }
    if (succeededIds.size) {
      const pastTense = { published: "published", draft: "moved to draft", hidden: "hidden", archived: "archived" }[status];
      DashToast.success(`${succeededIds.size} item${succeededIds.size === 1 ? "" : "s"} ${pastTense}.`);
      DashActivity.log(`bulk ${status}`, cfg.table, `${succeededIds.size} items`);
    }
    renderTable();
  }

  function setBulkButtonsDisabled(disabled) {
    const wrap = document.getElementById("crudBulkBarWrap");
    if (!wrap) return;
    wrap.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function openBulkDelete() {
    if (!selectedIds.size || isBulkWorking) return;
    bulkDeleteIds = Array.from(selectedIds);
    const count = bulkDeleteIds.length;
    document.getElementById("crudBulkDeleteBody").textContent =
      `Are you sure you want to permanently delete ${count} selected item${count === 1 ? "" : "s"}? This can't be undone.`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudBulkDeleteModal")).show();
  }

  async function onConfirmBulkDelete() {
    if (!bulkDeleteIds.length || isBulkWorking) return;
    isBulkWorking = true;
    const btn = document.getElementById("crudConfirmBulkDeleteBtn");
    btn.disabled = true;
    btn.querySelector(".btn-label").textContent = "Deleting…";

    const ids = bulkDeleteIds.slice();
    const results = await Promise.all(ids.map((id) => AdminApi.remove(cfg.table, id)));
    const failed = results
      .map((result, index) => ({ result, id: ids[index] }))
      .filter(({ result }) => result.error);
    const deletedIds = new Set(
      results
        .map((result, index) => (result.error ? null : ids[index]))
        .filter((id) => id !== null)
    );

    rows = rows.filter((row) => !deletedIds.has(row.id));
    deletedIds.forEach((id) => selectedIds.delete(id));

    btn.disabled = false;
    btn.querySelector(".btn-label").textContent = "Delete selected";
    isBulkWorking = false;
    bulkDeleteIds = failed.map(({ id }) => id);

    if (!failed.length) {
      bootstrap.Modal.getOrCreateInstance(document.getElementById("crudBulkDeleteModal")).hide();
    }

    if (failed.length) {
      DashToast.error(`${failed.length} item${failed.length === 1 ? "" : "s"} could not be deleted.`);
      if (failed.some(({ result }) => DashError.isAuthExpired(result.error))) redirectToLogin();
    }
    if (deletedIds.size) {
      DashToast.success(`${deletedIds.size} item${deletedIds.size === 1 ? "" : "s"} deleted.`);
      DashActivity.log("bulk deleted", cfg.table, `${deletedIds.size} items`);
    }

    renderTable();
  }

  return { init };
})();
