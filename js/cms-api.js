/**
 * js/cms-api.js
 * ------------------------------------------------------------------
 * Thin data-access layer over Supabase. This file knows the table
 * names and column shapes; nothing else in the codebase should call
 * `db.from(...)` directly. That keeps a schema change to a
 * one-file fix.
 *
 * Every function returns `null` on failure instead of throwing, so a
 * misconfigured key or a down network NEVER breaks page rendering.
 * cms-loader.js decides what to do when a table comes back null
 * (fall back to the hardcoded defaults already in script.js).
 * ------------------------------------------------------------------
 */

// Use the client created in js/supabase.js
const db = supabaseClient;

const CMSApi = (() => {
  async function safeQuery(builderFn, label) {
    try {
      const { data, error } = await builderFn();

      if (error) {
        console.warn(`[CMS] ${label} query error:`, error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.warn(`[CMS] ${label} query failed:`, err.message);
      return null;
    }
  }

  return {
    getHero: () =>
      safeQuery(
        () => db.from("hero").select("*").eq("id", 1).single(),
        "hero"
      ),

    getAbout: () =>
      safeQuery(
        () => db.from("about_content").select("*").eq("id", 1).eq("status", "published").single(),
        "about_content"
      ),

    getContact: () =>
      safeQuery(
        () => db.from("contact_content").select("*").eq("id", 1).eq("status", "published").single(),
        "contact_content"
      ),

    getServices: () =>
      safeQuery(
        () =>
          db
            .from("services")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true }),
        "services"
      ),

    getPortfolioProjects: () =>
      safeQuery(
        () =>
          db
            .from("portfolio_projects")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true }),
        "portfolio_projects"
      ),

    getTestimonials: () =>
      safeQuery(
        () =>
          db
            .from("testimonials")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true }),
        "testimonials"
      ),

    getFaqs: () =>
      safeQuery(
        () =>
          db
            .from("faq")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true }),
        "faq"
      ),

    getNavigation: () =>
      safeQuery(
        () =>
          db
            .from("navigation")
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true }),
        "navigation"
      ),

    // --- Phase 3 additions (Site Settings + SEO Manager) ---
    // Same safeQuery pattern as everything above: returns null on
    // any failure so cms-loader.js can fall back to the defaults
    // already hardcoded in script.js.

    getSiteSettings: () =>
      safeQuery(
        () => db.from("site_settings").select("*").eq("id", 1).single(),
        "site_settings"
      ),

    getSeoMeta: (pageKey) =>
      safeQuery(
        () => db.from("seo_meta").select("*").eq("page_key", pageKey).single(),
        "seo_meta"
      ),
  };
})();