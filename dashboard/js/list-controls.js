/**
 * dashboard/js/list-controls.js
 * ------------------------------------------------------------------
 * Reusable client-side Search / Filter / Sort / Pagination helpers
 * for the CrudEngine-powered dashboard list pages.
 *
 * This module remains stateless. CrudEngine owns the current state and
 * passes it into these pure helpers. All work is performed against the
 * already-loaded rows array, so searching, filtering, sorting and page
 * navigation never make additional Supabase requests.
 * ------------------------------------------------------------------
 */

const DashListControls = (() => {
  const DEFAULT_PAGE_SIZE = 10;
  const PAGE_SIZE_OPTIONS = [10, 20, 50];

  function defaultState() {
    return {
      search: "",
      filters: {},
      sort: "manual",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }

  /**
   * Manual ordering is safe only when the full, unfiltered manual-order
   * list is being viewed. Pagination itself does not change that rule.
   */
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

    return result;
  }

  /**
   * Return the valid current page plus its rows and metadata. The caller
   * may copy `page` back into state when a delete/filter leaves the old
   * page number outside the new valid range.
   */
  function paginate(items, state) {
    const requestedSize = Number(state.pageSize);
    const pageSize = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : DEFAULT_PAGE_SIZE;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const requestedPage = Number(state.page) || 1;
    const page = Math.min(Math.max(1, requestedPage), totalPages);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      rows: items.slice(startIndex, endIndex),
      page,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
    };
  }

  function pageItems(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) items.push("ellipsis-start");
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < totalPages - 1) items.push("ellipsis-end");
    items.push(totalPages);

    return items;
  }

  function renderPaginationHtml(meta) {
    if (!meta.totalItems) return "";

    const pageSizeOptions = PAGE_SIZE_OPTIONS.map(
      (size) => `<option value="${size}" ${meta.pageSize === size ? "selected" : ""}>${size}</option>`
    ).join("");

    const pageButtons = pageItems(meta.page, meta.totalPages)
      .map((item) => {
        if (typeof item !== "number") {
          return `<span class="crud-page-ellipsis" aria-hidden="true">&hellip;</span>`;
        }
        return `<button type="button" class="crud-page-btn${item === meta.page ? " is-active" : ""}" data-page="${item}" ${item === meta.page ? 'aria-current="page"' : ""} aria-label="Go to page ${item}">${item}</button>`;
      })
      .join("");

    return `
      <div class="crud-pagination" aria-label="Pagination">
        <label class="crud-page-size">
          <span>Show</span>
          <select class="form-select" id="crudPageSizeSelect" aria-label="Items per page">
            ${pageSizeOptions}
          </select>
          <span>per page</span>
        </label>

        <div class="crud-page-nav">
          <button type="button" class="crud-page-btn crud-page-step" data-page="${meta.page - 1}" ${meta.page === 1 ? "disabled" : ""} aria-label="Previous page">
            <i class="bi bi-chevron-left" aria-hidden="true"></i><span>Previous</span>
          </button>
          <div class="crud-page-numbers" aria-label="Page numbers">${pageButtons}</div>
          <button type="button" class="crud-page-btn crud-page-step" data-page="${meta.page + 1}" ${meta.page === meta.totalPages ? "disabled" : ""} aria-label="Next page">
            <span>Next</span><i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>`;
  }

  return {
    defaultState,
    isDefaultView,
    renderHtml,
    apply,
    paginate,
    renderPaginationHtml,
  };
})();
