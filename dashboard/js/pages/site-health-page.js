const SiteHealthPage = (() => {
  let allResults = [];
  let filteredResults = [];
  let state = { search: "", status: "all", type: "all" };
  const REVIEWED_KEY = "cudfirm_site_health_reviewed";

  function getReviewed() {
    try { return new Set(JSON.parse(localStorage.getItem(REVIEWED_KEY) || "[]")); }
    catch (_) { return new Set(); }
  }
  function saveReviewed(set) { localStorage.setItem(REVIEWED_KEY, JSON.stringify(Array.from(set))); }

  function statusLabel(status) {
    return { working: "Working", broken: "Confirmed broken", unverified: "Could not verify", warning: "Warning" }[status] || status;
  }

  function renderShell() {
    const root = document.getElementById("page-content");
    root.innerHTML = `
      <section class="site-health-hero">
        <div>
          <h1>Site Health Scanner</h1>
          <p>Check public pages, CMS links and image URLs without changing your website.</p>
        </div>
        <div class="site-health-actions">
          <button class="btn btn-brand" id="runScanBtn" type="button"><i class="bi bi-shield-check"></i> Scan site</button>
          <button class="btn btn-outline-brand" id="exportHealthBtn" type="button" disabled><i class="bi bi-download"></i> Export CSV</button>
        </div>
      </section>

      <section class="site-health-summary" id="healthSummary" aria-live="polite">
        ${summaryCards([])}
      </section>

      <section class="site-health-progress d-none" id="scanProgress" aria-live="polite">
        <i class="bi bi-arrow-repeat"></i><span id="scanStatus">Preparing scan…</span>
      </section>

      <section class="site-health-panel">
        <div class="site-health-controls">
          <div class="site-health-search">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input id="healthSearch" class="form-control" type="search" placeholder="Search URL or source page…" aria-label="Search scan results" />
          </div>
          <select id="healthStatusFilter" class="form-select" aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="broken">Confirmed broken</option>
            <option value="warning">Warnings</option>
            <option value="unverified">Could not verify</option>
            <option value="working">Working</option>
          </select>
          <select id="healthTypeFilter" class="form-select" aria-label="Filter by type">
            <option value="all">All types</option>
            <option value="link">Links</option>
            <option value="image">Images</option>
            <option value="page">Pages</option>
          </select>
        </div>
        <div class="site-health-result-meta" id="healthResultMeta">Run a scan to see results.</div>
        <div id="healthResults" class="site-health-results">
          <div class="empty-state"><i class="bi bi-shield-check"></i>Click “Scan site” to begin.</div>
        </div>
      </section>`;

    document.getElementById("runScanBtn").addEventListener("click", runScan);
    document.getElementById("exportHealthBtn").addEventListener("click", exportCsv);
    document.getElementById("healthSearch").addEventListener("input", (e) => { state.search = e.target.value; applyFilters(); });
    document.getElementById("healthStatusFilter").addEventListener("change", (e) => { state.status = e.target.value; applyFilters(); });
    document.getElementById("healthTypeFilter").addEventListener("change", (e) => { state.type = e.target.value; applyFilters(); });
  }

  function summaryCards(results) {
    const counts = { total: results.length, broken: 0, warning: 0, unverified: 0, working: 0 };
    results.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status] += 1; });
    return `
      <article><span>Total checked</span><strong>${counts.total}</strong></article>
      <article class="is-broken"><span>Broken</span><strong>${counts.broken}</strong></article>
      <article class="is-warning"><span>Warnings</span><strong>${counts.warning}</strong></article>
      <article class="is-unverified"><span>Unverified</span><strong>${counts.unverified}</strong></article>
      <article class="is-working"><span>Working</span><strong>${counts.working}</strong></article>`;
  }

  async function runScan() {
    const button = document.getElementById("runScanBtn");
    const progress = document.getElementById("scanProgress");
    const status = document.getElementById("scanStatus");
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-arrow-repeat health-spin"></i> Scanning…';
    progress.classList.remove("d-none");
    document.getElementById("healthResults").innerHTML = '<div class="loading-state"><i class="bi bi-arrow-repeat"></i> Checking links and images…</div>';

    try {
      allResults = await SiteScanner.scan({ onStatus: (text) => { status.textContent = text; } });
      document.getElementById("healthSummary").innerHTML = summaryCards(allResults);
      document.getElementById("exportHealthBtn").disabled = allResults.length === 0;
      applyFilters();
      DashToast.success(`Site scan completed: ${allResults.length} items checked.`);
    } catch (error) {
      console.error(error);
      document.getElementById("healthResults").innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>The scan could not be completed. Please try again.</div>';
      DashToast.error("Could not complete the site scan.");
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Rescan';
      progress.classList.add("d-none");
    }
  }

  function applyFilters() {
    const q = state.search.trim().toLowerCase();
    filteredResults = allResults.filter((item) => {
      if (state.status !== "all" && item.status !== state.status) return false;
      if (state.type !== "all" && item.type !== state.type) return false;
      if (q && !`${item.url} ${item.source} ${item.detail} ${item.suggestion}`.toLowerCase().includes(q)) return false;
      return true;
    });
    renderResults();
  }

  function renderResults() {
    const container = document.getElementById("healthResults");
    const meta = document.getElementById("healthResultMeta");
    const reviewed = getReviewed();
    meta.textContent = allResults.length ? `Showing ${filteredResults.length} of ${allResults.length} checked items` : "Run a scan to see results.";
    if (!filteredResults.length) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-search"></i>${allResults.length ? "No results match the current filters." : "Click “Scan site” to begin."}</div>`;
      return;
    }

    container.innerHTML = filteredResults.map((item) => {
      const isReviewed = reviewed.has(item.id);
      const icon = item.type === "image" ? "bi-image" : item.type === "page" ? "bi-file-earmark-code" : "bi-link-45deg";
      return `<article class="site-health-item ${isReviewed ? "is-reviewed" : ""}">
        <div class="site-health-type"><i class="bi ${icon}"></i><span>${esc(item.type)}</span></div>
        <div class="site-health-main">
          <div class="site-health-item-head">
            <strong>${esc(item.source)}</strong>
            <span class="health-status health-${esc(item.status)}">${esc(statusLabel(item.status))}</span>
          </div>
          <code title="${esc(item.url)}">${esc(item.url)}</code>
          <p>${esc(item.detail)}</p>
          <small><strong>Suggested action:</strong> ${esc(item.suggestion)}${item.duplicateCount > 1 ? ` · Found ${item.duplicateCount} times` : ""}</small>
        </div>
        <div class="site-health-item-actions">
          ${item.url !== "(empty)" && /^https?:/i.test(item.url) ? `<button type="button" class="btn-icon health-copy" data-url="${esc(item.url)}" title="Copy URL"><i class="bi bi-copy"></i></button><a class="btn-icon" href="${esc(item.url)}" target="_blank" rel="noopener" title="Open URL"><i class="bi bi-box-arrow-up-right"></i></a>` : ""}
          ${item.sourceUrl ? `<a class="btn-icon" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener" title="Open source page"><i class="bi bi-file-earmark-arrow-up"></i></a>` : ""}
          <button type="button" class="btn-icon health-review" data-id="${esc(item.id)}" title="${isReviewed ? "Mark unreviewed" : "Mark reviewed"}"><i class="bi ${isReviewed ? "bi-check-circle-fill" : "bi-check-circle"}"></i></button>
        </div>
      </article>`;
    }).join("");

    container.querySelectorAll(".health-copy").forEach((btn) => btn.addEventListener("click", async () => {
      try { await DashClipboard.writeText(btn.dataset.url); DashToast.success("URL copied."); }
      catch (_) { DashToast.error("Could not copy the URL."); }
    }));
    container.querySelectorAll(".health-review").forEach((btn) => btn.addEventListener("click", () => {
      const set = getReviewed();
      if (set.has(btn.dataset.id)) set.delete(btn.dataset.id); else set.add(btn.dataset.id);
      saveReviewed(set);
      renderResults();
    }));
  }

  function exportCsv() {
    const rows = filteredResults.length ? filteredResults : allResults;
    if (!rows.length) return;
    const escapeCsv = (value) => `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
    const csv = [
      ["Type", "Source", "URL", "Status", "Detail", "Suggested action"],
      ...rows.map((r) => [r.type, r.source, r.url, statusLabel(r.status), r.detail, r.suggestion]),
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    DashDownload.blob(blob, `cudfirm-site-health-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function init() { renderShell(); }
  return { init };
})();
