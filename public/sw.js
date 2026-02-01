const CACHE_NAME = 'vsu-smartmap-v9';
const TILE_CACHE_NAME = 'map-tiles-v1';
const API_CACHE_NAME = 'api-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/directory',
  '/chat',
  '/info',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const CACHEABLE_API_PATTERNS = [
  '/rest/v1/facilities',
  '/rest/v1/rooms',
  '/rest/v1/map_nodes',
  '/rest/v1/map_edges',
];

function isMapTileRequest(url) {
  return url.hostname === 'tile.openstreetmap.org' ||
    url.hostname.endsWith('.openstreetmap.org') ||
    url.hostname === 'basemaps.cartocdn.com' ||
    url.hostname.endsWith('.cartocdn.com');
}

function isCacheableApiRequest(url, request) {
  if (request.method !== 'GET') return false;
  if (!url.hostname.includes('supabase.co')) return false;
  if (request.headers.get('Authorization')) return false;
  return CACHEABLE_API_PATTERNS.some(pattern => url.pathname.includes(pattern));
}



self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keepCaches = [CACHE_NAME, TILE_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !keepCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for Next.js static assets (versioned/immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) =>
          cached || fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(async () => {
            // For JS chunks that fail offline, clients will need to reload
            // Return a proper error that won't crash the app silently
            return new Response('/* offline */', {
              status: 503,
              headers: { 'Content-Type': 'application/javascript' }
            });
          })
        )
      )
    );
    return;
  }

  // Cache-first for map tiles
  if (isMapTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 503 });
          });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for cacheable API endpoints
  if (isCacheableApiRequest(url, request)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Network failed, nothing to do. 
          // If we returned cachedResponse, user is fine.
          // If we didn't, the return networkFetch below will bubble the error (or we can handle it there).
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });

        if (cachedResponse) {
          // Return cached immediately, update in background
          event.waitUntil(networkFetch);
          return cachedResponse;
        }

        // No cache, wait for network
        return networkFetch;
      })
    );
    return;
  }

  // Network-first for navigation with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(request, { ignoreSearch: true }).then((cachedPage) => {
            if (cachedPage) return cachedPage;
            return caches.match('/offline').then((offlinePage) => {
              if (offlinePage) return offlinePage;
              return new Response('Offline', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // Cache-first with network fallback for other assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        return new Response('', { status: 503 });
      });
    })
  );
});
