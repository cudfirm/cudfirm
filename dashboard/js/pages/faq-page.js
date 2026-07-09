/**
 * dashboard/js/pages/faq-page.js
 * Config-only file consumed by CrudEngine. Maps to `faq`.
 */
const FaqPageConfig = {
  table: "faq",
  title: "FAQ",
  singularLabel: "FAQ Entry",
  hint: "Questions and answers shown on the FAQ tab.",
  orderCol: "sort_order",
  deleteLabelField: "question",
  searchFields: ["question", "answer"],
  columns: [
    { key: "question", label: "Question", primary: true },
    { key: "answer", label: "Answer" },
    { key: "is_active", label: "Status", type: "bool", trueLabel: "Active", falseLabel: "Hidden" },
  ],
  fields: [
    { key: "question", label: "Question", type: "text", required: true, maxLength: 200 },
    { key: "answer", label: "Answer", type: "richtext", required: true, maxLength: 800 },
    { key: "is_active", label: "Active (visible on live site)", type: "checkbox", default: true },
    { key: "sort_order", label: "Sort order", type: "number", default: 0 },
  ],
};
