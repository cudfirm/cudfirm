const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(relativePath, context) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
}

(async () => {
  const createdClients = [];
  const browserContext = {
    window: {
      CUDFIRM_CONFIG: {
        deploymentType: 'client',
        dataMode: 'supabase',
        supabaseUrl: 'https://client-project.supabase.co',
        supabaseAnonKey: 'sb_publishable_client_key',
      },
      supabase: {
        createClient(url, key) {
          const client = { url, key };
          createdClients.push(client);
          return client;
        },
      },
    },
    console,
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  };
  vm.createContext(browserContext);
  load('js/supabase.js', browserContext);

  assert.equal(createdClients.length, 1);
  assert.equal(createdClients[0].url, 'https://client-project.supabase.co');
  assert.equal(createdClients[0].key, 'sb_publishable_client_key');
  assert.equal(browserContext.window.CUDFIRMSupabase.source, 'configured');
  assert.equal(browserContext.window.CUDFIRMSupabase.configured, true);

  const defaultClients = [];
  const defaultContext = {
    window: {
      supabase: {
        createClient(url, key) {
          defaultClients.push({ url, key });
          return { url, key };
        },
      },
    },
    console,
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  };
  vm.createContext(defaultContext);
  load('js/supabase.js', defaultContext);
  assert.equal(defaultClients[0].url, 'https://wefncrkzugezvduzejzf.supabase.co');
  assert.equal(defaultContext.window.CUDFIRMSupabase.source, 'cudfirm-default');

  const incompleteContext = {
    window: {
      CUDFIRM_CONFIG: { dataMode: 'supabase', templateId: 'client-template' },
      supabase: { createClient: () => { throw new Error('Must not fall back to CUDFIRM'); } },
    },
    console: { ...console, error: () => {} },
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  };
  vm.createContext(incompleteContext);
  load('js/supabase.js', incompleteContext);
  assert.equal(incompleteContext.window.CUDFIRMSupabase.valid, false);
  assert.equal(incompleteContext.window.CUDFIRMSupabase.source, 'configured');
  assert.equal(incompleteContext.window.supabaseClient, null);

  const rejectedContext = {
    window: {
      CUDFIRM_CONFIG: {
        dataMode: 'supabase',
        supabaseUrl: 'https://client-project.supabase.co',
        supabaseAnonKey: 'sb_secret_forbidden',
      },
      supabase: { createClient: () => { throw new Error('Must not create client'); } },
    },
    console: { ...console, error: () => {} },
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  };
  vm.createContext(rejectedContext);
  load('js/supabase.js', rejectedContext);
  assert.equal(rejectedContext.window.CUDFIRMSupabase.valid, false);
  assert.equal(rejectedContext.window.supabaseClient, null);

  const writes = [];
  const fakeClient = {
    from(table) {
      return {
        insert(payload) {
          writes.push({ table, payload: JSON.parse(JSON.stringify(payload)) });
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
  const apiContext = {
    window: { supabaseClient: fakeClient },
    supabaseClient: fakeClient,
    console,
  };
  vm.createContext(apiContext);
  load('js/cms-api.js', apiContext);

  const api = apiContext.window.CMSApi;
  assert.equal(api.API_VERSION, '1.1.0');
  assert.equal(Object.prototype.hasOwnProperty.call(api, 'insert'), false);

  const contactResult = await api.submitContactMessage({
    name: '  Test Client  ',
    contactInfo: ' client@example.test ',
    message: ' Delivery test ',
    ignored: 'must not be written',
  });
  assert.equal(contactResult.ok, true);
  assert.deepEqual(writes[0], {
    table: 'messages',
    payload: {
      name: 'Test Client',
      contact_info: 'client@example.test',
      message: 'Delivery test',
    },
  });

  const newsletterResult = await api.subscribeNewsletter(' Client@Example.Test ');
  assert.equal(newsletterResult.ok, true);
  assert.deepEqual(writes[1], {
    table: 'subscribers',
    payload: { email: 'client@example.test' },
  });

  const formsSource = fs.readFileSync(path.resolve(__dirname, '../js/public-forms.js'), 'utf8');
  assert.equal(formsSource.includes('db.from('), false, 'Public form service must not query tables directly.');
  assert.equal(formsSource.includes('managedBy !== "shared-core"'), true);

  console.log('Shared client core verification passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
