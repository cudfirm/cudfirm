/**
 * js/portfolio.js — public Portfolio directory (portfolio.html).
 *
 * Data source: the existing `portfolio_projects` table, read through the shared
 * CMSApi.getPortfolioProjects() (published rows only, in the dashboard's sort order).
 * Projects are managed in Dashboard > Portfolio; nothing is entered twice.
 *
 * Cards use the same look as the homepage Portfolio tab. Features: industry filter,
 * search, pagination (10 per page on phones, 12 elsewhere), accessible detail dialog,
 * dark mode toggle (same storage key as the homepage), and a Visit link that only
 * appears when the project has a valid public URL.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var mq = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
  var state = { q: "", cat: "", page: 1 };
  var projects = [];
  var useFeatured = false;
  var lastOpener = null;

  function pageSize() { return mq && mq.matches ? 10 : 12; }
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

  /* ---- data cleanup ---- */
  function imageOf(p) {
    var v = String(p.image_url || "").trim();
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
    return raw.map(function (t) { return String(t).replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }
  function tagClass(t) { return /^#?(live|getstarted)$/i.test(t.replace(/\s/g, "")) ? "green" : "orange"; }
  function initialOf(p) { return (p.name || "C").trim().charAt(0).toUpperCase(); }

  /* ---- cards (same markup language as the homepage Portfolio tab) ---- */
  function media(p, eager, cls) {
    var wrap = h("div", { class: cls || "pf-media" });
    var src = imageOf(p);
    var ph = function () { return h("div", { class: "pf-ph", "aria-hidden": "true", text: initialOf(p) }); };
    if (src) {
      var img = h("img", { src: src, alt: "Screenshot of " + p.name + " website built by CUDFIRM", width: 400, height: 180, decoding: "async", loading: eager ? "eager" : "lazy" });
      img.addEventListener("error", function () { img.remove(); wrap.insertBefore(ph(), wrap.firstChild); });
      wrap.appendChild(img);
    } else wrap.appendChild(ph());
    return wrap;
  }
  function statusTag(p) {
    return h("span", { class: "pf-badge tag " + (p.is_live ? "green" : "orange"), style: "font-size:.62rem;padding:.2rem .5rem;background:" + (p.is_live ? "#E3F0EA" : "#F7EBD0"), text: p.is_live ? "● Live" : "● Demo" });
  }
  function card(p, idx) {
    var btn = h("button", { type: "button", class: "pf-title-btn", "aria-haspopup": "dialog", text: p.name });
    btn.addEventListener("click", function () { openDialog(p, btn); });
    var content = h("div", { class: "card-content" });
    content.appendChild(h("div", { class: "pf-name" }, [btn]));
    var meta = [p.industry, p.project_type].filter(Boolean).join(" · ");
    if (meta) content.appendChild(h("div", { class: "pf-meta", text: meta }));
    if (p.problem) content.appendChild(h("div", { class: "pf-line" }, [h("strong", { text: "Problem: " }), document.createTextNode(p.problem)]));
    if (p.solution) content.appendChild(h("div", { class: "pf-line" }, [h("strong", { text: "Solution: " }), document.createTextNode(p.solution)]));
    var tags = tagsOf(p);
    if (tags.length) content.appendChild(h("div", null, tags.slice(0, 4).map(function (t) { return h("span", { class: "tag " + tagClass(t), text: t }); })));
    var url = linkOf(p);
    if (url) {
      var ext = /^https?:/i.test(url);
      var a = h("a", { class: "pf-visit", href: url, text: "Visit project" + (ext ? " ↗" : ""), "aria-label": "Visit " + p.name });
      if (ext) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }
      content.appendChild(h("div", { class: "pf-actions" }, [a]));
    }
    var m = media(p, idx < 2);
    m.appendChild(statusTag(p));
    if (useFeatured && p.featured_home) m.appendChild(h("span", { class: "tag orange", style: "position:absolute;top:8px;left:8px;z-index:2;font-size:.62rem;padding:.2rem .5rem;background:#E8B84B;color:#1b1303", text: "★ Featured" }));
    var c = h("div", { class: "card h-100 pf-card" }, [m, content]);
    return h("div", { class: "col-12 col-md-6 col-lg-4" }, [c]);
  }

  /* ---- dialog ---- */
  function openDialog(p, opener) {
    var dlg = $("pfDialog");
    lastOpener = opener || null;
    var body = $("pfDlgBody"); clearEl(body);
    var m = media(p, true, "pf-dlg-media");
    m.appendChild(statusTag(p));
    body.appendChild(m);
    var text = h("div", { class: "pf-dlg-text" });
    var meta = [p.industry, p.project_type].filter(Boolean).join(" · ");
    if (meta) text.appendChild(h("div", { class: "pf-meta", text: meta }));
    text.appendChild(h("h2", { id: "pfDlgTitle", text: p.name }));
    if (p.problem) { text.appendChild(h("h3", { text: "The problem" })); text.appendChild(h("p", { text: p.problem })); }
    if (p.solution) { text.appendChild(h("h3", { text: "What we built" })); text.appendChild(h("p", { text: p.solution })); }
    var tags = tagsOf(p);
    if (tags.length) text.appendChild(h("div", null, tags.map(function (t) { return h("span", { class: "tag " + tagClass(t), text: t }); })));
    var actions = h("div", { class: "pf-dlg-actions" });
    var url = linkOf(p);
    if (url) {
      var ext = /^https?:/i.test(url);
      var a = h("a", { class: "pf-btn", href: url, text: "Visit project" + (ext ? " ↗" : "") });
      if (ext) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }
      actions.appendChild(a);
    } else {
      actions.appendChild(h("span", { class: "pf-nolink", text: p.is_live ? "This project has no public link yet." : "This is a demo project with no public link." }));
    }
    actions.appendChild(h("a", { class: "pf-btn ghost", href: "index.html#connect-content", text: "Start a similar project" }));
    text.appendChild(actions);
    body.appendChild(text);
    if (typeof dlg.showModal === "function") { dlg.showModal(); document.body.classList.add("pf-lock"); }
    else dlg.setAttribute("open", "");
    $("pfClose").focus();
  }
  function closeDialog() {
    var dlg = $("pfDialog");
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
  }
  function wireDialog() {
    var dlg = $("pfDialog");
    $("pfClose").addEventListener("click", closeDialog);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDialog(); });
    dlg.addEventListener("close", function () {
      document.body.classList.remove("pf-lock");
      if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
    });
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

  /* ---- list / filter / pagination ---- */
  function matches(p) {
    if (state.cat && p.industry !== state.cat) return false;
    var q = norm(state.q).trim();
    if (!q) return true;
    return norm([p.name, p.industry, p.project_type, p.problem, p.solution, tagsOf(p).join(" ")].join(" ")).indexOf(q) !== -1;
  }
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
  function renderChips() {
    var box = $("pfCats"); clearEl(box);
    var seen = {};
    projects.forEach(function (p) { if (p.industry) seen[p.industry] = 1; });
    var names = Object.keys(seen).sort();
    if (names.length < 2) return;
    [""].concat(names).forEach(function (n) {
      var b = h("button", { type: "button", class: "pf-chip", "aria-pressed": state.cat === n ? "true" : "false", text: n || "All work" });
      b.addEventListener("click", function () { state.cat = n; state.page = 1; syncUrl(); render(); });
      box.appendChild(b);
    });
  }
  function message(title, text, reset) {
    var box = $("pfMsg"); clearEl(box);
    if (!title) return;
    var el = h("div", { class: "pf-empty" }, [h("h2", { text: title }), h("p", { text: text })]);
    if (reset) {
      var b = h("button", { class: "pf-btn ghost", type: "button", text: "Clear filters" });
      b.addEventListener("click", function () { state.q = ""; state.cat = ""; state.page = 1; $("pfSearch").value = ""; syncUrl(); render(); });
      el.appendChild(b);
    }
    box.appendChild(el);
  }
  function render() {
    var grid = $("pfGrid"); clearEl(grid);
    renderChips();
    var list = projects.filter(matches);
    if (useFeatured) list = list.slice().sort(function (a, b) { return (b.featured_home ? 1 : 0) - (a.featured_home ? 1 : 0); });
    var size = pageSize();
    var pages = Math.max(1, Math.ceil(list.length / size));
    if (state.page > pages) state.page = pages;
    var first = (state.page - 1) * size;
    var slice = list.slice(first, first + size);
    slice.forEach(function (p, i) { grid.appendChild(card(p, i)); });
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
    wireDialog();
    wireTheme();
    var yr = $("pfYear"); if (yr) yr.textContent = new Date().getFullYear();
    $("pfSearch").value = state.q;
    $("pfSearch").addEventListener("input", function (e) { state.q = e.target.value.trim(); state.page = 1; syncUrl(); render(); });
    if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (projects.length) render(); });

    var grid = $("pfGrid");
    for (var i = 0; i < 6; i++) grid.appendChild(h("div", { class: "col-12 col-md-6 col-lg-4", "aria-hidden": "true" }, [h("div", { class: "pf-skel" })]));
    $("pfStatus").textContent = "Loading projects…";
    var fail = function () {
      clearEl(grid); $("pfStatus").textContent = "";
      message("We couldn't load the portfolio", "Please refresh the page or try again in a moment.", false);
    };
    if (typeof CMSApi === "undefined") { fail(); return; }
    CMSApi.getPortfolioProjects().then(function (rows) {
      if (!Array.isArray(rows)) { fail(); return; }
      projects = rows.filter(function (p) { return p && p.name; });
      var anyFeatured = projects.some(function (p) { return p.featured_home; });
      var anyNot = projects.some(function (p) { return !p.featured_home; });
      useFeatured = anyFeatured && anyNot;
      render();
    }, fail);
  }
  boot();
})();
