/**
 * CUDFIRM CMS data-contract normalizer (v1 foundation).
 * Converts raw database records into template-neutral field names.
 * No Supabase queries or rendering logic belongs in this file.
 */
const CUDFIRMContract = (() => {
  const CONTRACT_VERSION = "1.0.0";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }

  function bool(value, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
  }

  function normalizeSite(s = {}) {
    return {
      name: text(s.site_name || s.business_name || "CUDFIRM"),
      logoUrl: text(s.logo_url),
      faviconUrl: text(s.favicon_url),
      email: text(s.email),
      phone: text(s.phone),
      whatsapp: text(s.whatsapp),
      address: text(s.address),
      socialLinks: array(s.social_links),
      footerText: text(s.footer_text),
      copyrightText: text(s.copyright_text),
      mapEmbedUrl: text(s.map_embed_url),
    };
  }

  function normalizeTheme(s = {}) {
    return {
      preset: text(s.theme_preset),
      mode: text(s.theme_mode),
      colors: {
        primary: text(s.theme_primary_color),
        secondary: text(s.theme_secondary_color),
        accent: text(s.theme_accent_color),
        background: text(s.theme_background_color),
        text: text(s.theme_text_color),
      },
      typography: {
        heading: text(s.theme_heading_font),
        body: text(s.theme_body_font),
      },
      buttonStyle: text(s.theme_button_style),
      spacing: text(s.theme_section_spacing),
      shadow: text(s.theme_card_shadow),
      radius: text(s.theme_border_radius),
      containerWidth: text(s.theme_container_width || "wide"),
      customCss: text(s.custom_css),
    };
  }

  function normalizeHero(h = {}) {
    return {
      eyebrow: text(h.eyebrow),
      title: text(h.title),
      subtitle: text(h.subtitle),
      imageUrl: text(h.image_url),
      primaryAction: { label: text(h.cta_primary_text), target: text(h.cta_primary_target) },
      secondaryAction: { label: text(h.cta_secondary_text), target: text(h.cta_secondary_target) },
      trustItems: array(h.trust_items),
    };
  }

  function normalizeAbout(a = {}) {
    return {
      eyebrow: text(a.eyebrow),
      title: text(a.title),
      introduction: text(a.introduction),
      missionTitle: text(a.mission_title),
      missionText: text(a.mission_text),
      storyTitle: text(a.story_title),
      storyBlocks: array(a.story_blocks),
      valuesTitle: text(a.values_title),
      values: array(a.values),
      factsTitle: text(a.facts_title),
      facts: array(a.facts),
      imageUrl: text(a.image_url),
      imageAlt: text(a.image_alt),
      action: { label: text(a.cta_label), target: text(a.cta_target) },
      status: text(a.status),
    };
  }

  function normalizeContact(c = {}, site = {}) {
    const form = c.form_config && typeof c.form_config === "object" && !Array.isArray(c.form_config)
      ? c.form_config
      : {};
    return {
      eyebrow: text(c.eyebrow),
      title: text(c.title),
      introduction: text(c.introduction),
      assurances: array(c.assurances),
      form: { ...form },
      directContact: {
        title: text(c.direct_contact_title),
        description: text(c.direct_contact_description),
        businessHours: text(c.business_hours),
        showPhone: bool(c.show_phone, true),
        showEmail: bool(c.show_email, true),
        showWhatsapp: bool(c.show_whatsapp, true),
        showAddress: bool(c.show_address, true),
        showMap: bool(c.show_map, false),
        phone: text(site.phone),
        email: text(site.email),
        whatsapp: text(site.whatsapp),
        address: text(site.address),
        mapEmbedUrl: text(site.mapEmbedUrl),
      },
      status: text(c.status),
    };
  }

  function normalize(raw = {}) {
    const site = normalizeSite(raw.siteSettings || {});
    return {
      meta: {
        contractVersion: CONTRACT_VERSION,
        generatedAt: new Date().toISOString(),
        locale: "en-NG",
      },
      site,
      theme: normalizeTheme(raw.siteSettings || {}),
      navigation: array(raw.navigation).map((n) => ({
        id: n.id,
        label: text(n.label),
        target: text(n.tab_id),
        location: text(n.location),
        badge: text(n.badge),
        status: text(n.status),
        order: Number(n.sort_order) || 0,
      })),
      hero: normalizeHero(raw.hero || {}),
      about: normalizeAbout(raw.about || {}),
      services: array(raw.services).map((s) => ({
        id: s.id,
        title: text(s.name),
        description: text(s.description),
        priceText: text(s.price),
        iconUrl: text(s.icon_url),
        tags: array(s.tags),
        searchTerms: text(s.search_terms),
        featured: bool(s.featured_home),
        special: bool(s.is_special),
        status: text(s.status),
        order: Number(s.sort_order) || 0,
      })),
      portfolio: array(raw.portfolio).map((p) => ({
        id: p.id,
        title: text(p.name),
        industry: text(p.industry),
        projectType: text(p.project_type),
        imageUrl: text(p.image_url),
        destination: text(p.link),
        problem: text(p.problem),
        solution: text(p.solution),
        tags: array(p.tags),
        live: bool(p.is_live),
        featured: bool(p.featured_home),
        status: text(p.status),
        order: Number(p.sort_order) || 0,
      })),
      testimonials: array(raw.testimonials).map((t) => ({
        id: t.id,
        name: text(t.name),
        role: text(t.role),
        quote: text(t.quote),
        avatarUrl: text(t.avatar_url),
        accentColor: text(t.accent_color),
        placeholder: bool(t.is_placeholder),
        status: text(t.status),
        order: Number(t.sort_order) || 0,
      })),
      faq: array(raw.faq).map((f) => ({
        id: f.id,
        question: text(f.question),
        answer: text(f.answer),
        status: text(f.status),
        order: Number(f.sort_order) || 0,
      })),
      contact: normalizeContact(raw.contact || {}, site),
      seo: raw.seo ? { pages: { home: raw.seo } } : { pages: {} },
      media: {},
    };
  }

  return { CONTRACT_VERSION, normalize };
})();
window.CUDFIRMContract = CUDFIRMContract;
