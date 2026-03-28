// Orange AI OS³ — Service Worker for true offline capability
// Strategy: Cache-first for static assets, network-first for API calls

const CACHE_VERSION = 'orangeai-os-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const MEDIA_CACHE = `${CACHE_VERSION}-media`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Core app shell — precache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/placeholder.svg',
  '/favicon.ico',
  '/folder-icon.png',
];

// Local video assets to precache
const VIDEO_ASSETS = [
  '/videos/background.mp4',
  '/videos/sunset.mp4',
  '/videos/sunny.mp4',
  '/videos/rainy.mp4',
  '/videos/snowy.mp4',
  '/videos/foggy.mp4',
  '/videos/autumn.mp4',
  '/videos/spring.mp4',
  '/videos/thunderstorm.mp4',
  '/videos/typhoon.mp4',
  '/videos/fullmoon.mp4',
  '/videos/orange-ai-bg.mp4',
  '/videos/orange-ai-intro.mp4',
  '/videos/ads/ad1.mp4',
  '/videos/ads/ad2.mp4',
  '/videos/ads/ad3.mp4',
  '/videos/ads/ad4.mp4',
  '/videos/ads/ad5.mp4',
  '/videos/ads/ad6.mp4',
  '/videos/ads/ad7.mp4',
  '/videos/ads/ad8.mp4',
  '/videos/ads/ad9.mp4',
  '/videos/ads/ad10.mp4',
  '/videos/ads/sponsored-grok.mp4',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      // Precache videos progressively (don't block install)
      return caches.open(MEDIA_CACHE).then((cache) => {
        // Add videos one by one to avoid timeout
        return VIDEO_ASSETS.reduce((chain, url) => {
          return chain.then(() =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to precache ${url}:`, err);
            })
          );
        }, Promise.resolve());
      });
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase / API calls — network only
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  // Skip edge functions
  if (url.pathname.startsWith('/functions/')) return;

  // Video/audio files — cache-first with background update
  if (isMediaRequest(url, event.request)) {
    event.respondWith(cacheFirstWithUpdate(event.request, MEDIA_CACHE));
    return;
  }

  // Images (including external like Unsplash) — cache-first
  if (isImageRequest(url, event.request)) {
    event.respondWith(cacheFirstWithUpdate(event.request, MEDIA_CACHE));
    return;
  }

  // JS/CSS bundles — cache-first (hashed filenames handle versioning)
  if (url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // HTML navigation — network-first with cache fallback
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithCache(event.request, STATIC_CACHE));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMediaRequest(url, request) {
  const ext = url.pathname.toLowerCase();
  return ext.match(/\.(mp4|webm|mov|mp3|wav|ogg|m4a)$/) !== null;
}

function isImageRequest(url, request) {
  const ext = url.pathname.toLowerCase();
  if (ext.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) return true;
  if (url.hostname.includes('unsplash.com')) return true;
  if (url.hostname.includes('images.unsplash.com')) return true;
  return false;
}

// Cache-first: return cache hit, fallback to network
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Cache-first with background update for freshness
async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Background refresh (don't await)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  if (cached) return cached;

  // No cache — wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  return new Response('Offline', { status: 503 });
}

// Network-first with cache fallback (for HTML)
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback to index.html for SPA routing
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}
