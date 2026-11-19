/**
 * js/emerald-home.js — presentation helpers for the emerald redesign (index.html).
 *
 * Presentation only. It never fetches data, never touches Supabase/auth/forms, and it only
 * calls existing public functions (openTab, bootstrap.Dropdown). If script.js or the adapter
 * changes the markup, every helper here degrades to a no-op.
 *   1. Builds the pill navigation links inside the existing header (same destinations as MENU).
 *   2. Opens the existing MENU dropdown from the hero hamburger.
 *   3. Splits the CMS hero title into two lines (second line highlighted) without changing its text.
 *   4. Makes the featured / service tiles keyboard-reachable, and sends service tiles to Services.
 *   5. Scrolls the "All in CUDFIRM" pill to the featured grid.
 */
(function () {
  "use strict";

  var PILL_LINKS = [
    { label: "Home", tab: "tab1" },
    { label: "Services", tab: "tab3" },
    { label: "Portfolio", tab: "tab4" },
    { label: "About", tab: "tab20" },
    { label: "Blog", href: "blog.html" },
    { label: "Client Portal", portal: true }
  ];

  function portalHref() {
    var chip = document.getElementById("accountChip");   // js/portal-link.js keeps this pointing at portal / dashboard
    return (chip && chip.getAttribute("href")) || "account/";
  }

  function buildPill() {
    var header = document.querySelector(".content-header");
    if (!header || header.querySelector(".em-pill-links")) return !!header;
    var nav = document.createElement("nav");
    nav.className = "em-pill-links";
    nav.setAttribute("aria-label", "Main navigation");
    var scroller = document.createElement("div");   // the fade mask lives on this inner scroller, so the pill's own background stays solid
    scroller.className = "em-pill-scroll";
    nav.appendChild(scroller);
    PILL_LINKS.forEach(function (item) {
      var el;
      if (item.tab) {
        el = document.createElement("button");
        el.type = "button";
        el.dataset.tab = item.tab;
        el.addEventListener("click", function (e) { if (window.openTab) window.openTab(e, item.tab); });
      } else {
        el = document.createElement("a");
        el.href = item.portal ? portalHref() : item.href;
        if (item.portal) {
          el.dataset.portal = "1";
          el.addEventListener("click", function () { el.href = portalHref(); });
        }
      }
      el.textContent = item.label;
      scroller.appendChild(el);
    });
    header.insertBefore(nav, header.firstChild);
    markCurrent();
    return true;
  }

  function markCurrent() {
    var active = document.querySelector(".tab-content.active");
    var id = active ? active.id : "";
    document.querySelectorAll(".em-pill-links [data-tab]").forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.toggle("is-current", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  /* ---- hero title: "Build Smarter. Grow Bigger." -> two display lines, text unchanged ---- */
  function norm(t) { return String(t || "").replace(/\s+/g, " ").trim(); }
  function splitTitle() {
    var h = document.querySelector(".home-hero .hero-title");
    if (!h) return;
    var text = norm(h.textContent);
    if (h.dataset.emText === text && h.querySelector(".em-l1")) return;
    var parts = text.match(/[^.!?]+[.!?]+/g);
    if (!parts || parts.length < 2) { h.dataset.emText = text; return; }
    var first = parts[0].trim();
    var rest = text.slice(parts[0].length).trim();
    var a = document.createElement("span"); a.className = "em-l1"; a.textContent = first;
    var b = document.createElement("span"); b.className = "em-l2"; b.textContent = rest;
    h.textContent = "";
    h.appendChild(a); h.appendChild(document.createTextNode(" ")); h.appendChild(b);
    h.dataset.emText = norm(h.textContent);
  }

  function observeHero() {
    var hero = document.querySelector(".home-hero");
    if (!hero || hero.dataset.emObserved) return;
    hero.dataset.emObserved = "1";
    new MutationObserver(function () { splitTitle(); }).observe(hero, { childList: true, characterData: true, subtree: true });
    splitTitle();
  }

  /* ---- keyboard access for the clickable tiles (adapter replaces them, so tag on demand) ---- */
  function tagTiles() {
    document.querySelectorAll(".em-showcase .grid-item").forEach(function (t) {
      if (t.getAttribute("tabindex")) return;
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      var label = t.getAttribute("data-name");
      if (label) t.setAttribute("aria-label", label);
    });
  }

  function wireOnce() {
    var main = document.getElementById("contentMain");
    if (!main || main.dataset.emWired) return;
    main.dataset.emWired = "1";

    main.addEventListener("click", function (e) {
      var burger = e.target.closest("[data-em-menu]");
      if (burger) {
        e.stopPropagation();   // keep Bootstrap's outside-click handler from closing the menu we just opened
        var toggle = document.querySelector(".mobile-widgets .dropdown-toggle");
        if (toggle && window.bootstrap && window.bootstrap.Dropdown) window.bootstrap.Dropdown.getOrCreateInstance(toggle).toggle();
        return;
      }
      var scroller = e.target.closest("[data-em-scroll]");
      if (scroller) {
        var target = document.querySelector(scroller.getAttribute("data-em-scroll"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      // Service tiles have no page of their own: send them to the Services tab (previously they opened a placeholder image).
      var svc = e.target.closest(".em-services .grid-item");
      if (svc && (svc.getAttribute("data-link") || "#") === "#") {
        e.preventDefault(); e.stopPropagation();
        if (window.openTab) window.openTab(e, "tab3");
      }
    });

    main.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".em-showcase .grid-item")) {
        e.preventDefault();
        e.target.click();
      }
    });

    new MutationObserver(function () { markCurrent(); tagTiles(); })
      .observe(main, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true });
  }

  function run() {
    var ok = buildPill();
    wireOnce();
    observeHero();
    tagTiles();
    markCurrent();
    return ok && !!document.querySelector(".home-hero");
  }

  var tries = 0;
  var timer = setInterval(function () {
    if (run() || ++tries > 60) clearInterval(timer);
  }, 150);
  run();
})();
