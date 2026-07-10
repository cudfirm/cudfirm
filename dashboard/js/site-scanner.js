/**
 * Client-side site health scanner.
 * Scans same-origin public pages plus URL fields stored in Supabase.
 * External URLs blocked by CORS are reported as "unverified", never broken.
 */
const SiteScanner = (() => {
  const PAGE_PATHS = ["../index.html", "../portfolio.html", "../terms.html", "../thank-you.html"];
  const TIMEOUT_MS = 8000;
  const SKIP_SCHEMES = /^(mailto:|tel:|sms:|whatsapp:)/i;
  const UNSAFE_SCHEMES = /^(javascript:|data:|vbscript:)/i;

  function withTimeout(promise, ms = TIMEOUT_MS) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
    ]);
  }

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function issueKey(item) {
    return [item.type, item.source, item.url, item.code].join("|");
  }

  function makeResult(input) {
    return {
      id: input.id || issueKey(input),
      type: input.type || "link",
      source: input.source || "Unknown",
      sourceUrl: input.sourceUrl || "",
      url: input.url || "",
      status: input.status || "warning",
      code: input.code || "warning",
      label: input.label || "Warning",
      detail: input.detail || "",
      suggestion: input.suggestion || "Review this item.",
      duplicateCount: input.duplicateCount || 1,
    };
  }

  function resolveUrl(raw, baseUrl) {
    try {
      return new URL(raw, baseUrl);
    } catch (_) {
      return null;
    }
  }

  async function requestStatus(url, isImage) {
    const sameOrigin = url.origin === window.location.origin;
    if (url.protocol === "file:") {
      return { status: "unverified", code: "file-protocol", label: "Could not verify", detail: "Run the project through Live Server or the deployed site to scan URLs." };
    }

    try {
      const options = { cache: "no-store", redirect: "follow", credentials: sameOrigin ? "same-origin" : "omit" };
      let response;
      try {
        response = await withTimeout(fetch(url.href, { ...options, method: "HEAD", mode: "cors" }));
      } catch (_) {
        response = await withTimeout(fetch(url.href, { ...options, method: "GET", mode: "cors" }));
      }
      if (response.ok) return { status: "working", code: String(response.status), label: "Working", detail: `HTTP ${response.status}` };
      if (response.status === 404 || response.status === 410) {
        return { status: "broken", code: String(response.status), label: "Confirmed broken", detail: `HTTP ${response.status}` };
      }
      return { status: "warning", code: String(response.status), label: "Warning", detail: `HTTP ${response.status}` };
    } catch (error) {
      if (!sameOrigin) {
        return { status: "unverified", code: "cors", label: "Could not verify", detail: "The external website blocked browser verification (CORS)." };
      }
      return { status: "broken", code: "network", label: "Confirmed broken", detail: isImage ? "The image could not be loaded." : "The URL could not be reached." };
    }
  }

  async function inspectReference(ref) {
    const raw = clean(ref.url);
    if (!raw) {
      return makeResult({ ...ref, url: "(empty)", status: "warning", code: "empty", label: "Warning", detail: `Empty ${ref.type === "image" ? "src" : "href"} value.`, suggestion: `Add a valid ${ref.type === "image" ? "image URL" : "destination"} or remove the element.` });
    }
    if (UNSAFE_SCHEMES.test(raw)) {
      return makeResult({ ...ref, status: "broken", code: "unsafe-scheme", label: "Confirmed broken", detail: "Unsafe URL scheme detected.", suggestion: "Replace it with a normal HTTPS URL or a valid internal path." });
    }
    if (SKIP_SCHEMES.test(raw)) {
      return makeResult({ ...ref, status: "working", code: "contact-scheme", label: "Working", detail: "Contact link format is valid.", suggestion: "No action needed." });
    }
    if (raw === "#") {
      return makeResult({ ...ref, status: "warning", code: "placeholder", label: "Warning", detail: "Placeholder link points only to #.", suggestion: "Replace the placeholder with a real destination when available." });
    }

    const resolved = resolveUrl(raw, ref.baseUrl || window.location.href);
    if (!resolved || !/^https?:$/.test(resolved.protocol)) {
      return makeResult({ ...ref, status: "broken", code: "malformed", label: "Confirmed broken", detail: "Malformed or unsupported URL.", suggestion: "Correct the URL format." });
    }

    if (raw.startsWith("#")) {
      const exists = ref.document && ref.document.getElementById(raw.slice(1));
      return makeResult({ ...ref, url: resolved.href, status: exists ? "working" : "broken", code: exists ? "anchor-ok" : "missing-anchor", label: exists ? "Working" : "Confirmed broken", detail: exists ? "Page anchor exists." : `No element with id="${raw.slice(1)}" exists on the source page.`, suggestion: exists ? "No action needed." : "Create the target section or correct the anchor." });
    }

    const checked = await requestStatus(resolved, ref.type === "image");
    return makeResult({ ...ref, url: resolved.href, ...checked, suggestion: checked.status === "broken" ? (ref.type === "image" ? "Replace or remove the missing image." : "Correct or remove the destination URL.") : checked.status === "unverified" ? "Open the URL manually to verify it." : "No action needed." });
  }

  async function scanPage(path, onProgress) {
    const pageUrl = new URL(path, window.location.href);
    let response;
    try {
      response = await withTimeout(fetch(pageUrl.href, { cache: "no-store", credentials: "same-origin" }));
    } catch (error) {
      return [makeResult({ type: "page", source: pageUrl.pathname, sourceUrl: pageUrl.href, url: pageUrl.href, status: "broken", code: "page-fetch", label: "Confirmed broken", detail: "The source page could not be loaded.", suggestion: "Confirm the page exists and is deployed." })];
    }
    if (!response.ok) {
      return [makeResult({ type: "page", source: pageUrl.pathname, sourceUrl: pageUrl.href, url: pageUrl.href, status: "broken", code: String(response.status), label: "Confirmed broken", detail: `Source page returned HTTP ${response.status}.`, suggestion: "Fix or remove the page from the public site." })];
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const source = pageUrl.pathname.split("/").pop() || "index.html";
    const refs = [];

    doc.querySelectorAll("a").forEach((el) => {
      refs.push({ type: "link", source, sourceUrl: pageUrl.href, baseUrl: pageUrl.href, document: doc, url: el.getAttribute("href"), context: clean(el.textContent).slice(0, 80) });
    });
    doc.querySelectorAll("img").forEach((el) => {
      refs.push({ type: "image", source, sourceUrl: pageUrl.href, baseUrl: pageUrl.href, document: doc, url: el.getAttribute("src"), context: clean(el.getAttribute("alt")).slice(0, 80) });
    });

    const results = [];
    for (const ref of refs) {
      results.push(await inspectReference(ref));
      if (onProgress) onProgress();
    }
    return results;
  }

  async function loadCmsReferences() {
    const definitions = [
      { table: "hero", fields: [{ key: "image_url", type: "image" }] },
      { table: "services", fields: [{ key: "icon_url", type: "image" }] },
      { table: "portfolio_projects", fields: [{ key: "image_url", type: "image" }, { key: "link", type: "link" }] },
      { table: "testimonials", fields: [{ key: "avatar_url", type: "image" }] },
      { table: "seo_meta", fields: [{ key: "og_image", type: "image" }, { key: "twitter_image", type: "image" }, { key: "canonical_url", type: "link" }] },
      { table: "site_settings", fields: [{ key: "logo_url", type: "image" }, { key: "favicon_url", type: "image" }] },
    ];
    const refs = [];
    for (const def of definitions) {
      const { data, error } = await AdminApi.list(def.table, "id", true);
      if (error) continue;
      (data || []).forEach((row) => {
        def.fields.forEach((field) => {
          if (clean(row[field.key])) refs.push({ type: field.type, source: `${def.table} #${row.id}`, sourceUrl: "", baseUrl: new URL("../", window.location.href).href, url: row[field.key], context: field.key });
        });
        if (def.table === "site_settings" && Array.isArray(row.social_links)) {
          row.social_links.forEach((item, index) => {
            if (item && clean(item.url)) refs.push({ type: "link", source: `site_settings social #${index + 1}`, sourceUrl: "", baseUrl: new URL("../", window.location.href).href, url: item.url, context: item.platform || "Social link" });
          });
        }
      });
    }
    return refs;
  }

  function collapseDuplicates(results) {
    const map = new Map();
    results.forEach((item) => {
      const key = [item.type, item.source, item.url, item.status, item.code].join("|");
      if (map.has(key)) map.get(key).duplicateCount += 1;
      else map.set(key, { ...item });
    });
    return Array.from(map.values());
  }

  async function scan({ onStatus, onProgress } = {}) {
    const results = [];
    let completed = 0;
    const tick = () => { completed += 1; if (onProgress) onProgress(completed); };

    for (const path of PAGE_PATHS) {
      if (onStatus) onStatus(`Scanning ${path.replace("../", "")}…`);
      results.push(...await scanPage(path, tick));
    }

    if (onStatus) onStatus("Scanning CMS-managed URLs…");
    const cmsRefs = await loadCmsReferences();
    for (const ref of cmsRefs) {
      results.push(await inspectReference(ref));
      tick();
    }

    return collapseDuplicates(results);
  }

  return { scan };
})();
