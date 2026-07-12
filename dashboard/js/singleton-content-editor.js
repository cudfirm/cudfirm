/**
 * Config-driven editor for singleton CMS sections with JSON repeaters.
 * Used only by the About and Contact foundation pages.
 */
const SingletonContentEditor = (() => {
  let cfg = null;
  let record = null;
  let imageWidgets = {};
  let saving = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  function getPath(obj, path, fallback = "") {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? fallback;
  }

  function setPath(obj, path, value) {
    const parts = path.split(".");
    let cursor = obj;
    parts.slice(0, -1).forEach((part) => {
      if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
      cursor = cursor[part];
    });
    cursor[parts.at(-1)] = value;
  }

  function canEdit() {
    return window.DashPermissions && DashPermissions.can("edit_content");
  }

  async function init(config) {
    cfg = config;
    const root = document.getElementById("page-content");
    root.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading ${esc(cfg.title.toLowerCase())}…</div>`;
    const { data, error } = await AdminApi.getById(cfg.table, 1);
    if (error || !data) {
      root.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load ${esc(cfg.title.toLowerCase())}.</div>`;
      DashToast.error(DashError.friendly(error, `Could not load ${cfg.title.toLowerCase()}.`));
      return;
    }
    record = clone(data);
    cfg.repeaters.forEach((r) => {
      if (!Array.isArray(record[r.key])) record[r.key] = [];
    });
    render();
  }

  function renderField(field) {
    const value = getPath(record, field.key, field.type === "checkbox" ? false : "");
    const id = `f_${field.key.replace(/\./g, "_")}`;
    const disabled = canEdit() ? "" : " disabled";
    if (field.type === "checkbox") {
      return `<div class="col-12 col-md-6"><div class="form-check form-switch mt-2">
        <input class="form-check-input" type="checkbox" id="${id}" data-field="${esc(field.key)}" ${value ? "checked" : ""}${disabled}>
        <label class="form-check-label" for="${id}">${esc(field.label)}</label>
      </div></div>`;
    }
    if (field.type === "select") {
      return `<div class="${field.col || "col-12 col-md-6"}">
        <label class="form-label" for="${id}">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label>
        <select class="form-select" id="${id}" data-field="${esc(field.key)}"${disabled}>${field.options.map((o) => `<option value="${esc(o.value)}" ${String(value) === o.value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>
      </div>`;
    }
    if (field.type === "image") {
      return `<div class="${field.col || "col-12"}"><label class="form-label">${esc(field.label)}</label><div id="${id}_mount"></div></div>`;
    }
    if (field.type === "textarea") {
      return `<div class="${field.col || "col-12"}">
        <label class="form-label" for="${id}">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label>
        <textarea class="form-control" id="${id}" data-field="${esc(field.key)}" rows="${field.rows || 3}" maxlength="${field.maxLength || 5000}"${field.required ? " required" : ""}${disabled}>${esc(value)}</textarea>
        <div class="invalid-feedback"></div>
      </div>`;
    }
    return `<div class="${field.col || "col-12 col-md-6"}">
      <label class="form-label" for="${id}">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label>
      <input type="text" class="form-control" id="${id}" data-field="${esc(field.key)}" value="${esc(value)}" maxlength="${field.maxLength || 500}"${field.required ? " required" : ""}${disabled}>
      ${field.hint ? `<div class="form-hint">${esc(field.hint)}</div>` : ""}<div class="invalid-feedback"></div>
    </div>`;
  }

  function renderRepeater(rep) {
    const items = record[rep.key] || [];
    return `<div class="structured-repeater" data-repeater="${esc(rep.key)}">
      <div class="d-flex align-items-start justify-content-between gap-3 mb-2">
        <div><label class="form-label mb-0">${esc(rep.label)}</label>${rep.hint ? `<div class="form-hint">${esc(rep.hint)}</div>` : ""}</div>
        ${canEdit() ? `<button type="button" class="btn-add-repeater" data-add="${esc(rep.key)}"><i class="bi bi-plus-lg"></i> Add</button>` : ""}
      </div>
      <div class="structured-repeater-list" data-list="${esc(rep.key)}">
        ${items.length ? items.map((item, index) => renderRepeaterItem(rep, item, index)).join("") : `<div class="form-hint py-2">No items yet.</div>`}
      </div>
    </div>`;
  }

  function renderRepeaterItem(rep, item, index) {
    const controls = canEdit() ? `<div class="structured-repeater-actions">
      <button type="button" class="btn-icon" data-move-up="${index}" aria-label="Move item up"><i class="bi bi-arrow-up"></i></button>
      <button type="button" class="btn-icon" data-move-down="${index}" aria-label="Move item down"><i class="bi bi-arrow-down"></i></button>
      <button type="button" class="btn-repeater-remove" data-remove="${index}" aria-label="Remove item"><i class="bi bi-trash3"></i></button>
    </div>` : "";
    return `<div class="structured-repeater-item" draggable="${canEdit() ? "true" : "false"}" data-index="${index}">
      <div class="structured-repeater-head"><span class="structured-drag-handle"><i class="bi bi-grip-vertical"></i> Item ${index + 1}</span>${controls}</div>
      <div class="row g-3">${rep.fields.map((field) => {
        const val = item[field.key] ?? "";
        const inputId = `${rep.key}_${index}_${field.key}`;
        const common = `data-repeater-field="${esc(field.key)}" data-index="${index}"`;
        if (field.type === "textarea") return `<div class="${field.col || "col-12"}"><label class="form-label" for="${inputId}">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label><textarea class="form-control" id="${inputId}" ${common} rows="${field.rows || 3}" maxlength="${field.maxLength || 5000}" ${canEdit() ? "" : "disabled"}>${esc(val)}</textarea></div>`;
        return `<div class="${field.col || "col-12 col-md-6"}"><label class="form-label" for="${inputId}">${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label><input class="form-control" id="${inputId}" ${common} value="${esc(val)}" maxlength="${field.maxLength || 500}" ${canEdit() ? "" : "disabled"}></div>`;
      }).join("")}</div>
    </div>`;
  }

  function render() {
    imageWidgets = {};
    const root = document.getElementById("page-content");
    root.innerHTML = `<div class="singleton-note"><i class="bi bi-info-circle-fill mt-1"></i><span>${esc(cfg.note)}</span></div>
      <div class="table-card p-4"><form id="singletonContentForm" novalidate>
        ${cfg.groups.map((group) => `<section class="structured-editor-section"><h3>${group.icon ? `<i class="bi ${group.icon}"></i> ` : ""}${esc(group.title)}</h3><div class="row g-3">${group.fields.map(renderField).join("")}</div></section>`).join("")}
        ${cfg.repeaters.map(renderRepeater).join("")}
        <div class="d-flex justify-content-end mt-4 pt-3 border-top">${canEdit() ? `<button type="submit" class="btn btn-brand" id="singletonSaveBtn"><i class="bi bi-check-lg"></i> <span class="btn-label">Save changes</span></button>` : `<span class="badge text-bg-secondary">Read-only access</span>`}</div>
      </form></div>`;

    cfg.groups.flatMap((g) => g.fields).filter((f) => f.type === "image").forEach((field) => {
      const mount = document.getElementById(`f_${field.key.replace(/\./g, "_")}_mount`);
      imageWidgets[field.key] = ImageField.mount(mount, { value: getPath(record, field.key, ""), category: field.category || cfg.table, label: field.label, onChange: (url) => { setPath(record, field.key, url); markDirty(); } });
      if (!canEdit()) mount.querySelectorAll("input,button").forEach((el) => el.disabled = true);
    });

    const form = document.getElementById("singletonContentForm");
    form.querySelectorAll("[data-field]").forEach((el) => {
      const eventName = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(eventName, () => { setPath(record, el.dataset.field, el.type === "checkbox" ? el.checked : el.value); markDirty(); });
    });
    bindRepeaters();
    if (canEdit()) form.addEventListener("submit", save);
    DashUnsaved.set(false);
  }

  function bindRepeaters() {
    cfg.repeaters.forEach((rep) => {
      const root = document.querySelector(`[data-repeater="${rep.key}"]`);
      if (!root) return;
      root.querySelector(`[data-add="${rep.key}"]`)?.addEventListener("click", () => {
        const item = { id: uid(rep.itemPrefix || "item") };
        rep.fields.forEach((f) => { item[f.key] = ""; });
        record[rep.key].push(item); markDirty(); render();
      });
      root.querySelectorAll("[data-repeater-field]").forEach((el) => el.addEventListener("input", () => {
        record[rep.key][Number(el.dataset.index)][el.dataset.repeaterField] = el.value; markDirty();
      }));
      root.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", () => {
        record[rep.key].splice(Number(btn.dataset.remove), 1); markDirty(); render();
      }));
      root.querySelectorAll("[data-move-up]").forEach((btn) => btn.addEventListener("click", () => move(rep.key, Number(btn.dataset.moveUp), -1)));
      root.querySelectorAll("[data-move-down]").forEach((btn) => btn.addEventListener("click", () => move(rep.key, Number(btn.dataset.moveDown), 1)));
      let dragged = null;
      root.querySelectorAll(".structured-repeater-item").forEach((item) => {
        item.addEventListener("dragstart", () => { dragged = Number(item.dataset.index); item.classList.add("is-dragging"); });
        item.addEventListener("dragend", () => item.classList.remove("is-dragging"));
        item.addEventListener("dragover", (e) => e.preventDefault());
        item.addEventListener("drop", (e) => {
          e.preventDefault(); const target = Number(item.dataset.index);
          if (dragged === null || dragged === target) return;
          const [moved] = record[rep.key].splice(dragged, 1); record[rep.key].splice(target, 0, moved); markDirty(); render();
        });
      });
    });
  }

  function move(key, index, delta) {
    const target = index + delta;
    if (target < 0 || target >= record[key].length) return;
    [record[key][index], record[key][target]] = [record[key][target], record[key][index]];
    markDirty(); render();
  }

  function markDirty() { DashUnsaved.set(true); }

  function validate() {
    let first = null;
    document.querySelectorAll("#singletonContentForm [required]").forEach((el) => {
      el.classList.remove("is-invalid");
      if (!String(el.value || "").trim()) { el.classList.add("is-invalid"); if (!first) first = el; }
    });
    for (const rep of cfg.repeaters) {
      for (const [i, item] of record[rep.key].entries()) {
        for (const field of rep.fields.filter((f) => f.required)) {
          if (!String(item[field.key] || "").trim()) {
            const el = document.getElementById(`${rep.key}_${i}_${field.key}`); if (el) el.classList.add("is-invalid"); if (!first) first = el;
          }
        }
      }
    }
    if (first) { first.focus(); DashToast.error("Please complete the required fields."); return false; }
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (saving || !validate()) return;
    saving = true;
    const btn = document.getElementById("singletonSaveBtn"); btn.disabled = true; btn.querySelector(".btn-label").textContent = "Saving…";
    Object.entries(imageWidgets).forEach(([key, widget]) => setPath(record, key, widget.getValue()));
    const payload = {};
    cfg.persistFields.forEach((key) => setPath(payload, key, clone(getPath(record, key, key.includes(".") ? "" : []))));
    const { error } = await AdminApi.update(cfg.table, 1, payload);
    saving = false; btn.disabled = false; btn.querySelector(".btn-label").textContent = "Save changes";
    if (error) { DashToast.error(DashError.friendly(error, `Unable to save ${cfg.title.toLowerCase()}.`)); return; }
    DashUnsaved.set(false); DashToast.success(`${cfg.title} updated.`); DashActivity.log("updated", cfg.table, cfg.title);
  }

  return { init };
})();
