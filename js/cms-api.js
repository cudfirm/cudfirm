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

    getServices: () =>
      safeQuery(
        () =>
          db
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        "services"
      ),

    getPortfolioProjects: () =>
      safeQuery(
        () =>
          db
            .from("portfolio_projects")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        "portfolio_projects"
      ),

    getTestimonials: () =>
      safeQuery(
        () =>
          db
            .from("testimonials")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        "testimonials"
      ),

    getFaqs: () =>
      safeQuery(
        () =>
          db
            .from("faq")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        "faq"
      ),

    getNavigation: () =>
      safeQuery(
        () =>
          db
            .from("navigation")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        "navigation"
      ),
  };
})();