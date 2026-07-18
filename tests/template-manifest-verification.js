'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const context = {
  console,
  document: {
    querySelector: () => ({}),
  },
};
context.window = context;
vm.createContext(context);

function load(relativePath) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

load('js/template-validator.js');
load('templates/cudfirm-default/template.manifest.js');

const manifest = context.CUDFIRMDefaultManifest;
const validator = context.CUDFIRMTemplateValidator;
const adapter = {
  renderHome() {},
  renderAbout() {},
  renderServices() {},
  renderPortfolio() {},
  renderTestimonials() {},
  renderFaq() {},
  renderContact() {},
};
const data = {
  meta: { contractVersion: '1.1.0', locale: 'en-NG' },
  hero: { title: 'Home' },
  about: { title: 'About' },
  services: [{ title: 'Service', description: 'Description' }],
  portfolio: [{ title: 'Project', imageUrl: '/project.webp' }],
  testimonials: [{ name: 'Client', quote: 'Testimonial' }],
  faq: [{ question: 'Question?', answer: 'Answer.' }],
  navigation: [{ label: 'Home', target: 'home' }],
  contact: { title: 'Contact' },
};

assert.equal(manifest.schemaVersion, '1.1.0');
assert.equal(manifest.template.id, 'cudfirm-default');
assert.equal(manifest.template.version, '1.5.0');
assert.equal(manifest.compatibility.minimumContractVersion, '1.1.0');
assert.ok(manifest.assets.required.length > 0);
assert.ok(manifest.assets.required.some((asset) => asset.id === 'template-adapter'));

const report = validator.validate(manifest, adapter, data, { coreVersion: '2.0.0' });
assert.equal(report.compatible, true, report.errors.join('\n'));
assert.equal(report.errors.length, 0);
assert.equal(report.capabilities.assets.required.length, manifest.assets.required.length);

const invalidManifest = JSON.parse(JSON.stringify(manifest));
invalidManifest.assets.required[0].source = '';
const invalidReport = validator.validate(invalidManifest, adapter, data, { coreVersion: '2.0.0' });
assert.equal(invalidReport.compatible, false);
assert.ok(invalidReport.invalidSettings.includes('assets.required[0].source'));

console.log('Template manifest verification passed.');
