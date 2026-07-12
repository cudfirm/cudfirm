/**
 * CUDFIRM Phase 6.4 — isolated public theme manager.
 * Does not modify or depend on the internals of js/script.js.
 */
(() => {
  "use strict";

  const PRESETS = {
    default: { primary: "#0B3D2E", secondary: "#1A6B4A", accent: "#C8922A", background: "#F5F0E6", text: "#3A4035" },
    minimal: { primary: "#20241F", secondary: "#667065", accent: "#B18A4A", background: "#F7F7F4", text: "#30352F" },
    corporate: { primary: "#153B5B", secondary: "#2F678E", accent: "#C7902E", background: "#F2F5F7", text: "#26333D" },
    creative: { primary: "#542A68", secondary: "#9A3F7A", accent: "#E39A35", background: "#FFF6EC", text: "#372C39" },
    dark: { primary: "#10271F", secondary: "#23543D", accent: "#D4A84E", background: "#060E08", text: "#D4EAD8" },
  };

  const FONT_HEADINGS = {
    syne: "'Syne', sans-serif",
    dm_sans: "'DM Sans', system-ui, sans-serif",
    georgia: "Georgia, 'Times New Roman', serif",
  };
  const FONT_BODIES = {
    dm_sans: "'DM Sans', system-ui, sans-serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    georgia: "Georgia, 'Times New Roman', serif",
  };

  const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ""));
  const valueOr = (value, fallback) => isHex(value) ? value : fallback;

  function apply(settings = {}) {
    const root = document.documentElement;
    const presetName = PRESETS[settings.theme_preset] ? settings.theme_preset : "default";
    const preset = PRESETS[presetName];
    const primary = valueOr(settings.theme_primary_color, preset.primary);
    const secondary = valueOr(settings.theme_secondary_color, preset.secondary);
    const accent = valueOr(settings.theme_accent_color, preset.accent);
    const background = valueOr(settings.theme_background_color, preset.background);
    const text = valueOr(settings.theme_text_color, preset.text);

    root.dataset.themePreset = presetName;
    root.dataset.themeSpacing = settings.theme_spacing || "comfortable";
    root.dataset.themeShadow = settings.theme_shadow || "medium";
    root.dataset.themeRadius = settings.theme_radius || "medium";
    root.dataset.themeContainer = settings.theme_container_width || "wide";
    root.dataset.themeButton = settings.theme_button_style || "rounded";

    root.style.setProperty("--n-forest", primary);
    root.style.setProperty("--n-jade", secondary);
    root.style.setProperty("--n-gold", accent);
    root.style.setProperty("--n-cream", background);
    root.style.setProperty("--n-body", text);
    root.style.setProperty("--primary-color", primary);
    root.style.setProperty("--background-main", background);
    root.style.setProperty("--background-color", background);
    root.style.setProperty("--text-color", text);
    root.style.setProperty("--theme-heading-font", FONT_HEADINGS[settings.theme_heading_font] || FONT_HEADINGS.syne);
    root.style.setProperty("--theme-body-font", FONT_BODIES[settings.theme_body_font] || FONT_BODIES.dm_sans);

    const mode = settings.theme_mode || "light";
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    if (mode === "light") root.setAttribute("data-theme", "light");
    if (mode === "visitor") {
      try {
        const stored = localStorage.getItem("cudfirm_theme");
        if (stored === "dark" || stored === "light") root.setAttribute("data-theme", stored);
      } catch (_) {}
    }

    let custom = document.getElementById("cudfirmCustomThemeCss");
    if (!custom) {
      custom = document.createElement("style");
      custom.id = "cudfirmCustomThemeCss";
      document.head.appendChild(custom);
    }
    custom.textContent = typeof settings.custom_css === "string" ? settings.custom_css.slice(0, 12000) : "";
  }

  function previewSettings() {
    try {
      if (!new URLSearchParams(location.search).has("theme-preview")) return null;
      const raw = sessionStorage.getItem("cudfirm_theme_preview");
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  const preview = previewSettings();
  if (preview) {
    apply(preview);
    return;
  }

  const ready = window.CMSReady && typeof window.CMSReady.then === "function"
    ? window.CMSReady
    : Promise.resolve();

  ready.then(() => apply((window.CMS && window.CMS.siteSettings) || {})).catch(() => apply({}));

  window.CUDFIRMTheme = { apply, PRESETS };
})();
