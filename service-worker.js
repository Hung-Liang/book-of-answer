const CACHE_NAME = "boa-cache-v4";
const NETWORK_TIMEOUT_MS = 3000;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./locales/zh-TW.json",
  "./locales/en.json",
  "./locales/ja.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Prefer fresh same-origin files so deployed changes reach returning users. Cached
// responses are used only when the network is unavailable, keeping the app usable offline.
// If the network has not answered within NETWORK_TIMEOUT_MS, a cached copy is served instead;
// without one we keep waiting for the network, so first visits are not cut off. A late network
// response still updates the cache via waitUntil below.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const networkResponse = fetch(event.request);
  event.waitUntil(
    networkResponse
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
      })
      .catch(() => {})
  );

  const fromCache = () => caches.match(event.request).then((cached) => {
    if (cached) return cached;
    if (event.request.mode === "navigate") return caches.match("./index.html");
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS))
    .then(() => fromCache().then((cached) => cached || networkResponse));

  event.respondWith(
    Promise.race([networkResponse, timeout])
      .catch(() => fromCache().then((cached) => cached || Response.error()))
  );
});
