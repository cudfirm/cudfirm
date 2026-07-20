/**
 * js/cms-api.js
 * ------------------------------------------------------------------
 * Shared data-access layer over Supabase. This file owns table names,
 * approved public reads, and purpose-specific public form writes.
 * Templates and adapters must not call `db.from(...)` directly.
 *
 * Read functions return `null` on failure so public rendering can use
 * safe template fallbacks. Write functions return a structured result.
 * ------------------------------------------------------------------
 */

const CMSApi = (() => {
  const API_VERSION = "1.1.0";
  const db = typeof supabaseClient !== "undefined"
    ? supabaseClient
    : window.supabaseClient || null;

  function cleanText(value, maxLength) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  function cleanEmail(value) {
    return cleanText(value, 320).toLowerCase();
  }

  function mutationFailure(message, code = "client_error") {
    return Object.freeze({
      ok: false,
      data: null,
      duplicate: false,
      error: Object.freeze({ code, message }),
    });
  }

  async function safeQuery(builderFn, label) {
    if (!db) {
      console.warn(`[CMS] ${label} query skipped: Supabase is not configured.`);
      return null;
    }

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

  async function safeMutation(builderFn, label, options = {}) {
    if (!db) return mutationFailure("Supabase is not configured.", "not_configured");

    try {
      const { data, error } = await builderFn();

      if (error) {
        const duplicate = options.duplicateIsSuccess && error.code === "23505";
        if (duplicate) {
          return Object.freeze({ ok: true, data: null, duplicate: true, error: null });
        }

        console.warn(`[CMS] ${label} submission error:`, error.message);
        return mutationFailure(error.message || "Submission failed.", error.code || "database_error");
      }

      return Object.freeze({ ok: true, data: data ?? null, duplicate: false, error: null });
    } catch (err) {
      console.warn(`[CMS] ${label} submission failed:`, err.message);
      return mutationFailure(err.message || "Submission failed.", "network_error");
    }
  }

  function submitContactMessage(input = {}) {
    const payload = Object.freeze({
      name: cleanText(input.name, 120),
      contact_info: cleanText(input.contactInfo ?? input.contact_info, 320),
      message: cleanText(input.message, 5000),
    });

    if (!payload.name || !payload.contact_info || !payload.message) {
      return Promise.resolve(mutationFailure("Name, contact information, and message are required.", "validation_error"));
    }

    return safeMutation(
      () => db.from("messages").insert(payload),
      "contact",
    );
  }

  function subscribeNewsletter(value) {
    const email = cleanEmail(typeof value === "object" ? value?.email : value);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!validEmail) {
      return Promise.resolve(mutationFailure("A valid email address is required.", "validation_error"));
    }

    return safeMutation(
      () => db.from("subscribers").insert(Object.freeze({ email })),
      "newsletter",
      { duplicateIsSuccess: true },
    );
  }

  return Object.freeze({
    API_VERSION,

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

    submitContactMessage,
    subscribeNewsletter,
  });
})();

window.CMSApi = CMSApi;
