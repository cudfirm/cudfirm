/** Service Requests: view, search, filter, status workflow, notes, secure claim links. Access is enforced by RLS. */
const RequestsPage = (() => {
  const { h, when, can, db, note } = EcoDom;
  const STATUS = { new: "New", under_review: "Under Review", awaiting_client: "Awaiting Client Response", approved: "Approved", in_progress: "In Progress", completed: "Completed", declined: "Declined", cancelled: "Cancelled" };
  let rows = [], filters = { q: "", status: "all", unread: false }, openId = null, root, listEl, detailEl;

  async function init() {
    root = document.getElementById("page-content");
    root.textContent = "";
    const search = h("input", { class: "form-control", type: "search", placeholder: "Search name, email, service or text…", "aria-label": "Search requests", oninput: (e) => { filters.q = e.target.value.toLowerCase(); draw(); } });
    const status = h("select", { class: "form-select", "aria-label": "Filter by status", onchange: (e) => { filters.status = e.target.value; draw(); } },
      h("option", { value: "all", text: "All statuses" }), ...Object.entries(STATUS).map(([v, l]) => h("option", { value: v, text: l })));
    const unread = h("input", { type: "checkbox", id: "reqUnread", class: "form-check-input", onchange: (e) => { filters.unread = e.target.checked; draw(); } });
    root.append(h("div", { class: "crud-hint mb-3", text: "Requests submitted from the public Services section. The database record is the source of truth; email is only a notification." }),
      h("div", { class: "d-flex flex-wrap gap-2 mb-3 align-items-center" }, h("div", { style: "flex:1 1 220px" }, search), h("div", { style: "flex:0 1 220px" }, status),
        h("label", { class: "form-check-label d-flex gap-2 align-items-center", for: "reqUnread" }, unread, "Unread only")));
    listEl = h("div", { class: "d-grid gap-2", "aria-live": "polite" });
    detailEl = h("div", { class: "mt-3" });
    root.append(listEl, detailEl);
    await reload();
  }

  async function reload() {
    const { data, error } = await db().from("service_requests").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) { listEl.textContent = ""; return note(root, "Could not load requests. Check your permissions or that migration 018 has been applied.", "error"); }
    rows = data || []; draw();
  }

  function visible() {
    return rows.filter((r) => (filters.status === "all" || r.status === filters.status) && (!filters.unread || !r.is_read) &&
      (!filters.q || [r.name, r.email, r.service_name, r.requirements, r.reference].join(" ").toLowerCase().includes(filters.q)));
  }
  function draw() {
    listEl.textContent = "";
    const v = visible();
    if (!v.length) return listEl.append(h("p", { class: "text-muted", text: rows.length ? "No requests match these filters." : "No service requests yet." }));
    v.forEach((r) => listEl.append(h("button", { type: "button", class: "btn text-start border rounded-3 p-3 bg-white", onclick: () => open(r.id), "aria-label": "Open request " + r.reference },
      h("div", { class: "d-flex justify-content-between gap-2 flex-wrap" }, h("strong", { text: (r.is_read ? "" : "● ") + r.service_name }), h("span", { class: "badge text-bg-secondary", text: STATUS[r.status] || r.status })),
      h("div", { class: "small text-muted", text: r.name + " · " + r.reference + " · " + when(r.created_at) }))));
  }

  async function open(id) {
    openId = id;
    const r = rows.find((x) => x.id === id); if (!r) return;
    detailEl.textContent = "";
    const manage = can("manage_messages");
    if (manage && !r.is_read) { const u = await db().from("service_requests").update({ is_read: true }).eq("id", id); if (!u.error) r.is_read = true; draw(); }

    const statusSel = h("select", { class: "form-select", disabled: !manage, "aria-label": "Request status" }, ...Object.entries(STATUS).map(([v, l]) => h("option", { value: v, text: l, selected: v === r.status })));
    const saveStatus = h("button", { class: "btn btn-success", type: "button", disabled: !manage, text: "Update status", onclick: async () => {
      const res = await db().from("service_requests").update({ status: statusSel.value }).eq("id", id).select().single();
      if (res.error) return note(card, "Status could not be updated.", "error");
      Object.assign(r, res.data); note(card, "Status updated.", "ok"); draw(); } });
    const readBtn = h("button", { class: "btn btn-outline-secondary btn-sm", type: "button", disabled: !manage, text: r.is_read ? "Mark as unread" : "Mark as read", onclick: async () => {
      const res = await db().from("service_requests").update({ is_read: !r.is_read }).eq("id", id).select().single();
      if (!res.error) { Object.assign(r, res.data); draw(); open(id); } } });

    const kv = (k, v) => v ? h("div", { class: "mb-2" }, h("div", { class: "small text-muted", text: k }), h("div", { text: v, style: "white-space:pre-wrap;overflow-wrap:anywhere" })) : null;
    const card = h("section", { class: "border rounded-3 p-3 bg-white" },
      h("div", { class: "d-flex justify-content-between flex-wrap gap-2" }, h("h5", { class: "mb-2", text: r.service_name }), readBtn),
      kv("Reference", r.reference), kv("Submitted", when(r.created_at)), kv("Name", r.name), kv("Email", r.email), kv("Phone", r.phone),
      kv("Requirements", r.requirements), kv("Timeline / consultation", r.timeline), kv("Budget", r.budget), kv("Additional information", r.extra),
      kv("Notification", r.email_status === "sent" ? "Admin email accepted by the mail service" : r.email_status === "failed" ? "Email notification failed — this record is still saved. " + (r.email_error || "") : r.email_status === "not_configured" ? "Email not configured" : "Pending"),
      kv("Account link", r.member_id ? "Linked to a verified client account" : "Anonymous request (not linked to an account)"),
      h("div", { class: "d-flex gap-2 flex-wrap align-items-end my-3" }, h("div", { style: "flex:1 1 200px" }, statusSel), saveStatus));
    detailEl.append(card);

    // history
    const hist = Array.isArray(r.history) ? r.history : [];
    if (hist.length) card.append(h("div", { class: "small text-muted mb-3" }, h("strong", { text: "History: " }), hist.map((e) => (e.event ? e.event.replace(/_/g, " ") : (STATUS[e.from] || e.from) + " → " + (STATUS[e.to] || e.to)) + " (" + when(e.at) + ")").join(" · ")));

    // internal notes
    const notesBox = h("div", { class: "mb-2" });
    const ns = await db().from("service_request_notes").select("*").eq("request_id", id).order("created_at", { ascending: false });
    (ns.data || []).forEach((n) => notesBox.append(h("div", { class: "border rounded p-2 mb-1 small" }, h("div", { text: n.body, style: "white-space:pre-wrap" }), h("div", { class: "text-muted", text: when(n.created_at) }))));
    const ta = h("textarea", { class: "form-control", rows: "2", maxlength: "3000", placeholder: "Internal note (never shown to the client)…", disabled: !manage, "aria-label": "Internal note" });
    card.append(h("h6", { text: "Internal notes" }), notesBox, ta, h("button", { class: "btn btn-outline-success btn-sm mt-2", type: "button", disabled: !manage, text: "Add note", onclick: async () => {
      const body = ta.value.trim(); if (!body) return;
      const res = await db().from("service_request_notes").insert({ request_id: id, author_id: window.dashUser && dashUser.id, body });
      if (res.error) return note(card, "Note could not be saved.", "error"); open(id); } }));

    // secure claim link + project creation
    const tools = h("div", { class: "mt-3 pt-3 border-top" });
    if (!r.member_id) {
      const out = h("div", { class: "small mt-2" });
      tools.append(h("h6", { text: "Link to a client account" }), h("p", { class: "small text-muted mb-2", text: "Matching email addresses never link a request. Generate a one-time link (valid 72 hours) and send it to the client yourself; they open it while logged in to their portal account." }),
        h("button", { class: "btn btn-outline-secondary btn-sm", type: "button", disabled: !manage, text: "Generate claim link", onclick: async () => {
          const res = await db().rpc("create_request_claim", { p_request_id: id, p_ttl_hours: 72 });
          if (res.error) return note(card, "Could not create the link.", "error");
          const url = location.origin + location.pathname.replace(/dashboard\/[^/]*$/, "") + "account/?claim=" + res.data;
          out.textContent = ""; out.append(h("input", { class: "form-control form-control-sm", readonly: true, value: url, "aria-label": "Claim link", onfocus: (e) => e.target.select() }), h("div", { class: "text-muted mt-1", text: "Shown once. Generating a new link replaces this one." })); } }), out);
    } else {
      const ex = await db().from("client_projects").select("id").eq("source_request_id", id).maybeSingle();
      tools.append(ex.data ? h("p", { class: "small", text: "A client project already exists for this request (see Client Projects)." })
        : h("button", { class: "btn btn-success btn-sm", type: "button", disabled: !manage, text: "Create client project", onclick: async () => {
          const res = await db().from("client_projects").insert({ member_id: r.member_id, title: r.service_name, service_name: r.service_name, description: r.requirements, status: "request_received", source_request_id: id });
          note(card, res.error ? "Project could not be created." : "Project created — manage it under Client Projects.", res.error ? "error" : "ok"); open(id); } }));
    }
    card.append(tools);
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return { init };
})();
window.RequestsPage = RequestsPage;
