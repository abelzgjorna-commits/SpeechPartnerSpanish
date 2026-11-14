// Service worker: maakt de app offline bruikbaar.
// BELANGRIJK: verhoog CACHE_VERSION bij elke nieuwe versie, anders blijft de oude versie op het toestel.
const CACHE_VERSION = "gespreksgids-v41";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./css/speels.css",
  "./js/speels.js",
  "./js/i18n.js",
  "./js/content.js",
  "./js/dict-wiki.js",
  "./js/dict-extra.js",
  "./js/basis.js",
  "./js/grammatica.js",
  "./js/dict.js",
  "./js/uitspraak.js",
  "./js/app.js",
  "./js/whisper-worker.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Verzoeken naar andere sites (zoals het spraakmodel) gaan rechtstreeks, buiten deze cache om.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
