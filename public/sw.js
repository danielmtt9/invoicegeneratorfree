const CACHE_VERSION = "ig-cache-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/invoice/",
  "/invoice/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/robots.txt",
  "/sitemap.xml"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) return caches.delete(key);
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        const path = url.pathname;
        if (path.startsWith("/invoice")) {
          return caches.match("/invoice/index.html").then((m) => m || caches.match("/index.html"));
        }
        return caches.match("/index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") return response;
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
