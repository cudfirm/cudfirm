/**
 * dashboard/js/pages/blog-page.js
 * Config-only file consumed by CrudEngine. Maps to `blog_posts`
 * (created by supabase/019_blog_resources.sql).
 *
 * One table holds every Blog & Resources item. `content_type` decides how
 * the public page presents it; `category` is free text so categories can
 * grow without a code change (the public page builds its category list
 * from the published posts).
 */
const BlogPageConfig = {
  table: "blog_posts",
  title: "Blog & Resources",
  singularLabel: "Post",
  hint: "These populate the public Blog & Resources page. Only posts with status Published are visible to visitors.",
  orderCol: "sort_order",
  statusWorkflow: true,
  deleteLabelField: "title",
  searchFields: ["title", "summary", "category", "content_type", "tags", "author_name"],
  filters: [
    {
      key: "content_type",
      label: "Type",
      options: [
        { value: "article", label: "Article" },
        { value: "news", label: "Tech news" },
        { value: "guide", label: "Guide" },
        { value: "tutorial", label: "Tutorial" },
        { value: "tool", label: "Tool / platform" },
        { value: "case_study", label: "Case study" },
        { value: "announcement", label: "Announcement" },
        { value: "external", label: "External resource" },
        { value: "sponsored", label: "Sponsored / partner" },
      ],
    },
    { key: "category", label: "Category", dynamic: true },
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
    { key: "title", label: "Title", primary: true },
    { key: "category", label: "Category" },
    { key: "content_type", label: "Type" },
    { key: "featured", label: "Featured", type: "bool", trueLabel: "Featured", falseLabel: "—" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "title", label: "Title", type: "text", required: true, maxLength: 200 },
    { key: "slug", label: "URL name (slug)", type: "text", required: true, maxLength: 120, placeholder: "e.g. how-to-choose-a-web-host", hint: "Lowercase letters, numbers and dashes only. Filled in from the title automatically. Changing it later breaks old links." },
    { key: "summary", label: "Short summary", type: "textarea", rows: 2, maxLength: 400, hint: "Shown on cards and in search results (up to 400 characters)." },
    { key: "category", label: "Category", type: "text", required: true, maxLength: 60, default: "Articles", hint: "Reuse an existing category name where possible, e.g. Articles, Web Development, AI & Tools, Business & Productivity, Company Updates." },
    {
      key: "content_type",
      label: "Content type",
      type: "select",
      required: true,
      default: "article",
      options: [
        { value: "article", label: "Article" },
        { value: "news", label: "Tech news" },
        { value: "guide", label: "Guide" },
        { value: "tutorial", label: "Tutorial" },
        { value: "tool", label: "Tool / platform" },
        { value: "case_study", label: "Case study" },
        { value: "announcement", label: "Announcement" },
        { value: "external", label: "External resource (link to another site)" },
        { value: "sponsored", label: "Sponsored / partner" },
      ],
    },
    { key: "image_url", label: "Featured image", type: "image", category: "blog", hint: "Upload or pick from the Media Library." },
    { key: "image_alt", label: "Image description (for accessibility)", type: "text", maxLength: 200 },
    { key: "body", label: "Body", type: "richtext", hint: "Leave empty for external resources that only link out." },
    { key: "external_url", label: "External link", type: "url", maxLength: 500, placeholder: "https://… (external resources only)", hint: "Must start with http:// or https://. Required for External resource items." },
    { key: "source_name", label: "Source name", type: "text", maxLength: 120, placeholder: "e.g. MDN Web Docs (external resources only)" },
    { key: "disclosure", label: "Sponsorship / partner disclosure", type: "text", maxLength: 300, hint: "Shown on the post. Required for Sponsored / partner items." },
    { key: "author_name", label: "Author (only if verified)", type: "text", maxLength: 120 },
    { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "web, seo, hosting" },
    { key: "featured", label: "Feature at the top of the Blog & Resources page", type: "checkbox", default: false },
    {
      key: "status",
      label: "Content status",
      type: "select",
      required: true,
      default: "draft",
      options: [
        { value: "draft", label: "Draft (not public)" },
        { value: "published", label: "Published" },
        { value: "hidden", label: "Hidden" },
        { value: "archived", label: "Archived" },
      ],
    },
    { key: "sort_order", label: "Sort order", type: "number", default: 0, hint: "Lower numbers appear first among featured posts." },
  ],
};

/* Slug helper: fills the slug from the title and keeps it URL-safe. */
(function slugAssist() {
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120)
      .replace(/-+$/g, "");
  }
  let slugTouched = false;
  document.addEventListener("input", (e) => {
    const slug = document.getElementById("f_slug");
    if (!slug) return;
    if (e.target.id === "f_slug") { slugTouched = true; return; }
    if (e.target.id === "f_title" && (!slugTouched || !slug.value)) {
      slug.value = slugify(e.target.value);
    }
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.id === "f_slug") e.target.value = slugify(e.target.value);
  });
  document.addEventListener("submit", () => {
    const slug = document.getElementById("f_slug");
    if (slug) slug.value = slugify(slug.value);
  }, true);
  document.addEventListener("click", (e) => {
    // Opening a form resets the "touched" state; editing an existing post keeps its slug.
    if (e.target.closest && e.target.closest("[data-action]")) slugTouched = false;
  }, true);
})();
