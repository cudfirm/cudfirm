const SecurityPage = (() => {
  const PAGE_SIZE = 25;
  let allRows = [];
  let filteredRows = [];
  let currentPage = 1;

  const LABELS = {
    login_success: "Successful login",
    login_failed: "Failed login",
    logout: "Signed out",
    access_denied: "Access denied",
    role_changed: "Role changed",
    user_suspended: "User suspended",
    user_reactivated: "User reactivated",
  };

  const ICONS = {
    login_success: "bi-box-arrow-in-right",
    login_failed: "bi-shield-exclamation",
    logout: "bi-box-arrow-right",
    access_denied: "bi-slash-circle",
    role_changed: "bi-person-gear",
    user_suspended: "bi-person-x",
    user_reactivated: "bi-person-check",
  };

  async function init() {
    const root = document.getElementById("page-content");
    if (!root) return;

    root.innerHTML = `
      <div class="security-hero">
        <div>
          <span class="security-kicker"><i class="bi bi-shield-lock"></i> Super Admin</span>
          <h1>Security & Audit</h1>
          <p>Review dashboard sign-ins, denied access and permission changes. Events begin accumulating after Migration 012 is installed.</p>
        </div>
        <button class="btn btn-light" id="refreshSecurity" type="button"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>

      <div class="security-summary" id="securitySummary" aria-live="polite"></div>

      <div class="security-grid">
        <section class="security-panel">
          <div class="security-panel-head"><div><i class="bi bi-laptop"></i><h2>Current browser session</h2></div></div>
          <div id="currentSession" class="security-session"></div>
          <div class="security-limit-note"><i class="bi bi-info-circle"></i><span>Supabase does not expose every account session to browser-only code. This panel shows the current browser session and recent sign-in records, not a complete server-side session inventory.</span></div>
        </section>
        <section class="security-panel">
          <div class="security-panel-head"><div><i class="bi bi-exclamation-triangle"></i><h2>Security signals</h2></div></div>
          <div id="securitySignals" class="security-signals"></div>
        </section>
      </div>

      <div class="table-card security-events-card">
        <div class="security-toolbar">
          <div class="list-search security-search"><i class="bi bi-search" aria-hidden="true"></i><input class="form-control" id="securitySearch" type="search" placeholder="Search email, event or details…" autocomplete="off"></div>
          <select class="form-select" id="securityType" aria-label="Filter event type">
            <option value="">All events</option>
            ${Object.entries(LABELS).map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join("")}
          </select>
          <select class="form-select" id="securitySeverity" aria-label="Filter severity">
            <option value="">All severity</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Information</option>
          </select>
          <button class="btn btn-light" id="exportSecurity" type="button"><i class="bi bi-download"></i> Export CSV</button>
        </div>
        <div id="securityEvents" aria-live="polite"><div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading security events…</div></div>
        <div id="securityPagination"></div>
      </div>`;

    document.getElementById("refreshSecurity").addEventListener("click", load);
    document.getElementById("securitySearch").addEventListener("input", debounce(applyFilters, 180));
    document.getElementById("securityType").addEventListener("change", applyFilters);
    document.getElementById("securitySeverity").addEventListener("change", applyFilters);
    document.getElementById("exportSecurity").addEventListener("click", exportCsv);

    renderCurrentSession();
    await load();
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  async function load() {
    const host = document.getElementById("securityEvents");
    host.innerHTML = `<div class="loading-state"><i class="bi bi-arrow-repeat"></i> Loading security events…</div>`;
    const { data, error } = await SecurityApi.list();
    if (error) {
      console.error("[security] event query failed:", error);
      host.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><h2>Security events could not load</h2><p>${esc(DashError.friendly(error, "Confirm Migration 012 was run, then refresh."))}</p></div>`;
      return;
    }
    allRows = data || [];
    currentPage = 1;
    renderSummary();
    renderSignals();
    applyFilters();
  }

  function renderCurrentSession() {
    const host = document.getElementById("currentSession");
    const user = window.dashUser || {};
    const profile = (window.DashPermissions && DashPermissions.getProfile()) || {};
    supabaseClient.auth.getSession().then(({ data }) => {
      const session = data && data.session;
      const expires = session && session.expires_at ? new Date(session.expires_at * 1000) : null;
      host.innerHTML = `
        <div class="security-session-row"><span>Account</span><strong>${esc(user.email || profile.email || "Unknown")}</strong></div>
        <div class="security-session-row"><span>Role</span><strong>${esc(DashPermissions.roleLabel(profile.role))}</strong></div>
        <div class="security-session-row"><span>Token expires</span><strong>${expires ? esc(expires.toLocaleString()) : "Not available"}</strong></div>
        <div class="security-session-row"><span>Browser</span><strong title="${esc(navigator.userAgent)}">${esc(browserLabel())}</strong></div>`;
    });
  }

  function browserLabel() {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return "Microsoft Edge";
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Google Chrome";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    if (/Firefox\//.test(ua)) return "Firefox";
    return "Current browser";
  }

  function withinHours(value, hours) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) && Date.now() - time <= hours * 3600000;
  }

  function renderSummary() {
    const failed24 = allRows.filter((r) => r.event_type === "login_failed" && withinHours(r.created_at, 24)).length;
    const success30 = allRows.filter((r) => r.event_type === "login_success" && withinHours(r.created_at, 24 * 30)).length;
    const critical30 = allRows.filter((r) => r.severity === "critical" && withinHours(r.created_at, 24 * 30)).length;
    const changes30 = allRows.filter((r) => ["role_changed", "user_suspended", "user_reactivated"].includes(r.event_type) && withinHours(r.created_at, 24 * 30)).length;
    document.getElementById("securitySummary").innerHTML = `
      ${summaryCard("bi-box-arrow-in-right", success30, "Successful logins", "Last 30 days", "success")}
      ${summaryCard("bi-shield-exclamation", failed24, "Failed attempts", "Last 24 hours", failed24 ? "warning" : "neutral")}
      ${summaryCard("bi-person-gear", changes30, "Account changes", "Last 30 days", changes30 ? "warning" : "neutral")}
      ${summaryCard("bi-exclamation-octagon", critical30, "Critical events", "Last 30 days", critical30 ? "critical" : "neutral")}`;
  }

  function summaryCard(icon, value, label, note, tone) {
    return `<div class="security-stat ${tone}"><i class="bi ${icon}"></i><div><strong>${value}</strong><span>${esc(label)}</span><small>${esc(note)}</small></div></div>`;
  }

  function renderSignals() {
    const recentFailures = allRows.filter((r) => r.event_type === "login_failed" && withinHours(r.created_at, .25));
    const grouped = recentFailures.reduce((map, row) => {
      const key = (row.actor_email || "Unknown account").toLowerCase();
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
    const repeated = Object.entries(grouped).filter(([, count]) => count >= 5);
    const denied24 = allRows.filter((r) => r.event_type === "access_denied" && withinHours(r.created_at, 24));
    const criticalChanges = allRows.filter((r) => r.severity === "critical" && ["role_changed", "user_suspended", "user_reactivated"].includes(r.event_type) && withinHours(r.created_at, 24));
    const signals = [];
    repeated.forEach(([email, count]) => signals.push({ tone: "critical", icon: "bi-shield-exclamation", title: "Repeated failed sign-ins", text: `${count} failed attempts for ${email} within 15 minutes.` }));
    if (denied24.length) signals.push({ tone: "warning", icon: "bi-slash-circle", title: "Denied dashboard access", text: `${denied24.length} denied access event${denied24.length === 1 ? "" : "s"} in the last 24 hours.` });
    if (criticalChanges.length) signals.push({ tone: "warning", icon: "bi-person-lock", title: "Sensitive account changes", text: `${criticalChanges.length} critical role or suspension change${criticalChanges.length === 1 ? "" : "s"} in the last 24 hours.` });
    if (!signals.length) signals.push({ tone: "ok", icon: "bi-check-circle", title: "No immediate warning detected", text: "No repeated failed sign-ins, denied access or critical account changes were found in the current review window." });
    document.getElementById("securitySignals").innerHTML = signals.map((s) => `<div class="security-signal ${s.tone}"><i class="bi ${s.icon}"></i><div><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></div></div>`).join("");
  }

  function applyFilters() {
    const query = document.getElementById("securitySearch").value.trim().toLowerCase();
    const type = document.getElementById("securityType").value;
    const severity = document.getElementById("securitySeverity").value;
    filteredRows = allRows.filter((row) => {
      if (type && row.event_type !== type) return false;
      if (severity && row.severity !== severity) return false;
      if (!query) return true;
      const haystack = [row.actor_email, row.subject_email, LABELS[row.event_type], row.event_type, JSON.stringify(row.details || {})].join(" ").toLowerCase();
      return haystack.includes(query);
    });
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    const host = document.getElementById("securityEvents");
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = filteredRows.slice(start, start + PAGE_SIZE);
    if (!pageRows.length) {
      host.innerHTML = `<div class="empty-state"><i class="bi bi-shield-check"></i><h2>No security events found</h2><p>New sign-in and permission events will appear here.</p></div>`;
      document.getElementById("securityPagination").innerHTML = "";
      return;
    }
    host.innerHTML = `<div class="table-responsive-x"><table class="dash-table security-table"><thead><tr><th>Event</th><th>Account</th><th>Target</th><th>Severity</th><th>Date</th></tr></thead><tbody>${pageRows.map(rowHtml).join("")}</tbody></table></div>`;
    renderPagination();
  }

  function rowHtml(row) {
    const details = detailText(row);
    return `<tr><td class="col-primary"><div class="security-event-name"><i class="bi ${ICONS[row.event_type] || "bi-shield"}"></i><div><strong>${esc(LABELS[row.event_type] || row.event_type)}</strong>${details ? `<small>${esc(details)}</small>` : ""}</div></div></td><td>${esc(row.actor_email || "Unknown")}</td><td>${esc(row.subject_email || "—")}</td><td><span class="security-severity ${esc(row.severity)}">${esc(row.severity)}</span></td><td>${row.created_at ? esc(new Date(row.created_at).toLocaleString()) : "—"}</td></tr>`;
  }

  function detailText(row) {
    const d = row.details || {};
    if (row.event_type === "role_changed") return `${d.old_role || "unknown"} → ${d.new_role || "unknown"}`;
    if (row.event_type === "user_suspended") return "Dashboard access suspended";
    if (row.event_type === "user_reactivated") return "Dashboard access restored";
    if (d.reason) return String(d.reason);
    return "";
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
    const host = document.getElementById("securityPagination");
    if (totalPages <= 1) { host.innerHTML = `<div class="security-result-count">Showing ${filteredRows.length} event${filteredRows.length === 1 ? "" : "s"}</div>`; return; }
    host.innerHTML = `<div class="pagination-bar"><div class="pagination-summary">Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of ${filteredRows.length}</div><div class="pagination-controls"><button type="button" class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>Previous</button><span class="pagination-summary">Page ${currentPage} of ${totalPages}</span><button type="button" class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next</button></div></div>`;
    host.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { currentPage = Number(button.dataset.page); renderTable(); document.querySelector(".security-events-card").scrollIntoView({ behavior: "smooth", block: "start" }); }));
  }

  function exportCsv() {
    if (!filteredRows.length) { DashToast.error("There are no security events to export."); return; }
    const headers = ["Date", "Event", "Severity", "Account", "Target", "Success", "Source", "Details"];
    const lines = [headers, ...filteredRows.map((r) => [r.created_at || "", LABELS[r.event_type] || r.event_type, r.severity, r.actor_email || "", r.subject_email || "", r.success, r.source || "", JSON.stringify(r.details || {})])];
    const csv = lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
    DashDownload.blob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `cudfirm-security-${new Date().toISOString().slice(0, 10)}.csv`);
    DashActivity.log("exported", "security_events", "Security audit report", { count: filteredRows.length });
  }

  function csvCell(value) { return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`; }

  return { init };
})();
