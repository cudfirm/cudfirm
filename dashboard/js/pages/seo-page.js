/**
 * dashboard/js/pages/seo-page.js
 * Config-only file consumed by CrudEngine. Maps to `seo_meta`.
 * `seo_meta` has no sort_order column, so reordering is disabled and
 * rows are listed alphabetically by page_key instead.
 */
const SeoPageConfig = {
  table: "seo_meta",
  title: "SEO Manager",
  singularLabel: "Page Entry",
  hint: "One entry per page/section. \"home\" is applied to the live site's <head> on load.",
  orderCol: "page_key",
  orderable: false,
  deleteLabelField: "page_key",
  columns: [
    { key: "page_key", label: "Page Key", primary: true },
    { key: "title", label: "Title" },
    { key: "robots", label: "Robots" },
  ],
  fields: [
    { key: "page_key", label: "Page key", type: "text", required: true, maxLength: 60, placeholder: "e.g. home", hint: "A short identifier — \"home\" is the one currently read by the live site." },
    { key: "title", label: "Page title", type: "text", maxLength: 70, hint: "Aim for under 60 characters so it doesn't get truncated in search results." },
    { key: "meta_description", label: "Meta description", type: "textarea", rows: 3, maxLength: 160, hint: "Aim for under 155 characters." },
    { key: "og_image", label: "Open Graph image", type: "image", category: "seo", hint: "Shown when the page is shared on Facebook/LinkedIn." },
    { key: "twitter_image", label: "Twitter card image", type: "image", category: "seo" },
    {
      key: "robots",
      label: "Robots",
      type: "select",
      options: [
        { value: "index, follow", label: "Index, Follow (default)" },
        { value: "noindex, follow", label: "No Index, Follow" },
        { value: "index, nofollow", label: "Index, No Follow" },
        { value: "noindex, nofollow", label: "No Index, No Follow" },
      ],
    },
    { key: "canonical_url", label: "Canonical URL", type: "url", maxLength: 300, placeholder: "https://cudfirm.netlify.app" },
  ],
};
