/**
 * Umbrella-brand panel for the Home tab (additive; script.js untouched).
 * Only arms that exist today are labelled "Live"/"Showcased". Future brands are described
 * generically and labelled "Planned" — no unlaunched business is named or implied to operate.
 * Override or extend by defining window.CUDFIRM_ARMS before this script runs.
 */
(function () {
  "use strict";

  var ARMS = Array.isArray(window.CUDFIRM_ARMS) ? window.CUDFIRM_ARMS : [
    { name: "CUDFIRM Studio", state: "Live", planned: false,
      text: "Websites, landing pages and portfolios for small businesses, each with its own easy dashboard." },
    { name: "CUDFIRM Originals", state: "Showcased", planned: false,
      text: "Projects and brands created by CUDFIRM itself, shown in the portfolio under CUDFIRM Originals." },
    { name: "New brands & services", state: "Planned", planned: true,
      text: "CUDFIRM is built so new brands, products and services can be added under one parent without rebuilding the site." },
  ];

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  function build() {
    var box = el("section", "eco-umbrella");
    box.id = "ecoUmbrella";
    box.setAttribute("aria-labelledby", "ecoUmbrellaTitle");
    var h = el("h3", null, "The CUDFIRM ecosystem"); h.id = "ecoUmbrellaTitle";
    box.appendChild(h);
    box.appendChild(el("p", null, "CUDFIRM is the parent brand for a growing set of digital businesses, products and services. Here is what exists today and what is planned."));
    var grid = el("div", "eco-arms");
    ARMS.forEach(function (a) {
      var card = el("div", "eco-arm");
      card.appendChild(el("strong", null, a.name));
      card.appendChild(el("span", "eco-state" + (a.planned ? " is-planned" : ""), a.state));
      card.appendChild(el("p", null, a.text));
      grid.appendChild(card);
    });
    box.appendChild(grid);

    var invite = el("div", "eco-portal-invite");
    invite.appendChild(el("span", null, "Already a client? An optional account gives you a private place to follow your project, share files and message us. Browsing and requesting services never needs an account."));
    var a = el("a", null, "Client portal"); a.href = "account/";
    invite.appendChild(a);
    box.appendChild(invite);
    return box;
  }

  function run() {
    var tab = document.getElementById("tab1");
    if (tab && !document.getElementById("ecoUmbrella")) tab.appendChild(build());
  }
  var t = null;
  function schedule() { clearTimeout(t); t = setTimeout(run, 80); }
  function start() {
    run();
    if (typeof MutationObserver !== "undefined") new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
