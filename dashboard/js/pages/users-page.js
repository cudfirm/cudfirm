const UsersPage = (() => {
  let rows = [];
  const ROLES = ["super_admin", "admin", "editor", "viewer"];

  async function init() {
    if (!DashPermissions.require("manage_users")) return;
    const root = document.getElementById("page-content");
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
    await load();
  }

  async function load() {
    const wrap = document.getElementById("usersTable");
    const { data, error } = await supabaseClient.from("user_profiles").select("*").order("created_at", { ascending: true });
    if (error) { wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>Could not load users.</div>`; DashToast.error(DashError.friendly(error)); return; }
    rows = data || [];
    render();
  }

  function render() {
    const wrap = document.getElementById("usersTable");
    if (!rows.length) { wrap.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i>No user profiles found.</div>`; return; }
    const me = window.dashUser && window.dashUser.id;
    wrap.innerHTML = `<div class="table-responsive-x"><table class="dash-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>${rows.map(r=>{
      const self=r.id===me;
      return `<tr data-user-id="${esc(r.id)}"><td class="col-primary"><div>${esc(r.full_name || r.email || "User")}${self?' <span class="badge badge-soft badge-active">You</span>':''}</div><small>${esc(r.email||"")}</small></td>
      <td><select class="form-select form-select-sm user-role" aria-label="Role for ${esc(r.email||'user')}" ${self?'data-self="true"':''}>${ROLES.map(role=>`<option value="${role}" ${role===r.role?'selected':''}>${esc(DashPermissions.roleLabel(role))}</option>`).join('')}</select></td>
      <td><label class="user-active-toggle"><input class="form-check-input user-active" type="checkbox" ${r.is_active?'checked':''} ${self?'disabled title="You cannot suspend your own account"':''}> <span>${r.is_active?'Active':'Suspended'}</span></label></td>
      <td>${r.created_at?new Date(r.created_at).toLocaleDateString():'—'}</td>
      <td><button class="btn btn-brand btn-sm save-user" type="button"><i class="bi bi-check-lg"></i> Save</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
    wrap.querySelectorAll('.user-active').forEach(el=>el.addEventListener('change',()=>{el.nextElementSibling.textContent=el.checked?'Active':'Suspended';}));
    wrap.querySelectorAll('.save-user').forEach(btn=>btn.addEventListener('click',()=>save(btn.closest('tr'))));
  }

  async function save(tr) {
    const id=tr.dataset.userId, role=tr.querySelector('.user-role').value, active=tr.querySelector('.user-active').checked;
    const current=rows.find(r=>r.id===id); if(!current) return;
    if(id===window.dashUser.id && role!==current.role) { DashToast.error("For safety, another Super Admin must change your role."); render(); return; }
    const btn=tr.querySelector('.save-user'); btn.disabled=true;
    const { data, error } = await supabaseClient.from('user_profiles').update({role,is_active:active,updated_at:new Date().toISOString()}).eq('id',id).select().single();
    btn.disabled=false;
    if(error){DashToast.error(DashError.friendly(error,"Could not update this user."));return;}
    rows[rows.findIndex(r=>r.id===id)]=data; render(); DashToast.success("User permissions updated.");
    DashActivity.log("updated role", "user_profiles", data.email, { role:data.role, is_active:data.is_active });
  }
  return { init };
})();