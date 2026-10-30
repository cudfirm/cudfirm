/**
 * dashboard/js/pages/portfolio-page.js
 * Config-only file consumed by CrudEngine. Maps to `portfolio_projects`.
 */
// Industry choices come from the "Portfolio Industries" list (table portfolio_industries).
const PortfolioIndustryOptions = [{ value: "", label: "— Select an industry —" }];
(function loadIndustryOptions() {
  const db = window.supabaseClient;
  if (!db) return;
  db.from("portfolio_industries").select("name").order("name").then((r) => {
    if (r.error || !r.data) return;
    PortfolioIndustryOptions.length = 1;
    r.data.forEach((x) => PortfolioIndustryOptions.push({ value: x.name, label: x.name }));
  });
})();

const PortfolioPageConfig = {
  table: "portfolio_projects",
  title: "Portfolio Projects",
  singularLabel: "Project",
  hint: "These populate the Portfolio tab and the homepage preview grid.",
  orderCol: "sort_order",
  statusWorkflow: true,
  deleteLabelField: "name",
  searchFields: ["name", "industry", "project_type", "problem", "solution", "tags"],
  filters: [
    { key: "industry", label: "Industry", dynamic: true },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
        { value: "hidden", label: "Hidden" },
        { value: "archived", label: "Archived" },
      ],
    },
  ],
  columns: [
    { key: "name", label: "Project", primary: true },
    { key: "industry", label: "Industry" },
    { key: "is_live", label: "Live?", type: "bool", trueLabel: "Live", falseLabel: "Demo" },
    { key: "featured_home", label: "On Home", type: "bool", trueLabel: "Featured", falseLabel: "Hidden" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "name", label: "Project name", type: "text", required: true, maxLength: 120 },
    { key: "industry", label: "Industry", type: "select", options: PortfolioIndustryOptions, hint: "Choose from the list. Add or remove industries under Portfolio Industries in the menu." },
    { key: "project_type", label: "Project type", type: "text", placeholder: "e.g. Designer Portfolio Site", maxLength: 100 },
    { key: "image_url", label: "Image", type: "image", category: "portfolio", hint: "Upload or pick from the Media Library." },
    { key: "link", label: "Link", type: "url", placeholder: "'#', an external URL, or an internal tab id", maxLength: 500 },
    { key: "problem", label: "Problem", type: "textarea", rows: 2, maxLength: 400 },
    { key: "solution", label: "Solution", type: "textarea", rows: 2, maxLength: 400 },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "#Fashion, #Live" },
    { key: "is_live", label: "Live project (unchecked = \"Demo\")", type: "checkbox", default: true },
    { key: "featured_home", label: "Feature in homepage preview grid", type: "checkbox", default: true },
    {
      key: "status",
      label: "Content status",
      type: "select",
      required: true,
      default: "published",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
        { value: "hidden", label: "Hidden" },
        { value: "archived", label: "Archived" },
      ],
    },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};