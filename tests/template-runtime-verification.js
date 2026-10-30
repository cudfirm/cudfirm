'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(projectRoot, 'js/template-runtime.js'), 'utf8');

const mount = {
  hidden: false,
  dataset: {},
  replaceChildren() {},
};
const listeners = new Map();
const events = [];
const hookCalls = [];
let rendererPayload = null;

const manifest = {
  schemaVersion: '1.1.0',
  template: {
    id: 'runtime-test',
    name: 'Runtime Test',
    version: '1.0.0',
  },
  modules: { required: [], optional: [] },
  sections: {
    nested: {
      enabled: true,
      required: true,
      source: 'extensions.example.items',
      mount: '#nested',
      renderer: 'renderNested',
    },
    navigation: {
      enabled: true,
      required: true,
      managedBy: 'shared-core',
      source: 'navigation',
    },
  },
  fallbacks: {
    rendererFailure: 'keep-legacy',
    emptyList: 'keep-legacy',
  },
};

const adapter = {
  async initialize() {
    hookCalls.push('initialize');
  },
  async beforeRender(context) {
    hookCalls.push(`before:${context.sectionName}`);
  },
  async renderNested(payload) {
    rendererPayload = payload;
    await Promise.resolve();
    return true;
  },
  async afterRender(context) {
    hookCalls.push(`after:${context.sectionName}`);
  },
  async complete() {
    hookCalls.push('complete');
  },
};

const context = {
  console: {
    info() {},
    error() {},
  },
  setTimeout,
  clearTimeout,
  Date,
  Promise,
  MutationObserver: class {
    observe() {}
    disconnect() {}
  },
  CustomEvent: class {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  },
  document: {
    readyState: 'loading',
    documentElement: {},
    querySelector(selector) {
      return selector === '#nested' ? mount : null;
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    createElement() {
      return {
        className: '',
        dataset: {},
        setAttribute() {},
        textContent: '',
      };
    },
  },
  CUDFIRM_CONFIG: {
    templateId: 'runtime-test',
    coreVersion: '2.0.0',
    templateRuntime: { mountTimeoutMs: 0 },
  },
  CMSReady: Promise.resolve(),
  CUDFIRMModulesReady: Promise.resolve(),
  CMSContract: {
    meta: { contractVersion: '1.1.0' },
    site: { name: 'Example' },
    theme: {},
    navigation: [{ label: 'Home', target: 'home' }],
    extensions: {},
  },
  CUDFIRMTemplateRegistry: {
    get(id) {
      return id === 'runtime-test'
        ? { manifest, adapter, metadata: { source: 'test' } }
        : null;
    },
  },
  CUDFIRMTemplateValidator: {
    validate() {
      return {
        compatible: true,
        status: 'compatible',
        warnings: [],
        errors: [],
        capabilities: {
          modules: {
            compatibility: { compatible: true },
          },
        },
      };
    },
  },
  CUDFIRMModuleRuntime: {
    getExtensions() {
      return { example: { items: [{ id: 'item-1' }] } };
    },
    checkTemplateRequirements() {
      return {
        compatible: true,
        status: 'compatible',
        required: [],
        optional: [],
        installed: [],
        errors: [],
        warnings: [],
      };
    },
    list() {
      return [];
    },
  },
  dispatchEvent(event) {
    events.push(event);
  },
};
context.window = context;
vm.createContext(context);
vm.runInContext(runtimeSource, context, { filename: 'js/template-runtime.js' });

(async () => {
  assert.equal(context.CUDFIRM_TEMPLATE_RUNTIME_VERSION, '1.1.0');
  assert.equal(typeof context.CUDFIRM_RUNTIME.initialize, 'function');
  assert.equal(typeof context.CUDFIRM_RUNTIME.getReport, 'function');
  assert.equal(typeof context.CUDFIRM_RUNTIME.getSectionReport, 'function');

  const domReady = listeners.get('DOMContentLoaded');
  assert.equal(typeof domReady, 'function');
  domReady();

  const report = await context.CUDFIRMTemplateReady;
  assert.equal(report.status, 'ready');
  assert.equal(report.template.id, 'runtime-test');
  assert.equal(report.runtimeVersion, '1.1.0');
  assert.deepEqual(Array.from(report.renderedSections), ['nested']);
  assert.deepEqual(Array.from(report.externallyManagedSections), ['navigation']);
  assert.equal(report.sections.nested.status, 'rendered');
  assert.equal(report.sections.navigation.status, 'externally-managed');

  assert.ok(rendererPayload);
  assert.equal(rendererPayload.data[0].id, 'item-1');
  assert.equal(rendererPayload.runtime.runtimeVersion, '1.1.0');
  assert.deepEqual(hookCalls, [
    'initialize',
    'before:nested',
    'after:nested',
    'complete',
  ]);

  assert.equal(context.CUDFIRM_RUNTIME.getData().extensions.example.items[0].id, 'item-1');
  assert.equal(context.CUDFIRM_RUNTIME.getSectionReport('nested').status, 'rendered');
  assert.equal(events.at(-1).type, 'cudfirm:template-ready');

  const secondReport = await context.CUDFIRM_RUNTIME.initialize();
  assert.equal(secondReport, report, 'Repeated initialize() should be idempotent without force.');

  console.log('Template runtime verification passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
