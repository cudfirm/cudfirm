'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const fresh = path.join(root, 'supabase', 'fresh-install');

function read(name) {
  return fs.readFileSync(path.join(fresh, name), 'utf8');
}

const installer = read('01_cudfirm_core_fresh_install.sql');
const starter = read('02_client_starter_content.example.sql');
const verification = read('03_verify_fresh_install.sql');
const promotion = read('04_promote_first_admin_if_needed.sql');
const readme = read('README.md');

const includedMigrations = [
  '001_schema.sql',
  '003_admin_write_policies.sql',
  '004_phase3_platform.sql',
  '005_content_status_workflow.sql',
  '006_message_management.sql',
  '007_subscriber_management.sql',
  '008_backup_restore_permissions.sql',
  '009_user_roles_permissions.sql',
  '010_maintenance_mode.sql',
  '011_theme_customization.sql',
  '012_security_audit.sql',
  '013_theme_wide_default_fix.sql',
  '014_rls_api_security_hardening.sql',
  '015_about_contact_content.sql',
  '016_module_permissions_foundation.sql',
];

includedMigrations.forEach((name) => {
  const marker = `SOURCE MIGRATION: ${name}`;
  assert.equal(installer.split(marker).length - 1, 1, `${name} must appear exactly once.`);
  const migrationSource = fs.readFileSync(path.join(root, 'supabase', name), 'utf8').trim();
  assert.ok(installer.includes(migrationSource), `${name} content must remain unchanged in the installer.`);
});

assert.equal(installer.includes('SOURCE MIGRATION: 002_seed.sql'), false);
assert.equal(installer.includes('SOURCE MIGRATION: 017_public_messaging_refresh.sql'), false);
assert.ok(installer.includes('FRESH-INSTALL NEUTRALISATION'));
assert.ok(installer.includes("company_name = 'Client Website'"));
assert.ok(installer.includes('create table if not exists public.module_permissions'));
assert.ok(installer.includes('create table if not exists public.module_role_permissions'));
assert.ok(installer.includes('alter table public.module_permissions force row level security'));
assert.ok(installer.includes('alter table public.module_role_permissions force row level security'));

assert.ok(starter.includes('CHANGE_ME_CLIENT_NAME'));
assert.ok(starter.includes("raise exception 'Edit every CHANGE_ME starter-content placeholder"));
assert.ok(starter.includes("where value like 'CHANGE\\_ME%'"));
assert.ok(starter.includes('begin;'));
assert.ok(starter.includes('commit;'));

assert.ok(verification.includes("('module_permissions')"));
assert.ok(verification.includes("('module_role_permissions')"));
assert.ok(verification.includes('Private tables with anonymous SELECT grants'));
assert.ok(verification.includes("'record_auth_security_event'"));
assert.ok(verification.includes("'has_module_permission'"));
assert.equal(/\b(insert|update|delete|truncate|alter|create|drop|grant|revoke)\b/i.test(
  verification
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
), false, 'Verification SQL must remain read-only.');

assert.ok(promotion.includes('CHANGE_ME_ADMIN_EMAIL'));
assert.ok(promotion.includes("position('CHANGE_ME' in v_admin_email) > 0"));
assert.ok(promotion.includes('An active Super Admin already exists'));
assert.ok(promotion.includes('No Auth user exists with email'));

[
  '01_cudfirm_core_fresh_install.sql',
  '02_client_starter_content.example.sql',
  '03_verify_fresh_install.sql',
  '04_promote_first_admin_if_needed.sql',
].forEach((name) => assert.ok(readme.includes(name), `${name} must be documented.`));

console.log('Canonical fresh installer verification passed.');
