const CACHE_NAME = "boa-cache-v4";

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

  event.respondWith(
    networkResponse
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      }))
  );
});
