/**
 * CUDFIRM Default — Adapter 1 compatibility adapter.
 * Patches selected legacy section DOM without replacing shared behavior.
 */
(function () {
  'use strict';

  const hasText = (value) => typeof value === 'string' && value.trim() !== '';
  const text = (value) => (value == null ? '' : String(value));

  function setText(element, value) {
    if (element && hasText(text(value))) element.textContent = text(value);
  }

  function createIcon(icon) {
    const i = document.createElement('i');
    i.className = `bi ${hasText(icon) ? icon : 'bi-circle'}`;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  function renderStory(container, blocks) {
    if (!container || !Array.isArray(blocks) || !blocks.length) return;
    container.replaceChildren();
    blocks.forEach((block, index) => {
      if (hasText(block.heading)) {
        const heading = document.createElement('h4');
        heading.style.cssText = "font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;color:var(--n-forest);margin-bottom:0.45rem;";
        heading.textContent = block.heading;
        container.appendChild(heading);
      }
      if (hasText(block.text)) {
        const paragraph = document.createElement('p');
        paragraph.style.cssText = `font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin:${index === blocks.length - 1 ? '0' : '0 0 0.75rem'};`;
        paragraph.textContent = block.text;
        container.appendChild(paragraph);
      }
    });
  }

  function renderValues(row, values) {
    if (!row || !Array.isArray(values) || !values.length) return;
    row.replaceChildren();
    values.forEach((value) => {
      const column = document.createElement('div');
      column.className = 'col-12 col-md-6';
      const card = document.createElement('div');
      card.className = 'card p-3 h-100';
      const top = document.createElement('div');
      top.style.cssText = 'display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;';
      const iconBox = document.createElement('div');
      iconBox.style.cssText = 'width:40px;height:40px;border-radius:10px;background:var(--n-jade);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;';
      iconBox.appendChild(createIcon(value.icon));
      const title = document.createElement('div');
      title.style.cssText = "font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);";
      title.textContent = text(value.title);
      top.append(iconBox, title);
      card.appendChild(top);
      if (hasText(value.description)) {
        const description = document.createElement('p');
        description.style.cssText = 'font-size:0.78rem;color:var(--n-muted);margin:0;';
        description.textContent = value.description;
        card.appendChild(description);
      }
      column.appendChild(card);
      row.appendChild(column);
    });
  }

  function renderFacts(row, facts) {
    if (!row || !Array.isArray(facts) || !facts.length) return;
    row.replaceChildren();
    facts.forEach((fact) => {
      const column = document.createElement('div');
      column.className = 'col-6 col-md-3';
      const card = document.createElement('div');
      card.className = 'card p-3';
      const value = document.createElement('div');
      value.style.cssText = "font-family:'Syne',sans-serif;font-weight:800;font-size:0.95rem;color:var(--n-forest);margin-bottom:0.2rem;";
      value.textContent = text(fact.value);
      const label = document.createElement('div');
      label.style.cssText = 'font-size:0.7rem;color:var(--n-muted);';
      label.textContent = text(fact.label);
      card.append(value, label);
      column.appendChild(card);
      row.appendChild(column);
    });
  }

  function createHomeGridItem(item) {
    const column = document.createElement('div');
    column.className = 'col grid-item';
    column.dataset.img = text(item.imageUrl);
    column.dataset.name = text(item.name);
    column.dataset.link = text(item.destination || '#');

    const image = document.createElement('img');
    image.src = text(item.imageUrl);
    image.alt = text(item.alt || item.name || 'CUDFIRM');
    image.className = 'img-fluid';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      image.src = 'https://placehold.co/600x800/0B3D2E/C8922A?text=CUDFIRM';
    }, { once: true });

    const label = document.createElement('span');
    label.className = 'text';
    label.textContent = text(item.name);
    column.append(image, label);
    return column;
  }

  function replaceHomeGrid(container, items) {
    if (!container || !Array.isArray(items) || !items.length) return false;
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      if (!hasText(item.name) || !hasText(item.imageUrl)) return;
      fragment.appendChild(createHomeGridItem(item));
    });
    if (!fragment.childNodes.length) return false;
    container.replaceChildren(fragment);
    return true;
  }

  function renderHomeHero(mount, hero) {
    const container = mount?.querySelector('.home-hero');
    if (!container || !hero || !hasText(hero.title)) return false;

    setText(container.querySelector('.hero-eyebrow'), hero.eyebrow);
    setText(container.querySelector('.hero-title'), hero.title);
    setText(container.querySelector('.hero-sub'), hero.subtitle);

    const primary = container.querySelector('.btn-hero-primary');
    if (primary) {
      setText(primary, hero.primaryAction?.label);
      if (hasText(hero.primaryAction?.target)) {
        primary.onclick = (event) => window.openTab?.(event, hero.primaryAction.target);
      }
    }

    const secondary = container.querySelector('.btn-hero-secondary');
    if (secondary) {
      setText(secondary, hero.secondaryAction?.label);
      if (hasText(hero.secondaryAction?.target)) {
        secondary.onclick = (event) => window.openTab?.(event, hero.secondaryAction.target);
      }
    }

    let imageWrap = container.querySelector('.hero-cms-image-wrap');
    if (hasText(hero.imageUrl)) {
      if (!imageWrap) {
        imageWrap = document.createElement('div');
        imageWrap.className = 'hero-cms-image-wrap';
        const actions = container.querySelector('.hero-cta-row');
        container.insertBefore(imageWrap, actions || null);
      }
      imageWrap.replaceChildren();
      const image = document.createElement('img');
      image.src = hero.imageUrl;
      image.alt = hero.eyebrow || hero.title || 'CUDFIRM';
      image.className = 'hero-cms-image';
      image.loading = 'lazy';
      image.addEventListener('click', () => window.openLightbox?.(image.src, image.alt, null));
      const hint = document.createElement('span');
      hint.className = 'hero-cms-image-hint';
      hint.textContent = 'Click to enlarge';
      imageWrap.append(image, hint);
    } else if (imageWrap) {
      imageWrap.remove();
    }

    const trustStrip = container.querySelector('.hero-trust-strip');
    if (trustStrip && Array.isArray(hero.trustItems) && hero.trustItems.length) {
      trustStrip.replaceChildren();
      hero.trustItems.forEach((item) => {
        if (!hasText(item?.label)) return;
        const trustItem = document.createElement('span');
        trustItem.setAttribute('role', 'listitem');
        trustItem.appendChild(createIcon(item.icon || 'bi-check-circle-fill'));
        trustItem.append(document.createTextNode(` ${item.label}`));
        trustStrip.appendChild(trustItem);
      });
    }
    return true;
  }

  function renderHome({ mount, data, contract }) {
    if (!mount || !data || !contract) return false;
    const heroRendered = renderHomeHero(mount, data);

    const showcaseCards = mount.querySelectorAll('.home-showcase-grid > .card-section');
    const portfolioGrid = showcaseCards[0]?.querySelector('.card-content.icon-grid');
    const servicesGrid = showcaseCards[1]?.querySelector('.card-content.icon-grid');

    const featuredPortfolio = Array.isArray(contract.portfolio)
      ? contract.portfolio.filter((project) => project.featured && hasText(project.imageUrl)).map((project) => ({
          imageUrl: project.imageUrl,
          destination: project.destination || '#',
          name: project.title,
          alt: `${project.title} website built by CUDFIRM`,
        }))
      : [];
    const portfolioRendered = replaceHomeGrid(portfolioGrid, featuredPortfolio);

    const serviceItems = Array.isArray(contract.services)
      ? contract.services.slice(0, 7).map((service) => ({
          imageUrl: service.iconUrl || `https://placehold.co/200x250/0B3D2E/C8922A?text=${encodeURIComponent(service.title)}`,
          destination: '#',
          name: service.title,
          alt: service.title,
        }))
      : [];
    if (serviceItems.length) {
      serviceItems.push({
        imageUrl: 'https://placehold.co/200x250/3A4035/fff?text=MORE',
        destination: 'tab3',
        name: 'View All',
        alt: 'More Services',
      });
    }
    const servicesRendered = replaceHomeGrid(servicesGrid, serviceItems);

    if (heroRendered || portfolioRendered || servicesRendered) {
      mount.dataset.cudfirmAdapter = 'home';
      return true;
    }
    return false;
  }

  function renderAbout({ mount, data }) {
    if (!mount || !data || !hasText(data.title)) return false;

    setText(mount.querySelector('h6 .badge'), data.eyebrow);
    const cards = mount.querySelectorAll(':scope > .card-section');
    const mission = cards[0];
    const story = cards[1];
    const values = cards[2];
    const facts = cards[3];

    const missionParagraphs = mission?.querySelectorAll('.card-content > p') || [];
    setText(missionParagraphs[0], data.title);
    setText(missionParagraphs[1], data.introduction || data.missionText);

    const storyHeading = story?.querySelector('.card-header h3');
    if (storyHeading && hasText(data.storyTitle)) {
      const icon = storyHeading.querySelector('i');
      storyHeading.replaceChildren();
      if (icon) storyHeading.appendChild(icon);
      storyHeading.append(document.createTextNode(data.storyTitle));
    }
    renderStory(story?.querySelector('.card-content'), data.storyBlocks);

    const valuesHeading = values?.querySelector('.card-header h3');
    if (valuesHeading && hasText(data.valuesTitle)) {
      const icon = valuesHeading.querySelector('i');
      valuesHeading.replaceChildren();
      if (icon) valuesHeading.appendChild(icon);
      valuesHeading.append(document.createTextNode(data.valuesTitle));
    }
    renderValues(values?.querySelector('.row'), data.values);

    const factsHeading = facts?.querySelector('.card-header h3');
    if (factsHeading && hasText(data.factsTitle)) {
      const icon = factsHeading.querySelector('i');
      factsHeading.replaceChildren();
      if (icon) factsHeading.appendChild(icon);
      factsHeading.append(document.createTextNode(data.factsTitle));
    }
    renderFacts(facts?.querySelector('.row'), data.facts);

    const actionButton = mount.querySelector(':scope > .view-more-btn');
    setText(actionButton, data.action?.label);
    if (actionButton && hasText(data.action?.target)) {
      actionButton.onclick = (event) => window.openTab?.(event, data.action.target);
    }

    mount.dataset.cudfirmAdapter = 'about';
    return true;
  }


  function createTag(value, variant) {
    const tag = document.createElement('span');
    tag.className = `tag ${variant || 'orange'}`;
    tag.textContent = text(value);
    return tag;
  }

  function renderServices({ mount, data }) {
    const list = mount?.querySelector('#tab3-list');
    if (!list || !Array.isArray(data) || !data.length) return false;

    const fragment = document.createDocumentFragment();
    data.forEach((service) => {
      if (!hasText(service.title) || !hasText(service.description)) return;

      const item = document.createElement('div');
      item.className = 'list-item';
      item.dataset.searchText = [service.searchTerms, service.title, service.description, ...(Array.isArray(service.tags) ? service.tags : [])].filter(hasText).join(' ');

      const icon = document.createElement('div');
      icon.className = 'item-icon';
      if (hasText(service.iconUrl)) {
        const image = document.createElement('img');
        image.src = service.iconUrl;
        image.alt = '';
        image.loading = 'lazy';
        image.className = 'item-icon-img';
        icon.appendChild(image);
      } else {
        icon.textContent = service.title;
      }

      const content = document.createElement('div');
      content.className = 'item-content d-flex justify-content-between align-items-center gap-2';
      const copy = document.createElement('div');
      const description = document.createElement('h6');
      description.style.cssText = 'margin:0 0 0.2rem;';
      description.textContent = service.description;
      const price = document.createElement('span');
      price.style.cssText = "font-family:'Syne',sans-serif;font-weight:800;color:var(--n-gold);font-size:0.82rem;";
      price.textContent = service.priceText;
      copy.append(description, price);

      const action = document.createElement('a');
      action.href = '#';
      action.className = `btn btn-sm ${service.special ? 'btn-primary' : 'btn-success'} flex-shrink-0`;
      action.style.cssText = 'font-size:0.72rem;padding:0.3rem 0.65rem;';
      action.textContent = service.special ? 'Enquire' : 'Request';
      action.addEventListener('click', (event) => window.openTab?.(event, 'connect-content'));
      content.append(copy, action);

      const metadata = document.createElement('p');
      metadata.className = 'mb-0';
      metadata.style.cssText = 'font-size:0.72rem;';
      metadata.append(document.createTextNode('CUDFIRM · '));
      (Array.isArray(service.tags) ? service.tags : []).forEach((tagValue) => {
        metadata.appendChild(createTag(tagValue, String(tagValue).startsWith('#₦') ? 'green' : 'orange'));
      });

      item.append(icon, content, metadata);
      fragment.appendChild(item);
    });

    if (!fragment.childNodes.length) return false;
    list.replaceChildren(fragment);
    mount.dataset.cudfirmAdapter = 'services';
    return true;
  }

  function openPortfolioDestination(event, destination) {
    const target = text(destination).trim();
    if (!target || target === '#') return;
    if (/^https?:\/\//i.test(target) || (target.includes('/') && !target.startsWith('#'))) {
      window.open(target, '_blank', 'noopener');
      return;
    }
    window.openTab?.(event, target.replace(/^#/, ''));
  }

  function renderPortfolio({ mount, data }) {
    const row = mount?.querySelector(':scope > .row.g-3.stagger-children');
    if (!row || !Array.isArray(data) || !data.length) return false;

    const fragment = document.createDocumentFragment();
    data.forEach((project) => {
      if (!hasText(project.title) || !hasText(project.imageUrl)) return;

      const column = document.createElement('div');
      column.className = 'col-12 col-md-6 col-lg-4';
      const card = document.createElement('div');
      card.className = 'card h-100';
      card.style.cssText = 'overflow:hidden;cursor:pointer;';
      card.setAttribute('role', 'article');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${project.title}${hasText(project.industry) ? ` — ${project.industry} project` : ''}`);
      const activate = (event) => openPortfolioDestination(event, project.destination);
      card.addEventListener('click', activate);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(event);
        }
      });

      const media = document.createElement('div');
      media.style.cssText = 'position:relative;';
      const image = document.createElement('img');
      image.src = project.imageUrl;
      image.alt = `Screenshot of ${project.title} website built by CUDFIRM`;
      image.loading = 'lazy';
      image.style.cssText = 'width:100%;height:180px;object-fit:cover;';
      image.addEventListener('error', () => {
        image.src = 'https://placehold.co/400x280/0B3D2E/C8922A?text=CUDFIRM';
      }, { once: true });
      const statusBox = document.createElement('div');
      statusBox.style.cssText = 'position:absolute;top:8px;right:8px;';
      const status = createTag(project.live ? '● Live' : '● Demo', project.live ? 'green' : 'orange');
      status.style.cssText = 'font-size:0.62rem;padding:0.2rem 0.5rem;';
      statusBox.appendChild(status);
      media.append(image, statusBox);

      const content = document.createElement('div');
      content.className = 'card-content';
      const title = document.createElement('div');
      title.style.cssText = "font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;margin-bottom:0.1rem;";
      title.textContent = project.title;
      const type = document.createElement('div');
      type.style.cssText = 'font-size:0.72rem;color:var(--n-gold);font-weight:600;margin-bottom:0.4rem;';
      type.textContent = [project.industry, project.projectType].filter(hasText).join(' · ');
      content.append(title, type);

      [['Problem:', project.problem], ['Solution:', project.solution]].forEach(([labelText, value]) => {
        if (!hasText(value)) return;
        const line = document.createElement('div');
        line.style.cssText = 'font-size:0.75rem;color:var(--n-muted);margin-bottom:0.5rem;line-height:1.5;';
        const strong = document.createElement('strong');
        strong.style.cssText = 'color:var(--text-color);';
        strong.textContent = labelText;
        line.append(strong, document.createTextNode(` ${value}`));
        content.appendChild(line);
      });

      const tags = document.createElement('div');
      (Array.isArray(project.tags) ? project.tags : []).forEach((tagValue) => {
        const green = tagValue === '#Live' || tagValue === '#GetStarted';
        tags.appendChild(createTag(tagValue, green ? 'green' : 'orange'));
      });
      content.appendChild(tags);
      card.append(media, content);
      column.appendChild(card);
      fragment.appendChild(column);
    });

    if (!fragment.childNodes.length) return false;
    row.replaceChildren(fragment);
    mount.dataset.cudfirmAdapter = 'portfolio';
    return true;
  }

  function safeAccentColor(value) {
    const candidate = text(value).trim();
    return /^(#[0-9a-f]{3,8}|rgb\([^)]*\)|rgba\([^)]*\)|hsl\([^)]*\)|hsla\([^)]*\))$/i.test(candidate)
      ? candidate
      : '#0B3D2E';
  }

  function renderTestimonials({ mount, data }) {
    const row = mount?.querySelector(':scope > .row.g-3.stagger-children');
    if (!row || !Array.isArray(data) || !data.length) return false;

    mount.querySelectorAll(':scope > .testimonial-placeholder-notice').forEach((notice) => notice.remove());
    const allPlaceholder = data.every((item) => item.placeholder === true);
    if (allPlaceholder) {
      const notice = document.createElement('div');
      notice.className = 'testimonial-placeholder-notice';
      notice.setAttribute('role', 'note');
      notice.setAttribute('aria-label', 'Testimonials notice');
      notice.appendChild(createIcon('bi-info-circle-fill'));
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = 'Testimonials coming soon. ';
      copy.append(strong, document.createTextNode('The cards below show the kind of results CUDFIRM clients experience. Real verified reviews will be displayed here as our portfolio grows. '));
      const action = document.createElement('button');
      action.className = 'btn-inline-link';
      action.textContent = 'Become one of our first clients →';
      action.addEventListener('click', (event) => window.openTab?.(event, 'connect-content'));
      copy.appendChild(action);
      notice.appendChild(copy);
      row.before(notice);
    }

    const fragment = document.createDocumentFragment();
    data.forEach((testimonial) => {
      if (!hasText(testimonial.name) || !hasText(testimonial.quote)) return;
      const accent = safeAccentColor(testimonial.accentColor);
      const column = document.createElement('div');
      column.className = 'col-12 col-md-6';
      const card = document.createElement('div');
      card.className = 'card p-4 testimonial-placeholder-card';

      if (testimonial.placeholder) {
        const badge = document.createElement('div');
        badge.className = 'testimonial-placeholder-badge';
        badge.setAttribute('aria-label', 'Illustrative example');
        badge.textContent = 'Illustrative';
        card.appendChild(badge);
      }

      if (hasText(testimonial.avatarUrl)) {
        const avatar = document.createElement('img');
        avatar.src = testimonial.avatarUrl;
        avatar.alt = '';
        avatar.loading = 'lazy';
        avatar.style.cssText = 'width:44px;height:44px;border-radius:50%;object-fit:cover;margin-bottom:0.75rem;';
        card.appendChild(avatar);
      } else {
        const avatar = document.createElement('div');
        avatar.style.cssText = `width:44px;height:44px;border-radius:50%;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:0.75rem;`;
        avatar.textContent = testimonial.name.charAt(0).toUpperCase();
        card.appendChild(avatar);
      }

      const quote = document.createElement('p');
      quote.style.cssText = 'font-size:0.85rem;font-style:italic;color:var(--text-color);margin-bottom:0.75rem;';
      quote.textContent = `“${testimonial.quote}”`;
      const name = document.createElement('div');
      name.style.cssText = `font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;color:${accent};`;
      name.textContent = testimonial.name;
      const role = document.createElement('div');
      role.style.cssText = 'font-size:0.72rem;color:var(--n-muted);';
      role.textContent = testimonial.role;
      card.append(quote, name, role);
      column.appendChild(card);
      fragment.appendChild(column);
    });

    if (!fragment.childNodes.length) return false;
    row.replaceChildren(fragment);
    mount.dataset.cudfirmAdapter = 'testimonials';
    return true;
  }

  function renderFaq({ mount, data }) {
    const list = mount?.querySelector(':scope > .d-flex.flex-column.gap-3.stagger-children');
    if (!list || !Array.isArray(data) || !data.length) return false;

    const fragment = document.createDocumentFragment();
    data.forEach((item, index) => {
      if (!hasText(item.question) || !hasText(item.answer)) return;
      const card = document.createElement('div');
      card.className = 'card p-3';
      card.style.cssText = 'cursor:pointer;';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-expanded', 'false');

      const top = document.createElement('div');
      top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:0.75rem;';
      const question = document.createElement('div');
      question.style.cssText = "font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);";
      question.textContent = item.question;
      const icon = createIcon('bi-chevron-down');
      icon.style.cssText = 'color:var(--n-gold);flex-shrink:0;';
      top.append(question, icon);

      const answer = document.createElement('div');
      answer.id = `cudfirm-faq-answer-${item.id || index + 1}`;
      answer.className = 'faq-answer d-none';
      answer.style.cssText = 'margin-top:0.75rem;font-size:0.8rem;color:var(--n-muted);line-height:1.65;';
      answer.textContent = item.answer;
      card.setAttribute('aria-controls', answer.id);

      const toggle = () => {
        const willOpen = answer.classList.contains('d-none');
        answer.classList.toggle('d-none');
        card.setAttribute('aria-expanded', String(willOpen));
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
      card.append(top, answer);
      fragment.appendChild(card);
    });

    if (!fragment.childNodes.length) return false;
    list.replaceChildren(fragment);
    mount.dataset.cudfirmAdapter = 'faq';
    return true;
  }

  function setFieldCopy(mount, selector, value, attribute) {
    const element = mount.querySelector(selector);
    if (!element || !hasText(value)) return;
    if (attribute) element.setAttribute(attribute, value);
    else element.textContent = value;
  }

  function renderAssurances(row, assurances) {
    if (!row || !Array.isArray(assurances) || !assurances.length) return;
    row.replaceChildren();
    assurances.forEach((assurance) => {
      const item = document.createElement('span');
      item.setAttribute('role', 'listitem');
      item.appendChild(createIcon(assurance.icon));
      item.append(document.createTextNode(` ${text(assurance.title)}`));
      row.appendChild(item);
    });
  }

  function renderContact({ mount, data }) {
    if (!mount || !data || !hasText(data.title)) return false;

    setText(mount.querySelector('h6 .badge'), data.eyebrow);
    setText(mount.querySelector('.contact-header'), data.title);
    setText(mount.querySelector('.contact-subheader'), data.introduction);
    renderAssurances(mount.querySelector('.contact-trust-row'), data.assurances);

    const form = data.form || {};
    setFieldCopy(mount, 'label[for="contactName"]', form.nameLabel);
    setFieldCopy(mount, '#contactName', form.namePlaceholder, 'placeholder');
    setFieldCopy(mount, 'label[for="contactInfo"]', form.contactLabel);
    setFieldCopy(mount, '#contactInfo', form.contactPlaceholder, 'placeholder');
    setFieldCopy(mount, 'label[for="contactMessage"]', form.messageLabel);
    setFieldCopy(mount, '#contactMessage', form.messagePlaceholder, 'placeholder');

    const whatsappButton = mount.querySelector('button[onclick*="sendToWhatsApp"]');
    const submitButton = mount.querySelector('button[onclick*="sendToAdmin"]');
    const emailButton = mount.querySelector('button[onclick*="sendToEmail"]');
    setText(whatsappButton, form.whatsappLabel);
    setText(submitButton, form.submitLabel);
    setText(emailButton, form.emailLabel);

    const privacy = mount.querySelector('#contactForm p[style*="text-align:center"]');
    setText(privacy, form.privacyText);

    const direct = data.directContact || {};
    const box = mount.querySelector('.quick-contact-box');
    setText(box?.querySelector('h5'), direct.title);
    setText(box?.querySelector('p'), [direct.description, direct.businessHours].filter(hasText).join(' '));

    const phoneLink = box?.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      if (direct.showPhone === false || !hasText(direct.phone)) phoneLink.style.display = 'none';
      else phoneLink.href = `tel:${direct.phone.replace(/\s+/g, '')}`;
    }
    const copyButton = box?.querySelector('button[onclick*="copyToClipboard"]');
    if (copyButton) {
      if (direct.showPhone === false || !hasText(direct.phone)) copyButton.style.display = 'none';
      else copyButton.onclick = () => window.copyToClipboard?.(direct.phone, 'Number copied! ✓');
    }

    const details = box?.querySelector('div[style*="font-size:0.75rem"]');
    if (details) {
      details.replaceChildren();
      if (direct.showEmail !== false && hasText(direct.email)) {
        details.appendChild(createIcon('bi-envelope'));
        details.append(document.createTextNode(` ${direct.email}`), document.createElement('br'));
      }
      if (direct.showAddress !== false && hasText(direct.address)) {
        details.appendChild(createIcon('bi-geo-alt'));
        details.append(document.createTextNode(` ${direct.address}`));
      }
    }

    mount.dataset.cudfirmAdapter = 'contact';
    return true;
  }

  window.CUDFIRMDefaultAdapter = Object.freeze({ renderHome, renderAbout, renderServices, renderPortfolio, renderTestimonials, renderFaq, renderContact });
})();
