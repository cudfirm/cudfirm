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
 * ------------------------------------------------------------------
 */

(function () {
  const LOGIN_PATH = "index.html";

  async function guard() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data || !data.session) {
        window.location.replace(LOGIN_PATH);
        return;
      }

      window.dashUser = data.session.user;
      document.documentElement.classList.add("auth-ready");
      document.dispatchEvent(new CustomEvent("dash:authenticated", { detail: window.dashUser }));
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
