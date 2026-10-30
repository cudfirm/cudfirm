/**
 * Account status on the main website (additive; script.js untouched).
 *  - Header chip: "Log in" when signed out, "<first name>" (links to the portal) when signed in.
 *  - MENU: "Log in / Sign up" when signed out; "My portal" + "Log out" when signed in.
 *  - Contact page card changes to match.
 * Staff signed in to the dashboard see "Dashboard" instead of "My portal".
 */
(function () {
  "use strict";
  var PORTAL = "account/";
  var DASH = "dashboard/index.html";
  var db = window.supabaseClient;
  var acct = { status: "out", name: "" };   // out | member | staff

  function el(tag, props) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") n.textContent = props[k]; else if (k === "class") n.className = props[k];
      else if (k === "style") n.style.cssText = props[k]; else n.setAttribute(k, props[k]);
    });
    return n;
  }
  function firstName(n) { return (n || "").trim().split(/\s+/)[0].slice(0, 12); }
  function sig() { return acct.status + "|" + acct.name; }
  function target() { return acct.status === "staff" ? DASH : PORTAL; }

  function logout() {
    if (!db) return;
    db.auth.signOut().then(function () { acct = { status: "out", name: "" }; render(); });
  }

  /* ---- header chip ---- */
  function renderChip() {
    var host = document.querySelector(".mobile-widgets");
    if (!host) return;
    var chip = document.getElementById("accountChip");
    if (!chip) {
      chip = el("a", { id: "accountChip", class: "btn btn-sm btn-outline-light text-bg-dark",
        style: "margin-right:.4rem;font-size:.72rem;padding:.3rem .6rem;white-space:nowrap;max-width:7.5rem;overflow:hidden;text-overflow:ellipsis" });
      host.parentNode.insertBefore(chip, host);
    }
    chip.dataset.sig = sig();
    chip.href = acct.status === "out" ? PORTAL : target();
    chip.textContent = acct.status === "out" ? "Log in" : (acct.status === "staff" ? "Dashboard" : "\u25CF " + (firstName(acct.name) || "Account"));
    chip.title = acct.status === "out" ? "Log in or create a client account" : "Signed in" + (acct.name ? " as " + acct.name : "");
    chip.setAttribute("aria-label", chip.title);
  }

  /* ---- MENU items ---- */
  function renderMenu() {
    document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
      if (!menu.querySelector("[onclick*='openTab']")) return;
      menu.querySelectorAll("[data-portal-item]").forEach(function (x) { x.parentNode.remove(); });
      var li = el("li"), a = el("a", { class: "dropdown-item btn btn-sm", "data-portal-item": "1", "data-sig": sig(), href: acct.status === "out" ? PORTAL : target() });
      a.textContent = acct.status === "out" ? "Log in / Sign up" : (acct.status === "staff" ? "Dashboard" : "My portal");
      li.appendChild(a); menu.appendChild(li);
      if (acct.status !== "out") {
        var li2 = el("li"), b = el("button", { class: "dropdown-item btn btn-sm", type: "button", "data-portal-item": "1" });
        b.textContent = "Log out"; b.addEventListener("click", logout);
        li2.appendChild(b); menu.appendChild(li2);
      }
    });
  }

  /* ---- Contact page card ---- */
  function renderContact() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var card = document.getElementById("portalContactCard");
    if (!card) {
      var col = form.closest(".col-12.col-lg-8") || form.parentElement;
      card = el("div", { id: "portalContactCard",
        style: "margin-top:1rem;padding:1rem 1.1rem;border:1px solid #D9D3C7;border-radius:18px;background:#FAFAF8;display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;justify-content:space-between;font-size:.88rem;color:#3E4A42" });
      col.appendChild(card);
    }
    card.dataset.sig = sig();
    card.textContent = "";
    var t = el("span", { style: "flex:1 1 220px" });
    t.textContent = acct.status === "member" ? "You are signed in" + (acct.name ? " as " + acct.name : "") + ". Request projects and follow progress in your portal."
      : acct.status === "staff" ? "You are signed in as CUDFIRM staff."
      : "Already a client? Log in to follow your project, share files and message us. An account is optional.";
    var a = el("a", { href: acct.status === "out" ? PORTAL : target(),
      style: "font-weight:700;color:#0B3D2E;text-decoration:none;border:1.5px solid #0B3D2E;border-radius:999px;padding:.55rem 1.1rem;min-height:40px;display:inline-flex;align-items:center" });
    a.textContent = acct.status === "out" ? "Log in / Sign up" : (acct.status === "staff" ? "Open dashboard" : "Open my portal");
    card.appendChild(t); card.appendChild(a);
  }

  function render() { renderChip(); renderMenu(); renderContact(); }

  // Only touches the page when something is missing or out of date (prevents observer loops).
  function ensure() {
    var chip = document.getElementById("accountChip");
    var menus = [].filter.call(document.querySelectorAll(".dropdown-menu"), function (m) { return m.querySelector("[onclick*='openTab']"); });
    var stale = !!document.querySelector(".mobile-widgets") && (!chip || chip.dataset.sig !== sig());
    menus.forEach(function (m) { var i = m.querySelector("[data-portal-item]"); if (!i || i.dataset.sig !== sig()) stale = true; });
    var form = document.getElementById("contactForm"), card = document.getElementById("portalContactCard");
    if (form && (!card || card.dataset.sig !== sig())) stale = true;
    if (stale) render();
  }

  function refresh() {
    if (!db) return render();
    db.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) { acct = { status: "out", name: "" }; return render(); }
      var uid = s.user.id, email = s.user.email || "";
      return db.from("member_profiles").select("display_name,status").eq("user_id", uid).maybeSingle().then(function (m) {
        if (m.data && m.data.status === "active") { acct = { status: "member", name: m.data.display_name || email }; return render(); }
        return db.from("user_profiles").select("role,is_active").eq("id", uid).maybeSingle().then(function (u) {
          acct = (u.data && u.data.is_active) ? { status: "staff", name: email } : { status: "out", name: "" };
          render();
        });
      });
    }).catch(function () { acct = { status: "out", name: "" }; render(); });
  }

  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(ensure, 80); }
  function start() {
    refresh();
    if (typeof MutationObserver !== "undefined") new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    if (db) db.auth.onAuthStateChange(function () { refresh(); });
  }
  window.CUDFIRMAccountUI = { set: function (s) { acct = s; render(); }, refresh: refresh };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();