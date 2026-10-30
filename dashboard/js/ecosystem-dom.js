/** Small safe-DOM helpers for the Service Requests and Client Projects pages (textContent only). */
const EcoDom = (() => {
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  const when = (iso) => { try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } };
  const can = (p) => !(window.DashPermissions && DashPermissions.can) || DashPermissions.can(p);
  const db = () => window.supabaseClient;
  function note(root, text, state) {
    let el = root.querySelector(":scope > .eco-note");
    if (!el) { el = h("div", { class: "eco-note mt-2", role: "status", "aria-live": "polite" }); root.prepend(el); }
    el.className = "eco-note mt-2 alert alert-" + (state === "error" ? "danger" : state === "ok" ? "success" : "secondary") + " py-2 mb-2";
    el.textContent = text;
  }
  return { h, when, can, db, note };
})();
window.EcoDom = EcoDom;
