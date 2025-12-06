const CACHE_NAME = 'vsu-smartmap-v4';
const TILE_CACHE_NAME = 'map-tiles-v1';
const API_CACHE_NAME = 'api-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/directory',
  '/chat',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

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

  // Cache-first for Next.js static assets (versioned and immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) =>
          cached || fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => new Response('', { status: 503 }))
        )
      )
    );
    return;
  }

  // Cache-first for map tiles
  if (url.href.includes('tile.openstreetmap.org') ||
    url.href.includes('basemaps.cartocdn.com')) {
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

  if (url.href.includes('supabase.co') && request.method === 'GET') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return new Response(JSON.stringify({ error: 'Offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match('/offline').then((cachedPage) => {
            if (cachedPage) {
              return cachedPage;
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

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
