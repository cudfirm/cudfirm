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
  statusWorkflow: true,
  deleteLabelField: "question",
  searchFields: ["question", "answer"],
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
    { key: "question", label: "Question", primary: true },
    { key: "answer", label: "Answer" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "question", label: "Question", type: "text", required: true, maxLength: 200 },
    { key: "answer", label: "Answer", type: "richtext", required: true, maxLength: 800 },
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
