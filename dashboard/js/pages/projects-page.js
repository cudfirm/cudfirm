/** Client Projects: create, update status/dates, milestones, updates & messages, files. Access is enforced by RLS/storage policies. */
const ProjectsPage = (() => {
  const { h, when, can, db, note } = EcoDom;
  const STATUS = { request_received: "Request Received", under_review: "Under Review", awaiting_approval: "Awaiting Approval", awaiting_client_materials: "Awaiting Client Materials", in_progress: "In Progress", in_review: "In Review", completed: "Completed", cancelled: "Cancelled" };
  const TYPES = { "application/pdf": 1, "image/png": 1, "image/jpeg": 1, "image/webp": 1, "text/plain": 1, "text/csv": 1, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 1, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 1 };
  let root, listEl, detailEl, projects = [], members = {};

  async function init() {
    root = document.getElementById("page-content"); root.textContent = "";
    root.append(h("div", { class: "crud-hint mb-3", text: "Projects are visible to the linked client only. Clients see exactly what you record here — nothing is invented or estimated." }));
    listEl = h("div", { class: "d-grid gap-2 mb-3" }); detailEl = h("div");
    root.append(createForm(), listEl, detailEl);
    await reload();
  }

  async function reload() {
    const [p, m] = await Promise.all([
      db().from("client_projects").select("*").order("updated_at", { ascending: false }),
      db().from("member_profiles").select("user_id,display_name,status").eq("status", "active"),
    ]);
    if (p.error) return note(root, "Could not load projects. Check your permissions or that migration 018 has been applied.", "error");
    projects = p.data || []; members = {}; (m.data || []).forEach((x) => { members[x.user_id] = x.display_name; });
    drawList(); fillMembers();
  }
  const owner = (id) => members[id] || ("Client " + String(id).slice(0, 8));

  let memberSel;
  function fillMembers() {
    if (!memberSel) return; memberSel.textContent = "";
    memberSel.append(h("option", { value: "", text: "Select an active client account…" }), ...Object.entries(members).map(([id, n]) => h("option", { value: id, text: n })));
  }
  function createForm() {
    memberSel = h("select", { class: "form-select", "aria-label": "Client account" });
    const title = h("input", { class: "form-control", maxlength: "200", placeholder: "Project title", "aria-label": "Project title" });
    const svc = h("input", { class: "form-control", maxlength: "200", placeholder: "Service (optional)", "aria-label": "Service" });
    const form = h("section", { class: "border rounded-3 p-3 bg-white mb-3" }, h("h6", { text: "New project" }),
      h("div", { class: "row g-2" }, h("div", { class: "col-12 col-md-4" }, memberSel), h("div", { class: "col-12 col-md-4" }, title), h("div", { class: "col-12 col-md-4" }, svc)),
      h("button", { class: "btn btn-success btn-sm mt-2", type: "button", disabled: !can("manage_messages"), text: "Create project", onclick: async () => {
        if (!memberSel.value || !title.value.trim()) return note(form, "Choose a client and enter a title.", "error");
        const r = await db().from("client_projects").insert({ member_id: memberSel.value, title: title.value.trim(), service_name: svc.value.trim() || null });
        if (r.error) return note(form, "Project could not be created.", "error");
        title.value = ""; svc.value = ""; await reload(); } }));
    return form;
  }
  function drawList() {
    listEl.textContent = "";
    if (!projects.length) return listEl.append(h("p", { class: "text-muted", text: "No client projects yet." }));
    projects.forEach((p) => listEl.append(h("button", { type: "button", class: "btn text-start border rounded-3 p-3 bg-white", onclick: () => open(p.id) },
      h("div", { class: "d-flex justify-content-between gap-2 flex-wrap" }, h("strong", { text: p.title }), h("span", { class: "badge text-bg-secondary", text: STATUS[p.status] })),
      h("div", { class: "small text-muted", text: owner(p.member_id) + (p.service_name ? " · " + p.service_name : "") }))));
  }

  async function open(id) {
    const p = projects.find((x) => x.id === id); if (!p) return;
    detailEl.textContent = "";
    const manage = can("manage_messages");
    const box = h("section", { class: "border rounded-3 p-3 bg-white mb-3" });
    const title = h("input", { class: "form-control", value: p.title, maxlength: "200", disabled: !manage, "aria-label": "Title" });
    const status = h("select", { class: "form-select", disabled: !manage, "aria-label": "Status" }, ...Object.entries(STATUS).map(([v, l]) => h("option", { value: v, text: l, selected: v === p.status })));
    const start = h("input", { type: "date", class: "form-control", value: p.start_date || "", disabled: !manage, "aria-label": "Start date" });
    const due = h("input", { type: "date", class: "form-control", value: p.expected_completion || "", disabled: !manage, "aria-label": "Expected completion" });
    const desc = h("textarea", { class: "form-control", rows: "3", maxlength: "5000", disabled: !manage, "aria-label": "Description" }); desc.value = p.description || "";
    box.append(h("h5", { text: "Client: " + owner(p.member_id) }),
      h("div", { class: "row g-2" }, h("div", { class: "col-12 col-md-6" }, h("label", { class: "small text-muted", text: "Title" }), title), h("div", { class: "col-12 col-md-6" }, h("label", { class: "small text-muted", text: "Status" }), status),
        h("div", { class: "col-6" }, h("label", { class: "small text-muted", text: "Start date" }), start), h("div", { class: "col-6" }, h("label", { class: "small text-muted", text: "Expected completion" }), due),
        h("div", { class: "col-12" }, h("label", { class: "small text-muted", text: "Description" }), desc)),
      h("button", { class: "btn btn-success btn-sm mt-2", type: "button", disabled: !manage, text: "Save project", onclick: async () => {
        const r = await db().from("client_projects").update({ title: title.value.trim() || p.title, status: status.value, start_date: start.value || null, expected_completion: due.value || null, description: desc.value.trim() || null }).eq("id", id).select().single();
        if (r.error) return note(box, "Could not save changes.", "error");
        Object.assign(p, r.data); note(box, "Saved. The client now sees these changes.", "ok"); drawList(); } }));
    detailEl.append(box);

    const [ms, msgs, files] = await Promise.all([
      db().from("project_milestones").select("*").eq("project_id", id).order("position"),
      db().from("project_messages").select("*").eq("project_id", id).order("created_at"),
      db().from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    detailEl.append(milestones(id, ms.data || [], manage), thread(id, msgs.data || [], manage), filesBox(id, files.data || [], manage));
    const unread = (msgs.data || []).filter((m) => m.sender_role === "client" && !m.read_by_admin_at);
    if (manage && unread.length) db().from("project_messages").update({ read_by_admin_at: new Date().toISOString() }).in("id", unread.map((m) => m.id));
  }

  function milestones(pid, list, manage) {
    const box = h("section", { class: "border rounded-3 p-3 bg-white mb-3" }, h("h6", { text: "Milestones" }));
    const ul = h("div", { class: "d-grid gap-1 mb-2" });
    const refresh = () => open(pid);
    list.forEach((m) => ul.append(h("div", { class: "d-flex align-items-center gap-2 flex-wrap" },
      h("input", { type: "checkbox", class: "form-check-input", checked: !!m.completed_at, disabled: !manage, "aria-label": "Completed: " + m.title, onchange: async (e) => { await db().from("project_milestones").update({ completed_at: e.target.checked ? new Date().toISOString() : null }).eq("id", m.id); refresh(); } }),
      h("span", { text: m.title + (m.due_date ? " (due " + m.due_date + ")" : ""), style: "flex:1;overflow-wrap:anywhere" }),
      h("button", { class: "btn btn-outline-danger btn-sm", type: "button", disabled: !manage, text: "Remove", onclick: async () => { if (confirm("Remove this milestone?")) { await db().from("project_milestones").delete().eq("id", m.id); refresh(); } } }))));
    const t = h("input", { class: "form-control", maxlength: "200", placeholder: "New milestone", "aria-label": "Milestone title", disabled: !manage });
    const d = h("input", { type: "date", class: "form-control", "aria-label": "Milestone due date", disabled: !manage });
    box.append(ul, h("div", { class: "row g-2" }, h("div", { class: "col-12 col-md-6" }, t), h("div", { class: "col-6 col-md-3" }, d),
      h("div", { class: "col-6 col-md-3" }, h("button", { class: "btn btn-outline-success w-100", type: "button", disabled: !manage, text: "Add", onclick: async () => {
        if (!t.value.trim()) return; const r = await db().from("project_milestones").insert({ project_id: pid, title: t.value.trim(), due_date: d.value || null, position: list.length });
        if (r.error) return note(box, "Could not add milestone.", "error"); refresh(); } }))));
    return box;
  }

  function thread(pid, list, manage) {
    const box = h("section", { class: "border rounded-3 p-3 bg-white mb-3" }, h("h6", { text: "Messages & progress updates" }));
    list.forEach((m) => box.append(h("div", { class: "border rounded p-2 mb-1 small", style: m.sender_role === "admin" ? "background:#f3f8f5" : "" },
      h("strong", { text: (m.kind === "update" ? "Progress update (visible to client) · " : "") + (m.sender_role === "admin" ? "CUDFIRM" : "Client") }),
      h("div", { text: m.body, style: "white-space:pre-wrap;overflow-wrap:anywhere" }), h("div", { class: "text-muted", text: when(m.created_at) }))));
    const ta = h("textarea", { class: "form-control", rows: "3", maxlength: "5000", disabled: !manage, "aria-label": "Message or update" });
    const send = (kind) => async () => {
      const body = ta.value.trim(); if (!body) return;
      const r = await db().from("project_messages").insert({ project_id: pid, sender_id: window.dashUser && dashUser.id, sender_role: "admin", kind, body });
      if (r.error) return note(box, "Could not send.", "error"); open(pid); };
    box.append(ta, h("div", { class: "d-flex gap-2 flex-wrap mt-2" },
      h("button", { class: "btn btn-success btn-sm", type: "button", disabled: !manage, text: "Reply to client", onclick: send("message") }),
      h("button", { class: "btn btn-outline-success btn-sm", type: "button", disabled: !manage, text: "Post progress update", onclick: send("update") })));
    return box;
  }

  function filesBox(pid, list, manage) {
    const box = h("section", { class: "border rounded-3 p-3 bg-white mb-3" }, h("h6", { text: "Files" }));
    list.forEach((f) => box.append(h("div", { class: "d-flex align-items-center gap-2 flex-wrap mb-1" },
      h("span", { text: f.file_name + " · " + (f.uploader_role === "admin" ? "from CUDFIRM" : "from client") + " · " + when(f.created_at), style: "flex:1;overflow-wrap:anywhere" }),
      h("button", { class: "btn btn-outline-secondary btn-sm", type: "button", text: "Download", onclick: async () => {
        const r = await db().storage.from("project-files").createSignedUrl(f.storage_path, 60);
        if (r.error) return note(box, "Could not open the file.", "error"); window.open(r.data.signedUrl, "_blank", "noopener"); } }),
      h("button", { class: "btn btn-outline-danger btn-sm", type: "button", disabled: !manage, text: "Delete", onclick: async () => {
        if (!confirm("Delete " + f.file_name + "?")) return;
        const s = await db().storage.from("project-files").remove([f.storage_path]); if (s.error) return note(box, "Could not delete.", "error");
        await db().from("project_files").delete().eq("id", f.id); open(pid); } }))));
    const input = h("input", { type: "file", class: "form-control", accept: ".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.docx,.xlsx", disabled: !manage, "aria-label": "Upload a deliverable" });
    box.append(h("div", { class: "d-flex gap-2 mt-2 flex-wrap" }, h("div", { style: "flex:1 1 220px" }, input),
      h("button", { class: "btn btn-success btn-sm", type: "button", disabled: !manage, text: "Upload", onclick: async () => {
        const file = input.files && input.files[0];
        if (!file) return note(box, "Choose a file.", "error");
        if (!TYPES[file.type]) return note(box, "File type not allowed.", "error");
        if (file.size > 10 * 1024 * 1024) return note(box, "Files must be 10 MB or smaller.", "error");
        const path = pid + "/" + Math.random().toString(16).slice(2, 14) + "-" + file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120);
        const up = await db().storage.from("project-files").upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) return note(box, "Upload failed.", "error");
        const ins = await db().from("project_files").insert({ project_id: pid, storage_path: path, file_name: file.name.slice(0, 255), mime_type: file.type, size_bytes: file.size, uploader_id: window.dashUser && dashUser.id, uploader_role: "admin" });
        if (ins.error) { await db().storage.from("project-files").remove([path]); return note(box, "Upload could not be recorded.", "error"); }
        open(pid); } })));
    return box;
  }
  return { init };
})();
window.ProjectsPage = ProjectsPage;
