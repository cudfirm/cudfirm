/**
 * CUDFIRM public enquiry flow (additive; js/script.js is not modified).
 *  1. "Request" buttons on the Services tab open an accessible request dialog with the
 *     chosen service pre-selected. Submissions go to the `service-request` Edge Function,
 *     which stores the request, rate-limits, and e-mails the administrator.
 *  2. sendToAdmin() (contact form "Submit Request") is wrapped so the visitor is only told
 *     "sent" when the database accepted the message. The original Google-Sheets mirror and
 *     thank-you redirect are preserved for successful submissions.
 * No secrets live here: only the public project URL and publishable key are used.
 */
(function () {
  "use strict";

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    return h.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
  }

  function endpoint() {
    var base = window.CUDFIRMSupabase && window.CUDFIRMSupabase.projectUrl;
    return base ? base.replace(/\/$/, "") + "/functions/v1/service-request" : null;
  }
  function publishableKey() {
    try { return typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : ""; } catch (e) { return ""; }
  }

  function serviceNames() {
    var names = [];
    document.querySelectorAll("#tab3-list .list-item").forEach(function (item) {
      var n = nameOf(item);
      if (n && names.indexOf(n) === -1) names.push(n);
    });
    return names;
  }
  function nameOf(item) {
    var icon = item.querySelector(".item-icon");
    var t = icon && icon.textContent.replace(/\s+/g, " ").trim();
    if (!t) { var h = item.querySelector("h6"); t = h && h.textContent.replace(/\s+/g, " ").trim(); }
    return (t || "").slice(0, 200);
  }

  /* ---------------- request dialog ---------------- */
  var open = null;

  function openRequestDialog(preselected, prefill) {
    if (open) return;
    var opener = document.activeElement;
    var token = uuid();            // reused on retry: server rejects a second insert of the same token
    var inflight = false;
    var names = serviceNames();
    if (!preselected) { for (var i = 0; i < names.length; i++) { if (/web/i.test(names[i])) { preselected = names[i]; break; } } }
    if (preselected && names.indexOf(preselected) === -1) names.unshift(preselected);
    names.push("Something else / not sure yet");

    var status = el("div", { "class": "eco-status", role: "status", "aria-live": "polite" });
    var submit = el("button", { "class": "eco-btn", type: "submit", text: "Send request" });
    var cancel = el("button", { "class": "eco-btn is-ghost", type: "button", text: "Cancel" });

    var select = el("select", { id: "ecoService", name: "service", required: "required" },
      names.map(function (n) { var o = el("option", { value: n, text: n }); if (n === preselected) o.selected = true; return o; }));

    function field(id, label, input) { return [el("label", { "for": id, text: label }), input]; }
    var f = {
      name: el("input", { id: "ecoName", name: "name", type: "text", required: "required", maxlength: "120", autocomplete: "name" }),
      email: el("input", { id: "ecoEmail", name: "email", type: "email", required: "required", maxlength: "320", autocomplete: "email" }),
      phone: el("input", { id: "ecoPhone", name: "phone", type: "tel", maxlength: "40", autocomplete: "tel" }),
      req: el("textarea", { id: "ecoReq", name: "requirements", required: "required", maxlength: "5000" }),
      timeline: el("input", { id: "ecoTimeline", name: "timeline", type: "text", maxlength: "200", placeholder: "e.g. within 3 weeks, or call me on Friday" }),
      budget: el("input", { id: "ecoBudget", name: "budget", type: "text", maxlength: "120", placeholder: "Optional" }),
      hp: el("input", { id: "ecoWebsite", name: "website", type: "text", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" }),
    };

    var form = el("form", { novalidate: "novalidate" });
    [].concat(
      field("ecoService", "Service", select),
      field("ecoName", "Your name", f.name),
      field("ecoEmail", "Email address", f.email),
      field("ecoPhone", "Phone or WhatsApp (optional)", f.phone),
      field("ecoReq", "What do you need?", f.req),
      field("ecoTimeline", "Preferred timeline or consultation time (optional)", f.timeline),
      field("ecoBudget", "Budget (optional)", f.budget)
    ).forEach(function (n) { form.appendChild(n); });
    form.appendChild(el("div", { "class": "eco-hp", "aria-hidden": "true" }, [el("label", { "for": "ecoWebsite", text: "Leave this empty" }), f.hp]));
    form.appendChild(status);
    form.appendChild(el("div", { "class": "eco-actions" }, [cancel, submit]));

    var dialog = el("div", { "class": "eco-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "ecoTitle" }, [
      el("h2", { id: "ecoTitle", text: "Request this service" }),
      el("p", { "class": "eco-sub", text: "This sends us a request, not a confirmed booking. We review it and reply with a clear price and timeline. No account needed." }),
      form,
    ]);
    var overlay = el("div", { "class": "eco-overlay" }, [dialog]);

    function close() {
      document.removeEventListener("keydown", onKey, true);
      overlay.remove(); open = null;
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var focusables = dialog.querySelectorAll("a[href],button:not([disabled]),input:not([tabindex='-1']),select,textarea");
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
    cancel.addEventListener("click", close);
    document.addEventListener("keydown", onKey, true);

    function say(msg, state) { status.textContent = msg; status.dataset.state = state || ""; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (inflight) return;
      var email = f.email.value.trim();
      if (!f.name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !f.req.value.trim() || !select.value) {
        say("Please add your name, a valid email and what you need.", "error");
        return;
      }
      var url = endpoint();
      if (!url) { say("The request service is not available right now. Please use WhatsApp or the contact form.", "error"); return; }

      inflight = true; submit.disabled = true; submit.textContent = "Sending…"; say("", "");
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: publishableKey() },
        body: JSON.stringify({
          name: f.name.value, email: email, phone: f.phone.value, service: select.value,
          requirements: f.req.value, timeline: f.timeline.value, budget: f.budget.value,
          website: f.hp.value, clientToken: token,
        }),
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, status: res.status, body: body }; });
      }).then(function (r) {
        if (r.ok && r.body && r.body.ok) {
          var ref = r.body.reference ? " Your reference is " + r.body.reference + "." : "";
          form.reset();
          form.querySelectorAll("input,select,textarea").forEach(function (x) { x.disabled = true; });
          say("Request received." + ref + " We will review it and reply. This is not yet a confirmed booking.", "success");
          submit.textContent = "Sent"; cancel.textContent = "Close"; submit.disabled = true;
          return;
        }
        inflight = false; submit.disabled = false; submit.textContent = "Send request";
        say(r.status === 429 ? "Too many requests from this connection. Please try again later." :
          "We could not send your request. Please try again, or contact us on WhatsApp.", "error");
      }).catch(function () {
        inflight = false; submit.disabled = false; submit.textContent = "Send request";
        say("Network problem. Your request was not sent — please try again.", "error");
      });
    });

    if (prefill) f.req.value = String(prefill).slice(0, 5000);
    document.body.appendChild(overlay);
    f.name.focus();
    open = { close: close };
  }

  // Capture phase: runs before the button's inline onclick (which only switches tab).
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#tab3-list .list-item a.btn");
    if (!btn) return;
    var item = btn.closest(".list-item");
    e.preventDefault(); e.stopPropagation();
    openRequestDialog(item ? nameOf(item) : "");
  }, true);

  window.openServiceRequest = openRequestDialog;

  /* ---------------- accurate contact-form submission ---------------- */
  var sending = false;
  var originalSendToAdmin = window.sendToAdmin;

  window.sendToAdmin = function () {
    if (typeof validateForm !== "function" || typeof getFormValues !== "function" ||
        !window.CMSApi || typeof window.CMSApi.submitContactMessage !== "function") {
      return typeof originalSendToAdmin === "function" ? originalSendToAdmin.apply(this, arguments) : undefined;
    }
    if (sending) return;                    // duplicate-click protection
    if (!validateForm()) return;
    var v = getFormValues();
    sending = true;
    var btn = document.querySelector("#contactForm button[onclick*='sendToAdmin']");
    if (btn) btn.disabled = true;

    window.CMSApi.submitContactMessage({ name: v.name, contactInfo: v.contactInfo, message: v.message })
      .then(function (result) {
        if (result && result.ok) {
          if (typeof submitToGoogleSheets === "function") submitToGoogleSheets(v.name, v.contactInfo, v.message);
          if (typeof showToast === "function") showToast("Request sent \u2713 We'll reply within 24 hours!");
          setTimeout(function () { window.location.href = "thank-you.html"; }, 1500);
        } else {
          sending = false; if (btn) btn.disabled = false;
          if (typeof showToast === "function") showToast("We could not send your message. Please try again or use WhatsApp.");
        }
      })
      .catch(function () {
        sending = false; if (btn) btn.disabled = false;
        if (typeof showToast === "function") showToast("Network problem — your message was not sent.");
      });
  };

  /* ---------------- WhatsApp / Email buttons: open the app only ----------------
   * Originally these also saved the enquiry (and so e-mailed the admin) the moment they were
   * tapped, before the visitor had actually sent anything. They now only open WhatsApp / the mail
   * app with the message filled in. Only "Submit Request" saves to the database and notifies. */
  window.sendToWhatsAppWithForm = function () {
    if (typeof validateForm !== "function" || !validateForm()) return;
    var v = getFormValues();
    var s = window.CMS && window.CMS.siteSettings;
    var number = (s && s.whatsapp ? s.whatsapp : "+2348028699824").replace(/[^\d+]/g, "");
    var text = "Hello CUDFIRM,\n\nName: " + v.name + "\nContact: " + v.contactInfo + "\n\nMessage:\n" + v.message;
    window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  };

  window.sendToEmail = function () {
    if (typeof validateForm !== "function" || !validateForm()) return;
    var v = getFormValues();
    var subject = encodeURIComponent("Website Quote Request \u2014 CUDFIRM");
    var body = encodeURIComponent("Name: " + v.name + "\nContact Info: " + v.contactInfo + "\n\nMessage:\n" + v.message);
    window.location.href = "mailto:cudfirm@gmail.com?subject=" + subject + "&body=" + body;
  };
})();