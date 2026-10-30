const UsersPage = (() => {
  let rows = [];
  const ROLES = ["super_admin", "admin", "editor", "viewer"];

  async function init() {
    const root = document.getElementById("page-content");
    if (!root) {
      console.error("[users] page-content was not created by the dashboard layout.");
      return;
    }

    // AuthGuard has already protected users.html. Re-sync the shared
    // permission helper from DashAuth before checking access so a slow
    // profile/UI initialization can never leave this page silently blank.
    const profile = (window.DashAuth && window.DashAuth.profile) || window.dashProfile || null;
    if (profile && window.DashPermissions) {
      DashPermissions.setProfile(profile);
    }

    const isSuperAdmin = profile && profile.is_active !== false && profile.role === "super_admin";
    if (!isSuperAdmin || !window.DashPermissions || !DashPermissions.can("manage_users")) {
      root.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-shield-lock" aria-hidden="true"></i>
          <h2>Super Admin access required</h2>
          <p>Your signed-in account does not currently have permission to manage users.</p>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="singleton-note mb-3"><i class="bi bi-info-circle-fill" aria-hidden="true"></i><span>Create or invite accounts in <strong>Supabase Authentication → Users</strong>. Their profile appears here automatically; CUDFIRM never handles passwords.</span></div>
      <div class="crud-toolbar"><div class="crud-hint">Assign dashboard roles and suspend access. Server-side RLS enforces every role.</div><button class="btn btn-light" id="refreshUsers" type="button"><i class="bi bi-arrow-clockwise"></i> Refresh</button></div>
      <div class="role-guide mb-3">
        <div><strong>Super Admin</strong><span>Full access, users, backup and critical settings.</span></div>
        <div><strong>Admin</strong><span>Content, business tools, settings and destructive actions.</span></div>
        <div><strong>Editor</strong><span>Create/edit/publish content, media and SEO; no destructive/system access.</span></div>
        <div><strong>Viewer</strong><span>Read-only dashboard access.</span></div>
      </div>
      <div class="table-card"><div id="usersTable" aria-live="polite"><div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading users…</div></div></div>`;

    document.getElementById("refreshUsers").addEventListener("click", load);

    try {
      await load();
    } catch (error) {
      console.error("[users] initialization failed:", error);
      const wrap = document.getElementById("usersTable");
      if (wrap) {
        wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>Could not load users. Refresh the page and try again.</div>`;
      }
      if (window.DashToast) DashToast.error("Users & Roles could not be loaded.");
    }
  }

  async function load() {
    const wrap = document.getElementById("usersTable");
    if (!wrap) return;

    wrap.innerHTML = `<div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading users…</div>`;

    const { data, error } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[users] profile query failed:", error);
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>Could not load users.</div>`;
      DashToast.error(DashError.friendly(error));
      return;
    }

    rows = data || [];
    render();
  }

  function render() {
    const wrap = document.getElementById("usersTable");
    if (!wrap) return;
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i>No user profiles found.</div>`;
      return;
    }

    const me = window.dashUser && window.dashUser.id;
    wrap.innerHTML = `<div class="table-responsive-x"><table class="dash-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>${rows.map((r) => {
      const self = r.id === me;
      return `<tr data-user-id="${esc(r.id)}"><td class="col-primary"><div>${esc(r.full_name || r.email || "User")}${self ? ' <span class="badge badge-soft badge-active">You</span>' : ""}</div><small>${esc(r.email || "")}</small></td>
      <td><select class="form-select form-select-sm user-role" aria-label="Role for ${esc(r.email || "user")}" ${self ? 'data-self="true"' : ""}>${ROLES.map((role) => `<option value="${role}" ${role === r.role ? "selected" : ""}>${esc(DashPermissions.roleLabel(role))}</option>`).join("")}</select></td>
      <td><label class="user-active-toggle"><input class="form-check-input user-active" type="checkbox" ${r.is_active ? "checked" : ""} ${self ? 'disabled title="You cannot suspend your own account"' : ""}> <span>${r.is_active ? "Active" : "Suspended"}</span></label></td>
      <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
      <td><button class="btn btn-brand btn-sm save-user" type="button"><i class="bi bi-check-lg"></i> Save</button></td></tr>`;
    }).join("")}</tbody></table></div>`;

    wrap.querySelectorAll(".user-active").forEach((el) => el.addEventListener("change", () => {
      el.nextElementSibling.textContent = el.checked ? "Active" : "Suspended";
    }));
    wrap.querySelectorAll(".save-user").forEach((btn) => btn.addEventListener("click", () => save(btn.closest("tr"))));
  }

  async function save(tr) {
    const id = tr.dataset.userId;
    const role = tr.querySelector(".user-role").value;
    const active = tr.querySelector(".user-active").checked;
    const current = rows.find((r) => r.id === id);
    if (!current) return;

    if (id === window.dashUser.id && role !== current.role) {
      DashToast.error("For safety, another Super Admin must change your role.");
      render();
      return;
    }

    const btn = tr.querySelector(".save-user");
    btn.disabled = true;
    const { data, error } = await supabaseClient
      .from("user_profiles")
      .update({ role, is_active: active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    btn.disabled = false;

    if (error) {
      DashToast.error(DashError.friendly(error, "Could not update this user."));
      return;
    }

    rows[rows.findIndex((r) => r.id === id)] = data;
    render();
    DashToast.success("User permissions updated.");
    DashActivity.log("updated role", "user_profiles", data.email, { role: data.role, is_active: data.is_active });
  }

  return { init };
})();
