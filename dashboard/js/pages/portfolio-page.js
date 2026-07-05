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
  columns: [
    { key: "name", label: "Project", primary: true },
    { key: "industry", label: "Industry" },
    { key: "is_live", label: "Live?", type: "bool", trueLabel: "Live", falseLabel: "Demo" },
    { key: "featured_home", label: "On Home", type: "bool", trueLabel: "Featured", falseLabel: "Hidden" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
  ],
  fields: [
    { key: "name", label: "Project name", type: "text", required: true },
    { key: "industry", label: "Industry", type: "text", placeholder: "e.g. Fashion & Design" },
    { key: "project_type", label: "Project type", type: "text", placeholder: "e.g. Designer Portfolio Site" },
    { key: "image_url", label: "Image URL", type: "text", placeholder: "img/example.webp or https://…" },
    { key: "link", label: "Link", type: "text", placeholder: "'#', an external URL, or an internal tab id" },
    { key: "problem", label: "Problem", type: "textarea", rows: 2 },
    { key: "solution", label: "Solution", type: "textarea", rows: 2 },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "#Fashion, #Live" },
    { key: "is_live", label: "Live project (unchecked = \"Demo\")", type: "checkbox", default: true },
    { key: "featured_home", label: "Feature in homepage preview grid", type: "checkbox", default: true },
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
