/**
 * dashboard/js/auth-guard.js
 * ------------------------------------------------------------------
 * Runs on every protected dashboard page (everything except
 * dashboard/index.html, the login page).
 *
 * Relies on the SAME supabaseClient created in ../js/supabase.js
 * (loaded before this file — see the <script> order in each page).
 *
 * Behaviour:
 *  - No session found      -> redirect to dashboard login
 *  - Session found         -> reveal the page, expose window.dashUser
 *  - Session expires later -> onAuthStateChange bounces back to login
 *
 * ------------------------------------------------------------------
 * WHY DashAuth.onReady() EXISTS (read before touching this file)
 * ------------------------------------------------------------------
 * `supabaseClient.auth.getSession()` resolves from local storage as a
 * microtask — almost instantly. Because auth-guard.js is a plain,
 * non-deferred <script>, its `await` continuation (where we used to
 * fire a one-shot `dash:authenticated` CustomEvent) can run BEFORE
 * the browser has even fetched the later <script src> tags on the
 * page (layout.js, dashboard-api.js, and finally each page's own
 * inline listener) — those each require a separate network/cache
 * fetch, which is slower than a microtask. A plain
 * `dispatchEvent`/`addEventListener` pair loses the event in that
 * case, since dispatch doesn't replay for listeners that subscribe
 * late. `DashAuth.onReady(cb)` fixes this: if auth already resolved,
 * `cb` runs immediately; otherwise it's queued and flushed the
 * instant auth resolves — correct regardless of script load timing.
 * ------------------------------------------------------------------
 */

(function () {
  const LOGIN_PATH = "index.html";

  window.DashAuth = {
    ready: false,
    user: null,
    profile: null,
    _callbacks: [],
    onReady(cb) {
      if (this.ready) {
        cb(this.user, this.profile);
      } else {
        this._callbacks.push(cb);
      }
    },
  };

  function notifyReady(user, profile) {
    window.dashUser = user;
    window.DashAuth.user = user;
    window.DashAuth.profile = profile;
    if (window.DashPermissions) window.DashPermissions.setProfile(profile);
    window.DashAuth.ready = true;
    document.documentElement.classList.add("auth-ready");

    const queued = window.DashAuth._callbacks.splice(0);
    queued.forEach((cb) => cb(user, profile));

    // Kept for backwards compatibility with anything else listening
    // for this event; DashAuth.onReady() above is the reliable path.
    document.dispatchEvent(new CustomEvent("dash:authenticated", { detail: { user, profile } }));
  }

  async function guard() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data || !data.session) {
        window.location.replace(LOGIN_PATH);
        return;
      }

      const user = data.session.user;
      const { data: profile, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("id,email,full_name,role,is_active,created_at,updated_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.is_active === false) {
        console.error("[dashboard] profile check failed:", profileError || "inactive profile");
        try {
          await supabaseClient.rpc("record_auth_security_event", {
            p_event_type: "access_denied",
            p_email: user.email || null,
            p_success: false,
            p_details: { reason: profile && profile.is_active === false ? "suspended_profile" : "profile_unavailable" },
            p_user_agent: navigator.userAgent || null,
          });
        } catch (auditError) {
          console.warn("[security] denied-access event was not recorded:", auditError);
        }
        await supabaseClient.auth.signOut();
        window.location.replace(LOGIN_PATH + "?error=access");
        return;
      }

      if (window.DashPermissions) {
        window.DashPermissions.setProfile(profile);
        if (!window.DashPermissions.canAccessPage()) {
          window.location.replace("home.html?error=permission");
          return;
        }
      }

      notifyReady(user, profile);
    } catch (err) {
      console.error("[dashboard] auth check failed:", err);
      window.location.replace(LOGIN_PATH);
    }
  }

  // If the session disappears while the admin is on a page, bounce them out.
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      window.location.replace(LOGIN_PATH);
    }
  });

  guard();
})();
