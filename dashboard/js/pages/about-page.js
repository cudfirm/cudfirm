const AboutPage = (() => {
  const statusOptions = [
    { value: "published", label: "Published" }, { value: "draft", label: "Draft" },
    { value: "hidden", label: "Hidden" }, { value: "archived", label: "Archived" },
  ];
  const config = {
    table: "about_content", title: "About Content",
    note: "Template-neutral About content. Templates may rearrange or omit optional subsections, but the CMS data remains reusable.",
    groups: [
      { title: "Main content", icon: "bi-info-circle", fields: [
        { key: "eyebrow", label: "Eyebrow", maxLength: 80 },
        { key: "title", label: "Main title", type: "textarea", rows: 2, required: true, maxLength: 160 },
        { key: "introduction", label: "Introduction", type: "textarea", rows: 4, maxLength: 1000 },
        { key: "image_url", label: "About image", type: "image", category: "about" },
        { key: "image_alt", label: "Image alt text", maxLength: 200 },
      ]},
      { title: "Mission", icon: "bi-bullseye", fields: [
        { key: "mission_title", label: "Mission title", maxLength: 160 },
        { key: "mission_text", label: "Mission text", type: "textarea", rows: 5, maxLength: 3000 },
      ]},
      { title: "Section headings", icon: "bi-type-h2", fields: [
        { key: "story_title", label: "Story heading", maxLength: 160 },
        { key: "values_title", label: "Values heading", maxLength: 160 },
        { key: "facts_title", label: "Facts heading", maxLength: 160 },
      ]},
      { title: "Call to action and publishing", icon: "bi-megaphone", fields: [
        { key: "cta_label", label: "CTA label", maxLength: 100 },
        { key: "cta_target", label: "CTA target", maxLength: 500, hint: "Tab target, anchor, relative path, or HTTPS URL." },
        { key: "status", label: "Content status", type: "select", options: statusOptions },
      ]},
    ],
    repeaters: [
      { key: "story_blocks", label: "Story blocks", itemPrefix: "story", hint: "Drag items or use the arrow buttons to reorder.", fields: [
        { key: "heading", label: "Optional heading", maxLength: 160 },
        { key: "text", label: "Story text", type: "textarea", rows: 4, required: true, maxLength: 5000 },
        { key: "imageUrl", label: "Optional image URL", maxLength: 1000 },
        { key: "imageAlt", label: "Image alt text", maxLength: 200 },
      ]},
      { key: "values", label: "Values", itemPrefix: "value", fields: [
        { key: "icon", label: "Icon class or image URL", maxLength: 500 },
        { key: "title", label: "Title", required: true, maxLength: 120 },
        { key: "description", label: "Description", type: "textarea", rows: 3, required: true, maxLength: 1000 },
      ]},
      { key: "facts", label: "Quick facts", itemPrefix: "fact", fields: [
        { key: "value", label: "Value", required: true, maxLength: 50 },
        { key: "label", label: "Label", required: true, maxLength: 120 },
      ]},
    ],
    persistFields: ["eyebrow","title","introduction","mission_title","mission_text","story_title","story_blocks","values_title","values","facts_title","facts","image_url","image_alt","cta_label","cta_target","status"],
  };
  return { init: () => SingletonContentEditor.init(config) };
})();
