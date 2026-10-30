'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyDelivery } = require('../tools/verify-client-delivery.js');

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cudfirm-delivery-'));
const projectRef = 'abcdefghijklmnopqrst';

write(root, 'client-delivery.json', JSON.stringify({
  schemaVersion: '1.0.0',
  deploymentType: 'client',
  client: { id: 'sample-client', name: 'Sample Client' },
  core: { version: '2.0.0', contractVersion: '1.1.0', runtimeVersion: '1.1.0' },
  template: { id: 'sample-template', manifestGlobal: 'SampleManifest' },
  supabase: { projectRef, isolated: true, forbiddenProjectRefs: ['wefncrkzugezvduzejzf'] },
  paths: {
    siteRoot: '.',
    entry: 'index.html',
    dashboard: 'dashboard/index.html',
    clientConfig: 'config/client-config.js',
    templateManifest: 'templates/sample-template/template.manifest.js',
    templateAdapter: 'templates/sample-template/template.adapter.js',
    freshInstaller: 'supabase/fresh-install/01_cudfirm_core_fresh_install.sql',
    verificationSql: 'supabase/fresh-install/03_verify_fresh_install.sql',
    sharedSupabase: 'js/supabase.js',
    required: [
      'js/template-config.js',
      'js/supabase.js',
      'js/cms-api.js',
      'js/cms-contract.js',
      'js/cms-loader.js',
      'js/template-registry.js',
      'js/template-validator.js',
      'js/template-runtime.js',
      'js/public-forms.js'
    ]
  }
}, null, 2));

write(root, 'config/client-config.js', `window.CUDFIRM_CONFIG = Object.freeze({
  deploymentType: 'client',
  dataMode: 'supabase',
  templateId: 'sample-template',
  coreVersion: '2.0.0',
  contractVersion: '1.1.0',
  supabaseUrl: 'https://${projectRef}.supabase.co',
  supabaseAnonKey: 'sb_publishable_test_key'
});`);

write(root, 'index.html', `<!doctype html><html><head><link rel="stylesheet" href="templates/sample-template/template.css"></head><body>
<section id="hero"></section><form id="contact"></form>
<script src="config/client-config.js"></script><script src="js/supabase.js"></script>
<script src="templates/sample-template/template.manifest.js"></script><script src="templates/sample-template/template.adapter.js"></script>
</body></html>`);
write(root, 'dashboard/index.html', `<!doctype html><html><body><script src="../config/client-config.js"></script><script src="../js/supabase.js"></script></body></html>`);

write(root, 'templates/sample-template/template.manifest.js', `window.SampleManifest = Object.freeze({
  schemaVersion: '1.1.0',
  template: { id: 'sample-template', name: 'Sample', version: '1.0.0' },
  compatibility: { minimumContractVersion: '1.1.0', maximumContractVersion: '1.x', requiredCoreVersion: '2.0.0' },
  modules: { required: [], optional: [] },
  assets: { required: [
    { id: 'style', type: 'stylesheet', source: 'templates/sample-template/template.css', managedBy: 'template' },
    { id: 'adapter', type: 'script', source: 'templates/sample-template/template.adapter.js', managedBy: 'template' }
  ], optional: [], notes: [] },
  sections: { hero: { enabled: true, required: true, source: 'hero', mount: '#hero', renderer: 'renderHero', requiredFields: ['title'] } },
  forms: { contact: { managedBy: 'shared-core', formSelector: '#contact', fields: { name: '[name=name]' } } }
});`);
write(root, 'templates/sample-template/template.adapter.js', `window.SampleAdapter = Object.freeze({ renderHero() { return true; } });`);
write(root, 'templates/sample-template/template.css', 'body { display: block; }');

for (const relativePath of [
  'js/template-config.js', 'js/supabase.js', 'js/cms-api.js', 'js/cms-contract.js',
  'js/cms-loader.js', 'js/template-registry.js', 'js/template-validator.js',
  'js/template-runtime.js', 'js/public-forms.js'
]) write(root, relativePath, '// fixture');
write(root, 'supabase/fresh-install/01_cudfirm_core_fresh_install.sql', '-- fixture installer');
write(root, 'supabase/fresh-install/03_verify_fresh_install.sql', '-- fixture verification');

