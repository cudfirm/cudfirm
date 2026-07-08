/**
 * dashboard/js/pages/settings-page.js
 * ------------------------------------------------------------------
 * The `site_settings` table is a singleton (id = 1), same pattern as
 * `hero` — one dedicated edit-only form rather than CrudEngine.
 * Feeds the public site's footer/contact details via
 * CMSApi.getSiteSettings() -> window.CMS.siteSettings (see
 * js/cms-api.js and js/cms-loader.js).
 * ------------------------------------------------------------------
 */

const SettingsPage = (() => {
  const TABLE = "site_settings";
  let socialLinks = [];
  let logoWidget = null;
  let faviconWidget = null;
  let isSaving = false;

  function markDirty() {
    DashUnsaved.set(true);
  }

  async function init() {
    const root = document.getElementById("page-content");
    root.innerHTML = `<div class="loading-state" role="status"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Loading settings…</div>`;

    const { data, error } = await AdminApi.getById(TABLE, 1);
    if (error) {
      root.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>Could not load site settings.</div>`;
      DashToast.error(DashError.friendly(error, "Could not load site settings."));
      return;
    }

    socialLinks = Array.isArray(data.social_links) ? [...data.social_links] : [];
    renderForm(data);
  }

  function renderForm(s) {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <div class="singleton-note">
        <i class="bi bi-info-circle-fill mt-1" aria-hidden="true"></i>
        <span>These values feed the footer and contact details across the live site.</span>
      </div>

      <div class="table-card p-4">
        <form id="settingsForm" novalidate>

          <div class="settings-section-title">Company</div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="f_company_name">Company name</label>
              <input type="text" class="form-control" id="f_company_name" maxlength="120" value="${esc(s.company_name)}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_email">Email</label>
              <input type="email" class="form-control" id="f_email" maxlength="150" value="${esc(s.email)}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_phone">Phone</label>
              <input type="text" class="form-control" id="f_phone" maxlength="40" value="${esc(s.phone)}">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_whatsapp">WhatsApp number</label>
              <input type="text" class="form-control" id="f_whatsapp" maxlength="40" value="${esc(s.whatsapp)}">
            </div>
            <div class="col-12">
              <label class="form-label" for="f_address">Address</label>
              <input type="text" class="form-control" id="f_address" maxlength="200" value="${esc(s.address)}">
            </div>
          </div>

          <div class="settings-section-title">Branding</div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Company logo</label>
              <div id="logoMount"></div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Favicon</label>
              <div id="faviconMount"></div>
              <div class="form-hint">Square image recommended (e.g. 512×512).</div>
            </div>
          </div>

          <div class="settings-section-title">Social links</div>
          <div id="socialLinksList" role="group" aria-label="Social links"></div>
          <button type="button" class="btn-add-repeater mt-1" id="addSocialLink"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add social link</button>

          <div class="settings-section-title">Footer</div>
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="f_footer_text">Footer tagline</label>
              <textarea class="form-control" id="f_footer_text" rows="2" maxlength="300">${esc(s.footer_text)}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label" for="f_copyright_text">Copyright line</label>
              <input type="text" class="form-control" id="f_copyright_text" maxlength="200" value="${esc(s.copyright_text)}">
            </div>
            <div class="col-12">
              <label class="form-label" for="f_google_maps_embed">Google Maps embed URL</label>
              <input type="text" class="form-control" id="f_google_maps_embed" value="${esc(s.google_maps_embed)}" placeholder="https://www.google.com/maps/embed?…">
              <div class="form-hint">Paste the "src" URL from Google Maps → Share → Embed a map.</div>
            </div>
          </div>

          <div class="settings-section-title">Analytics</div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="f_ga_id">Google Analytics ID</label>
              <input type="text" class="form-control" id="f_ga_id" maxlength="40" value="${esc(s.ga_id)}" placeholder="G-XXXXXXXXXX">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="f_fb_pixel_id">Meta Pixel ID</label>
              <input type="text" class="form-control" id="f_fb_pixel_id" maxlength="40" value="${esc(s.fb_pixel_id)}">
            </div>
          </div>

          <div class="d-flex justify-content-end mt-4 pt-3 border-top">
            <button type="submit" class="btn btn-brand" id="settingsSaveBtn">
              <i class="bi bi-check-lg" aria-hidden="true"></i> <span class="btn-label">Save changes</span>
            </button>
          </div>
        </form>
      </div>
    `;

    logoWidget = ImageField.mount(document.getElementById("logoMount"), {
      value: s.logo_url,
      category: "branding",
      label: "Company logo",
      onChange: markDirty,
    });
    faviconWidget = ImageField.mount(document.getElementById("faviconMount"), {
      value: s.favicon_url,
      category: "branding",
      label: "Favicon",
      onChange: markDirty,
    });

    renderSocialLinks();
    document.getElementById("addSocialLink").addEventListener("click", () => {
      socialLinks.push({ platform: "instagram", url: "" });
      markDirty();
      renderSocialLinks();
    });
    document.getElementById("settingsForm").addEventListener("submit", onSave);

    DashUnsaved.set(false);
    document.getElementById("settingsForm").querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", markDirty);
    });
  }

  const PLATFORM_OPTIONS = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"];

  function renderSocialLinks() {
    const list = document.getElementById("socialLinksList");
    if (!socialLinks.length) {
      list.innerHTML = `<div class="form-hint mb-2">No social links yet.</div>`;
      return;
    }
    list.innerHTML = socialLinks
      .map((link, i) => {
        const opts = PLATFORM_OPTIONS.map((p) => `<option value="${p}" ${link.platform === p ? "selected" : ""}>${p[0].toUpperCase() + p.slice(1)}</option>`).join("");
        return `
        <div class="repeater-item">
          <label class="visually-hidden" for="social_platform_${i}">Platform ${i + 1}</label>
          <select class="form-select" style="max-width:170px" id="social_platform_${i}" data-idx="${i}" data-field="platform">${opts}</select>
          <label class="visually-hidden" for="social_url_${i}">URL ${i + 1}</label>
          <input type="text" class="form-control" id="social_url_${i}" placeholder="https://…" value="${esc(link.url)}" data-idx="${i}" data-field="url">
          <button type="button" class="btn-repeater-remove" data-remove="${i}" aria-label="Remove social link ${i + 1}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
        </div>`;
      })
      .join("");

    list.querySelectorAll("[data-idx]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.idx);
        socialLinks[idx][e.target.dataset.field] = e.target.value;
        markDirty();
      });
      input.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.idx);
        socialLinks[idx][e.target.dataset.field] = e.target.value;
        markDirty();
      });
    });
    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        socialLinks.splice(Number(btn.dataset.remove), 1);
        markDirty();
        renderSocialLinks();
      });
    });
  }

  function setSaving(saving) {
    isSaving = saving;
    const btn = document.getElementById("settingsSaveBtn");
    btn.disabled = saving;
    btn.querySelector(".btn-label").textContent = saving ? "Saving…" : "Save changes";
  }

  async function onSave(e) {
    e.preventDefault();
    if (isSaving) return;
    setSaving(true);

    const payload = {
      company_name: document.getElementById("f_company_name").value,
      email: document.getElementById("f_email").value,
      phone: document.getElementById("f_phone").value,
      whatsapp: document.getElementById("f_whatsapp").value,
      address: document.getElementById("f_address").value,
      logo_url: logoWidget.getValue(),
      favicon_url: faviconWidget.getValue(),
      social_links: socialLinks.filter((l) => l.url && l.url.trim() !== ""),
      footer_text: document.getElementById("f_footer_text").value,
      copyright_text: document.getElementById("f_copyright_text").value,
      google_maps_embed: document.getElementById("f_google_maps_embed").value,
      ga_id: document.getElementById("f_ga_id").value,
      fb_pixel_id: document.getElementById("f_fb_pixel_id").value,
    };

    const { error } = await AdminApi.update(TABLE, 1, payload);

    setSaving(false);

    if (error) {
      DashToast.error(DashError.friendly(error, "Unable to save your changes. Please try again."));
      if (DashError.isAuthExpired(error)) setTimeout(() => window.location.replace("index.html"), 1200);
      return;
    }

    DashUnsaved.set(false);
    DashToast.success("Site settings updated.");
    DashActivity.log("updated", "site_settings", "Site Settings");
  }

  return { init };
})();
