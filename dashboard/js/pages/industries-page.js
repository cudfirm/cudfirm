/** Portfolio Industries: the list that feeds the Industry dropdown on projects. Access is enforced by RLS. */
const IndustriesPage = (() => {
  const { h, can, db, note } = EcoDom;
  let root, listEl, rows = [], usage = {};

  async function init() {
    root = document.getElementById("page-content"); root.textContent = "";
    root.append(h("div", { class: "crud-hint mb-3", text: "These are the choices shown in the Industry dropdown when you add or edit a portfolio project. They also become the category buttons on your website." }));
    const input = h("input", { class: "form-control", maxlength: "100", placeholder: "New industry, e.g. Barbershops", "aria-label": "New industry name", disabled: !can("create_content") });
    const add = h("button", { class: "btn btn-success", type: "button", disabled: !can("create_content"), text: "Add", onclick: async () => {
      const name = input.value.replace(/\s+/g, " ").trim();
      if (!name) return note(root, "Type an industry name first.", "error");
      const r = await db().from("portfolio_industries").insert({ name });
      if (r.error) return note(root, r.error.code === "23505" ? "That industry is already in the list." : "Could not add it.", "error");
      input.value = ""; note(root, "Added.", "ok"); await load(); } });
    root.append(h("div", { class: "d-flex gap-2 mb-3" }, h("div", { style: "flex:1" }, input), add));
    listEl = h("div", { class: "d-grid gap-2" });
    root.append(listEl);
    await load();
  }

  async function load() {
    const [i, p] = await Promise.all([
      db().from("portfolio_industries").select("*").order("name"),
      db().from("portfolio_projects").select("industry"),
    ]);
    if (i.error) { listEl.textContent = ""; return note(root, "Could not load industries. Has migration 020 been run?", "error"); }
    rows = i.data || []; usage = {};
    (p.data || []).forEach((x) => { const k = (x.industry || "").trim(); if (k) usage[k] = (usage[k] || 0) + 1; });
    draw();
  }

  function draw() {
    listEl.textContent = "";
    if (!rows.length) return listEl.append(h("p", { class: "text-muted", text: "No industries yet. Add your first one above." }));
    rows.forEach((r) => {
      const n = usage[r.name] || 0;
      listEl.append(h("div", { class: "d-flex align-items-center gap-2 flex-wrap border rounded-3 p-2 bg-white" },
        h("div", { style: "flex:1 1 180px;overflow-wrap:anywhere" }, h("strong", { text: r.name }), h("div", { class: "small text-muted", text: n === 1 ? "Used by 1 project" : "Used by " + n + " projects" })),
        h("button", { class: "btn btn-outline-secondary btn-sm", type: "button", disabled: !can("edit_content"), text: "Rename", onclick: async () => {
          const next = (prompt("Rename industry", r.name) || "").replace(/\s+/g, " ").trim();
          if (!next || next === r.name) return;
          const u = await db().from("portfolio_industries").update({ name: next }).eq("id", r.id);
          if (u.error) return note(root, u.error.code === "23505" ? "That name already exists." : "Could not rename.", "error");
          if (n) await db().from("portfolio_projects").update({ industry: next }).eq("industry", r.name);
          note(root, "Renamed. Projects using it were updated too.", "ok"); await load(); } }),
        h("button", { class: "btn btn-outline-danger btn-sm", type: "button", disabled: !can("delete_content") || n > 0,
          title: n > 0 ? "Move or edit the projects using it first" : "Delete", text: "Delete", onclick: async () => {
            if (!confirm("Delete \u201C" + r.name + "\u201D?")) return;
            const d = await db().from("portfolio_industries").delete().eq("id", r.id);
            if (d.error) return note(root, "Could not delete.", "error");
            note(root, "Deleted.", "ok"); await load(); } })));
    });
  }
  return { init };
})();
window.IndustriesPage = IndustriesPage;