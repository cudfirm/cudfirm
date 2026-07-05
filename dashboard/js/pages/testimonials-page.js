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
  columns: [
    { key: "name", label: "Name", primary: true },
    { key: "role", label: "Role" },
    { key: "quote", label: "Quote" },
    { key: "is_placeholder", label: "Illustrative", type: "bool", trueLabel: "Illustrative", falseLabel: "Real" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Adaeze O." },
    { key: "role", label: "Role", type: "text", placeholder: "e.g. Fashion Designer · Lagos" },
    { key: "quote", label: "Quote", type: "textarea", required: true, rows: 3 },
    { key: "accent_color", label: "Accent color", type: "color", default: "#0B3D2E" },
    { key: "is_placeholder", label: "Show \"Illustrative\" badge", type: "checkbox", default: true },
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
