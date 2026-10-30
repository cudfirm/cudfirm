/**
 * dashboard/js/seo-health.js
 * Lightweight, client-side SEO validation for seo_meta records.
 * It does not write to Supabase and does not change live-site metadata.
 */
const SeoHealth = (() => {
  const TITLE_MIN = 30;
  const TITLE_MAX = 60;
  const DESCRIPTION_MIN = 70;
  const DESCRIPTION_MAX = 155;

  function clean(value) {
    return String(value || "").trim();
  }

  function normalized(value) {
    return clean(value).toLowerCase().replace(/\s+/g, " ");
  }

  function duplicateCounts(rows, key) {
    const counts = new Map();
    rows.forEach((row) => {
      const value = normalized(row[key]);
      if (!value) return;
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }

  function issue(code, label, detail, severity, penalty) {
    return { code, label, detail, severity, penalty };
  }

  function analyzeRow(row, rows) {
    const title = clean(row.title);
    const description = clean(row.meta_description);
    const canonical = clean(row.canonical_url);
    const robots = normalized(row.robots);
    const issues = [];

    const pageKeyCounts = duplicateCounts(rows, "page_key");
    const titleCounts = duplicateCounts(rows, "title");
    const descriptionCounts = duplicateCounts(rows, "meta_description");

    if (!clean(row.page_key)) {
      issues.push(issue("missing-page-key", "Missing page key", "Add a unique page identifier.", "critical", 30));
    } else if ((pageKeyCounts.get(normalized(row.page_key)) || 0) > 1) {
      issues.push(issue("duplicate-page-key", "Duplicate page key", "Each SEO entry should use a unique page key.", "critical", 30));
    }

    if (!title) {
      issues.push(issue("missing-title", "Missing page title", "Add a descriptive title for search results.", "critical", 25));
    } else {
      if (title.length < TITLE_MIN) {
        issues.push(issue("short-title", "Title is short", `Current length: ${title.length}. Aim for ${TITLE_MIN}–${TITLE_MAX} characters.`, "warning", 8));
      }
      if (title.length > TITLE_MAX) {
        issues.push(issue("long-title", "Title may be truncated", `Current length: ${title.length}. Aim for no more than ${TITLE_MAX} characters.`, "warning", 8));
      }
      if ((titleCounts.get(normalized(title)) || 0) > 1) {
        issues.push(issue("duplicate-title", "Duplicate page title", "Use a distinct title for each page.", "warning", 15));
      }
    }

    if (!description) {
      issues.push(issue("missing-description", "Missing meta description", "Add a concise summary for search results.", "critical", 20));
    } else {
      if (description.length < DESCRIPTION_MIN) {
        issues.push(issue("short-description", "Description is short", `Current length: ${description.length}. Aim for ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`, "warning", 8));
      }
      if (description.length > DESCRIPTION_MAX) {
        issues.push(issue("long-description", "Description may be truncated", `Current length: ${description.length}. Aim for no more than ${DESCRIPTION_MAX} characters.`, "warning", 8));
      }
      if ((descriptionCounts.get(normalized(description)) || 0) > 1) {
        issues.push(issue("duplicate-description", "Duplicate meta description", "Use a distinct description for each page.", "warning", 10));
      }
    }

    if (!clean(row.og_image)) {
      issues.push(issue("missing-og-image", "Missing social image", "Add an Open Graph image for link previews.", "warning", 10));
    }

    if (!canonical) {
      issues.push(issue("missing-canonical", "Missing canonical URL", "Add the preferred absolute URL for this page.", "warning", 10));
    } else {
      try {
        const url = new URL(canonical);
        if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
      } catch (_) {
        issues.push(issue("invalid-canonical", "Canonical URL is invalid", "Use a complete URL beginning with https:// or http://.", "critical", 15));
      }
    }

    if (!robots) {
      issues.push(issue("missing-robots", "Robots setting is missing", "Choose an indexing and link-following setting.", "warning", 10));
    } else if (robots.includes("noindex") || robots.includes("nofollow")) {
      issues.push(issue("restrictive-robots", "Robots setting restricts discovery", `Current setting: ${clean(row.robots)}. Confirm this is intentional.`, "warning", 5));
    }

    const score = Math.max(0, 100 - issues.reduce((sum, item) => sum + item.penalty, 0));
    const criticalCount = issues.filter((item) => item.severity === "critical").length;
    let status = "good";
    let label = "Good";
    if (criticalCount > 0 || score < 60) {
      status = "poor";
      label = "Poor";
    } else if (issues.length > 0 || score < 85) {
      status = "attention";
      label = "Needs Attention";
    }

    return { score, status, label, issues, criticalCount };
  }

  function analyzeAll(rows) {
    return rows.map((row) => ({ row, health: analyzeRow(row, rows) }));
  }

  function renderCell(row, rows) {
    const health = analyzeRow(row, rows);
    return `
      <button type="button" class="seo-health-pill seo-health-${health.status}" data-seo-health-id="${Number(row.id)}" aria-label="View SEO health details for ${esc(row.page_key || "this page")}">
        <span class="seo-health-score">${health.score}</span>
        <span>${esc(health.label)}</span>
      </button>`;
  }

  function renderSummary(rows) {
    if (!rows.length) return "";
    const analyzed = analyzeAll(rows);
    const counts = analyzed.reduce(
      (acc, item) => {
        acc[item.health.status] += 1;
        return acc;
      },
      { good: 0, attention: 0, poor: 0 }
    );
    const average = Math.round(analyzed.reduce((sum, item) => sum + item.health.score, 0) / analyzed.length);

    return `
      <section class="seo-health-summary" aria-labelledby="seoHealthSummaryTitle">
        <div class="seo-health-summary-head">
          <div>
            <h2 id="seoHealthSummaryTitle">SEO Health</h2>
            <p>Automatic checks run locally against the SEO entries already loaded in this dashboard.</p>
          </div>
          <div class="seo-health-average" aria-label="Average SEO score ${average} out of 100">
            <strong>${average}</strong><span>/100 average</span>
          </div>
        </div>
        <div class="seo-health-stat-grid">
          <div class="seo-health-stat"><span>Total entries</span><strong>${analyzed.length}</strong></div>
          <div class="seo-health-stat seo-health-good"><span>Good</span><strong>${counts.good}</strong></div>
          <div class="seo-health-stat seo-health-attention"><span>Needs attention</span><strong>${counts.attention}</strong></div>
          <div class="seo-health-stat seo-health-poor"><span>Poor</span><strong>${counts.poor}</strong></div>
        </div>
      </section>`;
  }

  function ensureModal() {
    if (document.getElementById("seoHealthModal")) return;
    const holder = document.createElement("div");
    holder.innerHTML = `
      <div class="modal fade" id="seoHealthModal" tabindex="-1" aria-labelledby="seoHealthModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title" id="seoHealthModalTitle">SEO health details</h5>
                <div class="seo-health-modal-key" id="seoHealthModalKey"></div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="seoHealthModalBody"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(holder);
  }

  function showDetails(row, rows) {
    ensureModal();
    const health = analyzeRow(row, rows);
    const title = document.getElementById("seoHealthModalTitle");
    const key = document.getElementById("seoHealthModalKey");
    const body = document.getElementById("seoHealthModalBody");
    title.textContent = `${health.score}/100 — ${health.label}`;
    key.textContent = row.page_key || "Unnamed SEO entry";

    if (!health.issues.length) {
      body.innerHTML = `
        <div class="seo-health-all-good">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
          <div><strong>No issues detected</strong><p>This entry passes the current SEO health checks.</p></div>
        </div>`;
    } else {
      body.innerHTML = `
        <div class="seo-health-issue-list">
          ${health.issues
            .map(
              (item) => `
                <div class="seo-health-issue seo-health-issue-${item.severity}">
                  <i class="bi ${item.severity === "critical" ? "bi-exclamation-octagon-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i>
                  <div><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p></div>
                </div>`
            )
            .join("")}
        </div>`;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById("seoHealthModal")).show();
  }

  function wire({ wrap, rows }) {
    wrap.querySelectorAll("[data-seo-health-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.seoHealthId);
        const row = rows.find((candidate) => Number(candidate.id) === id);
        if (row) showDetails(row, rows);
      });
    });
  }

  return { analyzeRow, renderCell, renderSummary, wire };
})();
