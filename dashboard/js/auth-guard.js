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
    _callbacks: [],
    onReady(cb) {
      if (this.ready) {
        cb(this.user);
      } else {
        this._callbacks.push(cb);
      }
    },
  };

  function notifyReady(user) {
    window.dashUser = user;
    window.DashAuth.user = user;
    window.DashAuth.ready = true;
    document.documentElement.classList.add("auth-ready");

    const queued = window.DashAuth._callbacks.splice(0);
    queued.forEach((cb) => cb(user));

    // Kept for backwards compatibility with anything else listening
    // for this event; DashAuth.onReady() above is the reliable path.
    document.dispatchEvent(new CustomEvent("dash:authenticated", { detail: user }));
  }

  async function guard() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data || !data.session) {
        window.location.replace(LOGIN_PATH);
        return;
      }

      notifyReady(data.session.user);
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
