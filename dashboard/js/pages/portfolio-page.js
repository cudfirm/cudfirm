/**
 * dashboard/js/pages/portfolio-page.js
 * Config-only file consumed by CrudEngine. Maps to `portfolio_projects`.
 */
const PortfolioPageConfig = {
  table: "portfolio_projects",
  title: "Portfolio Projects",
  singularLabel: "Project",
  hint: "These populate the Portfolio tab and the homepage preview grid.",
  orderCol: "sort_order",
  deleteLabelField: "name",
  columns: [
    { key: "name", label: "Project", primary: true },
    { key: "industry", label: "Industry" },
    { key: "is_live", label: "Live?", type: "bool", trueLabel: "Live", falseLabel: "Demo" },
    { key: "featured_home", label: "On Home", type: "bool", trueLabel: "Featured", falseLabel: "Hidden" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
  ],
  fields: [
    { key: "name", label: "Project name", type: "text", required: true, maxLength: 120 },
    { key: "industry", label: "Industry", type: "text", placeholder: "e.g. Fashion & Design", maxLength: 100 },
    { key: "project_type", label: "Project type", type: "text", placeholder: "e.g. Designer Portfolio Site", maxLength: 100 },
    { key: "image_url", label: "Image", type: "image", category: "portfolio", hint: "Upload or pick from the Media Library." },
    { key: "link", label: "Link", type: "url", placeholder: "'#', an external URL, or an internal tab id", maxLength: 500 },
    { key: "problem", label: "Problem", type: "textarea", rows: 2, maxLength: 400 },
    { key: "solution", label: "Solution", type: "textarea", rows: 2, maxLength: 400 },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "#Fashion, #Live" },
    { key: "is_live", label: "Live project (unchecked = \"Demo\")", type: "checkbox", default: true },
    { key: "featured_home", label: "Feature in homepage preview grid", type: "checkbox", default: true },
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
