/**
 * CUDFIRM CMS data-contract normalizer.
 *
 * Converts raw database records into stable, template-neutral field names.
 * Supabase queries, dashboard behavior, template selectors, and rendering
 * logic must remain outside this file.
 */
const CUDFIRMContract = (() => {
  const CONTRACT_VERSION = "1.1.0";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }

  function bool(value, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeAction(label, target) {
    return { label: text(label), target: text(target) };
  }

  function normalizeSite(s = {}) {
    return {
      name: text(s.company_name || s.site_name || s.business_name),
      logoUrl: text(s.logo_url),
      faviconUrl: text(s.favicon_url),
      email: text(s.email),
      phone: text(s.phone),
      whatsapp: text(s.whatsapp),
      address: text(s.address),
      socialLinks: array(s.social_links).map((link) => ({
        platform: text(link?.platform),
        url: text(link?.url),
      })),
      footerText: text(s.footer_text),
      copyrightText: text(s.copyright_text),
      mapEmbedUrl: text(s.google_maps_embed || s.map_embed_url),
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
      spacing: text(s.theme_spacing || s.theme_section_spacing),
      shadow: text(s.theme_shadow || s.theme_card_shadow),
      radius: text(s.theme_radius || s.theme_border_radius),
      containerWidth: text(s.theme_container_width || "wide"),
      customCss: text(s.custom_css),
    };
  }

  function normalizeMaintenance(s = {}) {
    return {
      enabled: bool(s.maintenance_enabled),
      title: text(s.maintenance_title),
      message: text(s.maintenance_message),
      returnAt: text(s.maintenance_return_at),
      contactUrl: text(s.maintenance_contact_url),
    };
  }

  function normalizeHero(h = {}) {
    return {
      eyebrow: text(h.eyebrow),
      title: text(h.title),
      subtitle: text(h.subtitle),
      imageUrl: text(h.image_url),
      primaryAction: normalizeAction(h.cta_primary_text, h.cta_primary_target),
      secondaryAction: normalizeAction(h.cta_secondary_text, h.cta_secondary_target),
      trustItems: array(h.trust_items).map((item) => ({
        icon: text(item?.icon),
        label: text(item?.label),
      })),
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
      storyBlocks: array(a.story_blocks).map((block) => ({
        id: text(block?.id),
        heading: text(block?.heading),
        text: text(block?.text),
        imageUrl: text(block?.imageUrl || block?.image_url),
        imageAlt: text(block?.imageAlt || block?.image_alt),
      })),
      valuesTitle: text(a.values_title),
      values: array(a.values).map((value) => ({
        id: text(value?.id),
        icon: text(value?.icon),
        title: text(value?.title),
        description: text(value?.description || value?.desc),
      })),
      factsTitle: text(a.facts_title),
      facts: array(a.facts).map((fact) => ({
        id: text(fact?.id),
        label: text(fact?.label),
        value: text(fact?.value),
      })),
      imageUrl: text(a.image_url),
      imageAlt: text(a.image_alt),
      action: normalizeAction(a.cta_label, a.cta_target),
      status: text(a.status),
    };
  }

  function normalizeContactForm(value) {
    const form = object(value);
    return {
      ...form,
      nameLabel: text(form.nameLabel),
      namePlaceholder: text(form.namePlaceholder),
      contactLabel: text(form.contactLabel),
      contactPlaceholder: text(form.contactPlaceholder),
      messageLabel: text(form.messageLabel),
      messagePlaceholder: text(form.messagePlaceholder),
      submitLabel: text(form.submitLabel),
      submittingLabel: text(form.submittingLabel),
      successMessage: text(form.successMessage),
      errorMessage: text(form.errorMessage),
      whatsappLabel: text(form.whatsappLabel),
      emailLabel: text(form.emailLabel),
      privacyText: text(form.privacyText),
    };
  }

  function normalizeContact(c = {}, site = {}) {
    return {
      eyebrow: text(c.eyebrow),
      title: text(c.title),
      introduction: text(c.introduction),
      assurances: array(c.assurances).map((assurance) => ({
        id: text(assurance?.id),
        icon: text(assurance?.icon),
        title: text(assurance?.title),
        description: text(assurance?.description),
      })),
      form: normalizeContactForm(c.form_config),
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

  function normalizeSeoPage(page = {}, fallbackKey = "") {
    return {
      key: text(page.page_key || fallbackKey),
      title: text(page.title),
      description: text(page.meta_description || page.description),
      canonicalUrl: text(page.canonical_url || page.canonicalUrl),
      robots: text(page.robots),
      openGraphImage: text(page.og_image || page.openGraphImage),
      twitterImage: text(page.twitter_image || page.twitterImage),
    };
  }

  function normalizeSeo(value) {
    if (value?.pages && typeof value.pages === "object" && !Array.isArray(value.pages)) {
      return {
        pages: Object.fromEntries(
          Object.entries(value.pages).map(([key, page]) => [key, normalizeSeoPage(page, key)])
        ),
      };
    }

    const records = Array.isArray(value) ? value : value ? [value] : [];
    const pages = {};
    records.forEach((record) => {
      const page = normalizeSeoPage(record);
      if (page.key) pages[page.key] = page;
    });
    return { pages };
  }

  function normalizeMedia(value) {
    return {
      items: array(value).map((item) => ({
        id: item?.id ?? null,
        fileName: text(item?.file_name),
        storagePath: text(item?.storage_path),
        publicUrl: text(item?.public_url),
        bucket: text(item?.bucket),
        category: text(item?.category),
        mimeType: text(item?.mime_type),
        sizeBytes: number(item?.size_bytes),
        altText: text(item?.alt_text),
        createdAt: text(item?.created_at),
      })),
    };
  }

  function normalize(raw = {}) {
    const site = normalizeSite(raw.siteSettings || {});
    return {
      meta: {
        contractVersion: CONTRACT_VERSION,
        generatedAt: new Date().toISOString(),
        locale: text(raw.locale || "en-NG"),
      },
      site,
      theme: normalizeTheme(raw.siteSettings || {}),
      maintenance: normalizeMaintenance(raw.siteSettings || {}),
      navigation: array(raw.navigation).map((n) => ({
        id: n?.id ?? null,
        label: text(n?.label),
        target: text(n?.target || n?.tab_id),
        location: text(n?.location),
        badge: text(n?.badge),
        status: text(n?.status),
        order: number(n?.sort_order),
      })),
      hero: normalizeHero(raw.hero || {}),
      about: normalizeAbout(raw.about || {}),
      services: array(raw.services).map((s) => ({
        id: s?.id ?? null,
        title: text(s?.name || s?.title),
        description: text(s?.description),
        priceText: text(s?.price || s?.priceText),
        iconUrl: text(s?.icon_url || s?.iconUrl),
        tags: array(s?.tags).map(text),
        searchTerms: text(s?.search_terms || s?.searchTerms),
        special: bool(s?.is_special ?? s?.special),
        status: text(s?.status),
        order: number(s?.sort_order ?? s?.order),
      })),
      portfolio: array(raw.portfolio).map((p) => ({
        id: p?.id ?? null,
        title: text(p?.name || p?.title),
        industry: text(p?.industry),
        projectType: text(p?.project_type || p?.projectType),
        imageUrl: text(p?.image_url || p?.imageUrl),
        destination: text(p?.link || p?.destination),
        problem: text(p?.problem),
        solution: text(p?.solution),
        tags: array(p?.tags).map(text),
        live: bool(p?.is_live ?? p?.live),
        featured: bool(p?.featured_home ?? p?.featured),
        status: text(p?.status),
        order: number(p?.sort_order ?? p?.order),
      })),
      testimonials: array(raw.testimonials).map((t) => ({
        id: t?.id ?? null,
        name: text(t?.name),
        role: text(t?.role),
        quote: text(t?.quote),
        avatarUrl: text(t?.avatar_url || t?.avatarUrl),
        accentColor: text(t?.accent_color || t?.accentColor),
        placeholder: bool(t?.is_placeholder ?? t?.placeholder),
        status: text(t?.status),
        order: number(t?.sort_order ?? t?.order),
      })),
      faq: array(raw.faq).map((f) => ({
        id: f?.id ?? null,
        question: text(f?.question),
        answer: text(f?.answer),
        status: text(f?.status),
        order: number(f?.sort_order ?? f?.order),
      })),
      contact: normalizeContact(raw.contact || {}, site),
      seo: normalizeSeo(raw.seo),
      media: normalizeMedia(raw.media),
      extensions: object(raw.extensions),
    };
  }

  return { CONTRACT_VERSION, normalize };
})();
window.CUDFIRMContract = CUDFIRMContract;
