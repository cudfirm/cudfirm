'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

const context = {
  console,
  document: {
    documentElement: { dataset: {} },
    querySelector: () => ({}),
    createElement() {
      return {
        className: '',
        dataset: {},
        style: {},
        setAttribute() {},
        addEventListener() {},
        append() {},
        appendChild() {},
        replaceChildren() {},
      };
    },
  },
};
context.window = context;
vm.createContext(context);

function load(relativePath) {
  vm.runInContext(read(relativePath), context, { filename: relativePath });
}

load('js/template-config.js');
load('js/template-validator.js');
load('templates/cudfirm-default/template.manifest.js');
load('templates/cudfirm-default/template.adapter.js');
load('js/template-registry.js');
load('templates/cudfirm-default/template.registration.js');

const manifest = context.CUDFIRMDefaultManifest;
const adapter = context.CUDFIRMDefaultAdapter;
const registryEntry = context.CUDFIRMTemplateRegistry.get('cudfirm-default');

assert.equal(context.CUDFIRM_CONFIG.templateId, 'cudfirm-default');
assert.equal(context.CUDFIRM_CONFIG.coreVersion, '2.0.0');
assert.equal(manifest.schemaVersion, '1.1.0');
assert.equal(manifest.template.id, 'cudfirm-default');
assert.equal(manifest.template.version, '1.5.0');
assert.equal(manifest.compatibility.minimumContractVersion, '1.1.0');
assert.equal(adapter.id, 'cudfirm-default');
assert.equal(adapter.version, '1.0.0');
assert.equal(registryEntry.adapter, adapter);
assert.equal(registryEntry.manifest, manifest);

['initialize', 'beforeRender', 'afterRender', 'complete', 'onError', 'getState'].forEach((name) => {
  assert.equal(typeof adapter[name], 'function', `Missing Adapter 1 lifecycle/API function: ${name}`);
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

const data = {
  meta: { contractVersion: '1.1.0', locale: 'en-NG' },
  site: { name: 'Example Business' },
  theme: {},
  hero: { title: 'Home' },
  about: { title: 'About' },
  services: [{ title: 'Service', description: 'Description' }],
  portfolio: [{ title: 'Project', imageUrl: '/project.webp' }],
  testimonials: [{ name: 'Client', quote: 'Testimonial' }],
  faq: [{ question: 'Question?', answer: 'Answer.' }],
  navigation: [{ label: 'Home', target: 'home' }],
  contact: { title: 'Contact' },
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
  templateId: 'cudfirm-default',
  contract: data,
});
assert.equal(adapter.getState().initialized, true);
assert.equal(context.document.documentElement.dataset.cudfirmTemplate, 'cudfirm-default');
assert.equal(context.document.documentElement.dataset.cudfirmAdapterVersion, '1.0.0');

const adapterSource = read('templates/cudfirm-default/template.adapter.js');
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
    `Adapter 1 must not contain privileged core token: ${forbidden}`,
  );
});


assert.equal(
  /\.from\(\s*['"`]/.test(adapterSource),
  false,
  'Adapter 1 must not contain a direct table query.',
);

const indexSource = read('index.html');
const orderedEntries = [
  'js/template-config.js',
  'templates/cudfirm-default/template.manifest.js',
  'templates/cudfirm-default/template.adapter.js',
  'js/template-registry.js',
  'templates/cudfirm-default/template.registration.js',
  'js/template-validator.js',
  'js/template-runtime.js',
];
const order = orderedEntries.map((entry) => indexSource.indexOf(entry));

order.forEach((position, index) => {
  assert.notEqual(position, -1, `index.html is missing ${orderedEntries[index]}`);
});
for (let index = 1; index < order.length; index += 1) {
  assert.ok(order[index - 1] < order[index], 'Template integration scripts are not in safe execution order.');
}

assert.equal(fs.existsSync(path.join(projectRoot, 'docs/ADAPTER_1_SPEC.md')), true);

console.log('CUDFIRM Default Adapter 1 verification passed.');