const passing = verifyDelivery(root);
assert.equal(passing.ok, true, passing.errors.join('\n'));
assert.equal(passing.errors.length, 0);
assert.equal(passing.clientId, 'sample-client');
assert.equal(passing.templateId, 'sample-template');

write(root, 'templates/sample-template/template.adapter.js', `window.SampleAdapter = { renderHero() {}, direct() { return supabaseClient.from('messages'); } };`);
const directDatabaseFailure = verifyDelivery(root);
assert.equal(directDatabaseFailure.ok, false);
assert.ok(directDatabaseFailure.errors.some((error) => error.includes('references Supabase directly')));
assert.ok(directDatabaseFailure.errors.some((error) => error.includes('queries a database table directly')));

write(root, 'templates/sample-template/template.adapter.js', `window.SampleAdapter = Object.freeze({ renderHero() { return true; } });`);
write(root, 'config/client-config.js', `window.CUDFIRM_CONFIG = {
  deploymentType: 'client', dataMode: 'supabase', templateId: 'sample-template',
  coreVersion: '2.0.0', contractVersion: '1.1.0',
  supabaseUrl: 'https://${projectRef}.supabase.co', supabaseAnonKey: 'sb_secret_forbidden'
};`);
const secretFailure = verifyDelivery(root);
assert.equal(secretFailure.ok, false);
assert.ok(secretFailure.errors.some((error) => error.includes('forbidden server-side Supabase key')));


const nestedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cudfirm-delivery-nested-'));
write(nestedRoot, 'client-delivery.json', JSON.stringify({
  schemaVersion: '1.0.0', deploymentType: 'client',
  client: { id: 'nested-client', name: 'Nested Client' },
  core: { version: '2.0.0', contractVersion: '1.1.0', runtimeVersion: '1.1.0' },
  template: { id: 'sample-template', manifestGlobal: 'SampleManifest' },
  supabase: { projectRef, isolated: true },
  paths: {
    siteRoot: 'site', entry: 'site/index.html', dashboard: 'site/dashboard/index.html',
    clientConfig: 'site/config/client-config.js', sharedSupabase: 'site/js/supabase.js',
    templateManifest: 'site/templates/sample-template/template.manifest.js',
    templateAdapter: 'site/templates/sample-template/template.adapter.js',
    freshInstaller: 'database/install.sql', verificationSql: 'database/verify.sql',
    required: ['site/js/supabase.js']
  }
}, null, 2));
write(nestedRoot, 'site/config/client-config.js', `window.CUDFIRM_CONFIG = {
  deploymentType: 'client', dataMode: 'supabase', templateId: 'sample-template',
  coreVersion: '2.0.0', contractVersion: '1.1.0',
  supabaseUrl: 'https://${projectRef}.supabase.co', supabaseAnonKey: 'sb_publishable_test_key'
};`);
write(nestedRoot, 'site/index.html', '<section id="hero"></section><script src="config/client-config.js"></script><script src="js/supabase.js"></script>');
write(nestedRoot, 'site/dashboard/index.html', '<script src="../config/client-config.js"></script><script src="../js/supabase.js"></script>');
write(nestedRoot, 'site/js/supabase.js', '// fixture');
write(nestedRoot, 'site/templates/sample-template/template.manifest.js', `window.SampleManifest = {
  schemaVersion:'1.1.0', template:{id:'sample-template',name:'Sample',version:'1.0.0'},
  compatibility:{minimumContractVersion:'1.1.0',maximumContractVersion:'1.x',requiredCoreVersion:'2.0.0'},
  modules:{required:[],optional:[]}, assets:{required:[],optional:[],notes:[]},
  sections:{hero:{enabled:true,required:true,source:'hero',mount:'#hero',renderer:'renderHero',requiredFields:['title']}}, forms:{}
};`);
write(nestedRoot, 'site/templates/sample-template/template.adapter.js', 'window.SampleAdapter={renderHero(){return true;}};');
write(nestedRoot, 'database/install.sql', '-- install');
write(nestedRoot, 'database/verify.sql', '-- verify');
const nestedPassing = verifyDelivery(nestedRoot);
assert.equal(nestedPassing.ok, true, nestedPassing.errors.join('\n'));
fs.rmSync(nestedRoot, { recursive: true, force: true });

fs.rmSync(root, { recursive: true, force: true });
console.log('Client delivery verification passed.');
