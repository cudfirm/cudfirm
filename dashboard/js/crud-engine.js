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
 * ------------------------------------------------------------------
 */

const CrudEngine = (() => {
  let cfg = null;
  let rows = [];
  let editingId = null;
  let deletingId = null;
  let isSaving = false;
  let isDeleting = false;

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
      <div class="table-card">
        <div id="crudTableWrap" aria-live="polite"></div>
      </div>
    `;
    document.getElementById("btnAddNew").addEventListener("click", () => openForm(null));
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
    `;
    document.body.appendChild(wrap);

    document.getElementById("crudForm").addEventListener("submit", onSubmitForm);
    document.getElementById("crudConfirmDeleteBtn").addEventListener("click", onConfirmDelete);

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
    const cols = cfg.columns.length + 1;
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
    renderTable();
  }

  function redirectToLogin() {
    setTimeout(() => window.location.replace("index.html"), 1200);
  }

  function renderTable() {
    const wrap = document.getElementById("crudTableWrap");
    if (!rows.length) {
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

    const headCells = cfg.columns.map((c) => `<th scope="col">${esc(c.label)}</th>`).join("");
    const bodyRows = rows
      .map((row, idx) => {
        const cells = cfg.columns
          .map((c) => {
            const val = row[c.key];
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
        const canReorder = cfg.orderable !== false;
        return `
          <tr data-id="${row.id}">
            ${cells}
            <td>
              <div class="row-actions">
                ${
                  canReorder
                    ? `<button class="btn" data-action="up" aria-label="Move ${itemLabel} up" ${idx === 0 ? "disabled" : ""}><i class="bi bi-arrow-up" aria-hidden="true"></i></button>
                       <button class="btn" data-action="down" aria-label="Move ${itemLabel} down" ${idx === rows.length - 1 ? "disabled" : ""}><i class="bi bi-arrow-down" aria-hidden="true"></i></button>`
                    : ""
                }
                <button class="btn" data-action="edit" aria-label="Edit ${itemLabel}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                <button class="btn text-danger" data-action="delete" aria-label="Delete ${itemLabel}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    wrap.innerHTML = `
      <div class="table-responsive-x">
        <table class="dash-table">
          <thead><tr>${headCells}<th scope="col" style="width:1%">Actions</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `;

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
  }

  async function reorder(id, direction) {
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
    // text / tags default to text input
    return `
      <div class="mb-3">
        <label class="form-label" for="f_${field.key}">${esc(field.label)} ${required}</label>
        <input type="text" class="form-control" ${idAttr} value="${esc(value)}" ${requiredAttr} ${maxLenAttr} placeholder="${esc(field.placeholder || "")}" ${describedBy}>
        <div class="invalid-feedback" id="err_${field.key}"></div>
        ${field.hint ? `<div class="form-hint" id="hint_${field.key}">${esc(field.hint)}</div>` : ""}
      </div>`;
  }

  function openForm(id) {
    editingId = id;
    const row = id ? rows.find((r) => r.id === id) : null;
    document.getElementById("crudFormTitle").textContent = row ? `Edit ${cfg.singularLabel || cfg.title}` : `Add ${cfg.singularLabel || cfg.title}`;
    const form = document.getElementById("crudForm");
    form.classList.remove("was-validated");
    document.getElementById("crudFormFields").innerHTML = cfg.fields.map((f) => renderField(f, row)).join("");

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
    DashToast.success(editingId ? "Changes saved." : `${esc(cfg.singularLabel || "Item")} added.`);
    renderTable();
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

    rows = rows.filter((r) => r.id !== deletingId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudDeleteModal")).hide();
    DashToast.success("Deleted.");
    deletingId = null;
    renderTable();
  }

  return { init };
})();
