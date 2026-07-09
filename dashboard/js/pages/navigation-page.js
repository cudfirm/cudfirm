/**
 * dashboard/js/pages/navigation-page.js
 * Config-only file consumed by CrudEngine. Maps to `navigation`.
 *
 * Note: sidebar and footer items share one table/one sort_order
 * sequence (matching the existing schema). The Up/Down reorder
 * buttons move a row within the full list as shown here; if you
 * want tighter control per-location, edit "Sort order" directly
 * in the form instead.
 */
const NavigationPageConfig = {
  table: "navigation",
  title: "Navigation",
  singularLabel: "Nav Item",
  hint: "Controls the sidebar and footer tabs/links on the live site.",
  orderCol: "sort_order",
  statusWorkflow: true,
  deleteLabelField: "label",
  searchFields: ["label", "tab_id", "badge"],
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
    { key: "label", label: "Label", primary: true },
    { key: "tab_id", label: "Tab ID" },
    { key: "location", label: "Location" },
    { key: "badge", label: "Badge" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "label", label: "Label", type: "text", required: true, maxLength: 60, placeholder: "e.g. Services" },
    { key: "tab_id", label: "Tab ID", type: "text", required: true, maxLength: 60, placeholder: "e.g. tab3 or connect-content", hint: "Must match the tab id used in script.js." },
    {
      key: "location",
      label: "Location",
      type: "select",
      required: true,
      options: [
        { value: "sidebar", label: "Sidebar" },
        { value: "footer", label: "Footer" },
      ],
    },
    { key: "badge", label: "Badge text (optional)", type: "text", maxLength: 20, placeholder: "e.g. hot" },
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
