/**
 * CUDFIRM client portal (optional accounts; public browsing never requires it).
 * Reuses the Member Accounts Edge Functions (register / sign-in) and the existing Supabase
 * Auth session. Every read/write below is enforced by Row-Level Security and storage
 * policies from migration 018 — hiding UI here is a convenience, never the protection.
 * All dynamic text is inserted with textContent (no innerHTML) to prevent injection.
 */
(function () {
  "use strict";

  var db = window.supabaseClient;
  var cfg = window.CUDFIRM_PORTAL || {};
  var root = document.getElementById("cpRoot");
  var logoutBtn = document.getElementById("cpLogout");
  var fnBase = window.CUDFIRMSupabase && window.CUDFIRMSupabase.projectUrl
    ? window.CUDFIRMSupabase.projectUrl.replace(/\/$/, "") + "/functions/v1/" : null;
  var anon = (function () { try { return typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : ""; } catch (e) { return ""; } })();

  var MAX_FILE = 10 * 1024 * 1024;
  var FILE_TYPES = {
    "application/pdf": 1, "image/png": 1, "image/jpeg": 1, "image/webp": 1, "text/plain": 1, "text/csv": 1,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 1,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 1,
  };
  var PROJECT_STATUS = {
    request_received: "Request received", under_review: "Under review", awaiting_approval: "Awaiting approval",
    awaiting_client_materials: "Awaiting your materials", in_progress: "In progress", in_review: "In review",
    completed: "Completed", cancelled: "Cancelled",
  };
  var REQUEST_STATUS = {
    new: "New", under_review: "Under review", awaiting_client: "Awaiting your response", approved: "Approved",
    in_progress: "In progress", completed: "Completed", declined: "Declined", cancelled: "Cancelled",
  };
  var WAITING = { awaiting_approval: 1, awaiting_client_materials: 1, awaiting_client: 1 };

  var state = { user: null, member: null, projects: [], requests: [], token: "" };
  var recovering = false;   // set while the user is choosing a new password after a reset link

  /* ---------- tiny DOM helper ---------- */
  function h(tag, props) {
    var n = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null) return;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) { c.forEach(function (x) { if (x != null && x !== false) n.appendChild(typeof x === "string" ? document.createTextNode(x) : x); }); continue; }
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  }
  function mount() { root.textContent = ""; for (var i = 0; i < arguments.length; i++) root.appendChild(arguments[i]); }
  function when(iso) { try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } }
  function day(d) { try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { dateStyle: "medium" }); } catch (e) { return d; } }
  function msg() { return h("p", { class: "cp-msg", role: "status", "aria-live": "polite" }); }
  function say(el, text, st) { el.textContent = text; el.dataset.state = st || ""; }
  function fn(name, body, token) {
    if (!fnBase) return Promise.reject(new Error("unavailable"));
    var headers = { "Content-Type": "application/json", apikey: anon };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(fnBase + name, { method: "POST", headers: headers, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, status: r.status, body: b }; }); });
  }

  /* ---------- claim token (secure link to attach an anonymous request) ---------- */
  function captureClaim() {
    var p = new URLSearchParams(location.search);
    var t = p.get("claim");
    if (t) {
      try { sessionStorage.setItem("cudfirm_claim", t); } catch (e) { /* ignore */ }
      p.delete("claim");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
    }
  }
  function redeemClaim() {
    var t = null;
    try { t = sessionStorage.getItem("cudfirm_claim"); sessionStorage.removeItem("cudfirm_claim"); } catch (e) { /* ignore */ }
    if (!t) return Promise.resolve(null);
    return db.rpc("redeem_request_claim", { p_token: t }).then(function (r) {
      return r.error ? { error: "That link is invalid or has expired. Ask CUDFIRM for a new one." }
                     : { ok: "Your earlier request is now linked to your account." };
    });
  }

  /* ---------- auth views ---------- */
  function authView(startTab, notice) {
    var tab = startTab || "signin";
    var settings = null;
    var card = h("section", { class: "cp-card" });
    var out = msg();

    function render() {
      card.textContent = "";
      var tabs = h("div", { class: "cp-tabs", role: "tablist" },
        ["signin|Log in", "register|Create account", "reset|Forgot password"].map(function (s) {
          var p = s.split("|");
          return h("button", { class: "cp-tab", role: "tab", type: "button", "aria-selected": String(tab === p[0]),
            onclick: function () { tab = p[0]; render(); } }, p[1]);
        }));
      card.appendChild(h("h1", { text: "Client portal" }));
      card.appendChild(h("p", { class: "cp-muted", text: "Optional. You never need an account to browse CUDFIRM or request a service." }));
      card.appendChild(tabs);
      card.appendChild(tab === "signin" ? signIn() : tab === "register" ? register() : reset());
      out = card.querySelector(".cp-msg");
      if (notice) { say(out, notice.text, notice.state); notice = null; }
    }

    function signIn() {
      var f = h("form", { novalidate: "novalidate" },
        h("label", { for: "si-email", text: "Email" }), h("input", { id: "si-email", type: "email", required: "required", autocomplete: "email" }),
        h("label", { for: "si-pass", text: "Password" }), h("input", { id: "si-pass", type: "password", required: "required", autocomplete: "current-password" }),
        h("div", { class: "cp-row", style: "margin-top:1rem" }, h("button", { class: "cp-btn", type: "submit", text: "Log in" })), msg());
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = f.querySelector("button"), m = f.querySelector(".cp-msg");
        var email = f.querySelector("#si-email").value.trim(), pass = f.querySelector("#si-pass").value;
        if (!email || !pass) return say(m, "Enter your email and password.", "error");
        btn.disabled = true; say(m, "Signing in…");
        fn("member-sign-in", { email: email, password: pass }).then(function (r) {
          if (!r.ok || !r.body.session) { btn.disabled = false; return say(m, r.status === 429 ? "Too many attempts. Try again later." : (r.body.message || "Sign-in failed. Check your details."), "error"); }
          var s = r.body.session;
          return db.auth.setSession({ access_token: s.accessToken, refresh_token: s.refreshToken }).then(boot);
        }).catch(function () { btn.disabled = false; say(m, "Network problem. Please try again.", "error"); });
      });
      return f;
    }

    function register() {
      var wrap = h("div", null, h("p", { class: "cp-muted", text: "Checking availability…" }));
      db.from("member_settings").select("enabled,public_registration,captcha_enabled,terms_version,privacy_version").limit(1).maybeSingle()
        .then(function (r) {
          settings = r.data;
          wrap.textContent = "";
          if (!settings || !settings.enabled || !settings.public_registration) {
            wrap.appendChild(h("p", { text: "Self-service registration is not open at the moment. If you are a CUDFIRM client, ask us for an invitation. You can still request services without an account." }));
            return;
          }
          if (settings.captcha_enabled && !cfg.turnstileSiteKey) {
            wrap.appendChild(h("p", { text: "Registration is temporarily unavailable while bot protection is being configured." }));
            return;
          }
          wrap.appendChild(registerForm());
        }).catch(function () { wrap.textContent = "Registration is unavailable right now."; });
      return wrap;
    }

    function registerForm() {
      var captchaBox = settings.captcha_enabled ? h("div", { id: "cp-captcha", style: "margin-top:.8rem" }) : null;
      var f = h("form", { novalidate: "novalidate" },
        h("label", { for: "rg-name", text: "Your name" }), h("input", { id: "rg-name", required: "required", maxlength: "80", autocomplete: "name" }),
        h("label", { for: "rg-email", text: "Email" }), h("input", { id: "rg-email", type: "email", required: "required", autocomplete: "email" }),
        h("label", { for: "rg-pass", text: "Password (8+ characters)" }), h("input", { id: "rg-pass", type: "password", required: "required", minlength: "8", maxlength: "128", autocomplete: "new-password" }),
        h("label", { class: "cp-check" }, h("input", { id: "rg-terms", type: "checkbox" }), h("span", null, "I accept the ", h("a", { href: cfg.termsUrl || "../terms.html", target: "_blank", rel: "noopener" }, "Terms of Service"))),
        h("label", { class: "cp-check" }, h("input", { id: "rg-priv", type: "checkbox" }), h("span", null, "I accept the ", h("a", { href: cfg.privacyUrl || "../terms.html", target: "_blank", rel: "noopener" }, "Privacy Policy"))),
        captchaBox,
        h("div", { class: "cp-row", style: "margin-top:1rem" }, h("button", { class: "cp-btn", type: "submit", text: "Create account" })), msg());
      var token = "";
      if (captchaBox) loadTurnstile(captchaBox, function (t) { token = t; });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = f.querySelector(".cp-msg"), btn = f.querySelector("button");
        var name = f.querySelector("#rg-name").value.trim(), email = f.querySelector("#rg-email").value.trim(), pass = f.querySelector("#rg-pass").value;
        if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || pass.length < 8) return say(m, "Enter your name, a valid email and a password of 8+ characters.", "error");
        if (!f.querySelector("#rg-terms").checked || !f.querySelector("#rg-priv").checked) return say(m, "Please accept the Terms and Privacy Policy.", "error");
        if (settings.captcha_enabled && !token) return say(m, "Please complete the bot-protection check.", "error");
        btn.disabled = true; say(m, "Creating your account…");
        fn("member-register", { email: email, password: pass, displayName: name, termsAccepted: true, privacyAccepted: true,
          termsVersion: settings.terms_version, privacyVersion: settings.privacy_version, captchaToken: token, returnTo: "/account/" })
          .then(function (r) {
            btn.disabled = false;
            if (r.ok) { f.reset(); return say(m, "Check your email to verify your address. After verifying, your account may need approval before you can log in.", "ok"); }
            say(m, r.body.message || "Registration failed.", "error");
          }).catch(function () { btn.disabled = false; say(m, "Network problem. Please try again.", "error"); });
      });
      return f;
    }

    function reset() {
      var f = h("form", { novalidate: "novalidate" },
        h("label", { for: "rs-email", text: "Account email" }), h("input", { id: "rs-email", type: "email", required: "required", autocomplete: "email" }),
        h("div", { class: "cp-row", style: "margin-top:1rem" }, h("button", { class: "cp-btn", type: "submit", text: "Email me a reset link" })), msg());
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = f.querySelector(".cp-msg"), email = f.querySelector("#rs-email").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say(m, "Enter a valid email address.", "error");
        db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function () {
          say(m, "If an account exists for that address, a reset link has been sent.", "ok"); // same answer either way
        });
      });
      return f;
    }
    render();
    mount(card);
  }

  function loadTurnstile(box, onToken) {
    function draw() { window.turnstile.render(box, { sitekey: cfg.turnstileSiteKey, callback: onToken, "expired-callback": function () { onToken(""); } }); }
    if (window.turnstile) return draw();
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.onload = draw;
    document.head.appendChild(s);
  }

  function newPasswordView() {
    var f = h("form", { class: "cp-card", novalidate: "novalidate" },
      h("h1", { text: "Choose a new password" }),
      h("label", { for: "np", text: "New password (8+ characters)" }), h("input", { id: "np", type: "password", minlength: "8", maxlength: "128", autocomplete: "new-password" }),
      h("div", { class: "cp-row", style: "margin-top:1rem" }, h("button", { class: "cp-btn", type: "submit", text: "Save password" })), msg());
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = f.querySelector(".cp-msg"), v = f.querySelector("#np").value;
      if (v.length < 8) return say(m, "Use at least 8 characters.", "error");
      db.auth.updateUser({ password: v }).then(function (r) {
        if (r.error) return say(m, "Could not update the password. The link may have expired.", "error");
        say(m, "Password updated.", "ok"); setTimeout(function () { recovering = false; boot(); }, 800);
      });
    });
    mount(f);
  }

  /* ---------- data ---------- */
  function load() {
    return Promise.all([
      db.from("member_profiles").select("display_name,status").eq("user_id", state.user.id).maybeSingle(),
      db.from("client_projects").select("*").order("updated_at", { ascending: false }),
      db.from("my_service_requests").select("*").order("created_at", { ascending: false }),
    ]).then(function (r) {
      state.member = r[0].data; state.projects = r[1].data || []; state.requests = r[2].data || [];
    });
  }

  /* ---------- portal views ---------- */
  function shell(active, body, note) {
    var nav = h("div", { class: "cp-tabs", role: "tablist" },
      ["overview|Overview", "projects|Projects", "requests|Requests", "profile|Profile"].map(function (s) {
        var p = s.split("|");
        return h("button", { class: "cp-tab", role: "tab", type: "button", "aria-selected": String(active === p[0]), onclick: function () { go(p[0]); } }, p[1]);
      }));
    mount(h("section", { class: "cp-card" }, h("h1", { text: "Welcome, " + ((state.member && state.member.display_name) || "client") }),
      h("p", { class: "cp-muted", text: "Everything here is private to your account." }),
      h("div", { class: "cp-actions" },
        h("button", { class: "cp-btn", type: "button", onclick: function () { go("new"); } }, "+ Request a new project"),
        h("a", { class: "cp-btn is-ghost", href: "../index.html" }, "Visit website")),
      note ? h("p", { class: "cp-msg", "data-state": note.state, text: note.text }) : null), nav, body);
  }
  function go(view, arg, note) {
    if (view === "overview") return overview(note);
    if (view === "projects") return projectList(note);
    if (view === "project") return projectDetail(arg, note);
    if (view === "requests") return requestList(note);
    if (view === "profile") return profile(note);
    if (view === "new") return requestView();
  }

  function statusPill(map, s) { return h("span", { class: "cp-pill" + (WAITING[s] ? " is-wait" : ""), text: map[s] || s }); }

  function overview(note) {
    var active = state.projects.filter(function (p) { return p.status !== "completed" && p.status !== "cancelled"; });
    var pending = state.requests.filter(function (r) { return r.status !== "completed" && r.status !== "cancelled" && r.status !== "declined"; });
    var actions = state.projects.filter(function (p) { return WAITING[p.status]; });
    var body = h("div", null,
      h("div", { class: "cp-grid" },
        h("div", { class: "cp-stat" }, h("b", { text: String(active.length) }), "Active projects"),
        h("div", { class: "cp-stat" }, h("b", { text: String(pending.length) }), "Open service requests"),
        h("div", { class: "cp-stat" }, h("b", { text: String(state.projects.length) }), "Projects in total")),
      h("section", { class: "cp-card", style: "margin-top:1rem" }, h("h2", { text: "Needs your attention" }), actions.length
        ? h("ul", { class: "cp-list" }, actions.map(function (p) { return h("li", { class: "cp-item" }, h("button", { class: "cp-open", type: "button", onclick: function () { go("project", p.id); } }, h("strong", { text: p.title }), " ", statusPill(PROJECT_STATUS, p.status))); }))
        : h("p", { class: "cp-muted", text: "Nothing is waiting on you." })),
      h("section", { class: "cp-card" }, h("h2", { text: "Recent activity" }), h("div", { id: "cpRecent", class: "cp-muted" }, "Loading…")));
    shell("overview", body, note);
    if (!state.projects.length) { document.getElementById("cpRecent").textContent = "No project activity yet."; return; }
    var ids = state.projects.map(function (p) { return p.id; });
    Promise.all([
      db.from("project_messages").select("project_id,sender_role,kind,body,created_at,read_by_client_at").in("project_id", ids).order("created_at", { ascending: false }).limit(5),
      db.from("project_files").select("project_id,file_name,uploader_role,created_at").in("project_id", ids).order("created_at", { ascending: false }).limit(5),
    ]).then(function (r) {
      var box = document.getElementById("cpRecent"); if (!box) return; box.textContent = "";
      var msgs = r[0].data || [], files = r[1].data || [];
      if (!msgs.length && !files.length) return (box.textContent = "No project activity yet.");
      var list = h("ul", { class: "cp-list" });
      msgs.forEach(function (m) { list.appendChild(h("li", { class: "cp-item" }, h("strong", { text: m.kind === "update" ? "Progress update" : (m.sender_role === "admin" ? "Message from CUDFIRM" : "Your message") }), h("div", { text: m.body.length > 140 ? m.body.slice(0, 140) + "…" : m.body }), h("small", { class: "cp-muted", text: when(m.created_at) }))); });
      files.forEach(function (f) { list.appendChild(h("li", { class: "cp-item" }, h("strong", { text: "File: " + f.file_name }), h("small", { class: "cp-muted", text: " " + (f.uploader_role === "admin" ? "from CUDFIRM" : "uploaded by you") + " · " + when(f.created_at) }))); });
      box.appendChild(list);
    });
  }

  function projectList(note) {
    shell("projects", h("section", { class: "cp-card" }, h("h2", { text: "Your projects" }), state.projects.length
      ? h("ul", { class: "cp-list" }, state.projects.map(function (p) {
        return h("li", { class: "cp-item" }, h("button", { class: "cp-open", type: "button", onclick: function () { go("project", p.id); } },
          h("div", { class: "cp-row" }, h("strong", { text: p.title }), statusPill(PROJECT_STATUS, p.status)),
          h("div", { class: "cp-muted", text: (p.service_name || "") + (p.expected_completion ? " · expected " + day(p.expected_completion) : "") })));
      }))
      : h("div", { class: "cp-empty" }, h("p", { class: "cp-muted", text: "No projects yet. Send a request and, once CUDFIRM starts work, your project appears here." }), h("button", { class: "cp-btn", type: "button", onclick: function () { go("new"); } }, "+ Request a new project"))), note);
  }

  function requestList(note) {
    shell("requests", h("section", { class: "cp-card" }, h("h2", { text: "Service requests linked to your account" }), state.requests.length
      ? h("ul", { class: "cp-list" }, state.requests.map(function (r) {
        return h("li", { class: "cp-item" }, h("div", { class: "cp-row" }, h("strong", { text: r.service_name }), statusPill(REQUEST_STATUS, r.status)),
          h("div", { class: "cp-muted", text: r.reference + " · submitted " + when(r.created_at) }), h("div", { text: r.requirements.length > 200 ? r.requirements.slice(0, 200) + "…" : r.requirements }));
      }))
      : h("div", { class: "cp-empty" }, h("p", { class: "cp-muted", text: "No requests yet. Requests you send while logged in appear here. Older requests sent without an account are linked only through a secure link from CUDFIRM." }), h("button", { class: "cp-btn", type: "button", onclick: function () { go("new"); } }, "+ Request a new project"))), note);
  }

  function profile(note) {
    var f = h("form", { class: "cp-card", novalidate: "novalidate" }, h("h2", { text: "Profile" }),
      h("label", { for: "pf-name", text: "Display name" }), h("input", { id: "pf-name", maxlength: "80", value: (state.member && state.member.display_name) || "" }),
      h("p", { class: "cp-muted", text: "Signed in as " + (state.user.email || "") }),
      h("div", { class: "cp-row" }, h("button", { class: "cp-btn", type: "submit", text: "Save" })), msg());
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = f.querySelector(".cp-msg"), v = f.querySelector("#pf-name").value.trim();
      if (v.length < 2) return say(m, "Name must be at least 2 characters.", "error");
      db.rpc("update_own_member_display_name", { p_display_name: v }).then(function (r) {
        if (r.error) return say(m, "Could not save your name.", "error");
        state.member.display_name = v; say(m, "Saved.", "ok");
      });
    });
    shell("profile", f, note);
  }

  function projectDetail(id, note) {
    var p = state.projects.filter(function (x) { return x.id === id; })[0];
    if (!p) return go("projects");
    var holder = h("div", null, h("p", { class: "cp-muted", text: "Loading project…" }));
    shell("projects", holder, note);
    Promise.all([
      db.from("project_milestones").select("*").eq("project_id", id).order("position"),
      db.from("project_messages").select("*").eq("project_id", id).order("created_at"),
      db.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]).then(function (r) {
      var ms = r[0].data || [], msgs = r[1].data || [], files = r[2].data || [];
      holder.textContent = "";
      var done = ms.filter(function (m) { return m.completed_at; }).length;
      holder.appendChild(h("section", { class: "cp-card" },
        h("button", { class: "cp-link", type: "button", onclick: function () { go("projects"); } }, "← All projects"),
        h("h2", { text: p.title, style: "margin-top:.6rem" }), statusPill(PROJECT_STATUS, p.status),
        p.service_name ? h("p", { class: "cp-muted", text: "Service: " + p.service_name }) : null,
        p.description ? h("p", { text: p.description, style: "white-space:pre-wrap" }) : null,
        h("p", { class: "cp-muted", text: [p.start_date ? "Started " + day(p.start_date) : "", p.expected_completion ? "Expected " + day(p.expected_completion) : "", p.completed_at ? "Completed " + when(p.completed_at) : ""].filter(Boolean).join(" · ") || "No dates recorded yet." })));
      holder.appendChild(h("section", { class: "cp-card" }, h("h2", { text: "Milestones" }), ms.length
        ? h("div", null, h("p", { class: "cp-muted", text: done + " of " + ms.length + " completed" }), h("ul", { class: "cp-list" }, ms.map(function (m) {
          return h("li", { class: "cp-item cp-ms" }, h("span", { class: m.completed_at ? "done" : "", text: m.completed_at ? "✓" : "○" }),
            h("div", null, h("strong", { text: m.title }), m.due_date ? h("div", { class: "cp-muted", text: "Due " + day(m.due_date) + (m.completed_at ? " · done " + day(m.completed_at.slice(0, 10)) : "") }) : null));
        })))
        : h("p", { class: "cp-muted", text: "No milestones have been recorded yet." })));
      holder.appendChild(threadCard(id, msgs));
      holder.appendChild(filesCard(id, files));
      if (msgs.some(function (m) { return m.sender_role === "admin" && !m.read_by_client_at; })) db.rpc("mark_project_messages_read", { p_project_id: id });
    });
  }

  function threadCard(id, msgs) {
    var thread = h("div", { class: "cp-thread", role: "log", "aria-live": "polite" });
    function add(m) {
      var me = m.sender_role === "client";
      thread.appendChild(h("div", { class: "cp-bubble " + (m.kind === "update" ? "update" : me ? "me" : "them") },
        m.kind === "update" ? h("strong", { text: "Progress update" }) : null, m.kind === "update" ? h("br") : null, m.body,
        h("small", { text: (m.kind === "update" ? "CUDFIRM" : me ? "You" : "CUDFIRM") + " · " + when(m.created_at) })));
      thread.scrollTop = thread.scrollHeight;
    }
    msgs.forEach(add);
    var ta = h("textarea", { id: "cp-msg", maxlength: "5000", "aria-label": "Message to CUDFIRM", placeholder: "Write a message…" });
    var out = msg(), sending = false;
    var form = h("form", { novalidate: "novalidate" }, ta, h("div", { class: "cp-row", style: "margin-top:.6rem" }, h("button", { class: "cp-btn", type: "submit", text: "Send" })), out);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var body = ta.value.trim();
      if (!body || sending) return;
      sending = true; form.querySelector("button").disabled = true;
      db.from("project_messages").insert({ project_id: id, sender_id: state.user.id, sender_role: "client", kind: "message", body: body })
        .select().single().then(function (r) {
          sending = false; form.querySelector("button").disabled = false;
          if (r.error) return say(out, "Your message could not be sent.", "error");
          ta.value = ""; say(out, "", ""); add(r.data);
        });
    });
    return h("section", { class: "cp-card" }, h("h2", { text: "Messages & updates" }),
      msgs.length ? null : h("p", { class: "cp-muted", text: "No messages yet." }), thread, form);
  }

  function filesCard(id, files) {
    var list = h("ul", { class: "cp-list" });
    var out = msg();
    function row(f) {
      var mine = f.uploader_role === "client" && f.uploader_id === state.user.id;
      var li = h("li", { class: "cp-item cp-row" },
        h("div", null, h("strong", { text: f.file_name }), h("div", { class: "cp-muted", text: (f.uploader_role === "admin" ? "From CUDFIRM" : "Uploaded by you") + " · " + when(f.created_at) })),
        h("div", null,
          h("button", { class: "cp-btn is-ghost", type: "button", onclick: function () {
            db.storage.from("project-files").createSignedUrl(f.storage_path, 60).then(function (r) {
              if (r.error || !r.data) return say(out, "Could not open the file.", "error");
              var a = document.createElement("a"); a.href = r.data.signedUrl; a.target = "_blank"; a.rel = "noopener"; a.click();
            });
          } }, "Download"), " ",
          mine ? h("button", { class: "cp-btn is-danger", type: "button", onclick: function () {
            if (!confirm("Delete " + f.file_name + "?")) return;
            db.storage.from("project-files").remove([f.storage_path]).then(function (s) {
              if (s.error) return say(out, "Could not delete the file.", "error");
              db.from("project_files").delete().eq("id", f.id).then(function (d) { if (d.error) return say(out, "Could not delete the record.", "error"); li.remove(); });
            });
          } }, "Delete") : null));
      list.appendChild(li);
    }
    files.forEach(row);
    var input = h("input", { type: "file", id: "cp-file", accept: ".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.docx,.xlsx", "aria-label": "Choose a file to upload" });
    var up = h("button", { class: "cp-btn", type: "button", text: "Upload" });
    up.addEventListener("click", function () {
      var file = input.files && input.files[0];
      if (!file) return say(out, "Choose a file first.", "error");
      if (!FILE_TYPES[file.type]) return say(out, "That file type is not allowed. Use PDF, PNG, JPG, WebP, TXT, CSV, DOCX or XLSX.", "error");
      if (file.size > MAX_FILE) return say(out, "Files must be 10 MB or smaller.", "error");
      var safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120) || "file";
      var rand = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).slice(0, 12);
      var path = id + "/" + rand + "-" + safe;
      up.disabled = true; say(out, "Uploading…");
      db.storage.from("project-files").upload(path, file, { contentType: file.type, upsert: false }).then(function (r) {
        if (r.error) { up.disabled = false; return say(out, "Upload failed.", "error"); }
        return db.from("project_files").insert({ project_id: id, storage_path: path, file_name: file.name.slice(0, 255), mime_type: file.type, size_bytes: file.size, uploader_id: state.user.id, uploader_role: "client" })
          .select().single().then(function (ins) {
            up.disabled = false;
            if (ins.error) { db.storage.from("project-files").remove([path]); return say(out, "Upload could not be recorded.", "error"); }
            input.value = ""; say(out, "Uploaded.", "ok"); row(ins.data);
          });
      });
    });
    return h("section", { class: "cp-card" }, h("h2", { text: "Files" }),
      files.length ? null : h("p", { class: "cp-muted", text: "No files yet." }), list,
      h("div", { style: "margin-top:.8rem" }, h("label", { for: "cp-file", text: "Add a file (max 10 MB)" }), input, h("div", { class: "cp-row", style: "margin-top:.6rem" }, up)), out);
  }


  function requestView() {
    var out = msg(), sending = false, token = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null;
    var select = h("select", { id: "nr-service", "aria-label": "Service" }, h("option", { value: "Website design", text: "Loading services…" }));
    var details = h("textarea", { id: "nr-details", maxlength: "5000", placeholder: "Tell us what you need, e.g. a website for my bakery with an online menu." });
    var timeline = h("input", { id: "nr-time", maxlength: "200", placeholder: "Optional, e.g. within 3 weeks" });
    var budget = h("input", { id: "nr-budget", maxlength: "120", placeholder: "Optional" });
    function fill(names) {
      select.textContent = "";
      names.concat(["Something else / not sure yet"]).forEach(function (n) { select.appendChild(h("option", { value: n, text: n })); });
    }
    fill(["Website design"]);
    db.from("services").select("name").eq("status", "published").order("sort_order").then(function (r) {
      if (!r.error && r.data && r.data.length) fill(r.data.map(function (x) { return x.name; }));
    });
    var form = h("form", { class: "cp-card", novalidate: "novalidate" },
      h("button", { class: "cp-link", type: "button", onclick: function () { go("overview"); } }, "← Back"),
      h("h2", { text: "Request a new project", style: "margin-top:.6rem" }),
      h("p", { class: "cp-muted", text: "This sends CUDFIRM a request, not a confirmed booking. We review it and reply." }),
      h("label", { for: "nr-service", text: "Service" }), select,
      h("label", { for: "nr-details", text: "What do you need?" }), details,
      h("label", { for: "nr-time", text: "Preferred timeline (optional)" }), timeline,
      h("label", { for: "nr-budget", text: "Budget (optional)" }), budget,
      h("div", { class: "cp-row", style: "margin-top:1rem" }, h("button", { class: "cp-btn", type: "submit", text: "Send request" })), out);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      if (!details.value.trim()) return say(out, "Please describe what you need.", "error");
      sending = true; form.querySelector("button[type=submit]").disabled = true; say(out, "Sending…");
      fn("service-request", {
        name: (state.member && state.member.display_name) || "Client", email: state.user.email, service: select.value,
        requirements: details.value, timeline: timeline.value, budget: budget.value, clientToken: token, website: "",
      }, state.token).then(function (r) {
        if (r.ok && r.body && r.body.ok) {
          return db.from("my_service_requests").select("*").order("created_at", { ascending: false }).then(function (q) {
            state.requests = q.data || [];
            go("requests", null, { text: "Request sent." + (r.body.reference ? " Reference " + r.body.reference + "." : "") + " CUDFIRM will review it and reply. This is not yet a confirmed booking.", state: "ok" });
          });
        }
        sending = false; form.querySelector("button[type=submit]").disabled = false;
        say(out, r.status === 429 ? "Too many requests. Please try again later." : "Your request could not be sent. Please try again.", "error");
      }).catch(function () { sending = false; form.querySelector("button[type=submit]").disabled = false; say(out, "Network problem. Please try again.", "error"); });
    });
    shell("overview", form);
  }

  /* ---------- boot ---------- */
  function boot() {
    if (recovering) return;
    if (!db) return mount(h("section", { class: "cp-card" }, h("p", { text: "The portal is not configured for this site." })));
    captureClaim();
    db.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      logoutBtn.hidden = !session;
      if (!session) return authView("signin");
      state.user = session.user; state.token = session.access_token;
      return load().then(function () {
        if (!state.member || state.member.status !== "active") {
          var st = state.member && state.member.status;
          logoutBtn.hidden = false;
          return mount(h("section", { class: "cp-card" }, h("h1", { text: "Account not active yet" }), h("p", {
            text: st === "pending_verification" ? "Please verify your email address first." : st === "pending_approval" ? "Your account is waiting for approval by CUDFIRM." : st === "suspended" ? "This account is suspended. Please contact CUDFIRM." : "This account has no client portal access.",
          })));
        }
        return redeemClaim().then(function (res) {
          return (res && res.ok ? load() : Promise.resolve()).then(function () {
            go("overview", null, res ? { text: res.ok || res.error, state: res.ok ? "ok" : "error" } : null);
          });
        });
      });
    });
  }

  logoutBtn.addEventListener("click", function () { db && db.auth.signOut().then(function () { state = { user: null, member: null, projects: [], requests: [], token: "" }; boot(); }); });
  if (db) db.auth.onAuthStateChange(function (event) { if (event === "PASSWORD_RECOVERY") { recovering = true; newPasswordView(); } });
  boot();
})();