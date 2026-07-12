/**
 * CUDFIRM Default — Adapter 1 compatibility adapter.
 * Patches the legacy About and Contact DOM without replacing shared behavior.
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

  window.CUDFIRMDefaultAdapter = Object.freeze({ renderAbout, renderContact });
})();
