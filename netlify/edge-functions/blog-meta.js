/**
 * netlify/edge-functions/blog-meta.js
 *
 * WhatsApp, Facebook, X and LinkedIn read the <meta> tags of a page WITHOUT running JavaScript, so a
 * shared link like  blog.html?post=my-post  would always show the generic blog preview.
 * This edge function runs on Netlify just before blog.html is served: for ?post=<slug> it looks the
 * published post up in Supabase (public anon key, published rows only — same as the page itself)
 * and rewrites the title, description and share-image tags in the HTML.
 *
 * Safe by design: any problem (no slug, no post, Supabase slow or down) returns the normal page untouched.
 * Browsers still run js/blog.js as usual; this only changes what link previews see.
 */
const SUPABASE_URL = "https://wefncrkzugezvduzejzf.supabase.co";
const SUPABASE_KEY = "sb_publishable_dC3QHBaoJ7qb2jJUGXepsA_uKeQtofO"; // public (publishable) key, already shipped in js/supabase.js
const SITE = "https://cudfirm.netlify.app";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function absoluteImage(src, origin) {
  const v = String(src || "").trim();
  if (!v) return "";
  if (/^https:\/\//i.test(v)) return v;
  if (/^http:\/\//i.test(v)) return v.replace(/^http:/i, "https:");
  if (/^[\w./-]+$/.test(v) && !v.startsWith("//")) return (origin || SITE) + "/" + v.replace(/^\//, "");
  return "";
}

export function injectMeta(html, post, origin) {
  const title = esc(`${post.title} | CUDFIRM Blog & Resources`);
  const desc = esc(post.summary || "Read this on the CUDFIRM Blog & Resources.");
  const url = esc(`${SITE}/blog.html?post=${encodeURIComponent(post.slug)}`);
  const image = absoluteImage(post.image_url, origin);
  const swap = (re, text) => { html = re.test(html) ? html.replace(re, text) : html; };

  swap(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  swap(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${desc}" />`);
  swap(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${url}" />`);
  swap(/<meta property="og:type" content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="article" />`);
  swap(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  swap(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${desc}" />`);
  swap(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${url}" />`);

  let extra = `<meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${desc}" />`;
  if (image) {
    swap(/<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${esc(image)}" />`);
    swap(/<meta name="twitter:card" content="[^"]*"\s*\/?>/i, `<meta name="twitter:card" content="summary_large_image" />`);
    extra += `<meta property="og:image:alt" content="${esc(post.image_alt || post.title)}" /><meta name="twitter:image" content="${esc(image)}" />`;
  }
  return html.replace(/<\/head>/i, `${extra}</head>`);
}

export default async (request, context) => {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("post") || "").trim();
  if (!slug || slug.length > 120 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return context.next();

  const response = await context.next();
  try {
    if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const api = `${SUPABASE_URL}/rest/v1/blog_posts?select=title,summary,slug,image_url,image_alt&slug=eq.${slug}&status=eq.published&limit=1`;
    const res = await fetch(api, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return response;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return response;
    const html = await response.clone().text();
    return new Response(injectMeta(html, rows[0], url.origin), {
      status: response.status,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" },
    });
  } catch (e) {
    return response;
  }
};

export const config = { path: ["/blog.html", "/blog"] };
