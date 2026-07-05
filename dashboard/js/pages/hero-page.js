/**
 * dashboard/js/pages/hero-page.js
 * ------------------------------------------------------------------
 * The `hero` table is a singleton (id = 1, enforced by a DB check
 * constraint) and has a nested jsonb array (`trust_items`), so it
 * doesn't fit the generic list/create/delete CrudEngine. This is a
 * simple, dedicated edit-only form.
 * ------------------------------------------------------------------
 */

const HeroPage = (() => {
  const TABLE = "hero";
  let trustItems = [];

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function init() {
    const root = document.getElementById("page-content");
    root.innerHTML = `<div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading hero content…</div>`;

    const { data, error } = await AdminApi.getById(TABLE, 1);
    if (error) {
      root.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>Could not load the hero row.<br><small>${esc(error.message)}</small></div>`;
      DashToast.error("Failed to load hero: " + error.message);
      return;
    }

    trustItems = Array.isArray(data.trust_items) ? [...data.trust_items] : [];
    renderForm(data);
  }

  function renderForm(hero) {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="singleton-note">
        <i class="bi bi-info-circle-fill mt-1"></i>
        <span>This is the single homepage hero row (id = 1). There is only ever one — you're editing it in place.</span>
      </div>

      <div class="table-card p-4">
        <form id="heroForm">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Eyebrow text</label>
              <input type="text" class="form-control" id="f_eyebrow" value="${esc(hero.eyebrow)}">
            </div>
            <div class="col-12">
              <label class="form-label">Title <span class="req">*</span></label>
              <textarea class="form-control" id="f_title" rows="2" required>${esc(hero.title)}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label">Subtitle</label>
              <textarea class="form-control" id="f_subtitle" rows="3">${esc(hero.subtitle)}</textarea>
            </div>

            <div class="col-md-6">
              <label class="form-label">Primary CTA text</label>
              <input type="text" class="form-control" id="f_cta_primary_text" value="${esc(hero.cta_primary_text)}">
            </div>
            <div class="col-md-6">
              <label class="form-label">Primary CTA target</label>
              <input type="text" class="form-control" id="f_cta_primary_target" value="${esc(hero.cta_primary_target)}">
              <div class="form-hint">A tab id (e.g. tab4) or "connect-content"</div>
            </div>

            <div class="col-md-6">
              <label class="form-label">Secondary CTA text</label>
              <input type="text" class="form-control" id="f_cta_secondary_text" value="${esc(hero.cta_secondary_text)}">
            </div>
            <div class="col-md-6">
              <label class="form-label">Secondary CTA target</label>
              <input type="text" class="form-control" id="f_cta_secondary_target" value="${esc(hero.cta_secondary_target)}">
            </div>

            <div class="col-12 mt-2">
              <label class="form-label">Trust items <span class="form-hint d-inline">(the checkmark row under the CTAs)</span></label>
              <div id="trustItemsList"></div>
              <button type="button" class="btn-add-repeater mt-1" id="addTrustItem"><i class="bi bi-plus-lg"></i> Add trust item</button>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-4 pt-3 border-top">
            <button type="submit" class="btn btn-brand" id="heroSaveBtn"><i class="bi bi-check-lg"></i> Save changes</button>
          </div>
        </form>
      </div>
    `;

    renderTrustItems();
    document.getElementById("addTrustItem").addEventListener("click", () => {
      trustItems.push({ icon: "bi-check-circle-fill", label: "" });
      renderTrustItems();
    });
    document.getElementById("heroForm").addEventListener("submit", onSave);
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
          <input type="text" class="form-control" style="max-width:170px" placeholder="bi-check-circle-fill" value="${esc(item.icon)}" data-idx="${i}" data-field="icon">
          <input type="text" class="form-control" placeholder="Label text" value="${esc(item.label)}" data-idx="${i}" data-field="label">
          <button type="button" class="btn-repeater-remove" data-remove="${i}"><i class="bi bi-trash3"></i></button>
        </div>`
      )
      .join("");

    list.querySelectorAll("input[data-idx]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        trustItems[idx][field] = e.target.value;
      });
    });
    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        trustItems.splice(Number(btn.dataset.remove), 1);
        renderTrustItems();
      });
    });
  }

  async function onSave(e) {
    e.preventDefault();
    const btn = document.getElementById("heroSaveBtn");
    btn.disabled = true;
    btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Saving…`;

    const payload = {
      eyebrow: document.getElementById("f_eyebrow").value,
      title: document.getElementById("f_title").value,
      subtitle: document.getElementById("f_subtitle").value,
      cta_primary_text: document.getElementById("f_cta_primary_text").value,
      cta_primary_target: document.getElementById("f_cta_primary_target").value,
      cta_secondary_text: document.getElementById("f_cta_secondary_text").value,
      cta_secondary_target: document.getElementById("f_cta_secondary_target").value,
      trust_items: trustItems.filter((t) => t.label && t.label.trim() !== ""),
    };

    const { error } = await AdminApi.update("hero", 1, payload);

    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-lg"></i> Save changes`;

    if (error) {
      DashToast.error("Save failed: " + error.message);
      return;
    }
    DashToast.success("Hero section updated.");
  }

  return { init };
})();
