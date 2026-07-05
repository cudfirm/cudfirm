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
 * select, tags (comma-separated <-> jsonb string array).
 * ------------------------------------------------------------------
 */

const CrudEngine = (() => {
  let cfg = null;
  let rows = [];
  let editingId = null;
  let deletingId = null;

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
    renderToolbar();
    renderModalShell();
    await reload();
  }

  function renderToolbar() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      ${cfg.note ? `<div class="singleton-note"><i class="bi bi-info-circle-fill mt-1"></i><span>${cfg.note}</span></div>` : ""}
      <div class="crud-toolbar">
        <div class="crud-hint">${cfg.hint || `Manage the ${cfg.title.toLowerCase()} shown on the live site.`}</div>
        <button class="btn btn-brand" id="btnAddNew"><i class="bi bi-plus-lg"></i> Add ${cfg.singularLabel || cfg.title}</button>
      </div>
      <div class="table-card">
        <div id="crudTableWrap"></div>
      </div>
    `;
    document.getElementById("btnAddNew").addEventListener("click", () => openForm(null));
  }

  function renderModalShell() {
    if (document.getElementById("crudFormModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="modal fade" id="crudFormModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="crudFormTitle">Add item</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="crudForm">
              <div class="modal-body" id="crudFormFields"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-brand" id="crudSaveBtn"><i class="bi bi-check-lg"></i> Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="modal fade" id="crudDeleteModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Delete item?</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">This permanently deletes the row from Supabase. This can't be undone.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="crudConfirmDeleteBtn"><i class="bi bi-trash3"></i> Delete permanently</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById("crudForm").addEventListener("submit", onSubmitForm);
    document.getElementById("crudConfirmDeleteBtn").addEventListener("click", onConfirmDelete);
  }

  async function reload() {
    const wrap = document.getElementById("crudTableWrap");
    wrap.innerHTML = `<div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading…</div>`;

    const { data, error } = await AdminApi.list(cfg.table, cfg.orderCol || "sort_order");
    if (error) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>Could not load data.<br><small>${esc(error.message)}</small></div>`;
      DashToast.error(`Failed to load ${cfg.title.toLowerCase()}: ${error.message}`);
      return;
    }
    rows = data || [];
    renderTable();
  }

  function renderTable() {
    const wrap = document.getElementById("crudTableWrap");
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i>No ${cfg.title.toLowerCase()} yet. Click "Add ${cfg.singularLabel || cfg.title}" to create one.</div>`;
      return;
    }

    const headCells = cfg.columns.map((c) => `<th>${c.label}</th>`).join("");
    const bodyRows = rows
      .map((row, idx) => {
        const cells = cfg.columns
          .map((c) => {
            const val = row[c.key];
            if (c.type === "bool") {
              return `<td><span class="badge badge-soft ${val ? "badge-active" : "badge-inactive"}">${val ? c.trueLabel || "Yes" : c.falseLabel || "No"}</span></td>`;
            }
            if (c.type === "tags") {
              const arr = Array.isArray(val) ? val : [];
              return `<td>${arr.map((t) => `<span class="badge badge-soft badge-active me-1">${esc(t)}</span>`).join("") || "—"}</td>`;
            }
            const display = val === null || val === undefined || val === "" ? "—" : esc(val);
            return `<td class="${c.primary ? "col-primary" : "truncate"}">${display}</td>`;
          })
          .join("");

        const canReorder = cfg.orderable !== false;
        return `
          <tr data-id="${row.id}">
            ${cells}
            <td>
              <div class="row-actions">
                ${
                  canReorder
                    ? `<button class="btn" data-action="up" title="Move up" ${idx === 0 ? "disabled style='opacity:.3'" : ""}><i class="bi bi-arrow-up"></i></button>
                       <button class="btn" data-action="down" title="Move down" ${idx === rows.length - 1 ? "disabled style='opacity:.3'" : ""}><i class="bi bi-arrow-down"></i></button>`
                    : ""
                }
                <button class="btn" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn text-danger" data-action="delete" title="Delete"><i class="bi bi-trash3"></i></button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    wrap.innerHTML = `
      <table class="dash-table">
        <thead><tr>${headCells}<th style="width:1%">Actions</th></tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
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
      DashToast.error("Could not reorder: " + (e1 || e2).message);
      return;
    }
    await reload();
  }

  function fieldValueFromRow(field, row) {
    if (!row) return field.default !== undefined ? field.default : "";
    const val = row[field.key];
    if (field.type === "tags") return tagsToText(val);
    return val === null || val === undefined ? "" : val;
  }

  function renderField(field, row) {
    const value = fieldValueFromRow(field, row);
    const required = field.required ? `<span class="req">*</span>` : "";
    const idAttr = `id="f_${field.key}"`;

    if (field.type === "textarea") {
      return `
        <div class="mb-3">
          <label class="form-label">${field.label} ${required}</label>
          <textarea class="form-control" ${idAttr} rows="${field.rows || 3}" ${field.required ? "required" : ""}>${esc(value)}</textarea>
          ${field.hint ? `<div class="form-hint">${field.hint}</div>` : ""}
        </div>`;
    }
    if (field.type === "checkbox") {
      return `
        <div class="mb-3 form-check form-switch">
          <input class="form-check-input" type="checkbox" ${idAttr} ${value ? "checked" : ""}>
          <label class="form-check-label form-label mb-0" for="f_${field.key}">${field.label}</label>
        </div>`;
    }
    if (field.type === "select") {
      const opts = field.options
        .map((o) => `<option value="${esc(o.value)}" ${o.value === value ? "selected" : ""}>${esc(o.label)}</option>`)
        .join("");
      return `
        <div class="mb-3">
          <label class="form-label">${field.label} ${required}</label>
          <select class="form-select" ${idAttr} ${field.required ? "required" : ""}>${opts}</select>
        </div>`;
    }
    if (field.type === "color") {
      return `
        <div class="mb-3">
          <label class="form-label">${field.label}</label>
          <input type="color" class="form-control form-control-color" ${idAttr} value="${esc(value || "#0B3D2E")}">
        </div>`;
    }
    if (field.type === "number") {
      return `
        <div class="mb-3">
          <label class="form-label">${field.label} ${required}</label>
          <input type="number" class="form-control" ${idAttr} value="${esc(value)}" ${field.required ? "required" : ""}>
        </div>`;
    }
    // text / tags default to text input
    return `
      <div class="mb-3">
        <label class="form-label">${field.label} ${required}</label>
        <input type="text" class="form-control" ${idAttr} value="${esc(value)}" ${field.required ? "required" : ""} placeholder="${esc(field.placeholder || "")}">
        ${field.hint ? `<div class="form-hint">${field.hint}</div>` : ""}
      </div>`;
  }

  function openForm(id) {
    editingId = id;
    const row = id ? rows.find((r) => r.id === id) : null;
    document.getElementById("crudFormTitle").textContent = row ? `Edit ${cfg.singularLabel || cfg.title}` : `Add ${cfg.singularLabel || cfg.title}`;
    document.getElementById("crudFormFields").innerHTML = cfg.fields.map((f) => renderField(f, row)).join("");
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("crudFormModal"));
    modal.show();
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

  async function onSubmitForm(e) {
    e.preventDefault();
    const saveBtn = document.getElementById("crudSaveBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Saving…`;

    const payload = readFormValues();

    let result;
    if (editingId) {
      result = await AdminApi.update(cfg.table, editingId, payload);
    } else {
      if (cfg.orderable !== false && (payload.sort_order === null || payload.sort_order === undefined)) {
        payload.sort_order = rows.length ? Math.max(...rows.map((r) => r.sort_order || 0)) + 1 : 1;
      }
      result = await AdminApi.create(cfg.table, payload);
    }

    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="bi bi-check-lg"></i> Save`;

    if (result.error) {
      DashToast.error(`Save failed: ${result.error.message}`);
      return;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudFormModal")).hide();
    DashToast.success(editingId ? "Updated successfully." : "Created successfully.");
    await reload();
  }

  function openDelete(id) {
    deletingId = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudDeleteModal")).show();
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    const btn = document.getElementById("crudConfirmDeleteBtn");
    btn.disabled = true;
    const { error } = await AdminApi.remove(cfg.table, deletingId);
    btn.disabled = false;

    if (error) {
      DashToast.error(`Delete failed: ${error.message}`);
      return;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById("crudDeleteModal")).hide();
    DashToast.success("Deleted.");
    deletingId = null;
    await reload();
  }

  return { init };
})();
