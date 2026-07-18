'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const requiredFiles = [
  'cudtemp.html',
  'templates/cudtemp/css/cudtemp.css',
  'templates/cudtemp/js/cudtemp.js',
  'templates/cudtemp/template.config.js',
  'templates/cudtemp/template.manifest.js',
  'templates/cudtemp/template.adapter.js',
  'templates/cudtemp/template.registration.js',
  'templates/cudtemp/README.md',
  'templates/cudtemp/LICENSE-NOTICE.md',
  'docs/ADAPTER_2_SPEC.md',
  ...Array.from({ length: 5 }, (_, index) => `templates/cudtemp/images/cudtemp-screen-${String(index + 1).padStart(2, '0')}.webp`),
];
requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Missing ${file}`));

const html = read('cudtemp.html');
assert.equal(/Clearwave/i.test(html), false, 'The public page must use the CUDTEMP identity.');
assert.equal(html.includes('templates/cudtemp/css/cudtemp.css'), true);
assert.equal(html.includes('templates/cudtemp/js/cudtemp.js'), true);
assert.equal(html.includes('css/template.css'), false);
assert.equal(html.includes('js/template.js'), false);
assert.equal((html.match(/class="feature-row(?:\s|\")/g) || []).length, 3);
assert.equal((html.match(/class="stat-card\b/g) || []).length, 4);
assert.equal((html.match(/class="pricing-card\b/g) || []).length, 3);
assert.equal((html.match(/class="testimonial-card\b/g) || []).length, 5);
assert.equal((html.match(/class="integration-tile\b/g) || []).length, 16);
assert.equal((html.match(/class="faq-item\b/g) || []).length, 6);
assert.equal((html.match(/class="phone-card\b/g) || []).length, 5);
['#1 Productivity SaaS','SOC 2 Certified','99.9% Uptime SLA','50k+ Teams','Start Free Trial','Sign in','status.clearwave.io'].forEach(claim => assert.equal(html.includes(claim), false, `Unsupported claim remains: ${claim}`));

const context = {
  console,
  Node: { TEXT_NODE: 3 },
  document: {
    documentElement: { dataset: {}, style: { setProperty() {} } },
    head: { querySelector() { return null; }, appendChild() {} },
    querySelector() { return {}; },
    querySelectorAll() { return []; },
    createElement() { return { setAttribute() {}, appendChild() {}, style: {}, classList: { add(){}, remove(){} } }; },
    createTextNode(value) { return { nodeType: 3, textContent: value, remove() {} }; },
  },
};
context.window = context;
vm.createContext(context);
['templates/cudtemp/template.config.js','js/template-config.js','js/template-validator.js','templates/cudtemp/template.manifest.js','templates/cudtemp/template.adapter.js','js/template-registry.js','templates/cudtemp/template.registration.js'].forEach(file => vm.runInContext(read(file), context, { filename: file }));

const manifest = context.CUDTEMPManifest;
const adapter = context.CUDTEMPAdapter;
const registered = context.CUDFIRMTemplateRegistry.get('cudtemp');
assert.equal(context.CUDFIRM_CONFIG.templateId, 'cudtemp');
assert.equal(manifest.template.id, 'cudtemp');
assert.equal(manifest.template.name, 'CUDTEMP');
assert.equal(manifest.template.version, '1.0.0');
assert.equal(adapter.id, 'cudtemp');
assert.equal(adapter.version, '1.0.0');
assert.equal(registered.manifest, manifest);
assert.equal(registered.adapter, adapter);
Object.entries(manifest.sections).filter(([, section]) => section.enabled && (section.managedBy || 'adapter') === 'adapter').forEach(([name, section]) => assert.equal(typeof adapter[section.renderer], 'function', `${name} missing ${section.renderer}`));

const contract = {
  meta: { contractVersion: '1.1.0', locale: 'en-NG' },
  site: { name: 'CUDFIRM' }, theme: {}, navigation: [{ label:'Home', target:'home' }],
  hero: { title:'Reusable CMS' }, about: { facts:[], values:[] },
  services: [{ title:'Template Integration', description:'Description' }],
  portfolio: [{ title:'Project', imageUrl:'/project.webp' }],
  testimonials: [{ name:'Client', quote:'Feedback' }], faq: [{ question:'Question?', answer:'Answer.' }],
  contact: { title:'Contact' }, seo: { pages: { home: { title:'CUDFIRM' } } },
};
const report = context.CUDFIRMTemplateValidator.validate(manifest, adapter, contract, { coreVersion:'2.0.0', registration:registered.metadata });
assert.equal(report.compatible, true, report.errors.join('\n'));

const adapterSource = read('templates/cudtemp/template.adapter.js');
['service_role','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','record_auth_security_event','current_app_role','has_permission','record_activity_event'].forEach(token => assert.equal(adapterSource.includes(token), false, `Privileged token found: ${token}`));
assert.equal(/\.from\(\s*['"`]/.test(adapterSource), false, 'CUDTEMP adapter must not query a table directly.');

const order = [
 'templates/cudtemp/template.config.js','js/template-config.js','js/cms-contract.js','templates/cudtemp/template.manifest.js','templates/cudtemp/template.adapter.js','js/template-registry.js','templates/cudtemp/template.registration.js','js/template-validator.js','js/template-runtime.js',
].map(entry => html.indexOf(entry));
order.forEach((position,index) => assert.notEqual(position,-1, `cudtemp.html missing integration script ${index}`));
for (let index=1; index<order.length; index += 1) assert.ok(order[index-1] < order[index], 'CUDTEMP scripts are not in safe order.');

console.log('CUDTEMP Adapter 2 verification passed.');
