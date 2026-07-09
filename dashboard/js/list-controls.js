/**
 * dashboard/js/list-controls.js
 * ------------------------------------------------------------------
 * Phase 4.1 — reusable client-side Search / Filter / Sort for the
 * CrudEngine-powered list pages (Services, Portfolio, Testimonials,
 * FAQ, Navigation).
 *
 * This module is deliberately stateless: it doesn't hold row data or
 * remember what the admin typed. The caller (crud-engine.js) owns a
 * small `state` object ({ search, filters, sort }) and calls:
 *
 *   DashListControls.renderHtml(cfg, state, rows)   -> toolbar markup
 *   DashListControls.apply(rows, cfg, state)         -> filtered/sorted rows
 *
 * Keeping it stateless/pure is what makes it reusable: a future
 * Pagination feature can slice() the array apply() returns, and a
 * future Bulk Actions feature can operate on that same filtered
 * subset — neither needs to touch this file.
 *
 * Everything here reads from the already-loaded `rows` array that
 * CrudEngine fetched — no extra Supabase requests are made while
 * searching, filtering, or sorting.
 *
 * Opt-in per page via two optional config keys (a page with neither
 * gets no toolbar at all and behaves exactly as before):
 *
 *   searchFields: ['name', 'description']   // row keys to search across
 *   filters: [{
 *     key: 'is_active',                     // row key to filter on
 *     label: 'Status',
 *     options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }],
 *     dynamic: false,                       // if true, options are derived from the loaded rows instead of listed above
 *   }]
 *
 * Sort is generic and needs no per-page config: Manual Order (the
 * existing sort_order column), Newest/Oldest (by id — none of these
 * tables have a created_at column, and id already increases in
 * creation order, so it's a safe, schema-free stand-in), and A→Z /
 * Z→A (using the same field CrudEngine already uses for delete
 * confirmations: cfg.deleteLabelField, falling back to the first
 * column — no new config needed).
 * ------------------------------------------------------------------
 */

const DashListControls = (() => {
  function defaultState() {
    return { search: "", filters: {}, sort: "manual" };
  }

  /** True when nothing is searched/filtered and sort is untouched — the only state where manual drag-free reordering (up/down) still makes sense. */
  function isDefaultView(state) {
    const noFilters = Object.values(state.filters).every((v) => !v || v === "all");
    return !state.search.trim() && state.sort === "manual" && noFilters;
  }

  function buildDynamicOptions(rows, filter) {
    const values = Array.from(
      new Set(rows.map((r) => r[filter.key]).filter((v) => v !== null && v !== undefined && v !== ""))
    );
    values.sort((a, b) => String(a).localeCompare(String(b)));
    return values.map((v) => ({ value: v, label: v }));
  }

  function renderHtml(cfg, state, rows) {
    if (!cfg.searchFields && !cfg.filters) return "";

    const searchHtml = cfg.searchFields
      ? `<div class="crud-search-wrap">
           <i class="bi bi-search" aria-hidden="true"></i>
           <input type="search" class="form-control" id="listSearchInput" placeholder="Search ${esc(cfg.title.toLowerCase())}…" value="${esc(state.search)}" aria-label="Search ${esc(cfg.title.toLowerCase())}">
         </div>`
      : "";

    const filtersHtml = (cfg.filters || [])
      .map((f) => {
        const options = f.dynamic ? buildDynamicOptions(rows, f) : f.options;
        const current = state.filters[f.key];
        const optsHtml = [`<option value="all">All ${esc(f.label.toLowerCase())}</option>`]
          .concat(
            options.map(
              (o) => `<option value="${esc(o.value)}" ${String(current) === String(o.value) ? "selected" : ""}>${esc(o.label)}</option>`
            )
          )
          .join("");
        return `<select class="form-select" data-filter-key="${esc(f.key)}" aria-label="Filter by ${esc(f.label)}">${optsHtml}</select>`;
      })
      .join("");

    const sortHtml = `
      <select class="form-select" id="listSortSelect" aria-label="Sort">
        <option value="manual" ${state.sort === "manual" ? "selected" : ""}>Manual Order</option>
        <option value="newest" ${state.sort === "newest" ? "selected" : ""}>Newest</option>
        <option value="oldest" ${state.sort === "oldest" ? "selected" : ""}>Oldest</option>
        <option value="az" ${state.sort === "az" ? "selected" : ""}>A &rarr; Z</option>
        <option value="za" ${state.sort === "za" ? "selected" : ""}>Z &rarr; A</option>
      </select>`;

    return `
      <div class="crud-filters-bar">
        ${searchHtml}
        ${filtersHtml}
        ${sortHtml}
        <span class="crud-results-count" id="crudResultsCount" aria-live="polite"></span>
      </div>`;
  }

  function apply(rows, cfg, state) {
    let result = rows.slice();

    if (cfg.searchFields && state.search.trim()) {
      const term = state.search.trim().toLowerCase();
      result = result.filter((row) =>
        cfg.searchFields.some((key) => {
          const val = row[key];
          if (Array.isArray(val)) return val.join(" ").toLowerCase().includes(term);
          return String(val || "").toLowerCase().includes(term);
        })
      );
    }

    (cfg.filters || []).forEach((f) => {
      const val = state.filters[f.key];
      if (val === undefined || val === "all" || val === "") return;
      result = result.filter((row) => String(row[f.key]) === String(val));
    });

    const sortField = cfg.deleteLabelField || (cfg.columns && cfg.columns[0] && cfg.columns[0].key) || "id";
    if (state.sort === "newest") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (state.sort === "oldest") {
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
    } else if (state.sort === "az") {
      result.sort((a, b) => String(a[sortField] || "").localeCompare(String(b[sortField] || "")));
    } else if (state.sort === "za") {
      result.sort((a, b) => String(b[sortField] || "").localeCompare(String(a[sortField] || "")));
    }
    // "manual" — leave as-is; rows already arrive sorted by sort_order from AdminApi.list.

    return result;
  }

  return { defaultState, isDefaultView, renderHtml, apply };
})();
