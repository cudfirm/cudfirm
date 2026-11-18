/* CUDFIRM service worker.
 *
 * Goals: make the site installable and usable when the connection drops, WITHOUT ever
 * serving stale code to someone who is online.
 *   - Pages, CSS, JS, JSON  -> network first (always fresh when online), cached copy when offline/slow.
 *   - Images, fonts         -> stale-while-revalidate (instant, refreshed in the background).
 *   - CDN libraries/fonts   -> stale-while-revalidate.
 *   - NEVER touched: the dashboard, the client portal (/account/), Supabase / Edge Functions,
 *     anything that is not a GET request, and range requests.
 * To ship a new version of the site you do not need to change anything here: network-first means
 * visitors get new files on their next load. Bump VERSION only to force-clear old caches.
 */
const VERSION = "v1";
const SHELL = "cudfirm-shell-" + VERSION;
const RUNTIME = "cudfirm-runtime-" + VERSION;
const RUNTIME_MAX = 150;
const NAV_TIMEOUT_MS = 4500;

const SCOPE_PATH = new URL(self.registration.scope).pathname;
const CDN_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];
const BYPASS_PREFIXES = ["dashboard/", "account/", "supabase/", "netlify/", ".netlify/", "api/"];

/* Small, tolerant precache: the shell needed to open the app with no connection. A missing file never blocks install. */
const PRECACHE = [
  "offline.html", "manifest.webmanifest",
  "css/app-shell.css", "js/pwa.js", "js/app-shell.js",
  "img/icon-192.png", "img/icon-512.png", "img/cudfirm.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf("cudfirm-") === 0 && k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function relPath(url) { return url.pathname.indexOf(SCOPE_PATH) === 0 ? url.pathname.slice(SCOPE_PATH.length) : url.pathname.replace(/^\//, ""); }
function cacheable(res) { return res && (res.status === 200 || res.type === "opaque"); }

function put(cacheName, request, response) {
  return caches.open(cacheName).then((cache) =>
    cache.put(request, response).then(() => trim(cache, cacheName === RUNTIME ? RUNTIME_MAX : 60))
  ).catch(() => null);
}
function trim(cache, max) {
  return cache.keys().then((keys) => { if (keys.length > max) return cache.delete(keys[0]).then(() => trim(cache, max)); });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/* Network first; cached copy if the network fails (or, for pages, is very slow). */
function networkFirst(event, request, opts) {
  opts = opts || {};
  const attempt = fetch(request);
  const network = attempt.then((res) => {
    if (cacheable(res)) event.waitUntil(put(RUNTIME, request, res.clone()));
    return res;
  });
  const guarded = opts.timeout ? withTimeout(network, opts.timeout) : network;
  return guarded.catch(() =>
    caches.match(request, { ignoreSearch: !!opts.ignoreSearch }).then((hit) => {
      if (hit) return hit;
      if (opts.fallback) return opts.fallback();
      return network;                       // slow but nothing cached: keep waiting for the real response
    })
  );
}

function staleWhileRevalidate(event, request) {
  return caches.match(request).then((hit) => {
    const refresh = fetch(request).then((res) => { if (cacheable(res)) event.waitUntil(put(RUNTIME, request, res.clone())); return res; }).catch(() => null);
    if (hit) { event.waitUntil(refresh); return hit; }
    return refresh.then((res) => res || Response.error());
  });
}

function offlinePage() {
  return caches.match("offline.html").then((r) => r || new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } }));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (CDN_HOSTS.indexOf(url.hostname) !== -1) event.respondWith(staleWhileRevalidate(event, request));
    return;                                  // Supabase, analytics, etc.: straight to the network
  }

  const path = relPath(url);
  if (BYPASS_PREFIXES.some((p) => path.indexOf(p) === 0)) return;   // dashboard, client portal, backend files
  if (path === "sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, request, { timeout: NAV_TIMEOUT_MS, ignoreSearch: true, fallback: offlinePage }));
    return;
  }
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf)$/i.test(path)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }
  if (/\.(?:css|js|json|webmanifest|html)$/i.test(path)) {
    event.respondWith(networkFirst(event, request, { timeout: NAV_TIMEOUT_MS }));
  }
});
