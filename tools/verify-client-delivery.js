#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESCRIPTOR_NAME = 'client-delivery.json';
const DEFAULT_FORBIDDEN_PROJECT_REFS = ['wefncrkzugezvduzejzf'];
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '.netlify', '.vercel', 'dist', 'build']);

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_error) {
    return false;
  }
}

function normalizeRelative(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function resolveInside(root, relativePath) {
  const normalized = normalizeRelative(relativePath);
  const resolved = path.resolve(root, normalized);
  const relative = path.relative(root, resolved);
  if (!normalized || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function walkFiles(root, current = root, output = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) walkFiles(root, fullPath, output);
    else if (entry.isFile()) output.push(fullPath);
  }
  return output;
}

function parseJson(filePath, errors) {
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    errors.push(`${path.basename(filePath)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function decodeJwtRole(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return '';
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return String(JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))?.role || '');
  } catch (_error) {
    return '';
  }
}

function isForbiddenBrowserKey(value) {
  const key = String(value || '');
  return /service[_-]?role/i.test(key) || /^sb_secret_/i.test(key) || decodeJwtRole(key) === 'service_role';
}

function loadBrowserScript(filePath, seed = {}) {
  const context = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    ...seed,
  };
  context.window = context.window || {};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(readText(filePath), context, { filename: filePath, timeout: 2000 });
  return context;
}

function externalReference(value) {
  return /^(?:[a-z]+:|\/\/|#|data:|javascript:)/i.test(value);
}

function stripReference(value) {
  return String(value || '').split('#')[0].split('?')[0].trim();
}

function extractLocalReferences(html) {
  const refs = [];
  const pattern = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const value = stripReference(match[2]);
    if (value && !externalReference(value)) refs.push(value);
  }
  return refs;
}

function checkHtmlReferences(root, htmlRelativePath, errors, checks) {
  const htmlPath = resolveInside(root, htmlRelativePath);
  if (!htmlPath || !isFile(htmlPath)) return;
  const html = readText(htmlPath);
  const htmlDirectory = path.dirname(htmlPath);
  for (const reference of extractLocalReferences(html)) {
    const resolved = path.resolve(htmlDirectory, reference);
    if (!isFile(resolved)) errors.push(`${htmlRelativePath} references missing local file: ${reference}`);
    else checks.push(`${htmlRelativePath} local reference exists: ${reference}`);
  }
}

function selectorAppearsInHtml(selector, html) {
  if (!selector || selector === 'head' || selector === 'body' || selector === 'html') return true;
  if (/^#[A-Za-z][\w:-]*$/.test(selector)) {
    const id = selector.slice(1);
    return new RegExp(`\\bid=["'][^"']*\\b${id}\\b[^"']*["']`, 'i').test(html);
  }
  if (/^\.[A-Za-z][\w-]*$/.test(selector)) {
    const className = selector.slice(1);
    return new RegExp(`\\bclass=["'][^"']*\\b${className}\\b[^"']*["']`, 'i').test(html);
  }
  if (/^[A-Za-z][\w-]*$/.test(selector)) return new RegExp(`<${selector}\\b`, 'i').test(html);
  return null;
}

function verifyDelivery(deliveryRoot, options = {}) {
  const root = path.resolve(deliveryRoot || '.');
  const errors = [];
  const warnings = [];
  const checks = [];
  const descriptorPath = path.join(root, options.descriptor || DESCRIPTOR_NAME);

  if (!isFile(descriptorPath)) {
    return {
      ok: false,
      root,
      errors: [`Missing ${options.descriptor || DESCRIPTOR_NAME} at the delivery root.`],
      warnings,
      checks,
    };
  }

  const descriptor = parseJson(descriptorPath, errors);
  if (!descriptor) return { ok: false, root, errors, warnings, checks };

  if (descriptor.schemaVersion !== '1.0.0') errors.push('client-delivery.json schemaVersion must be 1.0.0.');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(descriptor.client?.id || '')) errors.push('client.id must use lowercase letters, numbers, and hyphens.');
  if (!descriptor.client?.name) errors.push('client.name is required.');
  if (descriptor.deploymentType !== 'client') errors.push('deploymentType must be "client".');
  if (descriptor.core?.version !== '2.0.0') errors.push('core.version must be 2.0.0.');
  if (descriptor.core?.contractVersion !== '1.1.0') errors.push('core.contractVersion must be 1.1.0.');
  if (descriptor.core?.runtimeVersion !== '1.1.0') errors.push('core.runtimeVersion must be 1.1.0.');

  const requiredPaths = {
    entry: descriptor.paths?.entry,
    dashboard: descriptor.paths?.dashboard,
    clientConfig: descriptor.paths?.clientConfig,
    templateManifest: descriptor.paths?.templateManifest,
    templateAdapter: descriptor.paths?.templateAdapter,
    freshInstaller: descriptor.paths?.freshInstaller,
    verificationSql: descriptor.paths?.verificationSql,
  };

  const resolvedPaths = {};
  for (const [label, relativePath] of Object.entries(requiredPaths)) {
    const resolved = resolveInside(root, relativePath);
    resolvedPaths[label] = resolved;
    if (!resolved || !isFile(resolved)) errors.push(`Missing required ${label} file: ${relativePath || '(not declared)'}`);
    else checks.push(`Required ${label} file exists: ${normalizeRelative(relativePath)}`);
  }

  const extraRequiredPaths = Array.isArray(descriptor.paths?.required) ? descriptor.paths.required : [];
  for (const relativePath of extraRequiredPaths) {
    const resolved = resolveInside(root, relativePath);
    if (!resolved || !isFile(resolved)) errors.push(`Missing paths.required file: ${relativePath}`);
    else checks.push(`Required delivery file exists: ${normalizeRelative(relativePath)}`);
  }

  const projectRef = String(descriptor.supabase?.projectRef || '').trim();
  if (!/^[a-z0-9]{20}$/.test(projectRef)) errors.push('supabase.projectRef must be the 20-character client Supabase project reference.');
  if (descriptor.supabase?.isolated !== true) errors.push('supabase.isolated must be true.');

  const forbiddenRefs = new Set([
    ...DEFAULT_FORBIDDEN_PROJECT_REFS,
    ...(Array.isArray(descriptor.supabase?.forbiddenProjectRefs) ? descriptor.supabase.forbiddenProjectRefs : []),
  ].map(String).filter(Boolean));
  if (forbiddenRefs.has(projectRef)) errors.push('The client projectRef matches a forbidden shared/core Supabase project.');

  let clientConfig = null;
  if (resolvedPaths.clientConfig && isFile(resolvedPaths.clientConfig)) {
    try {
      const context = loadBrowserScript(resolvedPaths.clientConfig);
      clientConfig = context.window.CUDFIRM_CONFIG;
      if (!clientConfig || typeof clientConfig !== 'object') errors.push('Client configuration did not create window.CUDFIRM_CONFIG.');
      else {
        if (clientConfig.deploymentType !== 'client') errors.push('Client configuration deploymentType must be "client".');
        if (clientConfig.dataMode !== 'supabase') errors.push('Client configuration dataMode must be "supabase".');
        if (clientConfig.templateId !== descriptor.template?.id) errors.push('Client configuration templateId does not match template.id.');
        if (clientConfig.coreVersion !== descriptor.core?.version) errors.push('Client configuration coreVersion does not match client-delivery.json.');
        if (clientConfig.contractVersion !== descriptor.core?.contractVersion) errors.push('Client configuration contractVersion does not match client-delivery.json.');
        if (clientConfig.supabaseUrl !== `https://${projectRef}.supabase.co`) errors.push('Client configuration Supabase URL does not match supabase.projectRef.');
        if (!clientConfig.supabaseAnonKey) errors.push('Client configuration is missing a browser-safe Publishable/anon key.');
        if (isForbiddenBrowserKey(clientConfig.supabaseAnonKey)) errors.push('Client configuration contains a forbidden server-side Supabase key.');
      }
    } catch (error) {
      errors.push(`Client configuration could not be evaluated: ${error.message}`);
    }
  }

  let manifest = null;
  if (resolvedPaths.templateManifest && isFile(resolvedPaths.templateManifest)) {
    try {
      const context = loadBrowserScript(resolvedPaths.templateManifest);
      const globalName = descriptor.template?.manifestGlobal;
      manifest = globalName ? context.window[globalName] : null;
      if (!manifest) errors.push(`Template manifest global ${globalName || '(not declared)'} was not created.`);
      else {
        if (manifest.schemaVersion !== '1.1.0') errors.push('Template manifest schemaVersion must be 1.1.0.');
        if (manifest.template?.id !== descriptor.template?.id) errors.push('Template manifest ID does not match template.id.');
        if (manifest.compatibility?.minimumContractVersion !== '1.1.0') errors.push('Template manifest minimumContractVersion must be 1.1.0.');
        if (!manifest.modules || !Array.isArray(manifest.modules.required) || !Array.isArray(manifest.modules.optional)) errors.push('Template manifest must declare modules.required and modules.optional arrays.');
        if (!manifest.assets || !Array.isArray(manifest.assets.required) || !Array.isArray(manifest.assets.optional)) errors.push('Template manifest must declare assets.required and assets.optional arrays.');
        if (!manifest.sections || typeof manifest.sections !== 'object') errors.push('Template manifest sections are missing.');
        for (const [formName, form] of Object.entries(manifest.forms || {})) {
          if (!form?.managedBy) errors.push(`${formName} form must declare managedBy.`);
        }

        const entryHtml = resolvedPaths.entry && isFile(resolvedPaths.entry) ? readText(resolvedPaths.entry) : '';
        const siteRoot = resolveInside(root, descriptor.paths?.siteRoot || '.') || root;
        for (const asset of [...(manifest.assets?.required || []), ...(manifest.assets?.optional || [])]) {
          const source = stripReference(asset?.source);
          if (!source || externalReference(source)) continue;
          const assetPath = resolveInside(siteRoot, source);
          if (!assetPath || !isFile(assetPath)) {
            const target = asset?.managedBy === 'template' || (manifest.assets?.required || []).includes(asset) ? errors : warnings;
            target.push(`Manifest asset is missing: ${source}`);
          } else {
            checks.push(`Manifest asset exists: ${source}`);
          }
          if ((manifest.assets?.required || []).includes(asset) && entryHtml && !entryHtml.includes(asset.source)) {
            warnings.push(`Required asset is not visibly referenced by the entry HTML: ${asset.source}`);
          }
        }

        for (const [sectionName, section] of Object.entries(manifest.sections || {})) {
          if (!section?.enabled || (section.managedBy || 'adapter') !== 'adapter') continue;
          const selectorResult = selectorAppearsInHtml(section.mount, entryHtml);
          if (selectorResult === false) errors.push(`${sectionName} mount is not present in the entry HTML: ${section.mount}`);
          if (selectorResult === null) warnings.push(`${sectionName} uses a complex mount selector that requires browser verification: ${section.mount}`);
        }
      }
    } catch (error) {
      errors.push(`Template manifest could not be evaluated: ${error.message}`);
    }
  }

  if (resolvedPaths.templateAdapter && isFile(resolvedPaths.templateAdapter)) {
    const adapterSource = readText(resolvedPaths.templateAdapter);
    const forbiddenAdapterPatterns = [
      [/\bcreateClient\s*\(/, 'creates a Supabase client'],
      [/\b(?:supabaseClient|window\.supabase)\b/, 'references Supabase directly'],
      [/\.from\s*\(/, 'queries a database table directly'],
      [/service[_-]?role|sb_secret_/i, 'contains a server-side credential marker'],
    ];
    for (const [pattern, description] of forbiddenAdapterPatterns) {
      if (pattern.test(adapterSource)) errors.push(`Template adapter ${description}.`);
    }
    for (const [sectionName, section] of Object.entries(manifest?.sections || {})) {
      if (!section?.enabled || (section.managedBy || 'adapter') !== 'adapter' || !section.renderer) continue;
      const rendererPattern = new RegExp(`\\b${section.renderer.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`);
      if (!rendererPattern.test(adapterSource)) errors.push(`${sectionName} renderer is not present in the adapter source: ${section.renderer}`);
    }
  }

  for (const htmlPath of [requiredPaths.entry, requiredPaths.dashboard].filter(Boolean)) {
    checkHtmlReferences(root, htmlPath, errors, checks);
    const resolved = resolveInside(root, htmlPath);
    if (!resolved || !isFile(resolved)) continue;
    const html = readText(resolved);
    const htmlDirectory = path.dirname(resolved);
    const configReference = normalizeRelative(path.relative(htmlDirectory, resolvedPaths.clientConfig));
    const sharedSupabaseRelativePath = descriptor.paths?.sharedSupabase || 'js/supabase.js';
    const sharedSupabasePath = resolveInside(root, sharedSupabaseRelativePath);
    const supabaseReference = sharedSupabasePath
      ? normalizeRelative(path.relative(htmlDirectory, sharedSupabasePath))
      : normalizeRelative(sharedSupabaseRelativePath);
    const configIndex = html.indexOf(configReference);
    const supabaseIndex = html.indexOf(supabaseReference);
    if (configIndex < 0) errors.push(`${htmlPath} does not load ${configReference}.`);
    if (supabaseIndex < 0) errors.push(`${htmlPath} does not load ${supabaseReference}.`);
    if (configIndex >= 0 && supabaseIndex >= 0 && configIndex > supabaseIndex) errors.push(`${htmlPath} loads client configuration after js/supabase.js.`);
  }

  const scanExtensions = new Set(['.html', '.js', '.json', '.md', '.txt']);
  for (const filePath of walkFiles(root)) {
    if (!scanExtensions.has(path.extname(filePath).toLowerCase())) continue;
    const relative = normalizeRelative(path.relative(root, filePath));
    const source = readText(filePath);
    if (/sb_secret_|service[_-]?role/i.test(source)) errors.push(`Forbidden server-side credential marker found in ${relative}.`);
    if (path.resolve(filePath) === path.resolve(descriptorPath)) continue;
    for (const ref of forbiddenRefs) {
      if (ref && source.includes(ref) && ref !== projectRef) errors.push(`Forbidden Supabase project reference ${ref} found in ${relative}.`);
    }
  }

  return {
    ok: errors.length === 0,
    root,
    clientId: descriptor.client?.id || '',
    templateId: descriptor.template?.id || '',
    projectRef,
    errors,
    warnings,
    checks,
  };
}

function printReport(report) {
  const label = report.ok ? 'PASSED' : 'FAILED';
  console.log(`CUDFIRM client delivery verification ${label}.`);
  if (report.clientId) console.log(`Client: ${report.clientId}`);
  if (report.templateId) console.log(`Template: ${report.templateId}`);
  console.log(`Checks: ${report.checks.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Errors: ${report.errors.length}`);
  report.warnings.forEach((message) => console.warn(`WARNING: ${message}`));
  report.errors.forEach((message) => console.error(`ERROR: ${message}`));
}

if (require.main === module) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const report = verifyDelivery(root);
  printReport(report);
  if (!report.ok) process.exitCode = 1;
}

module.exports = { verifyDelivery, printReport };
