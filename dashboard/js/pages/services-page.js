/**
 * dashboard/js/pages/services-page.js
 * Config-only file consumed by CrudEngine. Maps to the `services` table.
 */
const ServicesPageConfig = {
  table: "services",
  title: "Services",
  singularLabel: "Service",
  hint: "These power the pricing cards on the Services tab of the live site.",
  orderCol: "sort_order",
  columns: [
    { key: "name", label: "Name", primary: true },
    { key: "price", label: "Price" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "is_special", label: "Special", type: "bool", trueLabel: "Special", falseLabel: "Standard" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Starter Landing Page" },
    { key: "description", label: "Description", type: "textarea", required: true, rows: 4 },
    { key: "price", label: "Price", type: "text", placeholder: "e.g. ₦50,000" },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "#Landing, #Starter, #₦50K" },
    { key: "search_terms", label: "Search terms", type: "textarea", rows: 2, hint: "Used by the on-page search box — space-separated keywords." },
    { key: "is_special", label: "Show as \"special request\" style card", type: "checkbox" },
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
