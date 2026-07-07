/**
 * dashboard/js/pages/hero-page.js
 * ------------------------------------------------------------------
 * The `hero` table is a singleton (id = 1, enforced by a DB check
 * constraint) and has a nested jsonb array (`trust_items`), so it
 * doesn't fit the generic list/create/delete CrudEngine. This is a
 * simple, dedicated edit-only form.
 *
 * Phase 2.5: same reliability patterns as crud-engine.js — friendly
 * errors via DashError, unsaved-changes tracking via DashUnsaved,
 * a double-submit guard, and accessible labels on the repeater
 * controls.
 * ------------------------------------------------------------------
 */

const HeroPage = (() => {
  const TABLE = "hero";
  let trustItems = [];
  let isSaving = false;

  function markDirty() {
    DashUnsaved.set(true);
  }

  async function init() {
    const root = document.getElementById("page-content");
    root.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading hero content…</div>`;

    const { data, error } = await AdminApi.getById(TABLE, 1);
    if (error) {
      root.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load the hero section.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load the hero section."));
      if (DashError.isAuthExpired(error)) setTimeout(() => window.location.replace("index.html"), 1200);
      return;
    }

    trustItems = Array.isArray(data.trust_items) ? [...data.trust_items] : [];
    renderForm(data);
  }

  function renderForm(hero) {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="singleton-note">
        <i class="bi bi-info-circle-fill mt-1" aria-hidden="true"></i>
        <span>This is the single homepage hero row (id = 1). There is only ever one — you're editing it in place.</span>
      </div>

      <div class="table-card p-4">
        <form id="heroForm" novalidate>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="f_eyebrow">Eyebrow text</label>
              <input type="text" class="form-control" id="f_eyebrow" maxlength="80" value="${esc(hero.eyebrow)}">
            </div>
            <div class="col-12">
              <label class="form-label" for="f_title">Title <span class="req" aria-hidden="true">*</span></label>
              <textarea class="form-control" id="f_title" rows="2" maxlength="200" required aria-required="true">${esc(hero.title)}</textarea>
              <div class="invalid-feedback" id="err_title"></div>
            </div>
            <div class="col-12">
              <label class="form-label" for="f_subtitle">Subtitle</label>
              <textarea class="form-control" id="f_subtitle" rows="3" maxlength="400">${esc(hero.subtitle)}</textarea>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="f_cta_primary_text">Primary CTA text</label>
              <input type="text" class="form-control" id="f_cta_primary_text" maxlength="60" value="${esc(hero.cta_primary_text)}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_cta_primary_target">Primary CTA target</label>
              <input type="text" class="form-control" id="f_cta_primary_target" value="${esc(hero.cta_primary_target)}" aria-describedby="hint_primary_target">
              <div class="form-hint" id="hint_primary_target">A tab id (e.g. tab4) or "connect-content"</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="f_cta_secondary_text">Secondary CTA text</label>
              <input type="text" class="form-control" id="f_cta_secondary_text" maxlength="60" value="${esc(hero.cta_secondary_text)}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_cta_secondary_target">Secondary CTA target</label>
              <input type="text" class="form-control" id="f_cta_secondary_target" value="${esc(hero.cta_secondary_target)}">
            </div>

            <div class="col-12 mt-2">
              <label class="form-label" id="trustItemsLabel">Trust items <span class="form-hint d-inline">(the checkmark row under the CTAs)</span></label>
              <div id="trustItemsList" role="group" aria-labelledby="trustItemsLabel"></div>
              <button type="button" class="btn-add-repeater mt-1" id="addTrustItem"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add trust item</button>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-4 pt-3 border-top">
            <button type="submit" class="btn btn-brand" id="heroSaveBtn">
              <i class="bi bi-check-lg" aria-hidden="true"></i> <span class="btn-label">Save changes</span>
            </button>
          </div>
        </form>
      </div>
    `;

    renderTrustItems();
    document.getElementById("addTrustItem").addEventListener("click", () => {
      trustItems.push({ icon: "bi-check-circle-fill", label: "" });
      markDirty();
      renderTrustItems();
    });
    document.getElementById("heroForm").addEventListener("submit", onSave);

    // Track edits for the unsaved-changes guard (beforeunload + modal-
    // adjacent navigation elsewhere in the dashboard don't apply here
    // since this page has no modal, but reload/tab-close/nav away do).
    DashUnsaved.set(false);
    document.getElementById("heroForm").querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", markDirty);
    });
  }

  function renderTrustItems() {
    const list = document.getElementById("trustItemsList");
    if (!trustItems.length) {
      list.innerHTML = `<div class="form-hint mb-2">No trust items yet.</div>`;
      return;
    }
    list.innerHTML = trustItems
      .map(
        (item, i) => `
        <div class="repeater-item">
          <label class="visually-hidden" for="trust_icon_${i}">Trust item ${i + 1} icon class</label>
          <input type="text" class="form-control" style="max-width:170px" id="trust_icon_${i}" placeholder="bi-check-circle-fill" value="${esc(item.icon)}" data-idx="${i}" data-field="icon">
          <label class="visually-hidden" for="trust_label_${i}">Trust item ${i + 1} label</label>
          <input type="text" class="form-control" id="trust_label_${i}" placeholder="Label text" maxlength="60" value="${esc(item.label)}" data-idx="${i}" data-field="label">
          <button type="button" class="btn-repeater-remove" data-remove="${i}" aria-label="Remove trust item ${i + 1}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
        </div>`
      )
      .join("");

    list.querySelectorAll("input[data-idx]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        trustItems[idx][field] = e.target.value;
        markDirty();
      });
    });
    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        trustItems.splice(Number(btn.dataset.remove), 1);
        markDirty();
        renderTrustItems();
      });
    });
  }

  function setSaving(saving) {
    isSaving = saving;
    const btn = document.getElementById("heroSaveBtn");
    btn.disabled = saving;
    btn.querySelector(".btn-label").textContent = saving ? "Saving…" : "Save changes";
  }

  async function onSave(e) {
    e.preventDefault();
    if (isSaving) return;

    const titleEl = document.getElementById("f_title");
    const titleErr = document.getElementById("err_title");
    titleEl.classList.remove("is-invalid");
    titleErr.textContent = "";
    if (!titleEl.value.trim()) {
      titleEl.classList.add("is-invalid");
      titleErr.textContent = "Title is required.";
      titleEl.focus();
      DashToast.error("Please fix the highlighted field before saving.");
      return;
    }

    setSaving(true);

    const payload = {
      eyebrow: document.getElementById("f_eyebrow").value,
      title: titleEl.value,
      subtitle: document.getElementById("f_subtitle").value,
      cta_primary_text: document.getElementById("f_cta_primary_text").value,
      cta_primary_target: document.getElementById("f_cta_primary_target").value,
      cta_secondary_text: document.getElementById("f_cta_secondary_text").value,
      cta_secondary_target: document.getElementById("f_cta_secondary_target").value,
      trust_items: trustItems.filter((t) => t.label && t.label.trim() !== ""),
    };

    const { error } = await AdminApi.update(TABLE, 1, payload);

    setSaving(false);

    if (error) {
      DashToast.error(DashError.friendly(error, "Unable to save your changes. Please try again."));
      if (DashError.isAuthExpired(error)) setTimeout(() => window.location.replace("index.html"), 1200);
      return;
    }

    DashUnsaved.set(false);
    DashToast.success("Hero section updated.");
  }

  return { init };
})();
