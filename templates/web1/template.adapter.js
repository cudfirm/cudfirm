/** Web1 — CUDFIRM Adapter 2. Maps the normalized contract into Web1 markup. */
(function () {
  'use strict';

  const ADAPTER_ID = 'web1';
  const ADAPTER_VERSION = '1.0.0';
  const renderedSections = new Set();
  const errors = [];

  const text = (value) => (value == null ? '' : String(value));
  const hasText = (value) => text(value).trim() !== '';
  const query = (root, selector) => root?.querySelector?.(selector) || null;
  const all = (root, selector) => Array.from(root?.querySelectorAll?.(selector) || []);

  function setText(element, value) {
    if (element && hasText(value)) element.textContent = text(value);
  }

  function safeHref(value, fallback = '#') {
    const raw = text(value).trim();
    if (!raw) return fallback;
    if (/^(#|\/|\.\/|\.\.\/|https?:|mailto:|tel:)/i.test(raw)) return raw;
    return fallback;
  }

  function setLink(element, label, target) {
    if (!element) return;
    setText(element, label);
    if (hasText(target)) element.setAttribute('href', safeHref(target));
  }

  function setImage(element, source, alt) {
    if (!element || !hasText(source)) return false;
    element.src = safeHref(source, '');
    element.alt = text(alt);
    element.loading = element.loading || 'lazy';
    return true;
  }

  function normalizeIcon(value) {
    const raw = text(value).trim();
    if (!raw) return 'bi bi-check2-circle';
    if (raw.startsWith('bi ')) return raw;
    if (raw.startsWith('bi-')) return `bi ${raw}`;
    return 'bi bi-check2-circle';
  }

  function sortItems(items) {
    return [...items].sort((left, right) => Number(left?.order || 0) - Number(right?.order || 0));
  }

  function targetFromNavigation(item) {
    const raw = text(item?.target).trim().replace(/^#/, '').toLowerCase();
    const label = text(item?.label).trim().toLowerCase();
    const aliases = {
      home: '#hero',
      hero: '#hero',
      tab1: '#hero',
      about: '#about',
      tab20: '#about',
      inventory: '#featured',
      portfolio: '#featured',
      featured: '#featured',
      tab4: '#featured',
      services: '#services',
      tab3: '#services',
      testimonials: '#testimonials',
      reviews: '#testimonials',
      tab9: '#testimonials',
      contact: '#contact',
      connect: '#contact',
    };

    const mapped = aliases[raw] || aliases[label] || (raw ? `#${raw}` : '');
    return mapped && document.querySelector(mapped) ? mapped : '';
  }

  function cssLength(value, fallback, tokens = {}) {
    const raw = text(value).trim();
    if (tokens[raw]) return tokens[raw];
    if (/^(\d+(\.\d+)?)(px|rem|em|%|vw|vh)$/.test(raw)) return raw;
    return fallback;
  }

  function applyTheme(contract, manifest) {
    const theme = contract?.theme || {};
    const colors = theme.colors || {};
    const map = manifest?.theme?.cssVariableMap || {};
    const values = {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      background: colors.background,
      text: colors.text,
      radius: cssLength(theme.radius, '8px', {
        none: '0px', small: '4px', medium: '8px', large: '16px', rounded: '24px',
      }),
      containerWidth: cssLength(theme.containerWidth, '1320px', {
        compact: '1140px', wide: '1320px', full: '100%',
      }),
    };

    Object.entries(map).forEach(([key, cssVariable]) => {
      if (hasText(values[key])) document.documentElement.style.setProperty(cssVariable, values[key]);
    });
  }

  function initialize(context = {}) {
    if (context.templateId !== ADAPTER_ID) {
      throw new Error(`Web1 adapter cannot initialize template "${context.templateId || ''}".`);
    }
    renderedSections.clear();
    errors.length = 0;
    document.documentElement.dataset.cudfirmTemplate = ADAPTER_ID;
    document.documentElement.dataset.cudfirmAdapterVersion = ADAPTER_VERSION;
    applyTheme(context.contract, context.manifest);
  }

  function beforeRender(context = {}) {
    if (context.mount?.dataset) context.mount.dataset.cudfirmRenderState = 'rendering';
  }

  function afterRender(context = {}) {
    if (context.sectionName) renderedSections.add(context.sectionName);
    if (context.mount?.dataset) {
      context.mount.dataset.cudfirmAdapter = ADAPTER_ID;
      context.mount.dataset.cudfirmSection = context.sectionName || '';
      context.mount.dataset.cudfirmRenderState = 'rendered';
    }
  }

  function complete(context = {}) {
    document.documentElement.dataset.cudfirmTemplateState = context.report?.status || 'ready';
    document.documentElement.dataset.cudfirmRenderedSections = Array.from(renderedSections).join(',');
    window.CUDFIRMWeb1UI?.refresh?.();
  }

  function onError(context = {}) {
    const message = context.error?.message || context.phase || 'Unknown Web1 adapter error.';
    errors.push(message);
    document.documentElement.dataset.cudfirmTemplateState = 'error';
  }

  function renderNavigation({ mount, data, site }) {
    if (!mount || !Array.isArray(data) || !data.length) return false;

    const fragment = document.createDocumentFragment();
    sortItems(data).forEach((item) => {
      const target = targetFromNavigation(item);
      if (!hasText(item.label) || !target) return;

      const listItem = document.createElement('li');
      listItem.className = 'nav-item';
      const link = document.createElement('a');
      link.className = 'nav-link';
      link.href = target;
      link.textContent = item.label;
      if (target === '#hero') link.classList.add('active');
      listItem.appendChild(link);
      fragment.appendChild(listItem);
    });

    if (!fragment.childNodes.length) return false;
    mount.replaceChildren(fragment);
    all(document, '[data-cudfirm-site-name], .navbar-brand').forEach((element) => setText(element, site?.name));
    return true;
  }

  function renderHero({ mount, data }) {
    if (!mount || !data || !hasText(data.title)) return false;
    const content = query(mount, '.hero-content');
    if (!content) return false;

    setText(query(content, 'h1'), data.title);
    setText(query(content, 'p'), data.subtitle);
    const buttons = all(content, 'a.btn');
    setLink(buttons[0], data.primaryAction?.label, targetFromNavigation({ target: data.primaryAction?.target }) || data.primaryAction?.target);
    setLink(buttons[1], data.secondaryAction?.label, targetFromNavigation({ target: data.secondaryAction?.target }) || data.secondaryAction?.target);
    return true;
  }

  function renderHeroSlides({ mount, data }) {
    if (!mount || !Array.isArray(data) || !data.length) return false;
    const items = sortItems(data).filter((item) => hasText(item.title) && hasText(item.imageUrl));
    if (!items.length) return false;

    const fragment = document.createDocumentFragment();
    const featured = items.filter((item) => item.featured);
    (featured.length ? featured : items).slice(0, 6).forEach((item) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      const image = document.createElement('img');
      image.className = 'img-fluid';
      setImage(image, item.imageUrl, item.title);
      const content = document.createElement('div');
      content.className = 'slide-content';
      const title = document.createElement('h5');
      title.textContent = item.title;
      const detail = document.createElement('p');
      detail.textContent = [item.projectType, item.industry].filter(hasText).join(' · ');
      content.append(title, detail);
      slide.append(image, content);
      fragment.appendChild(slide);
    });
    mount.replaceChildren(fragment);
    return true;
  }

  function renderAbout({ mount, data }) {
    if (!mount || !data || !hasText(data.title)) return false;
    setText(query(mount, '.section-title h2'), data.title);
    const paragraphs = all(mount, '.col-lg-6 p');
    setText(paragraphs[0], data.introduction);
    setText(paragraphs[1], data.missionText);
    setImage(query(mount, '.about-image img'), data.imageUrl, data.imageAlt || data.title);
    setLink(query(mount, 'a.btn'), data.action?.label, targetFromNavigation({ target: data.action?.target }) || data.action?.target);
    return true;
  }

  function renderFacts({ mount, data }) {
    const facts = Array.isArray(data?.facts) ? data.facts.filter((item) => hasText(item.label) && hasText(item.value)) : [];
    const row = query(mount, '.row');
    if (!mount || !row || !facts.length) return false;

    const fragment = document.createDocumentFragment();
    facts.slice(0, 4).forEach((fact, index) => {
      const column = document.createElement('div');
      column.className = 'col-lg-3 col-md-6 mb-4 mb-lg-0';
      column.dataset.aos = 'fade-up';
      column.dataset.aosDelay = String(index * 100);
      const box = document.createElement('div');
      box.className = 'counter-box';
      const value = document.createElement('h3');
      value.className = 'counter';
      const numeric = text(fact.value).replace(/[^0-9.]/g, '') || '0';
      value.dataset.target = numeric;
      value.textContent = '0';
      const label = document.createElement('p');
      label.textContent = fact.label;
      box.append(value, label);
      column.appendChild(box);
      fragment.appendChild(column);
    });
    row.replaceChildren(fragment);
    return true;
  }

  function renderPortfolio({ mount, data }) {
    if (!mount || !Array.isArray(data) || !data.length) return false;
    const row = query(mount, '.row.g-4');
    if (!row) return false;

    const items = sortItems(data).filter((item) => hasText(item.title) && hasText(item.imageUrl));
    if (!items.length) return false;

    const fragment = document.createDocumentFragment();
    items.slice(0, 6).forEach((item, index) => {
      const column = document.createElement('div');
      column.className = 'col-lg-4 col-md-6';
      column.dataset.aos = 'fade-up';
      column.dataset.aosDelay = String((index + 1) * 100);

      const card = document.createElement('div');
      card.className = 'car-card';
      const imageWrap = document.createElement('div');
      imageWrap.className = 'img-container';
      const image = document.createElement('img');
      image.className = 'card-img-top';
      setImage(image, item.imageUrl, item.title);
      imageWrap.appendChild(image);

      const body = document.createElement('div');
      body.className = 'card-body';
      const nameRow = document.createElement('div');
      nameRow.className = 'car-name';
      const title = document.createElement('h5');
      title.textContent = item.title;
      const type = document.createElement('span');
      type.className = 'year';
      type.textContent = item.projectType || 'Showcase';
      nameRow.append(title, type);
      const category = document.createElement('p');
      category.className = 'price';
      category.textContent = item.industry || 'Featured collection';
      const features = document.createElement('ul');
      features.className = 'features';
      (Array.isArray(item.tags) ? item.tags : []).slice(0, 3).forEach((tag) => {
        if (!hasText(tag)) return;
        const listItem = document.createElement('li');
        const icon = document.createElement('i');
        icon.className = 'bi bi-check2-circle';
        icon.setAttribute('aria-hidden', 'true');
        listItem.append(icon, document.createTextNode(` ${tag}`));
        features.appendChild(listItem);
      });
      body.append(nameRow, category, features);
      card.append(imageWrap, body);
      column.appendChild(card);
      fragment.appendChild(column);
    });
    row.replaceChildren(fragment);

    const button = query(mount, '.text-center.mt-5 a');
    if (button) {
      button.href = '#contact';
      button.textContent = 'Request Details';
    }
    return true;
  }

  function renderServices({ mount, data }) {
    if (!mount || !Array.isArray(data) || !data.length) return false;
    const row = query(mount, '.row.g-5');
    if (!row) return false;

    const items = sortItems(data).filter((item) => hasText(item.title) && hasText(item.description));
    if (!items.length) return false;

    const fragment = document.createDocumentFragment();
    items.slice(0, 6).forEach((item, index) => {
      const column = document.createElement('div');
      column.className = 'col-lg-6';
      column.dataset.aos = index % 2 ? 'fade-left' : 'fade-right';
      const service = document.createElement('div');
      service.className = 'service-item';
      const iconWrap = document.createElement('div');
      iconWrap.className = 'icon';
      if (/^(https?:|\/|\.\/|\.\.\/)/i.test(text(item.iconUrl))) {
        const image = document.createElement('img');
        image.className = 'service-icon-image';
        setImage(image, item.iconUrl, '');
        iconWrap.appendChild(image);
      } else {
        const icon = document.createElement('i');
        icon.className = normalizeIcon(item.iconUrl);
        icon.setAttribute('aria-hidden', 'true');
        iconWrap.appendChild(icon);
      }
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.title;
      const description = document.createElement('p');
      description.textContent = item.description;
      content.append(title, description);
      service.append(iconWrap, content);
      column.appendChild(service);
      fragment.appendChild(column);
    });
    row.replaceChildren(fragment);
    return true;
  }

  function renderTestimonials({ mount, data }) {
    if (!mount || !Array.isArray(data) || !data.length) return false;
    const wrapper = query(mount, '.swiper-wrapper');
    if (!wrapper) return false;

    const items = sortItems(data).filter((item) => !item.placeholder && hasText(item.name) && hasText(item.quote));
    if (!items.length) return false;

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      const quoteIcon = document.createElement('div');
      quoteIcon.className = 'quote-icon';
      const icon = document.createElement('i');
      icon.className = 'bi bi-quote';
      quoteIcon.appendChild(icon);
      const quote = document.createElement('p');
      quote.textContent = `“${item.quote}”`;
      const author = document.createElement('div');
      author.className = 'author';
      const image = document.createElement('img');
      setImage(image, item.avatarUrl, item.name);
      const identity = document.createElement('div');
      const name = document.createElement('h5');
      name.textContent = item.name;
      const role = document.createElement('span');
      role.textContent = item.role || '';
      identity.append(name, role);
      author.append(image, identity);
      card.append(quoteIcon, quote, author);
      slide.appendChild(card);
      fragment.appendChild(slide);
    });
    wrapper.replaceChildren(fragment);
    return true;
  }

  function renderCta({ mount, data }) {
    if (!mount || !data) return false;
    setText(query(mount, 'h2'), data.title);
    setText(query(mount, 'p'), data.introduction);
    const button = query(mount, 'a.btn');
    if (button) button.href = '#contact';
    return hasText(data.title) || hasText(data.introduction);
  }

  function renderContact({ mount, data }) {
    if (!mount || !data) return false;
    setText(query(mount, '.section-title h2'), data.title);
    setText(query(mount, '.section-title p'), data.introduction);

    const formConfig = data.form || {};
    const form = query(mount, '[data-cudfirm-form="contact"]');
    if (form) {
      const name = query(form, '[name="name"]');
      const contact = query(form, '[name="email"]');
      const message = query(form, '[name="message"]');
      const submit = query(form, '[type="submit"]');
      if (name && hasText(formConfig.namePlaceholder || formConfig.nameLabel)) name.placeholder = formConfig.namePlaceholder || formConfig.nameLabel;
      if (contact && hasText(formConfig.contactPlaceholder || formConfig.contactLabel)) contact.placeholder = formConfig.contactPlaceholder || formConfig.contactLabel;
      if (message && hasText(formConfig.messagePlaceholder || formConfig.messageLabel)) message.placeholder = formConfig.messagePlaceholder || formConfig.messageLabel;
      setText(submit, formConfig.submitLabel);
    }
    return hasText(data.title) || hasText(data.introduction);
  }

  function renderFooter({ mount, data }) {
    if (!mount || !data) return false;
    all(document, '[data-cudfirm-site-name], .navbar-brand').forEach((element) => setText(element, data.name));
    setText(query(mount, '.col-lg-4 p'), data.footerText);

    const contactItems = all(mount, '.col-lg-3 ul li');
    setText(contactItems[0], data.address);
    setText(contactItems[1], data.phone);
    setText(contactItems[2], data.email);
    setText(query(mount, '.footer-bottom p'), data.copyrightText);

    const socialLinks = new Map((Array.isArray(data.socialLinks) ? data.socialLinks : [])
      .filter((item) => hasText(item.platform) && hasText(item.url))
      .map((item) => [item.platform.toLowerCase(), item.url]));
    all(mount, '.social-icons a').forEach((link) => {
      const iconClass = query(link, 'i')?.className || '';
      const platform = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok']
        .find((name) => iconClass.includes(name));
      if (platform && socialLinks.has(platform)) link.href = safeHref(socialLinks.get(platform));
    });

    if (hasText(data.faviconUrl)) {
      const favicon = document.getElementById('siteFavicon');
      if (favicon) favicon.href = safeHref(data.faviconUrl, favicon.href);
    }
    return true;
  }

  function setMeta(selector, attribute, value) {
    if (!hasText(value)) return;
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applySeo({ data, site }) {
    const page = data?.pages?.home || {};
    if (hasText(page.title)) document.title = page.title;
    setMeta('meta[name="description"]', 'content', page.description);
    setMeta('meta[name="robots"]', 'content', page.robots);
    setMeta('meta[property="og:title"]', 'content', page.title);
    setMeta('meta[property="og:description"]', 'content', page.description);
    setMeta('meta[property="og:image"]', 'content', page.openGraphImage);
    setMeta('meta[name="twitter:title"]', 'content', page.title);
    setMeta('meta[name="twitter:description"]', 'content', page.description);
    setMeta('meta[name="twitter:image"]', 'content', page.twitterImage || page.openGraphImage);
    setMeta('link[rel="canonical"]', 'href', page.canonicalUrl);
    if (hasText(site?.faviconUrl)) {
      const favicon = document.getElementById('siteFavicon');
      if (favicon) favicon.href = safeHref(site.faviconUrl, favicon.href);
    }
    return true;
  }

  window.CUDFIRMWeb1Adapter = Object.freeze({
    id: ADAPTER_ID,
    version: ADAPTER_VERSION,
    initialize,
    beforeRender,
    afterRender,
    complete,
    onError,
    renderNavigation,
    renderHero,
    renderHeroSlides,
    renderAbout,
    renderFacts,
    renderPortfolio,
    renderServices,
    renderTestimonials,
    renderCta,
    renderContact,
    renderFooter,
    applySeo,
    getState: () => Object.freeze({
      id: ADAPTER_ID,
      version: ADAPTER_VERSION,
      renderedSections: Object.freeze(Array.from(renderedSections)),
      errors: Object.freeze([...errors]),
    }),
  });
})();
