'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

const mount = {
  dataset: {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
};

const context = {
  console,
  CustomEvent: class {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  document: {
    readyState: 'complete',
    documentElement: {
      dataset: {},
      style: { setProperty() {} },
    },
    head: mount,
    querySelector() { return mount; },
    querySelectorAll() { return []; },
    createDocumentFragment() {
      return {
        childNodes: [],
        appendChild(node) { this.childNodes.push(node); },
      };
    },
    createTextNode(value) { return { textContent: value }; },
    createElement() {
      return {
        className: '',
        dataset: {},
        style: {},
        classList: { add() {}, toggle() {} },
        setAttribute() {},
        addEventListener() {},
        append() {},
        appendChild() {},
        replaceChildren() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
      };
    },
    addEventListener() {},
    getElementById() { return null; },
  },
  addEventListener() {},
  dispatchEvent() {},
};
context.window = context;
vm.createContext(context);

function load(relativePath) {
  vm.runInContext(read(relativePath), context, { filename: relativePath });
}

load('templates/web1/template.config.js');
load('js/template-config.js');
load('js/template-validator.js');
load('templates/web1/template.manifest.js');
load('templates/web1/template.adapter.js');
load('js/template-registry.js');
load('templates/web1/template.registration.js');

const manifest = context.CUDFIRMWeb1Manifest;
const adapter = context.CUDFIRMWeb1Adapter;
const registryEntry = context.CUDFIRMTemplateRegistry.get('web1');

assert.equal(context.CUDFIRM_CONFIG.templateId, 'web1');
assert.equal(context.CUDFIRM_CONFIG.coreVersion, '2.0.0');
assert.equal(manifest.schemaVersion, '1.1.0');
assert.equal(manifest.template.id, 'web1');
assert.equal(manifest.template.version, '1.1.0');
assert.equal(manifest.compatibility.minimumContractVersion, '1.1.0');
assert.equal(adapter.id, 'web1');
assert.equal(adapter.version, '1.0.0');
assert.equal(registryEntry.adapter, adapter);
assert.equal(registryEntry.manifest, manifest);

['initialize', 'beforeRender', 'afterRender', 'complete', 'onError', 'getState'].forEach((name) => {
  assert.equal(typeof adapter[name], 'function', `Missing Adapter 2 lifecycle/API function: ${name}`);
});

Object.entries(manifest.sections)
  .filter(([, section]) => section.enabled && (section.managedBy || 'adapter') === 'adapter')
  .forEach(([sectionName, section]) => {
    assert.equal(
      typeof adapter[section.renderer],
      'function',
      `${sectionName} is missing renderer ${section.renderer}`,
    );
  });

assert.equal(manifest.forms.contact.managedBy, 'shared-core');
assert.equal(manifest.forms.newsletter.managedBy, 'shared-core');

const data = {
  meta: { contractVersion: '1.1.0', locale: 'en-NG' },
  site: {
    name: 'Example Motors',
    footerText: 'Footer',
    socialLinks: [],
  },
  theme: {
    colors: {
      primary: '#0a2463',
      secondary: '#d9a273',
      accent: '#d9a273',
      background: '#f8f9fa',
      text: '#4a5568',
    },
  },
  navigation: [{ label: 'Home', target: 'home', order: 1 }],
  hero: { title: 'Find Your Vehicle', subtitle: 'Example' },
  about: { title: 'About', facts: [{ label: 'Vehicles', value: '10' }] },
  portfolio: [{ title: 'Vehicle', imageUrl: '/vehicle.webp', tags: [] }],
  services: [{ title: 'Service', description: 'Description' }],
  testimonials: [{ name: 'Client', quote: 'Excellent.' }],
  contact: {
    title: 'Contact',
    form: {
      nameLabel: 'Name',
      contactLabel: 'Email',
      messageLabel: 'Message',
      submitLabel: 'Send',
    },
  },
  seo: { pages: { home: { title: 'Example Motors' } } },
};

const report = context.CUDFIRMTemplateValidator.validate(
  manifest,
  adapter,
  data,
  { coreVersion: '2.0.0', registration: registryEntry.metadata },
);
assert.equal(report.compatible, true, report.errors.join('\n'));
assert.equal(report.errors.length, 0);

adapter.initialize({
  templateId: 'web1',
  contract: data,
  manifest,
});
assert.equal(context.document.documentElement.dataset.cudfirmTemplate, 'web1');
assert.equal(context.document.documentElement.dataset.cudfirmAdapterVersion, '1.0.0');

const adapterSource = read('templates/web1/template.adapter.js');
[
  'service_role',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'supabaseClient',
  'record_auth_security_event',
  'current_app_role',
  'has_permission',
  'record_activity_event',
].forEach((forbidden) => {
  assert.equal(
    adapterSource.includes(forbidden),
    false,
    `Adapter 2 must not contain privileged core token: ${forbidden}`,
  );
});
assert.equal(/\.from\(\s*['"`]/.test(adapterSource), false, 'Adapter 2 must not contain a direct table query.');

const submissionSource = read('js/public-submissions.js');
assert.equal(submissionSource.includes("from('messages')"), true);
assert.equal(submissionSource.includes("from('subscribers')"), true);
assert.equal(submissionSource.includes('service_role'), false);
assert.equal(submissionSource.includes('SUPABASE_SERVICE_ROLE_KEY'), false);

const html = read('web1.html');
const requiredOrder = [
  'js/supabase.js',
  'templates/web1/template.config.js',
  'js/template-config.js',
  'js/cms-api.js',
  'js/cms-contract.js',
  'js/cms-loader.js',
  'js/public-submissions.js',
  'templates/web1/template.manifest.js',
  'templates/web1/template.adapter.js',
  'js/template-registry.js',
  'templates/web1/template.registration.js',
  'js/template-validator.js',
  'js/template-runtime.js',
  'templates/web1/js/script.js',
];
const positions = requiredOrder.map((entry) => html.indexOf(entry));
positions.forEach((position, index) => {
  assert.notEqual(position, -1, `web1.html is missing ${requiredOrder[index]}`);
});
for (let index = 1; index < positions.length; index += 1) {
  assert.ok(positions[index - 1] < positions[index], 'Adapter 2 scripts are not in safe execution order.');
}

[
  'config/client-config.js',
  'js/sample-data.js',
  'js/supabase-loader.js',
  'sb_publishable_',
].forEach((forbidden) => {
  assert.equal(html.includes(forbidden), false, `web1.html must not include old delivery dependency: ${forbidden}`);
});

[
  'web1.html',
  'js/public-submissions.js',
  'templates/web1/template.config.js',
  'templates/web1/template.manifest.js',
  'templates/web1/template.adapter.js',
  'templates/web1/template.registration.js',
  'templates/web1/css/styles.css',
  'templates/web1/css/theme-overrides.css',
  'templates/web1/js/script.js',
  'templates/web1/README.md',
  'docs/ADAPTER_2_SPEC.md',
].forEach((relativePath) => {
  assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), true, `Missing Adapter 2 file: ${relativePath}`);
});

console.log('CUDFIRM Web1 Adapter 2 verification passed.');
