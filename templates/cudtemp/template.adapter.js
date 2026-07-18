/** CUDTEMP — Adapter 2 contract-to-markup mapper. */
(function () {
  'use strict';

  const state = { initialized: false, renders: 0, errors: [] };
  const text = value => value == null ? '' : String(value).trim();
  const hasText = value => Boolean(text(value));
  const array = value => Array.isArray(value) ? value : [];

  function setText(node, value) {
    if (node && hasText(value)) node.textContent = text(value);
  }

  function initials(name) {
    return text(name).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CU';
  }

  function resolveAnchor(value, label) {
    const raw = `${text(value)} ${text(label)}`.toLowerCase();
    if (/portfolio|project|work|showcase|tab4/.test(raw)) return '#screens';
    if (/service|feature|offer|tab3/.test(raw)) return '#features';
    if (/testimonial|review|tab9/.test(raw)) return '#testimonials';
    if (/faq|question|tab13/.test(raw)) return '#faq';
    if (/contact|quote|connect|tab20|get started/.test(raw)) return '#contact';
    if (/price|delivery|package/.test(raw)) return '#pricing';
    if (/^https?:|^mailto:|^tel:|^https:\/\/wa\.me/.test(text(value))) return text(value);
    return '#top';
  }

  function setAction(node, action, fallbackLabel, fallbackTarget) {
    if (!node) return;
    const label = text(action?.label) || fallbackLabel;
    const target = text(action?.target) || fallbackTarget;
    const arrow = node.querySelector('.btn-arrow');
    const play = node.querySelector('.btn-play');
    node.replaceChildren();
    if (play) node.appendChild(play);
    node.appendChild(document.createTextNode(label));
    if (arrow) node.appendChild(arrow);
    node.href = resolveAnchor(target, label);
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const values = {
      '--accent': theme?.colors?.primary,
      '--accent-mid': theme?.colors?.secondary,
      '--accent-light': theme?.colors?.accent,
      '--bg': theme?.colors?.background,
      '--text-1': theme?.colors?.text,
      '--radius': theme?.radius,
    };
    Object.entries(values).forEach(([property, value]) => { if (hasText(value)) root.style.setProperty(property, value); });
  }

  function initialize({ contract }) {
    document.documentElement.dataset.cudfirmTemplate = 'cudtemp';
    document.documentElement.dataset.cudfirmAdapterVersion = '1.0.0';
    applyTheme(contract?.theme || {});
    state.initialized = true;
    return true;
  }

  function renderNavigation({ mount, data, site }) {
    const items = array(data);
    setText(mount.querySelector('.nav-logo'), site?.name || 'CUDTEMP');
    const desktop = mount.querySelectorAll('.nav-links a');
    const mobile = document.querySelectorAll('#mobileMenu > a:not(.mobile-cta)');
    items.slice(0, Math.max(desktop.length, mobile.length)).forEach((item, index) => {
      [desktop[index], mobile[index]].forEach(link => {
        if (!link) return;
        setText(link, item.label);
        link.href = resolveAnchor(item.target, item.label);
      });
    });
    state.renders += 1;
    return true;
  }

  function renderHero({ mount, data }) {
    if (!mount || !hasText(data?.title)) return false;
    setText(mount.querySelector('.hero-badge span'), data.eyebrow);
    setText(mount.querySelector('.hero-title'), data.title);
    setText(mount.querySelector('.hero-sub'), data.subtitle);
    setAction(mount.querySelector('.btn-primary-lg'), data.primaryAction, 'Start Your Project', '#contact');
    setAction(mount.querySelector('.btn-outline-lg'), data.secondaryAction, 'See the CMS in action', '#screens');
    array(data.trustItems).slice(0, 3).forEach((item, index) => {
      const node = mount.querySelectorAll('.trust-item')[index];
      if (!node) return;
      const svg = node.querySelector('svg');
      node.replaceChildren();
      if (svg) node.appendChild(svg);
      node.appendChild(document.createTextNode(text(item.label)));
    });
    state.renders += 1;
    return true;
  }

  function renderPortfolio({ mount, data }) {
    const projects = array(data).filter(item => hasText(item.imageUrl));
    if (!projects.length) return false;
    mount.querySelectorAll('.phone-card img').forEach((image, index) => {
      const project = projects[index % projects.length];
      image.src = project.imageUrl;
      image.alt = project.title || `Published project ${index + 1}`;
    });
    state.renders += 1;
    return true;
  }

  function renderServiceCard(row, service, index) {
    if (!row || !service) return;
    setText(row.querySelector('.feature-number'), `${String(index + 1).padStart(2, '0')} — ${service.title}`);
    setText(row.querySelector('.feature-title'), service.title);
    setText(row.querySelector('.feature-desc'), service.description);
    const bullets = array(service.tags).filter(hasText);
    row.querySelectorAll('.feature-check span').forEach((node, bulletIndex) => {
      if (bullets[bulletIndex]) setText(node, bullets[bulletIndex]);
    });
  }

  function renderServices({ mount, data }) {
    const services = array(data).filter(item => hasText(item.title) && hasText(item.description));
    if (!services.length) return false;
    mount.querySelectorAll('.feature-row').forEach((row, index) => renderServiceCard(row, services[index % services.length], index));
    state.renders += 1;
    return true;
  }

  function renderFacts({ mount, data }) {
    const facts = array(data?.facts).filter(item => hasText(item.label) || hasText(item.value));
    if (!facts.length) return false;
    mount.querySelectorAll('.stat-card').forEach((card, index) => {
      const fact = facts[index % facts.length];
      const numeric = text(fact.value).match(/\d+(?:\.\d+)?/);
      const num = card.querySelector('.stat-num');
      if (numeric) num.dataset.target = numeric[0];
      setText(card.querySelector('.stat-label'), fact.label);
      setText(card.querySelector('.stat-sublabel'), fact.value);
    });
    state.renders += 1;
    return true;
  }

  function renderDelivery({ mount, data }) {
    const services = array(data).filter(item => hasText(item.title) && hasText(item.description));
    if (!services.length) return false;
    mount.querySelectorAll('.pricing-card').forEach((card, index) => {
      const service = services[index % services.length];
      setText(card.querySelector('.pricing-tier'), service.title);
      setText(card.querySelector('.pricing-desc'), service.description);
      setText(card.querySelector('.price-annual-note'), service.priceText || 'Request a tailored quote');
      const tags = array(service.tags).filter(hasText);
      card.querySelectorAll('.pricing-feature span').forEach((node, tagIndex) => {
        if (tags[tagIndex]) setText(node, tags[tagIndex]);
      });
    });
    state.renders += 1;
    return true;
  }

  function renderTestimonials({ mount, data }) {
    const testimonials = array(data).filter(item => hasText(item.name) && hasText(item.quote) && !item.placeholder);
    if (!testimonials.length) return false;
    mount.querySelectorAll('.testimonial-card').forEach((card, index) => {
      const item = testimonials[index % testimonials.length];
      setText(card.querySelector('.testimonial-quote'), `“${item.quote}”`);
      setText(card.querySelector('.author-name'), item.name);
      setText(card.querySelector('.author-role'), item.role || 'CUDFIRM Client');
      const avatar = card.querySelector('.author-avatar');
      if (hasText(item.avatarUrl)) {
        avatar.classList.add('has-image');
        avatar.style.backgroundImage = `url("${item.avatarUrl.replace(/"/g, '%22')}")`;
        avatar.textContent = initials(item.name);
      } else {
        avatar.classList.remove('has-image');
        avatar.style.backgroundImage = '';
        avatar.textContent = initials(item.name);
      }
    });
    state.renders += 1;
    return true;
  }

  function renderCapabilities({ mount, data }) {
    const values = array(data?.values).filter(item => hasText(item.title));
    if (!values.length) return false;
    mount.querySelectorAll('.integration-name').forEach((node, index) => setText(node, values[index % values.length].title));
    state.renders += 1;
    return true;
  }

  function renderFaq({ mount, data }) {
    const items = array(data).filter(item => hasText(item.question) && hasText(item.answer));
    if (!items.length) return false;
    mount.querySelectorAll('.faq-item').forEach((itemNode, index) => {
      const item = items[index % items.length];
      const question = itemNode.querySelector('.faq-question');
      const icon = question.querySelector('.faq-icon');
      question.replaceChildren(document.createTextNode(item.question));
      if (icon) question.appendChild(icon);
      setText(itemNode.querySelector('.faq-answer-inner'), item.answer);
    });
    state.renders += 1;
    return true;
  }

  function whatsappUrl(value) {
    const digits = text(value).replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '';
  }

  function renderContact({ mount, data, site }) {
    if (!mount) return false;
    setText(mount.querySelector('.cta-title'), data?.title);
    setText(mount.querySelector('.cta-sub'), data?.introduction || data?.directContact?.description);
    const primary = mount.querySelector('.btn-cta-primary');
    const secondary = mount.querySelector('.btn-cta-ghost');
    const wa = whatsappUrl(data?.directContact?.whatsapp || site?.whatsapp);
    if (primary && wa) { primary.href = wa; primary.target = '_blank'; primary.rel = 'noopener noreferrer'; }
    if (secondary && hasText(data?.directContact?.email || site?.email)) secondary.href = `mailto:${data?.directContact?.email || site.email}`;
    state.renders += 1;
    return true;
  }

  function renderSite({ mount, data }) {
    const name = data?.name || 'CUDTEMP';
    document.querySelectorAll('.nav-logo').forEach(node => setText(node, name));
    setText(mount.querySelector('.footer-brand-desc'), data?.footerText);
    setText(mount.querySelector('.footer-copy'), data?.copyrightText || `© ${new Date().getFullYear()} ${name}.`);
    array(data?.socialLinks).slice(0, 4).forEach((item, index) => {
      const link = mount.querySelectorAll('.footer-socials a')[index];
      if (link && hasText(item.url)) { link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    });
    state.renders += 1;
    return true;
  }

  function upsertMeta(name, content, property = false) {
    if (!hasText(content)) return;
    const attr = property ? 'property' : 'name';
    let node = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!node) { node = document.createElement('meta'); node.setAttribute(attr, name); document.head.appendChild(node); }
    node.content = content;
  }

  function renderSeo({ data }) {
    const page = data?.pages?.home || Object.values(data?.pages || {})[0];
    if (!page) return false;
    if (hasText(page.title)) document.title = page.title;
    upsertMeta('description', page.description);
    upsertMeta('robots', page.robots);
    upsertMeta('og:title', page.title, true);
    upsertMeta('og:description', page.description, true);
    upsertMeta('og:image', page.openGraphImage, true);
    if (hasText(page.canonicalUrl)) {
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = page.canonicalUrl;
    }
    state.renders += 1;
    return true;
  }

  function beforeRender() { return true; }
  function afterRender() { return true; }
  function complete() { document.documentElement.dataset.cudtempReady = 'true'; return true; }
  function onError({ error }) { state.errors.push(error?.message || 'Unknown adapter error'); }
  function getState() { return Object.freeze({ initialized: state.initialized, renders: state.renders, errors: [...state.errors] }); }

  window.CUDTEMPAdapter = Object.freeze({
    id: 'cudtemp', version: '1.0.0', initialize, beforeRender, afterRender, complete, onError, getState,
    renderNavigation, renderHero, renderPortfolio, renderServices, renderFacts, renderDelivery, renderTestimonials, renderCapabilities, renderFaq, renderContact, renderSite, renderSeo,
  });
})();
