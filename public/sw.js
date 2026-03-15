// Isang Kusina 2026 — Service Worker for offline caching
// v4 — WKWebView + App Store ready: enhanced offline, precache critical assets
const CACHE_NAME = "ik26-cache-v4";
const APP_VERSION = "2.0.0";

// Critical assets to precache on install for offline-first experience
const PRECACHE_URLS = [
  "/",
  "/privacy",
  "/terms",
  "/offline.html",
  "/og-image.svg",
  "/manifest.json",
];

// Listen for skip waiting message from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install — precache critical assets, then activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Don't block install if precache fails
  );
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static assets, stale-while-revalidate for fonts, network-first for navigation/API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase API calls and external URLs (always network)
  if (
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/functions/") ||
    (url.hostname !== self.location.hostname &&
     !url.hostname.includes("fonts.googleapis.com") &&
     !url.hostname.includes("fonts.gstatic.com") &&
     !url.hostname.includes("unsplash.com"))
  ) {
    return;
  }

  // Stale-while-revalidate for fonts (Google Fonts, etc.)
  const isFont =
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/);

  if (isFont) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    url.pathname.startsWith("/assets/");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Return cached version if available, else a basic offline response
            return caches.match(request);
          });
      })
    );
    return;
  }

  // Stale-while-revalidate for Unsplash images (below-fold, decorative)
  if (url.hostname.includes("unsplash.com")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for HTML / navigation requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, show branded offline page
          if (request.mode === "navigate") {
            return caches.match("/offline.html").then((offlinePage) => {
              if (offlinePage) return offlinePage;
              // Final fallback: try cached index
              return caches.match("/").then((indexPage) => {
                if (indexPage) return indexPage;
                return new Response(
                  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — IK26</title><style>body{background:#2B4440;color:#C9A96E;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}h1{font-size:1.5rem;font-weight:400}p{color:rgba(201,169,110,0.5);font-size:0.875rem;margin-top:0.5rem}</style></head><body><div><h1>IK 2026</h1><p>You\'re offline. Please reconnect.</p></div></body></html>',
                  { status: 503, headers: { "Content-Type": "text/html" } }
                );
              });
            });
          }
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
      )
  );
});