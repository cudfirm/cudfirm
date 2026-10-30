/* Dependency-free structural checks for CUDFIRM v2 public pages, blog migration and removals. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const errors = [];
const check = (c, m) => { if (!c) errors.push(m); };

// Local references in the new pages must exist.
["blog.html", "portfolio.html"].forEach((page) => {
  const html = read(page);
  const refs = [...html.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css|webp|png|html))(?:[#?][^"]*)?"/g)].map((m) => m[1]).filter((r) => !/^https?:/.test(r));
  refs.forEach((r) => check(fs.existsSync(path.join(root, r)), `${page}: missing local file ${r}`));
  check(!/umbrella/i.test(html), `${page}: contains the word "umbrella"`);
  check(!/cdn\.tailwindcss|jquery|gsap|unpkg\.com|raw\.githubusercontent|phosphor/i.test(html), `${page}: contains a removed third-party dependency`);
});
["js/blog.js", "js/portfolio.js", "css/blog.css", "css/blog-tw.css", "css/portfolio.css", "js/v2-nav.js", "tools/blog-tailwind/tailwind.config.js"].forEach((f) => check(fs.existsSync(path.join(root, f)) && read(f).length > 200, `${f} missing or empty`));
check(!/umbrella/i.test(read("js/blog.js") + read("js/portfolio.js")), "public scripts contain the word umbrella");

// Migration 019 safety.
const sql = read("supabase/019_blog_resources.sql");
check(/enable row level security/i.test(sql) && /force row level security/i.test(sql), "019: RLS not enabled/forced");
check(/for select to anon using \(status = 'published'\)/i.test(sql), "019: anon read not limited to published");
check(!/drop table (?!if exists public\.blog_posts)/i.test(sql.replace(/--.*$/gm, "")), "019: unexpected drop statement");
check(!/\b(alter|drop)\s+table\s+(?!public\.blog_posts)/i.test(sql.replace(/--.*$/gm, "")), "019: touches a table other than blog_posts");
check(!/grant .* to anon/i.test(sql.replace(/grant select on public\.blog_posts to anon;/i, "")), "019: grants more than SELECT to anon");

// Dashboard wiring.
check(/blog\.html/.test(read("dashboard/js/layout.js")) && /blog\.html/.test(read("dashboard/js/permissions.js")), "dashboard nav/permissions missing blog");
check(fs.existsSync(path.join(root, "dashboard/blog.html")) && fs.existsSync(path.join(root, "dashboard/js/pages/blog-page.js")), "dashboard blog page missing");

// Edge function + dark theme files.
check(fs.existsSync(path.join(root, "netlify/edge-functions/blog-meta.js")) && /export const config/.test(read("netlify/edge-functions/blog-meta.js")), "blog-meta edge function missing or has no config");
check(fs.existsSync(path.join(root, "dashboard/css/dashboard-dark.css")), "dashboard dark stylesheet missing");

// Removals must not leave dangling references.
["cudtemp.html", "templates/cudtemp", "js/feed.js", "css/feed.css"].forEach((f) => check(!fs.existsSync(path.join(root, f)), `${f} should have been removed`));
const idx = read("index.html");
check(!/feed\.(js|css)/.test(idx), "index.html still references feed assets");
check(/js\/v2-nav\.js/.test(idx), "index.html does not load v2-nav.js");

if (errors.length) { console.error("CUDFIRM v2 verification FAILED:\n- " + errors.join("\n- ")); process.exit(1); }
console.log("CUDFIRM v2 public pages verification passed.");
