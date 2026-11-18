/**
 * js/app-shell.js — shared app-style navigation for CUDFIRM's standalone public pages
 * (portfolio.html, blog.html). A page opts in with <body data-app-page="portfolio|blog">.
 *
 * It adds the same bottom navigation the homepage app uses (same icons, labels and order, plus
 * Blog), so moving between the homepage tabs and these pages feels like moving between sections of
 * one app. The bar is shown on phones and tablets; desktop keeps the top navigation.
 * Single source of truth for the links: edit ITEMS below.
 */
(function () {
  "use strict";
  var body = document.body;
  var page = body && body.getAttribute("data-app-page");
  if (!page || body.querySelector(".ap-bottom-nav")) return;

  var ITEMS = [
    { id: "home",      href: "index.html",                label: "Home",      icon: "bi-house-fill" },
    { id: "services",  href: "index.html#tab3",           label: "Services",  icon: "bi-briefcase" },
    { id: "portfolio", href: "portfolio.html",            label: "Portfolio", icon: "bi-laptop" },
    { id: "blog",      href: "blog.html",                 label: "Blog",      icon: "bi-journal-text" },
    { id: "about",     href: "index.html#tab20",          label: "About",     icon: "bi-info-circle" },
    { id: "contact",   href: "index.html#connect-content", label: "Contact",   icon: "bi-chat-dots" }
  ];

  var nav = document.createElement("nav");
  nav.className = "ap-bottom-nav";
  nav.setAttribute("aria-label", "App navigation");
  ITEMS.forEach(function (it) {
    var a = document.createElement("a");
    a.href = it.href;
    a.innerHTML = '<i class="bi ' + it.icon + '" aria-hidden="true"></i><span>' + it.label + "</span>";
    if (it.id === page) {
      a.setAttribute("aria-current", "page");
      // Tapping the section you are already in scrolls back to the top, as in a native app.
      a.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    }
    nav.appendChild(a);
  });
  body.appendChild(nav);
  body.classList.add("has-ap-nav");
})();
