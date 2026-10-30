// Static verification for the ecosystem layer (migration 018, Edge Functions, browser files).
// Behavioural browser tests were run separately (see docs/ECOSYSTEM_REPORT.md).
const fs = require("fs"), path = require("path"), cp = require("child_process");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const fail = [];
const check = (name, cond) => { if (!cond) fail.push(name); };

["js/portfolio-ref.js", "js/enquiry-flow.js", "js/ecosystem.js", "js/client-portal.js",
 "dashboard/js/ecosystem-dom.js", "dashboard/js/pages/requests-page.js", "dashboard/js/pages/projects-page.js"].forEach((f) => {
  const r = cp.spawnSync(process.execPath, ["--check", path.join(root, f)]);
  check("syntax: " + f, r.status === 0);
});

const sql = read("supabase/018_service_requests_client_portal.sql");
["service_requests", "service_request_notes", "client_projects", "project_milestones", "project_messages", "project_files", "request_claims", "enquiry_rate_limits"]
  .forEach((t) => check("RLS enabled: " + t, new RegExp("alter table public\\." + t + " enable row level security").test(sql) || /alter table public\.client_projects enable[\s\S]*project_files enable/.test(sql) && ["client_projects","project_milestones","project_messages","project_files"].includes(t)));
check("no anon grants on new tables", !/grant [^;]* to anon/i.test(sql.replace(/revoke[^;]*;/gi, "")));
check("storage bucket private", /'project-files', 'project-files', false/.test(sql));
check("claims never match by email", !/email\s*=/.test(sql.split("create_request_claim")[1] || ""));
check("migration is additive (no drop table/alter existing)", !/drop table|alter table public\.(messages|member_profiles|user_profiles)/i.test(sql));

const browserFiles = ["js/portfolio-ref.js", "js/enquiry-flow.js", "js/ecosystem.js", "js/client-portal.js", "account/index.html", "dashboard/js/pages/requests-page.js", "dashboard/js/pages/projects-page.js"];
browserFiles.forEach((f) => { const t = read(f); check("no service-role/secret in " + f, !/service_role|sb_secret|SUPABASE_SERVICE/i.test(t)); check("no innerHTML in " + f, !/\.innerHTML\s*=/.test(t)); });

const fn = read("supabase/functions/service-request/index.ts");
check("recipient fixed by server env", /ADMIN_NOTIFY_EMAIL/.test(fn) && /to: adminTo/.test(fn));
check("honeypot + rate limit + idempotency", /body\.website/.test(fn) && /enquiry_rate_limit_consume/.test(fn) && /client_token/.test(fn));
const nt = read("supabase/functions/enquiry-notify/index.ts");
check("webhook requires shared secret", /ENQUIRY_WEBHOOK_SECRET/.test(nt) && /equalSecret/.test(nt));

const idx = read("index.html");
check("index.html loads ecosystem assets", /css\/ecosystem\.css/.test(idx) && /js\/portfolio-ref\.js/.test(idx) && /js\/enquiry-flow\.js/.test(idx));
check("web1 absent from code", !/web1/i.test([idx, read("js/script.js"), read("js/supabase.js")].join()));

if (fail.length) { console.error("Ecosystem verification FAILED:\n- " + fail.join("\n- ")); process.exit(1); }
console.log("Ecosystem verification passed.");
