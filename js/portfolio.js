/**
 * js/portfolio.js — public Portfolio directory (portfolio.html).
 *
 * Data source: the existing `portfolio_projects` table, read through the shared
 * CMSApi.getPortfolioProjects() (published rows only, in the dashboard's sort order).
 * Projects are managed in Dashboard > Portfolio; nothing is entered twice.
 *
 * Presentation: this page now renders the SAME cards, filter pills and preview dialog as the
 * homepage Portfolio tab. Those builders live in js/portfolio-ref.js (window.CUDFIRMPortfolioUI) and
 * the styles in css/ecosystem.css, so the two can never drift apart. This file only supplies the data,
 * search, pagination and URL state that belong to the full-page directory.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var UI = window.CUDFIRMPortfolioUI;
  var state = { q: "", cat: "", page: 1 };
  var PAGE_SIZE = 12;               // divisible by 2, 3 and 4 so every row of the grid is complete on phone, tablet and desktop
  var projects = [];
  var useFeatured = false;

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      if (k === "text") el.textContent = attrs[k];
      else if (k === "class") el.className = attrs[k];
      else el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function norm(s) { return String(s || "").toLowerCase(); }
  function catKey(v) { return UI ? UI.catKey(v) : norm(v).replace(/[^a-z0-9]+/g, ""); }

  /* ---- data cleanup (same rules as before) ---- */
  function imageOf(v) {
    v = String(v || "").trim();
    if (!v || /(^|\/\/)placehold\.co\b/i.test(v)) return "";
    if (/^https?:\/\//i.test(v) || /^[\w./-]+$/.test(v)) return v;
    return "";
  }
  /* Same link rules as the homepage: '#' or empty = none; external URL; bare domain gets https;
     a site path is allowed; anything else (an internal homepage tab id) is not a public link. */
  function linkOf(p) {
    var v = String(p.link == null ? "" : p.link).trim();
    if (!v || v === "#") return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v) && !/\.(html?|php)$/i.test(v)) return "https://" + v;
    if ((/\//.test(v) || /\.(html?|php)$/i.test(v)) && /^[\w./#?=&-]+$/.test(v) && !/^\/\//.test(v)) return v;
    return "";
  }
  function tagsOf(p) {
    var raw = Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",") : []);
    return raw.map(function (t) { return String(t).replace(/^#/, "").replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }

  /* Convert a database row into the shape the shared card / dialog builders expect. */
  function toProject(row) {
    var tags = tagsOf(row), industry = String(row.industry || "").trim() || "Other";
    var cats = [industry];
    tags.forEach(function (t) { if (!(UI && UI.GENERIC_TAGS[catKey(t)])) cats.push(t); });
    return {
      name: row.name, industry: industry, type: String(row.project_type || "").trim(),
      problem: row.problem || "", solution: row.solution || "",
      src: imageOf(row.image_url), mobileSrc: imageOf(row.mobile_image_url),
      link: linkOf(row), tab: "", tags: tags, cats: cats,
      live: !!row.is_live, hasBadge: true, featured: !!row.featured_home, el: null
    };
  }

  /* ---- theme (same storage key as the homepage) ---- */
  function wireTheme() {
    var root = document.documentElement, icon = $("pfThemeIcon");
    var sync = function () { icon.className = root.getAttribute("data-theme") === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill"; };
    sync();
    $("pfTheme").addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("cudfirm_theme", next); } catch (e) { /* storage blocked */ }
      sync();
    });
  }

  /* ---- categories: every industry (near-duplicates merge) plus any tag used by 2+ projects — same as the homepage tab ---- */
  var categories = [];
  function buildCategories() {
    var seen = {}, tagCount = {}, tagName = {};
    categories = [];
    projects.forEach(function (p) { var k = catKey(p.industry); if (!seen[k]) { seen[k] = 1; categories.push({ name: p.industry, key: k }); } });
    projects.forEach(function (p) {
      var uniq = {};
      p.cats.slice(1).forEach(function (t) { var k = catKey(t); if (k && !uniq[k]) { uniq[k] = 1; tagCount[k] = (tagCount[k] || 0) + 1; tagName[k] = tagName[k] || t; } });
    });
    Object.keys(tagCount).forEach(function (k) { if (tagCount[k] >= 2 && !seen[k]) { seen[k] = 1; categories.push({ name: tagName[k], key: k }); } });
  }
  function inCategory(p, cat) {
    if (!cat) return true;
    var want = catKey(cat);
    return p.cats.some(function (c) { return catKey(c) === want; });
  }
  function matches(p) {
    if (!inCategory(p, state.cat)) return false;
    var q = norm(state.q).trim();
    if (!q) return true;
    return norm([p.name, p.industry, p.type, p.problem, p.solution, p.tags.join(" ")].join(" ")).indexOf(q) !== -1;
  }

  /* ---- list / pagination ---- */
  function pageList(current, total) {
    var nums = [], i;
    for (i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - current) <= 1) nums.push(i);
    var out = [];
    nums.forEach(function (n, idx) { if (idx && n - nums[idx - 1] > 1) out.push("…"); out.push(n); });
    return out;
  }
  function renderPager(total) {
    var nav = $("pfPager"); clearEl(nav);
    if (total <= 1) { nav.hidden = true; return; }
    nav.hidden = false;
    var go = function (n) { state.page = n; syncUrl(); render(); $("pfStatus").scrollIntoView({ block: "start" }); };
    var prev = h("button", { type: "button", "aria-label": "Previous page", text: "‹" });
    prev.disabled = state.page <= 1; prev.addEventListener("click", function () { go(state.page - 1); });
    nav.appendChild(prev);
    pageList(state.page, total).forEach(function (n) {
      if (n === "…") { nav.appendChild(h("span", { "aria-hidden": "true", text: "…" })); return; }
      var b = h("button", { type: "button", text: String(n), "aria-label": "Page " + n });
      if (n === state.page) b.setAttribute("aria-current", "page");
      b.addEventListener("click", function () { go(n); });
      nav.appendChild(b);
    });
    var next = h("button", { type: "button", "aria-label": "Next page", text: "›" });
    next.disabled = state.page >= total; next.addEventListener("click", function () { go(state.page + 1); });
    nav.appendChild(next);
  }
  function renderPills() {
    var box = $("pfCats"); clearEl(box);
    if (categories.length < 2) return;
    [{ name: "", label: UI.ALL }].concat(categories.map(function (c) { return { name: c.name, label: c.name }; })).forEach(function (c) {
      var b = h("button", { type: "button", class: "pf-pill", "aria-pressed": catKey(state.cat) === catKey(c.name) ? "true" : "false", text: c.label });
      b.addEventListener("click", function () { state.cat = c.name; state.page = 1; syncUrl(); render(); });
      box.appendChild(b);
    });
  }
  function message(title, text, reset) {
    var box = $("pfMsg"); clearEl(box);
    if (!title) return;
    var el = h("div", { class: "pf-empty" }, [h("h3", { text: title }), h("p", { text: text })]);
    if (reset) {
      var b = h("button", { class: "pf-btn is-ghost pf-clear", type: "button", text: "Clear filters" });
      b.addEventListener("click", function () { state.q = ""; state.cat = ""; state.page = 1; $("pfSearch").value = ""; syncUrl(); render(); });
      el.appendChild(b);
    }
    box.appendChild(el);
  }
  function render() {
    var grid = $("pfGrid"); clearEl(grid);
    renderPills();
    var list = projects.filter(matches);
    if (useFeatured) list = list.slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var first = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(first, first + PAGE_SIZE);
    slice.forEach(function (p, i) { grid.appendChild(UI.buildCard(p, i)); });
    $("pfStatus").textContent = list.length
      ? "Showing " + (first + 1) + "–" + (first + slice.length) + " of " + list.length + (list.length === 1 ? " project" : " projects")
      : "";
    if (!projects.length) message("Projects coming soon", "We are preparing our portfolio. Please check back shortly.", false);
    else if (!list.length) message("No matching projects", "Try a different search or clear the filters.", true);
    else message("", "", false);
    renderPager(pages);
  }

  /* ---- URL state ---- */
  function readUrl() {
    var u = new URLSearchParams(location.search);
    state.q = (u.get("q") || "").slice(0, 80);
    state.cat = u.get("cat") || "";
    state.page = Math.max(1, parseInt(u.get("page"), 10) || 1);
  }
  function syncUrl() {
    var u = new URLSearchParams();
    if (state.q) u.set("q", state.q);
    if (state.cat) u.set("cat", state.cat);
    if (state.page > 1) u.set("page", state.page);
    var qs = u.toString();
    try { history.replaceState(null, "", "portfolio.html" + (qs ? "?" + qs : "")); } catch (e) { /* non-critical */ }
  }

  /* ---- boot ---- */
  function boot() {
    readUrl();
    wireTheme();
    var yr = $("pfYear"); if (yr) yr.textContent = new Date().getFullYear();
    $("pfSearch").value = state.q;
    $("pfSearch").addEventListener("input", function (e) { state.q = e.target.value.trim(); state.page = 1; syncUrl(); render(); });

    var grid = $("pfGrid");
    var fail = function () {
      clearEl(grid); $("pfStatus").textContent = "";
      message("We couldn't load the portfolio", "Please refresh the page or try again in a moment.", false);
    };
    if (!UI) { fail(); return; }
    for (var i = 0; i < 8; i++) grid.appendChild(h("div", { class: "pf-card pf-skel-card", "aria-hidden": "true" }, [h("div", { class: "pf-bar" }, [h("span", { class: "pf-dot" }), h("span", { class: "pf-dot" }), h("span", { class: "pf-dot" })]), h("div", { class: "pf-preview" }), h("div", { class: "pf-meta" }, [h("i"), h("i")])]));
    $("pfStatus").textContent = "Loading projects…";
    if (typeof CMSApi === "undefined") { fail(); return; }
    CMSApi.getPortfolioProjects().then(function (rows) {
      if (!Array.isArray(rows)) { fail(); return; }
      var clean = rows.filter(function (p) { return p && p.name; });
      var anyFeatured = clean.some(function (p) { return p.featured_home; });
      var anyNot = clean.some(function (p) { return !p.featured_home; });
      useFeatured = anyFeatured && anyNot;
      projects = clean.map(toProject);
      buildCategories();
      render();
    }, fail);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
