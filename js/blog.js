/**
 * js/blog.js — CUDBLOG: public Blog & Resources hub (blog.html).
 *
 * Reads published rows from `blog_posts` (supabase/019_blog_resources.sql) through the
 * shared Supabase client. Row level security guarantees only status = 'published' rows
 * are ever returned. Layout classes are Tailwind utilities compiled into css/blog-tw.css
 * (see tools/blog-tailwind) — add new class names there, then rebuild.
 *
 *   blog.html            -> hero, searchable/filterable feed, sidebar, category slider, topics
 *   blog.html?post=slug  -> single article / resource page with related items
 * Database text is inserted with textContent; article bodies pass an allow-list sanitiser.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 8;
  var SITE = "https://cudfirm.netlify.app";
  var TYPE_LABELS = {
    article: "Article", news: "Tech news", guide: "Guide", tutorial: "Tutorial", tool: "Tool / platform",
    case_study: "Case study", announcement: "Announcement", external: "External resource", sponsored: "Sponsored"
  };
  var LIST_COLUMNS = "id,slug,title,summary,image_url,image_alt,category,content_type,author_name,tags,external_url,source_name,disclosure,featured,sort_order,published_at,updated_at";

  var $ = function (id) { return document.getElementById(id); };
  var db = window.supabaseClient || null;
  var state = { q: "", cat: "", type: "", sort: "newest", page: 1 };
  var posts = [];
  var bodyMatchIds = null;
  var searchTimer = null;
  var wired = false;

  /* ---------- helpers ---------- */
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
  function safeUrl(u, allowRelative) {
    var v = String(u == null ? "" : u).trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (allowRelative && /^[\w./-]+$/.test(v) && !/^\/\//.test(v)) return v;
    return "";
  }
  function tagsOf(p) { return Array.isArray(p.tags) ? p.tags.map(String) : []; }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function norm(s) { return String(s || "").toLowerCase(); }
  function clearEl(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function setMeta(sel, attr, val) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, val); }
  function byDate(x, y) { return new Date(y.published_at || 0) - new Date(x.published_at || 0); }
  function readingMinutes(html) {
    var words = String(html || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }
  function postHref(p) { return "blog.html?post=" + encodeURIComponent(p.slug); }
  function scrollToFeed() { var f = $("feedTitle"); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); }

  /* Allow-list sanitiser for article bodies (defence in depth: the dashboard also sanitises on save). */
  var ALLOWED = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, UL: 1, OL: 1, LI: 1, A: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1, IMG: 1, HR: 1, DIV: 1, SPAN: 1 };
  function sanitize(html) {
    var doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = String(html || "");
    doc.body.querySelectorAll("script,style,iframe,object,embed,form,link,meta,svg,math").forEach(function (n) { n.remove(); });
    Array.prototype.slice.call(doc.body.querySelectorAll("*")).forEach(function (el) {
      if (!el.parentNode) return;
      if (!ALLOWED[el.tagName]) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); return; }
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        var name = a.name.toLowerCase();
        var keep = (el.tagName === "A" && name === "href") || (el.tagName === "IMG" && (name === "src" || name === "alt"));
        if (!keep) el.removeAttribute(a.name);
      });
      if (el.tagName === "A") {
        var href = el.getAttribute("href") || "";
        if (/^(https?:|mailto:)/i.test(href) || /^[\w./#?=&-]+$/.test(href)) {
          if (/^https?:/i.test(href)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
        } else el.removeAttribute("href");
      }
      if (el.tagName === "IMG") {
        if (!safeUrl(el.getAttribute("src"), true)) { el.remove(); return; }
        el.setAttribute("loading", "lazy");
        if (!el.hasAttribute("alt")) el.setAttribute("alt", "");
      }
    });
    return doc.body.innerHTML;
  }

  /* ---------- page chrome (loader, menus, search overlay, scroll-top) ---------- */
  function initChrome() {
    var dateEl = $("current-date");
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
    var y = $("v2Year"); if (y) y.textContent = new Date().getFullYear();

    // Loader: first visit of a session only, never with reduced motion.
    var overlay = $("loader-overlay");
    if (overlay) {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var seen = false;
      try { seen = sessionStorage.getItem("cudblog_loader") === "1"; } catch (e) { /* storage blocked */ }
      if (reduce || seen) overlay.classList.add("is-done");
      else {
        try { sessionStorage.setItem("cudblog_loader", "1"); } catch (e) { /* ignore */ }
        var count = $("loader-count"), n = 0;
        var tick = setInterval(function () {
          n = Math.min(100, n + 4);
          if (count) count.textContent = String(n);
          if (n >= 100) {
            clearInterval(tick);
            if (count) count.classList.add("hide");
            $("loader-brand").classList.add("show");
            setTimeout(function () { overlay.classList.add("is-open"); }, 650);
            setTimeout(function () { overlay.classList.add("is-done"); }, 1900);
          }
        }, 36);
      }
    }

    // Light / dark theme (same storage key as the homepage and portfolio)
    var root = document.documentElement, tIcon = $("theme-icon"), tBtn = $("theme-toggle");
    function syncTheme() {
      var dark = root.getAttribute("data-theme") === "dark";
      tIcon.className = (dark ? "bi bi-sun-fill" : "bi bi-moon-fill") + " text-xl";
      tBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    syncTheme();
    tBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("cudfirm_theme", next); } catch (e) { /* storage blocked */ }
      syncTheme();
    });

    // Mobile menu
    var menu = $("mobile-menu"), ham = $("hamburger");
    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      ham.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) $("close-mobile").focus(); else ham.focus();
    }
    ham.addEventListener("click", function () { setMenu(true); });
    $("close-mobile").addEventListener("click", function () { setMenu(false); });
    $("mobile-dropdown-btn").addEventListener("click", function () {
      var box = $("mobile-dropdown-content");
      var open = box.classList.toggle("hidden") === false;
      if (open) box.classList.add("flex");
      else box.classList.remove("flex");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Search overlay
    var so = $("search-overlay"), si = $("search-input");
    function openSearch() {
      so.classList.remove("hidden"); so.classList.add("flex");
      setTimeout(function () { so.classList.remove("opacity-0"); }, 10);
      document.body.style.overflow = "hidden";
      si.value = state.q || ""; si.focus();
    }
    function closeSearch(restore) {
      so.classList.add("opacity-0");
      setTimeout(function () { so.classList.remove("flex"); so.classList.add("hidden"); }, 300);
      document.body.style.overflow = "";
      if (restore) $("search-trigger").focus();
    }
    $("search-trigger").addEventListener("click", openSearch);
    $("close-search").addEventListener("click", function () { closeSearch(true); });
    $("search-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = si.value.trim().slice(0, 80);
      si.blur();
      if (!$("listView") || $("listView").hidden) { window.location.href = "blog.html" + (q ? "?q=" + encodeURIComponent(q) : ""); return; }
      state.q = q; state.page = 1;
      $("blSearch").value = q;
      closeSearch(false); onQueryChange(); scrollToFeed();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!so.classList.contains("hidden")) closeSearch(true);
      if (menu.classList.contains("is-open")) setMenu(false);
    });

    // Scroll to top + progress ring
    var btn = $("scroll-top-btn"), ring = $("scroll-progress"), CIRC = 138;
    window.addEventListener("scroll", function () {
      var top = window.pageYOffset || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? top / max : 0;
      var show = top > 300;
      btn.classList.toggle("visible", show);
      btn.classList.toggle("invisible", !show); btn.classList.toggle("opacity-0", !show); btn.classList.toggle("translate-y-4", !show);
      if (ring) ring.style.strokeDashoffset = String(CIRC - pct * CIRC);
    }, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- shared card pieces ---------- */
  function placeholderBox(p, big) {
    return h("div", { class: "w-full h-full flex items-center justify-center bg-brand-dark text-brand-accent font-serif " + (big ? "text-7xl" : "text-5xl"), "aria-hidden": "true", text: (p.category || "C").charAt(0).toUpperCase() });
  }
  function imageBox(p, boxClass, big) {
    var box = h("div", { class: boxClass + " img-zoom-container overflow-hidden relative bg-brand-dark" });
    var src = safeUrl(p.image_url, true);
    if (src) {
      var img = h("img", { src: src, alt: p.image_alt || "", loading: "lazy", decoding: "async", width: 800, height: 500, class: "w-full h-full object-cover img-zoom" });
      img.addEventListener("error", function () { img.remove(); box.appendChild(placeholderBox(p, big)); });
      box.appendChild(img);
    } else box.appendChild(placeholderBox(p, big));
    return box;
  }
  function kickerLine(p, withMin) {
    var el = h("div", { class: "flex flex-wrap items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500" });
    if (p.category) el.appendChild(h("span", { class: "text-brand-accent", text: p.category }));
    var label = TYPE_LABELS[p.content_type] || "Article";
    if (p.content_type === "sponsored") el.appendChild(h("span", { class: "bg-brand-accent text-brand-dark px-2 py-0.5", text: "Sponsored" }));
    else if (p.content_type === "external") el.appendChild(h("span", { class: "border border-brand-dark text-brand-dark px-2 py-0.5", text: "External" }));
    else if (p.content_type !== "article") el.appendChild(h("span", { class: "border border-brand-sec px-2 py-0.5", text: label }));
    if (p.published_at) el.appendChild(h("time", { datetime: p.published_at, text: fmtDate(p.published_at) }));
    if (p.content_type === "external" && p.source_name) el.appendChild(h("span", { text: "via " + p.source_name }));
    if (withMin && p.min) el.appendChild(h("span", { text: p.min + " min read" }));
    return el;
  }
  var STRETCH = "after:absolute after:inset-0 after:content-['']";
  function storyRow(p) {
    var title = h("h3", { class: "font-serif text-2xl font-bold mb-3 group-hover:text-brand-accent transition-colors" }, [h("a", { href: postHref(p), class: STRETCH, text: p.title })]);
    var body = h("div", { class: "flex flex-col justify-center" }, [kickerLine(p), title]);
    if (p.summary) body.appendChild(h("p", { class: "text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3", text: p.summary }));
    body.appendChild(h("span", { class: "text-xs font-bold uppercase tracking-widest border-b border-brand-dark pb-1 self-start group-hover:text-brand-accent group-hover:border-brand-accent transition-all", text: p.content_type === "external" ? "View resource" : "Read story" }));
    return h("article", { role: "listitem", class: "relative flex flex-col md:flex-row gap-5 md:gap-8 group border-b border-brand-sec pb-8" }, [imageBox(p, "w-full md:w-5/12 h-56 md:h-60 shrink-0"), body]);
  }
  /* Advertisement slot (in-feed). Replace the contents with real ad code when an advertiser is booked. */
  function adSlot() {
    return h("aside", { role: "listitem", "aria-label": "Advertisement", class: "ad-slot w-full h-32 bg-gray-100 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 p-3" }, [
      h("span", { class: "text-[10px] font-bold uppercase text-gray-500 tracking-widest mb-1", text: "Advertisement" }),
      h("a", { href: "index.html#connect-content", class: "text-xs font-bold uppercase tracking-widest text-brand-accent border-b border-brand-accent pb-0.5", text: "Advertise with CUDFIRM" })
    ]);
  }
  function relatedCard(p) {
    var title = h("h3", { class: "font-serif text-xl font-bold mb-2 group-hover:text-brand-accent transition-colors" }, [h("a", { href: postHref(p), class: STRETCH, text: p.title })]);
    var body = h("div", { class: "pt-4" }, [kickerLine(p), title]);
    if (p.summary) body.appendChild(h("p", { class: "text-gray-600 text-sm leading-relaxed line-clamp-3", text: p.summary }));
    return h("article", { role: "listitem", class: "relative group" }, [imageBox(p, "w-full h-48"), body]);
  }

  /* ---------- hero, ticker, sidebar, collections, topics, footer ---------- */
  function pickHero() {
    var feats = posts.filter(function (p) { return p.featured; }).sort(function (a, b) { return (a.sort_order - b.sort_order) || byDate(a, b); });
    return feats[0] || posts.slice().sort(byDate)[0] || null;
  }
  function renderHero() {
    var wrap = $("heroWrap"); clearEl(wrap);
    var p = pickHero();
    if (!p) {
      wrap.appendChild(h("div", { class: "bg-white border border-brand-sec p-8 md:p-14 text-center shadow-sm" }, [
        h("span", { class: "text-brand-accent text-xs font-bold uppercase tracking-widest block mb-4", text: "CUDBLOG" }),
        h("h1", { class: "font-serif text-4xl md:text-6xl text-brand-dark mb-4", text: "Fresh stories are on the way" }),
        h("p", { class: "text-gray-600 text-lg max-w-xl mx-auto", text: "Articles, guides and resources on websites, technology and digital business will appear here soon." })
      ]));
      return;
    }
    var left = imageBox(p, "h-[300px] sm:h-[400px] lg:h-[520px] w-full order-2 lg:order-1 cursor-pointer", true);
    var kick = h("div", { class: "flex items-center gap-3 text-brand-accent text-xs font-bold uppercase tracking-widest mb-4" });
    if (p.category) kick.appendChild(h("span", { text: p.category }));
    if (p.category && p.published_at) kick.appendChild(h("span", { "aria-hidden": "true", text: "•" }));
    if (p.published_at) kick.appendChild(h("time", { datetime: p.published_at, text: fmtDate(p.published_at) }));
    var right = h("div", { class: "flex flex-col justify-center order-1 lg:order-2 mb-6 lg:mb-0" }, [
      kick,
      h("h1", { class: "font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-5 text-brand-dark hover:text-gray-600 transition-colors" }, [h("a", { href: postHref(p), text: p.title })])
    ]);
    if (p.summary) right.appendChild(h("p", { class: "text-gray-600 text-base md:text-lg leading-relaxed mb-6", text: p.summary }));
    if (p.author_name) right.appendChild(h("p", { class: "text-sm font-bold text-brand-dark uppercase tracking-wide mb-5", text: p.author_name }));
    right.appendChild(h("a", { href: postHref(p), class: "self-start px-6 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-brand-dark transition-colors", text: p.content_type === "external" ? "View resource" : "Read story" }));
    left.addEventListener("click", function () { window.location.href = postHref(p); });
    wrap.appendChild(h("div", { class: "grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 items-center bg-white border border-brand-sec p-5 md:p-10 shadow-sm" }, [left, right]));
  }
  function renderTicker() {
    var track = $("ticker-track"); if (!track) return;
    clearEl(track);
    var items = posts.slice().sort(byDate).slice(0, 6);
    if (!items.length) { track.appendChild(h("span", { text: "Welcome to the CUDFIRM journal" })); track.classList.remove("animate-ticker"); return; }
    track.classList.add("animate-ticker");
    [0, 1].forEach(function (pass) {
      items.forEach(function (p) {
        var a = h("a", { href: postHref(p), class: "hover:text-brand-accent", text: p.title });
        if (pass) a.setAttribute("tabindex", "-1");
        track.appendChild(a);
        track.appendChild(h("span", { "aria-hidden": "true", text: "•" }));
      });
    });
  }
  function catCounts() {
    var c = {};
    posts.forEach(function (p) { if (p.category) c[p.category] = (c[p.category] || 0) + 1; });
    return c;
  }
  function toggleCat(name) {
    state.cat = state.cat === name ? "" : name; state.page = 1;
    syncUrl(); render(); scrollToFeed();
  }
  function renderSidebar() {
    var counts = catCounts(), names = Object.keys(counts).sort();
    var catWrap = $("sideCatsWrap"), ul = $("sideCats"); clearEl(ul);
    catWrap.hidden = names.length < 1;
    names.forEach(function (n) {
      var b = h("button", { type: "button", class: "flex justify-between w-full group text-left", "aria-pressed": state.cat === n ? "true" : "false" }, [
        h("span", { class: "group-hover:text-brand-accent" + (state.cat === n ? " text-brand-accent font-bold" : ""), text: n }),
        h("span", { class: "text-gray-400", text: String(counts[n]).padStart(2, "0") })
      ]);
      b.addEventListener("click", function () { toggleCat(n); });
      ul.appendChild(h("li", null, [b]));
    });
    var latest = posts.slice().sort(byDate).slice(0, 3);
    var lw = $("sideLatestWrap"), box = $("sideLatest"); clearEl(box);
    lw.hidden = !latest.length;
    latest.forEach(function (p, i) {
      box.appendChild(h("div", { class: "group" }, [
        h("span", { class: "text-[10px] text-brand-accent font-bold", text: "0" + (i + 1) }),
        h("h4", { class: "font-serif font-bold group-hover:text-brand-accent transition-colors" }, [h("a", { href: postHref(p), text: p.title })])
      ]));
    });
  }
  function renderCollections() {
    var wrap = $("collectionsWrap"), slider = $("category-slider"); clearEl(slider);
    var counts = catCounts(), names = Object.keys(counts).sort();
    wrap.hidden = names.length < 2;
    names.forEach(function (n) {
      var mine = posts.filter(function (p) { return p.category === n; }).sort(byDate);
      var withImg = mine.filter(function (p) { return safeUrl(p.image_url, true); })[0];
      var media = h("div", { class: "h-[320px] md:h-[400px] overflow-hidden relative bg-brand-dark" });
      if (withImg) {
        var img = h("img", { src: safeUrl(withImg.image_url, true), alt: "", loading: "lazy", decoding: "async", width: 700, height: 800, class: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" });
        img.addEventListener("error", function () { img.remove(); });
        media.appendChild(img);
      }
      media.appendChild(h("div", { class: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/50 transition-colors" }));
      media.appendChild(h("span", { class: "absolute bottom-6 left-6 right-6 text-white font-serif text-2xl", text: n }));
      media.appendChild(h("span", { class: "absolute top-4 left-4 bg-brand-accent text-brand-dark text-[10px] font-bold uppercase tracking-widest px-2 py-1", text: counts[n] + (counts[n] === 1 ? " story" : " stories") }));
      var b = h("button", { type: "button", class: "min-w-[260px] md:min-w-[340px] text-left group", "aria-label": "Show " + n + " (" + counts[n] + ")" }, [media]);
      b.addEventListener("click", function () { state.cat = n; state.page = 1; syncUrl(); render(); scrollToFeed(); });
      slider.appendChild(b);
    });
  }
  function renderTopics() {
    var wrap = $("topicsWrap"), grid = $("topicsGrid"); clearEl(grid);
    var freq = {};
    posts.forEach(function (p) { tagsOf(p).forEach(function (t) { var k = t.trim(); if (k) freq[k] = (freq[k] || 0) + 1; }); });
    var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || a.localeCompare(b); }).slice(0, 8);
    wrap.hidden = top.length < 2;
    top.forEach(function (t) {
      var b = h("button", { type: "button", class: "bg-white border border-brand-sec p-6 hover:border-brand-accent transition-colors group text-center" }, [
        h("i", { class: "bi bi-hash text-3xl text-brand-dark group-hover:text-brand-accent block mb-2", "aria-hidden": "true" }),
        h("span", { class: "font-serif text-lg block", text: t }),
        h("span", { class: "text-xs text-gray-500", text: freq[t] + (freq[t] === 1 ? " story" : " stories") })
      ]);
      b.addEventListener("click", function () { state.q = t; state.page = 1; $("blSearch").value = t; onQueryChange(); scrollToFeed(); });
      grid.appendChild(b);
    });
  }
  function renderFooter() {
    var p = posts.slice().sort(byDate)[0];
    var wrap = $("footerLatestWrap"), box = $("footerLatest"); clearEl(box);
    wrap.hidden = !p;
    if (!p) return;
    box.appendChild(h("div", { class: "group" }, [
      imageBox(p, "w-full h-32 mb-3"),
      h("h4", { class: "font-serif font-bold group-hover:text-brand-accent transition-colors" }, [h("a", { href: postHref(p), text: p.title })])
    ]));
  }
  function renderChrome() { renderTicker(); renderFooter(); }

  /* ---------- list view ---------- */
  function matches(p) {
    if (state.cat && p.category !== state.cat) return false;
    if (state.type && p.content_type !== state.type) return false;
    var q = norm(state.q).trim();
    if (!q) return true;
    var hay = norm([p.title, p.summary, p.category, p.author_name, p.source_name, tagsOf(p).join(" ")].join(" "));
    if (hay.indexOf(q) !== -1) return true;
    return !!(bodyMatchIds && bodyMatchIds[p.id]);
  }
  function score(p) {
    var q = norm(state.q).trim(); if (!q) return 0;
    var s = 0;
    if (norm(p.title).indexOf(q) !== -1) s += 4;
    if (norm(p.category).indexOf(q) !== -1 || norm(tagsOf(p).join(" ")).indexOf(q) !== -1) s += 2;
    if (norm(p.summary).indexOf(q) !== -1) s += 1;
    if (bodyMatchIds && bodyMatchIds[p.id]) s += 1;
    return s;
  }
  function sorted(list) {
    var a = list.slice();
    if (state.sort === "oldest") a.sort(function (x, y) { return -byDate(x, y); });
    else if (state.sort === "featured") a.sort(function (x, y) { return (y.featured ? 1 : 0) - (x.featured ? 1 : 0) || (x.sort_order - y.sort_order) || byDate(x, y); });
    else if (state.sort === "relevance") a.sort(function (x, y) { return score(y) - score(x) || byDate(x, y); });
    else a.sort(byDate);
    return a;
  }
  function pageList(current, total) {
    var nums = [], i;
    for (i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - current) <= 1) nums.push(i);
    var out = [];
    nums.forEach(function (n, idx) { if (idx && n - nums[idx - 1] > 1) out.push("…"); out.push(n); });
    return out;
  }
  var PG = "w-11 h-11 border border-brand-sec text-sm font-bold hover:bg-brand-dark hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit";
  var PG_ON = "w-11 h-11 border border-brand-dark bg-brand-dark text-white text-sm font-bold";
  function renderPager(total) {
    var nav = $("blPager"); clearEl(nav);
    if (total <= 1) { nav.hidden = true; return; }
    nav.hidden = false;
    var go = function (n) { state.page = n; syncUrl(); render(); scrollToFeed(); };
    var prev = h("button", { type: "button", class: PG, "aria-label": "Previous page", text: "‹" });
    prev.disabled = state.page <= 1; prev.addEventListener("click", function () { go(state.page - 1); });
    nav.appendChild(prev);
    pageList(state.page, total).forEach(function (n) {
      if (n === "…") { nav.appendChild(h("span", { class: "px-1 text-gray-400", "aria-hidden": "true", text: "…" })); return; }
      var cur = n === state.page;
      var b = h("button", { type: "button", class: cur ? PG_ON : PG, text: String(n), "aria-label": "Page " + n });
      if (cur) b.setAttribute("aria-current", "page");
      b.addEventListener("click", function () { go(n); });
      nav.appendChild(b);
    });
    var next = h("button", { type: "button", class: PG, "aria-label": "Next page", text: "›" });
    next.disabled = state.page >= total; next.addEventListener("click", function () { go(state.page + 1); });
    nav.appendChild(next);
  }
  function message(title, text, withReset) {
    var box = $("blMsg"); clearEl(box);
    if (!title) return;
    var el = h("div", { class: "text-center border border-dashed border-brand-sec bg-white p-10" }, [
      h("h3", { class: "font-serif text-2xl text-brand-dark mb-2", text: title }),
      h("p", { class: "text-gray-600 text-sm mb-4", text: text })
    ]);
    if (withReset) {
      var b = h("button", { type: "button", class: "px-6 py-3 border border-brand-dark text-xs font-bold uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-colors", text: "Clear filters" });
      b.addEventListener("click", function () {
        state.q = ""; state.cat = ""; state.type = ""; state.page = 1;
        $("blSearch").value = ""; $("blType").value = ""; bodyMatchIds = null;
        syncUrl(); render();
      });
      el.appendChild(b);
    }
    box.appendChild(el);
  }
  var CHIP = "px-4 py-2 border border-brand-sec bg-white text-[11px] font-bold uppercase tracking-widest hover:border-brand-accent transition-colors";
  var CHIP_ON = "px-4 py-2 border border-brand-dark bg-brand-dark text-white text-[11px] font-bold uppercase tracking-widest";
  function buildCategoryChips() {
    var box = $("blCats"); clearEl(box);
    var names = Object.keys(catCounts()).sort();
    if (names.length < 2) return;
    [""].concat(names).forEach(function (name) {
      var on = state.cat === name;
      var b = h("button", { type: "button", class: on ? CHIP_ON : CHIP, "aria-pressed": on ? "true" : "false", text: name || "All" });
      b.addEventListener("click", function () { state.cat = name; state.page = 1; syncUrl(); render(); });
      box.appendChild(b);
    });
  }
  function buildTypeSelect() {
    var sel = $("blType"), present = {};
    posts.forEach(function (p) { present[p.content_type] = 1; });
    Object.keys(TYPE_LABELS).forEach(function (k) { if (present[k]) sel.appendChild(h("option", { value: k, text: TYPE_LABELS[k] })); });
    sel.value = state.type;
    if (sel.value !== state.type) state.type = "";
  }
  function render() {
    var grid = $("blGrid"); clearEl(grid);
    $("blSort").querySelector('option[value="relevance"]').hidden = !state.q;
    if (!state.q && state.sort === "relevance") { state.sort = "newest"; $("blSort").value = "newest"; }
    buildCategoryChips();
    renderSidebar();
    var list = sorted(posts.filter(matches));
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var first = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(first, first + PAGE_SIZE);
    slice.forEach(function (p, i) {
      grid.appendChild(storyRow(p));
      if (i === 2 && slice.length > 3) grid.appendChild(adSlot());
    });
    $("blStatus").textContent = list.length
      ? "Showing " + (first + 1) + "–" + (first + slice.length) + " of " + list.length + (list.length === 1 ? " item" : " items")
      : "";
    if (!posts.length) message("Nothing published yet", "New articles and resources will appear here soon.", false);
    else if (!list.length) message("No matches", "Nothing matches your search or filters. Try different words or clear the filters.", true);
    else message("", "", false);
    renderPager(pages);
  }
  function onQueryChange() {
    if (state.q && state.sort !== "relevance") { state.sort = "relevance"; $("blSort").value = "relevance"; }
    syncUrl(); render();
    clearTimeout(searchTimer);
    var q = state.q;
    searchTimer = setTimeout(function () { runBodySearch(q); }, 350);
  }

  /* ---------- URL state ---------- */
  function readUrl() {
    var u = new URLSearchParams(location.search);
    state.q = (u.get("q") || "").slice(0, 80);
    state.cat = u.get("cat") || "";
    state.type = u.get("type") || "";
    state.sort = ["newest", "oldest", "featured", "relevance"].indexOf(u.get("sort")) > -1 ? u.get("sort") : "newest";
    state.page = Math.max(1, parseInt(u.get("page"), 10) || 1);
    return u.get("post");
  }
  function syncUrl() {
    var u = new URLSearchParams();
    if (state.q) u.set("q", state.q);
    if (state.cat) u.set("cat", state.cat);
    if (state.type) u.set("type", state.type);
    if (state.sort !== "newest") u.set("sort", state.sort);
    if (state.page > 1) u.set("page", state.page);
    var qs = u.toString();
    try { history.replaceState(null, "", "blog.html" + (qs ? "?" + qs : "")); } catch (e) { /* non-critical */ }
  }

  /* ---------- search ---------- */
  function runBodySearch(q) {
    var clean = q.replace(/[%,()*\\]/g, " ").trim();
    if (!db || clean.length < 3) { bodyMatchIds = null; render(); return; }
    db.from("blog_posts").select("id").eq("status", "published").ilike("body", "%" + clean + "%").limit(200)
      .then(function (r) {
        if (state.q !== q) return;
        bodyMatchIds = null;
        if (!r.error && r.data) { bodyMatchIds = {}; r.data.forEach(function (x) { bodyMatchIds[x.id] = 1; }); }
        render();
      }, function () { bodyMatchIds = null; });
  }
  function wireControls() {
    if (wired) return;
    wired = true;
    $("blSearch").value = state.q;
    $("blSort").value = state.sort;
    $("blSearch").addEventListener("input", function (e) { state.q = e.target.value.trim(); state.page = 1; onQueryChange(); });
    $("blType").addEventListener("change", function (e) { state.type = e.target.value; state.page = 1; syncUrl(); render(); });
    $("blSort").addEventListener("change", function (e) { state.sort = e.target.value; state.page = 1; syncUrl(); render(); });
    var slider = $("category-slider");
    $("slide-next").addEventListener("click", function () { slider.scrollBy({ left: 320, behavior: "smooth" }); });
    $("slide-prev").addEventListener("click", function () { slider.scrollBy({ left: -320, behavior: "smooth" }); });
  }

  /* ---------- article view ---------- */
  function setSeo(title, desc, url, image, type) {
    document.title = title;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", type || "website");
    if (image) setMeta('meta[property="og:image"]', "content", image);
  }
  function absolute(u) { return /^https?:\/\//i.test(u) ? u : SITE + "/" + String(u).replace(/^\//, ""); }
  function addJsonLd(p, url, image) {
    var data = {
      "@context": "https://schema.org", "@type": "Article", headline: p.title, mainEntityOfPage: url,
      datePublished: p.published_at || undefined, dateModified: p.updated_at || p.published_at || undefined,
      image: image || undefined, description: p.summary || undefined,
      author: p.author_name ? { "@type": "Person", name: p.author_name } : { "@type": "Organization", name: "CUDFIRM" },
      publisher: { "@type": "Organization", name: "CUDFIRM", logo: { "@type": "ImageObject", url: SITE + "/img/cudfirm.webp" } }
    };
    var s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }
  var SHARE_BTN = "px-4 py-2 border border-brand-dark text-[11px] font-bold uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-colors";
  function shareBar(p, url) {
    var enc = encodeURIComponent, text = enc(p.title);
    var wrap = h("div", { class: "flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-brand-sec" }, [h("span", { class: "text-xs font-bold uppercase tracking-widest text-gray-500 mr-2", text: "Share" })]);
    [["WhatsApp", "https://wa.me/?text=" + text + "%20" + enc(url)],
     ["X", "https://twitter.com/intent/tweet?text=" + text + "&url=" + enc(url)],
     ["LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(url)]].forEach(function (s) {
      wrap.appendChild(h("a", { class: SHARE_BTN, href: s[1], target: "_blank", rel: "noopener noreferrer", text: s[0], "aria-label": "Share on " + s[0] }));
    });
    var copy = h("button", { class: SHARE_BTN, type: "button", text: "Copy link" });
    copy.addEventListener("click", function () {
      var done = function (ok) { copy.textContent = ok ? "Link copied" : "Copy failed"; setTimeout(function () { copy.textContent = "Copy link"; }, 2000); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      else {
        var t = h("textarea", { readonly: true, style: "position:fixed;opacity:0" });
        t.value = url; document.body.appendChild(t); t.select();
        var ok = false; try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ }
        t.remove(); done(ok);
      }
    });
    wrap.appendChild(copy);
    return wrap;
  }
  function renderPost(p) {
    var url = SITE + "/blog.html?post=" + encodeURIComponent(p.slug);
    var image = safeUrl(p.image_url, true);
    setSeo(p.title + " | CUDFIRM Blog & Resources", p.summary || (TYPE_LABELS[p.content_type] || "Article") + " from CUDFIRM.", url, image ? absolute(image) : "", "article");
    addJsonLd(p, url, image ? absolute(image) : "");
    var root = $("postArticle"); clearEl(root);
    var art = h("div", null, []);
    p.min = p.body ? readingMinutes(p.body) : 0;
    art.appendChild(kickerLine(p, true));
    if (p.updated_at && p.published_at && new Date(p.updated_at) - new Date(p.published_at) > 864e5) art.appendChild(h("p", { class: "text-xs text-gray-500 mb-2", text: "Updated " + fmtDate(p.updated_at) }));
    art.appendChild(h("h1", { class: "font-serif text-4xl md:text-5xl leading-[1.1] text-brand-dark mb-5", text: p.title }));
    if (p.author_name) art.appendChild(h("p", { class: "text-sm font-bold text-brand-dark uppercase tracking-wide mb-4", text: "By " + p.author_name }));
    if (p.summary) art.appendChild(h("p", { class: "text-lg md:text-xl text-gray-600 leading-relaxed mb-6", text: p.summary }));
    if (p.content_type === "sponsored") art.appendChild(h("div", { class: "bl-note", role: "note", text: p.disclosure || "This is sponsored or partner content." }));
    else if (p.disclosure) art.appendChild(h("div", { class: "bl-note", role: "note", text: p.disclosure }));
    if (image) {
      var coverImg = h("img", { src: image, alt: p.image_alt || "", width: 1200, height: 675, decoding: "async", class: "w-full h-full object-cover" });
      var cover = h("div", { class: "w-full aspect-video bg-brand-dark mb-8 overflow-hidden" }, [coverImg]);
      coverImg.addEventListener("error", function () { cover.remove(); });
      art.appendChild(cover);
    }
    var ext = safeUrl(p.external_url, false);
    if (ext) {
      var rel = p.content_type === "sponsored" ? "sponsored noopener noreferrer" : "noopener noreferrer";
      var label = p.source_name ? "Visit " + p.source_name + " ↗" : "Visit resource ↗";
      var visit = h("div", { class: "bl-visit flex flex-wrap items-center gap-3 mb-8" }, [h("a", { class: "px-6 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-brand-dark transition-colors", href: ext, target: "_blank", rel: rel, text: label })]);
      if (p.content_type === "external") visit.appendChild(h("span", { class: "text-xs text-gray-500", text: "External site. Not published by CUDFIRM." }));
      art.appendChild(visit);
    }
    if (p.body) { var body = h("div", { class: "bl-body" }); body.innerHTML = sanitize(p.body); art.appendChild(body); }
    var tags = tagsOf(p);
    if (tags.length) art.appendChild(h("div", { class: "flex flex-wrap gap-2 mt-8" }, tags.map(function (t) { return h("span", { class: "px-3 py-1 border border-brand-sec text-[11px] font-bold uppercase tracking-widest text-gray-600", text: t }); })));
    art.appendChild(shareBar(p, url));
    root.appendChild(art);
  }
  function renderRelated(p) {
    var mine = tagsOf(p).map(norm);
    var rel = posts.filter(function (x) { return x.id !== p.id; }).map(function (x) {
      var s = (x.category === p.category ? 2 : 0) + tagsOf(x).filter(function (t) { return mine.indexOf(norm(t)) > -1; }).length;
      return { x: x, s: s };
    }).filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || byDate(a.x, b.x); }).slice(0, 3);
    var wrap = $("relatedWrap"), grid = $("relatedGrid"); clearEl(grid);
    if (!rel.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    rel.forEach(function (r) { grid.appendChild(relatedCard(r.x)); });
  }
  function postMessage(title, text) {
    var root = $("postArticle"); clearEl(root);
    root.appendChild(h("div", { class: "text-center border border-dashed border-brand-sec bg-white p-10" }, [
      h("h2", { class: "font-serif text-2xl text-brand-dark mb-2", text: title }),
      h("p", { class: "text-gray-600 text-sm mb-5", text: text }),
      h("a", { href: "blog.html", class: "inline-block px-6 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-brand-dark transition-colors", text: "Browse Blog & Resources" })
    ]));
  }
  function showPost(slug) {
    $("listView").hidden = true; $("postView").hidden = false;
    var root = $("postArticle"); clearEl(root);
    root.appendChild(h("div", { class: "skel h-72", "aria-hidden": "true" }));
    if (!db) { postMessage("Content unavailable", "We couldn't connect to load this page. Please try again later."); return; }
    var one = db.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    var all = db.from("blog_posts").select(LIST_COLUMNS).eq("status", "published").order("published_at", { ascending: false }).limit(200);
    Promise.all([one, all]).then(function (res) {
      posts = res[1].data || [];
      renderChrome();
      if (res[0].error) { postMessage("Something went wrong", "We couldn't load this page. Please try again."); return; }
      if (!res[0].data) {
        document.title = "Not found | CUDFIRM Blog & Resources";
        var robots = document.createElement("meta"); robots.name = "robots"; robots.content = "noindex"; document.head.appendChild(robots);
        postMessage("We couldn't find that page", "It may have been moved or is no longer published.");
        return;
      }
      renderPost(res[0].data);
      renderRelated(res[0].data);
    }, function () { postMessage("Something went wrong", "We couldn't load this page. Please check your connection and try again."); });
  }

  /* ---------- boot ---------- */
  function showList() {
    $("postView").hidden = true; $("listView").hidden = false;
    var grid = $("blGrid");
    for (var i = 0; i < 4; i++) grid.appendChild(h("div", { class: "skel h-56", "aria-hidden": "true" }));
    $("blStatus").textContent = "Loading…";
    var fail = function (title, text) { clearEl(grid); $("blStatus").textContent = ""; renderHero(); message(title, text, false); };
    if (!db) { fail("Content unavailable", "We couldn't connect to load articles. Please try again later."); return; }
    db.from("blog_posts").select(LIST_COLUMNS).eq("status", "published").order("published_at", { ascending: false }).limit(500)
      .then(function (r) {
        if (r.error) { fail("Something went wrong", "We couldn't load articles right now. Please refresh and try again."); return; }
        posts = r.data || [];
        buildTypeSelect();
        wireControls();
        renderHero(); renderChrome(); renderCollections(); renderTopics();
        render();
        if (state.q) runBodySearch(state.q);
      }, function () { fail("Something went wrong", "We couldn't reach the server. Please check your connection and try again."); });
  }

  initChrome();
  var slug = readUrl();
  if (slug) showPost(slug); else showList();
})();
