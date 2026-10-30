/**
 * js/v2-nav.js — CUDFIRM v2 homepage additions (index.html).
 *
 * js/script.js (protected) is NOT modified, and the homepage Portfolio tab is
 * left exactly as it is. This isolated script only:
 *   1. Adds a "View all" button at the bottom right of the Portfolio tab (#tab4),
 *      directly above "Start Your Project", that opens portfolio.html.
 *   2. Adds a "Blog & Resources" link to the sidebar and the mobile tab strip.
 * If script.js changes or fails to load, this file does nothing.
 */
(function () {
  "use strict";

  function addViewAll() {
    var tab = document.getElementById("tab4");
    if (!tab || tab.querySelector("[data-v2-viewall]")) return;
    var wrap = document.createElement("div");
    wrap.setAttribute("data-v2-viewall", "");
    wrap.style.cssText = "display:flex;justify-content:flex-end;margin:16px 0 4px;";
    var a = document.createElement("a");
    a.href = "portfolio.html";
    a.className = "btn btn-success";
    a.style.cssText = "font-size:1rem;font-weight:700;padding:.5rem 1.1rem;";
    a.textContent = "View all \u2192";
    a.setAttribute("aria-label", "View all projects on the portfolio page");
    wrap.appendChild(a);
    // Place it directly above the "Start Your Project" button; fall back to the end of the tab.
    var start = tab.querySelector(".view-more-btn");
    if (start && start.parentNode) start.parentNode.insertBefore(wrap, start);
    else tab.appendChild(wrap);
  }

  function addBlogLinks() {
    var side = document.getElementById("sidebarTabsContainer");
    if (side && !side.querySelector("[data-v2-blog]")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab-button whitenho";
      b.setAttribute("data-v2-blog", "");
      b.textContent = "Blog & Resources";
      b.addEventListener("click", function () { window.location.href = "blog.html"; });
      side.appendChild(b);
    }
    var strip = document.getElementById("mobileTabStrip");
    if (strip && !strip.querySelector("[data-v2-blog]")) {
      var c = document.createElement("a");
      c.className = "mobile-tab-chip";
      c.href = "blog.html";
      c.setAttribute("data-v2-blog", "");
      c.style.textDecoration = "none";
      c.textContent = "Blog & Resources";
      strip.appendChild(c);
    }
  }

  function run() { addViewAll(); addBlogLinks(); }
  run();
  // Sections, sidebar and strip are rendered after the CMS loads; retry briefly until they exist.
  var tries = 0;
  var timer = setInterval(function () {
    run();
    var ready = document.querySelector("#tab4 [data-v2-viewall]") && document.querySelector("#sidebarTabsContainer [data-v2-blog]") && document.querySelector("#mobileTabStrip [data-v2-blog]");
    if (ready || ++tries > 40) clearInterval(timer);
  }, 250);
})();
