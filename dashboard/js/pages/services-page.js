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
  statusWorkflow: true,
  deleteLabelField: "name",
  searchFields: ["name", "description", "price", "tags", "search_terms"],
  filters: [
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
    { key: "name", label: "Name", primary: true },
    { key: "price", label: "Price" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "is_special", label: "Special", type: "bool", trueLabel: "Special", falseLabel: "Standard" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, maxLength: 120, placeholder: "e.g. Starter Landing Page" },
    { key: "icon_url", label: "Icon / image", type: "image", category: "services" },
    { key: "description", label: "Description", type: "richtext", required: true, maxLength: 600 },
    { key: "price", label: "Price", type: "text", maxLength: 40, placeholder: "e.g. ₦50,000" },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "#Landing, #Starter, #₦50K" },
    { key: "search_terms", label: "Search terms", type: "textarea", rows: 2, maxLength: 300, hint: "Used by the on-page search box — space-separated keywords." },
    { key: "is_special", label: "Show as \"special request\" style card", type: "checkbox" },
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
