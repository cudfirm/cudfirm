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
  deleteLabelField: "label",
  searchFields: ["label", "tab_id", "badge"],
  columns: [
    { key: "label", label: "Label", primary: true },
    { key: "tab_id", label: "Tab ID" },
    { key: "location", label: "Location" },
    { key: "badge", label: "Badge" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
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
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
