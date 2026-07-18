const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const contractPath = path.resolve(__dirname, '../js/cms-contract.js');
const source = fs.readFileSync(contractPath, 'utf8');
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(source, context, { filename: contractPath });

const contract = context.window.CUDFIRMContract;
assert.ok(contract, 'CUDFIRMContract should be exposed on window.');
assert.equal(contract.CONTRACT_VERSION, '1.1.0');

const normalized = contract.normalize({
  locale: 'en-NG',
  siteSettings: {
    company_name: 'Example Studio',
    email: 'hello@example.test',
    phone: '+234 800 000 0000',
    whatsapp: '+2348000000000',
    address: 'Lagos, Nigeria',
    google_maps_embed: 'https://maps.example.test/embed',
    social_links: [{ platform: 'instagram', url: 'https://example.test/social' }],
    theme_spacing: 'spacious',
    theme_shadow: 'strong',
    theme_radius: 'large',
    maintenance_enabled: true,
    maintenance_title: 'Maintenance',
  },
  hero: {
    title: 'Build with confidence',
    trust_items: [{ icon: 'bi-check', label: 'Trusted' }],
  },
  about: {
    title: 'About us',
    story_blocks: [{ id: 'story-1', text: 'Story', image_url: '/story.webp', image_alt: 'Story image' }],
    values: [{ id: 'value-1', title: 'Quality', desc: 'Careful work' }],
    facts: [{ id: 'fact-1', label: 'Location', value: 'Lagos' }],
  },
  services: [{ id: 1, name: 'Landing page', description: 'A focused page', is_special: true, sort_order: 2 }],
  portfolio: [{ id: 2, name: 'Project', featured_home: true, is_live: true }],
  contact: {
    title: 'Contact us',
    assurances: [{ id: 'a-1', title: 'Fast reply' }],
    form_config: { submitLabel: 'Send', successMessage: 'Sent' },
    show_phone: true,
    show_whatsapp: false,
    show_map: true,
  },
  seo: [
    { page_key: 'home', title: 'Home', meta_description: 'Home description', og_image: '/home.webp' },
    { page_key: 'about', title: 'About', canonical_url: 'https://example.test/about' },
  ],
  media: [{ id: 9, file_name: 'photo.webp', public_url: '/photo.webp', size_bytes: '1024' }],
});

assert.equal(normalized.site.name, 'Example Studio');
assert.equal(normalized.site.mapEmbedUrl, 'https://maps.example.test/embed');
assert.deepEqual(JSON.parse(JSON.stringify(normalized.site.socialLinks)), [
  { platform: 'instagram', url: 'https://example.test/social' },
]);
assert.equal(normalized.theme.spacing, 'spacious');
assert.equal(normalized.theme.shadow, 'strong');
assert.equal(normalized.theme.radius, 'large');
assert.equal(normalized.maintenance.enabled, true);
assert.equal(normalized.maintenance.title, 'Maintenance');
assert.equal(normalized.about.storyBlocks[0].imageUrl, '/story.webp');
assert.equal(normalized.about.storyBlocks[0].imageAlt, 'Story image');
assert.equal(normalized.about.values[0].description, 'Careful work');
assert.equal(normalized.contact.directContact.phone, '+234 800 000 0000');
assert.equal(normalized.contact.directContact.showWhatsapp, false);
assert.equal(normalized.contact.directContact.showMap, true);
assert.equal(normalized.contact.form.successMessage, 'Sent');
assert.equal(normalized.services[0].special, true);
assert.equal(Object.prototype.hasOwnProperty.call(normalized.services[0], 'featured'), false);
assert.equal(normalized.portfolio[0].featured, true);
assert.equal(normalized.seo.pages.home.description, 'Home description');
assert.equal(normalized.seo.pages.home.openGraphImage, '/home.webp');
assert.equal(normalized.seo.pages.about.canonicalUrl, 'https://example.test/about');
assert.equal(normalized.media.items[0].sizeBytes, 1024);
assert.deepEqual(JSON.parse(JSON.stringify(normalized.extensions)), {});

const safe = contract.normalize({
  siteSettings: { social_links: 'invalid' },
  about: { story_blocks: null, values: {}, facts: 'invalid' },
  contact: { assurances: null, form_config: [] },
  services: null,
  seo: null,
});

assert.deepEqual(JSON.parse(JSON.stringify(safe.site.socialLinks)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.about.storyBlocks)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.about.values)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.about.facts)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.contact.assurances)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.services)), []);
assert.deepEqual(JSON.parse(JSON.stringify(safe.seo.pages)), {});

console.log('CMS contract verification passed.');
