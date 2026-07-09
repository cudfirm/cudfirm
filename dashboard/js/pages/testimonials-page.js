/**
 * dashboard/js/pages/testimonials-page.js
 * Config-only file consumed by CrudEngine. Maps to `testimonials`.
 */
const TestimonialsPageConfig = {
  table: "testimonials",
  title: "Testimonials",
  singularLabel: "Testimonial",
  hint: "Client quotes shown on the Testimonials tab.",
  orderCol: "sort_order",
  statusWorkflow: true,
  deleteLabelField: "name",
  searchFields: ["name", "role", "quote"],
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
    { key: "role", label: "Role" },
    { key: "quote", label: "Quote" },
    { key: "is_placeholder", label: "Illustrative", type: "bool", trueLabel: "Illustrative", falseLabel: "Real" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, maxLength: 100, placeholder: "e.g. Adaeze O." },
    { key: "avatar_url", label: "Avatar", type: "image", category: "testimonials" },
    { key: "role", label: "Role", type: "text", maxLength: 120, placeholder: "e.g. Fashion Designer · Lagos" },
    { key: "quote", label: "Quote", type: "textarea", required: true, rows: 3, maxLength: 500 },
    { key: "accent_color", label: "Accent color", type: "color", default: "#0B3D2E" },
    { key: "is_placeholder", label: "Show \"Illustrative\" badge", type: "checkbox", default: true },
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
