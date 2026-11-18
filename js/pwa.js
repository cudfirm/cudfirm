/**
 * js/pwa.js — CUDFIRM installable-app layer (public pages only; never loaded by the dashboard).
 *
 *  1. Registers /sw.js (HTTPS or localhost only) and checks for updates when the app is reopened.
 *  2. Install experience:
 *       - Chrome / Edge / Samsung / Android / desktop: uses the browser's own install prompt.
 *       - iPhone / iPad (any browser) and Safari on Mac: shows a short "Add to Home Screen" guide,
 *         because those browsers have no install prompt to call.
 *       - Hidden once the site is already running as an installed app, and where install is unsupported.
 *     Any element with [data-install-app] becomes the install button; a small dismissible banner is
 *     also offered once (and not again for 14 days after it is closed).
 *  3. Adds `is-standalone` to <html> when launched as an app, so CSS can tune the app-style display.
 * Nothing here changes how the site behaves in an ordinary browser tab.
 */
(function () {
  "use strict";
  if (window.__cudfirmPwa) return;
  window.__cudfirmPwa = true;

  var DISMISS_KEY = "cudfirm_install_dismissed";
  var DISMISS_DAYS = 14;
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/pwa\.js(?:[?#].*)?$/, "") : new URL("./", location.href).href;

  var root = document.documentElement;
  var deferred = null;
  var bannerEl = null, sheetEl = null, bannerTimer = null;

  /* ---------- environment ---------- */
  function isStandalone() {
    try {
      return (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches || matchMedia("(display-mode: minimal-ui)").matches)) || window.navigator.standalone === true;
    } catch (e) { return false; }
  }
  var ua = navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isMacSafari = !isIOS && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);

  function guideKind() { return isIOS ? "ios" : isMacSafari ? "mac" : ""; }
  function canInstall() { return !isStandalone() && (!!deferred || !!guideKind()); }

  if (isStandalone()) root.classList.add("is-standalone");

  /* ---------- service worker ---------- */
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    var secure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (!secure) return;
    navigator.serviceWorker.register(base + "sw.js").then(function (reg) {
      // Pick up a new version as soon as the app is reopened or brought back to the front.
      document.addEventListener("visibilitychange", function () { if (!document.hidden) reg.update().catch(function () {}); });
    }).catch(function () { /* install features simply stay off */ });
  }
  if (document.readyState === "complete") registerSW(); else window.addEventListener("load", registerSW);

  /* ---------- install buttons ---------- */
  function buttons() { return document.querySelectorAll("[data-install-app]"); }
  function syncButtons() {
    var show = canInstall();
    Array.prototype.forEach.call(buttons(), function (b) {
      b.hidden = !show;
      var li = b.parentNode && b.parentNode.nodeName === "LI" && b.parentNode.hasAttribute("data-install-li") ? b.parentNode : null;
      if (li) li.hidden = !show;
    });
    if (!show) hideBanner();
  }

  function promptInstall() {
    if (deferred) {
      var ev = deferred;
      deferred = null;
      ev.prompt();
      ev.userChoice.then(function (choice) {
        if (choice && choice.outcome === "dismissed") remember();
        syncButtons();
      }).catch(function () { syncButtons(); });
      hideBanner();
      return;
    }
    if (guideKind()) openSheet();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-install-app]");
    if (!t) return;
    e.preventDefault();
    promptInstall();
  });

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    syncButtons();
    scheduleBanner();
  });
  window.addEventListener("appinstalled", function () {
    deferred = null;
    root.classList.add("is-standalone");
    syncButtons();
    hideBanner();
  });

  /* ---------- helpers for UI ---------- */
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function recentlyDismissed() {
    try { var t = parseInt(localStorage.getItem(DISMISS_KEY), 10); return t && Date.now() - t < DISMISS_DAYS * 86400000; } catch (e) { return false; }
  }
  function remember() { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* storage blocked */ } }

  /* ---------- banner ---------- */
  function placeBanner() {
    if (!bannerEl) return;
    var nav = document.querySelector(".ap-bottom-nav, .footer-nav");
    var lift = 12;
    if (nav && nav.offsetParent !== null && getComputedStyle(nav).display !== "none") lift = nav.getBoundingClientRect().height + 10;
    bannerEl.style.setProperty("--ap-banner-lift", lift + "px");
  }
  function showBanner() {
    if (bannerEl || !canInstall() || recentlyDismissed() || document.querySelector(".cud-overlay.is-open, dialog[open]")) return;
    bannerEl = el("div", "ap-install", "");
    bannerEl.setAttribute("role", "region");
    bannerEl.setAttribute("aria-label", "Install CUDFIRM");
    bannerEl.innerHTML =
      '<img class="ap-install-ic" src="' + base + 'img/icon-192.png" width="44" height="44" alt="" />' +
      '<div class="ap-install-tx"><strong>Install CUDFIRM</strong><span>Open it from your home screen, like an app.</span></div>' +
      '<button type="button" class="ap-install-go">Install</button>' +
      '<button type="button" class="ap-install-x" aria-label="Not now">&times;</button>';
    bannerEl.querySelector(".ap-install-go").addEventListener("click", promptInstall);
    bannerEl.querySelector(".ap-install-x").addEventListener("click", function () { remember(); hideBanner(); });
    document.body.appendChild(bannerEl);
    placeBanner();
    requestAnimationFrame(function () { bannerEl && bannerEl.classList.add("is-in"); });
  }
  function hideBanner() {
    clearTimeout(bannerTimer);
    if (!bannerEl) return;
    var b = bannerEl; bannerEl = null;
    b.classList.remove("is-in");
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 250);
  }
  function scheduleBanner() {
    clearTimeout(bannerTimer);
    if (recentlyDismissed() || isStandalone()) return;
    bannerTimer = setTimeout(showBanner, 7000);       // let the visitor see the page first
  }
  window.addEventListener("resize", placeBanner);

  /* ---------- "Add to Home Screen" guide (iPhone / iPad / Safari on Mac) ---------- */
  function openSheet() {
    if (sheetEl) return;
    var kind = guideKind(); if (!kind) return;
    var steps = kind === "ios"
      ? ['Tap the <b>Share</b> button in your browser.', 'Scroll down and choose <b>Add to Home Screen</b>.', 'Tap <b>Add</b>. CUDFIRM now opens like an app.']
      : ['In the menu bar choose <b>File</b>.', 'Click <b>Add to Dock&hellip;</b>', 'Click <b>Add</b>. CUDFIRM now opens like an app.'];
    sheetEl = el("div", "ap-sheet");
    sheetEl.innerHTML =
      '<div class="ap-sheet-bg" data-close></div>' +
      '<div class="ap-sheet-box" role="dialog" aria-modal="true" aria-labelledby="apSheetTitle">' +
      '<button type="button" class="ap-sheet-x" data-close aria-label="Close">&times;</button>' +
      '<img src="' + base + 'img/icon-192.png" width="56" height="56" alt="" class="ap-sheet-ic" />' +
      '<h2 id="apSheetTitle">Install CUDFIRM</h2>' +
      '<ol>' + steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") + '</ol>' +
      '<button type="button" class="ap-install-go ap-sheet-ok" data-close>Got it</button></div>';
    document.body.appendChild(sheetEl);
    document.body.classList.add("ap-lock");
    var prev = document.activeElement;
    function close() {
      document.removeEventListener("keydown", onKey, true);
      if (sheetEl && sheetEl.parentNode) sheetEl.parentNode.removeChild(sheetEl);
      sheetEl = null; document.body.classList.remove("ap-lock");
      if (prev && prev.focus) prev.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") { var f = sheetEl.querySelectorAll("button"); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    }
    sheetEl.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey, true);
    sheetEl.querySelector(".ap-sheet-ok").focus();
    hideBanner(); remember();
  }

  /* ---------- homepage: add the install option to the menu and sidebar ----------
     The homepage UI is rendered by js/script.js (left untouched), so these are added once it exists. */
  function addHomepageInstall() {
    var menu = document.querySelector(".mobile-widgets .dropdown-menu");
    if (menu && !menu.querySelector("[data-install-app]")) {
      var li = el("li", null, '<button type="button" class="dropdown-item btn btn-sm" data-install-app hidden><i class="bi bi-download me-1" aria-hidden="true"></i>Install app</button>');
      li.setAttribute("data-install-li", ""); li.hidden = true;
      menu.insertBefore(li, menu.firstChild);
    }
    var side = document.getElementById("sidebarTabsContainer");
    if (side && !side.querySelector("[data-install-app]")) {
      var b = el("button", "tab-button whitenho", '<i class="bi bi-download me-1" aria-hidden="true"></i>Install app');
      b.type = "button"; b.setAttribute("data-install-app", ""); b.hidden = true;
      side.appendChild(b);
    }
    syncButtons();
  }
  if (document.getElementById("contentMain")) {
    var tries = 0, t = setInterval(function () {
      addHomepageInstall();
      var done = document.querySelector("#sidebarTabsContainer [data-install-app]") && document.querySelector(".mobile-widgets [data-install-app]");
      if (done || ++tries > 40) clearInterval(t);
    }, 300);
  }

  function ready() {
    syncButtons();
    if (guideKind() && !isStandalone()) scheduleBanner();      // iOS / Mac Safari never fire beforeinstallprompt
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
