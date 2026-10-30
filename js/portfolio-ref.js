/**
 * CUDFIRM portfolio presentation layer (reference-screenshot design).
 *
 * It does NOT replace the portfolio renderer in js/script.js. It reads the cards
 * that script.js already rendered (from the CMS or its fallback data), hides that
 * original row, and presents the same projects as filterable, reference-styled cards.
 * Activating a card calls .click() on the ORIGINAL card, so the existing link /
 * tab-navigation behaviour is preserved exactly.
 */
(function () {
  "use strict";

  var ALL = "All Work";

  function text(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function mk(tag, cls, txt) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt != null) el.textContent = txt;
    return el;
  }
  function isPlaceholder(src) { return !src || /(^|\/\/)placehold\.co\b/i.test(src); }


  var GENERIC_TAGS = { live: 1, demo: 1, getstarted: 1, featured: 1, new: 1 };
  function catKey(v) { return String(v || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").replace(/s$/, ""); }
  function tagList(raw) {
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") return raw.split(",");
    return [];
  }
  function cleanTag(t) { return String(t).replace(/^#/, "").replace(/\s+/g, " ").trim(); }

  /* Turn whatever was typed in the dashboard "Link" box into something usable.
     https://x.com  -> external   |  x.com or www.x.com -> https:// added
     page.html or folder/page.html -> site path   |  '#' or empty -> none   |  anything else -> a tab id */
  function resolveLink(raw) {
    var v = String(raw == null ? "" : raw).trim();
    if (!v || v === "#") return { url: "", tab: "" };
    if (/^https?:\/\//i.test(v)) return { url: v, tab: "" };
    if (/^(mailto:|tel:)/i.test(v)) return { url: v, tab: "" };
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v) && !/\.(html?|php)$/i.test(v)) return { url: "https://" + v, tab: "" };
    if (/\//.test(v) || /\.(html?|php)$/i.test(v)) return { url: v, tab: "" };
    return { url: "", tab: v };
  }
  function cmsRecord(name) {
    var list = window.CMS && Array.isArray(window.CMS.portfolio) ? window.CMS.portfolio : [];
    var n = String(name || "").trim().toLowerCase();
    for (var i = 0; i < list.length; i++) { if (String(list[i].name || "").trim().toLowerCase() === n) return list[i]; }
    return null;
  }

  function readProjects(row) {
    return Array.prototype.map.call(row.children, function (col) {
      var card = col.querySelector(".card");
      if (!card) return null;
      var content = card.querySelector(".card-content");
      var lines = content ? content.children : [];
      var name = text(lines[0]);
      var meta = text(lines[1]).split(" · ");
      var industry = (meta[0] || "").trim();
      var img = card.querySelector("img");
      var badge = card.querySelector(".tag");
      if (!name) return null;
      var oc = card.getAttribute("onclick") || "";
      var m = oc.match(/window\.open\('([^']+)'/);
      var tabm = oc.match(/openTab\(event,'([^']+)'\)/);
      var rec = cmsRecord(name);                       // the saved dashboard data is the source of truth
      var link = rec ? resolveLink(rec.link) : { url: m ? m[1] : "", tab: tabm ? tabm[1] : "" };
      var tags = rec ? tagList(rec.tags) : [];
      var cats = [industry || "Other"];
      tags.forEach(function (t) { var c = cleanTag(t); if (c && !GENERIC_TAGS[catKey(c)]) cats.push(c); });
      return {
        link: link.url, tab: link.tab, tags: tags.map(cleanTag).filter(function (t) { return t; }), cats: cats,
        type: (meta.slice(1).join(" \u00B7 ") || "").trim(),
        problem: text(lines[2]).replace(/^Problem:\s*/i, ""), solution: text(lines[3]).replace(/^Solution:\s*/i, ""),
        el: card, name: name, industry: industry || "Other",
        src: img ? img.getAttribute("src") : "",
        live: /live/i.test(text(badge)), hasBadge: !!badge,
      };
    }).filter(Boolean);
  }

  function skeleton() {
    var s = mk("div", "pf-skeleton");
    s.setAttribute("aria-hidden", "true");
    s.appendChild(mk("i"));
    s.appendChild(mk("i"));
    var blocks = mk("div", "pf-blocks");
    blocks.appendChild(mk("b")); blocks.appendChild(mk("b")); blocks.appendChild(mk("b"));
    s.appendChild(blocks);
    return s;
  }


  var modalOpen = null;
  function openModal(p, opener) {
    if (modalOpen) return;
    var overlay = mk("div", "pf-overlay");
    var dlg = mk("div", "pf-modal");
    dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true"); dlg.setAttribute("aria-labelledby", "pfModalTitle");
    var close = mk("button", "pf-close", "\u00D7");
    close.type = "button"; close.setAttribute("aria-label", "Close preview");
    var bar = mk("div", "pf-bar"); bar.setAttribute("aria-hidden", "true");
    bar.appendChild(mk("span", "pf-dot")); bar.appendChild(mk("span", "pf-dot")); bar.appendChild(mk("span", "pf-dot"));
    var prev = mk("div", "pf-modal-preview");
    if (isPlaceholder(p.src)) prev.appendChild(skeleton());
    else { var im = document.createElement("img"); im.alt = "Screenshot of " + p.name; im.src = p.src; im.addEventListener("error", function () { prev.textContent = ""; prev.appendChild(skeleton()); }); prev.appendChild(im); }
    var body = mk("div", "pf-modal-body");
    var t = mk("h3", "pf-modal-title", p.name); t.id = "pfModalTitle";
    body.appendChild(t);
    body.appendChild(mk("div", "pf-cat", p.industry + (p.type ? " \u00B7 " + p.type : "")));
    if (p.problem) { var a = mk("p", "pf-modal-text"); a.appendChild(mk("strong", null, "Problem: ")); a.appendChild(document.createTextNode(p.problem)); body.appendChild(a); }
    if (p.solution) { var b = mk("p", "pf-modal-text"); b.appendChild(mk("strong", null, "Solution: ")); b.appendChild(document.createTextNode(p.solution)); body.appendChild(b); }
    var actions = mk("div", "pf-modal-actions");
    if (typeof window.openServiceRequest === "function") {
      var req = mk("button", "pf-btn pf-btn-wide", "Request a site like this"); req.type = "button";
      req.addEventListener("click", function () {
        shut();
        window.openServiceRequest("", "I\u2019d like a website similar to \u201C" + p.name + "\u201D (" + p.industry + ").");
      });
      actions.appendChild(req);
    }
    if (p.tab) {
      var go = mk("button", "pf-btn is-ghost", "Open page"); go.type = "button";
      go.addEventListener("click", function () {
        shut();
        if (typeof window.openTab === "function") window.openTab(null, p.tab); else p.el.click();
      });
      actions.appendChild(go);
    } else if (p.link) {
      var visit = mk("a", "pf-btn is-ghost", "Visit site \u2197"); visit.href = p.link; visit.target = "_blank"; visit.rel = "noopener noreferrer"; actions.appendChild(visit);
    } else {
      body.appendChild(mk("p", "pf-modal-text pf-muted", "This project has no public link yet."));
    }
    if (p.tags && p.tags.length) {
      var tg = mk("div", "pf-tags");
      p.tags.forEach(function (t) { tg.appendChild(mk("span", "pf-tag", "#" + t)); });
      body.appendChild(tg);
    }
    var closeBtn = mk("button", "pf-btn is-ghost", "Close"); closeBtn.type = "button"; actions.appendChild(closeBtn);
    body.appendChild(actions);
    dlg.appendChild(close); dlg.appendChild(bar); dlg.appendChild(prev); dlg.appendChild(body);
    overlay.appendChild(dlg);

    var prevOverflow = document.body.style.overflow;
    function shut() {
      document.removeEventListener("keydown", onKey, true);
      overlay.remove(); document.body.style.overflow = prevOverflow; modalOpen = null;
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); shut(); return; }
      if (e.key !== "Tab") return;
      var f = dlg.querySelectorAll("a[href],button"); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    close.addEventListener("click", shut); closeBtn.addEventListener("click", shut);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) shut(); });
    document.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
    close.focus();
    modalOpen = { close: shut };
  }

  function buildCard(p, index) {
    var art = mk("article", "pf-card");
    art.setAttribute("role", "button");
    art.setAttribute("tabindex", "0");
    art.setAttribute("aria-label", "Preview " + p.name + ", " + p.industry);
    art.dataset.category = p.industry;
    art.dataset.keys = p.cats.map(catKey).join("|");

    var bar = mk("div", "pf-bar");
    bar.setAttribute("aria-hidden", "true");
    bar.appendChild(mk("span", "pf-dot")); bar.appendChild(mk("span", "pf-dot")); bar.appendChild(mk("span", "pf-dot"));

    var prev = mk("div", "pf-preview");
    function showSkeleton() { prev.textContent = ""; prev.appendChild(skeleton()); prev.appendChild(badge()); }
    function badge() {
      if (!p.hasBadge) return document.createDocumentFragment();
      return mk("span", "pf-badge" + (p.live ? "" : " is-demo"), p.live ? "● Live" : "● Demo");
    }
    if (isPlaceholder(p.src)) {
      showSkeleton();
    } else {
      var img = document.createElement("img");
      img.alt = "Screenshot of " + p.name;
      img.loading = index < 4 ? "eager" : "lazy";
      img.decoding = "async";
      img.addEventListener("error", showSkeleton);
      img.src = p.src;
      prev.appendChild(img);
      prev.appendChild(badge());
    }

    var meta = mk("div", "pf-meta");
    meta.appendChild(mk("h3", "pf-title", p.name));
    var foot = mk("div", "pf-foot");
    foot.appendChild(mk("span", "pf-cat", p.industry));
    foot.appendChild(mk("span", "pf-go", "Preview \u2197"));
    meta.appendChild(foot);

    art.appendChild(bar); art.appendChild(prev); art.appendChild(meta);

    function activate() { openModal(p, art); }
    art.addEventListener("click", activate);
    art.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
    return art;
  }

  function panel(title, hint) {
    var wrap = mk("section", "pf-panel");
    var head = mk("div", "pf-panel-head");
    head.appendChild(mk("h2", "pf-heading", title));
    if (hint) head.appendChild(mk("span", "pf-hint", hint));
    var body = mk("div", "pf-panel-body");
    wrap.appendChild(head); wrap.appendChild(mk("div", "pf-band")); wrap.appendChild(body);
    return { wrap: wrap, body: body };
  }

  function enhance(tab) {
    var row = tab.querySelector(":scope > .row");
    if (!row || tab.querySelector(".pf-root")) return false;
    var projects = readProjects(row);
    if (!projects.length) return false;

    // Pills: every Industry (near-duplicates like "Barbershop"/"Barbershops" merge) plus any tag used by 2+ projects.
    var categories = [], seen = {}, tagCount = {}, tagName = {};
    projects.forEach(function (p) {
      var k = catKey(p.industry);
      if (!seen[k]) { seen[k] = 1; categories.push({ name: p.industry, key: k }); }
    });
    projects.forEach(function (p) {
      var uniq = {};
      p.cats.slice(1).forEach(function (t) { var k = catKey(t); if (k && !uniq[k]) { uniq[k] = 1; tagCount[k] = (tagCount[k] || 0) + 1; tagName[k] = tagName[k] || t; } });
    });
    Object.keys(tagCount).forEach(function (k) {
      if (tagCount[k] >= 2 && !seen[k]) { seen[k] = 1; categories.push({ name: tagName[k], key: k }); }
    });

    var root = mk("div", "pf-root");
    var filterPanel = panel("What We Build");
    var galleryPanel = panel("Project Gallery", "Tap any card to preview");
    var filters = mk("div", "pf-filters");
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", "Filter projects by category");
    var grid = mk("div", "pf-grid");
    grid.setAttribute("aria-label", "Project gallery");
    var empty = mk("p", "pf-empty", "No projects in this category yet.");
    empty.hidden = true;
    var live = mk("p", "pf-sr");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");

    var cards = projects.map(function (p, i) { var c = buildCard(p, i); grid.appendChild(c); return c; });

    function select(cat) {
      var shown = 0;
      var want = cat === ALL ? "" : catKey(cat);
      cards.forEach(function (c) {
        var match = cat === ALL || ("|" + c.dataset.keys + "|").indexOf("|" + want + "|") !== -1;
        c.hidden = !match;
        if (match) shown++;
      });
      Array.prototype.forEach.call(filters.children, function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.category === cat));
      });
      empty.hidden = shown !== 0;
      live.textContent = shown + (shown === 1 ? " project" : " projects") + " shown" + (cat === ALL ? "" : " in " + cat);
    }

    [ALL].concat(categories.map(function (c) { return c.name; })).forEach(function (cat) {
      var b = mk("button", "pf-pill", cat);
      b.type = "button";
      b.dataset.category = cat;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { select(cat); });
      filters.appendChild(b);
    });

    filterPanel.body.appendChild(filters);
    galleryPanel.body.appendChild(grid);
    galleryPanel.body.appendChild(empty);
    galleryPanel.body.appendChild(live);
    root.appendChild(filterPanel.wrap);
    root.appendChild(galleryPanel.wrap);

    row.hidden = true;                 // original renderer output stays in the DOM
    row.setAttribute("aria-hidden", "true");
    row.parentNode.insertBefore(root, row);
    select(ALL);
    return true;
  }

  function run() {
    var tab = document.getElementById("tab4");
    if (tab) enhance(tab);
  }

  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 60); }

  function start() {
    run();
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener("cudfirm:template-ready", schedule);
  }

  window.CUDFIRMPortfolioGallery = { enhance: enhance, refresh: run };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
