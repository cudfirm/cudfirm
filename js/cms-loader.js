/**
 * js/cms-loader.js
 * ------------------------------------------------------------------
 * Loads all CMS content in parallel and exposes it as `window.CMS`
 * BEFORE script.js builds the tabs. script.js awaits
 * `window.CMSReady` once (see the DOMContentLoaded handler) and then
 * reads from `window.CMS.*`, falling back to its own hardcoded
 * defaults for any table that is missing (Supabase not yet
 * configured, RLS misconfigured, network down, etc).
 *
 * This means: as long as `js/supabase.js` still has placeholder
 * keys, or any single table is empty, the site renders EXACTLY as
 * it does today. Nothing breaks. Content only starts coming from
 * Supabase once real data exists there.
 * ------------------------------------------------------------------
 */

window.CMS = {
  hero: null,
  about: null,
  services: null,
  portfolio: null,
  testimonials: null,
  faq: null,
  navigation: null,
  contact: null,
  siteSettings: null,
  seo: null,
};

// Hard timeout: never block the page for more than 2.5s on a slow
// or unreachable Supabase project.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

window.CMSReady = (async function loadCMS() {
  const TIMEOUT_MS = 2500;

  const [hero, about, services, portfolio, testimonials, faq, navigation, contact, siteSettings, seo] =
    await Promise.all([
      withTimeout(CMSApi.getHero(), TIMEOUT_MS),
      withTimeout(CMSApi.getAbout(), TIMEOUT_MS),
      withTimeout(CMSApi.getServices(), TIMEOUT_MS),
      withTimeout(CMSApi.getPortfolioProjects(), TIMEOUT_MS),
      withTimeout(CMSApi.getTestimonials(), TIMEOUT_MS),
      withTimeout(CMSApi.getFaqs(), TIMEOUT_MS),
      withTimeout(CMSApi.getNavigation(), TIMEOUT_MS),
      withTimeout(CMSApi.getContact(), TIMEOUT_MS),
      withTimeout(CMSApi.getSiteSettings(), TIMEOUT_MS),
      withTimeout(CMSApi.getSeoMeta("home"), TIMEOUT_MS),
    ]);

  window.CMS = { hero, about, services, portfolio, testimonials, faq, navigation, contact, siteSettings, seo };
  window.CMSContract = window.CUDFIRMContract ? window.CUDFIRMContract.normalize(window.CMS) : null;

  if (Object.values(window.CMS).every((v) => v === null || (Array.isArray(v) && v.length === 0))) {
    console.info('[CMS] No Supabase content found — using built-in defaults from script.js.');
  } else {
    console.info('[CMS] Loaded content from Supabase.');
  }

  return window.CMS;
})();
