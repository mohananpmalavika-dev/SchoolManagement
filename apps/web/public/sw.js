const CACHE = 'krypton-static-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/krypton-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/krypton-logo.png',
  '/offline.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS_TO_CACHE)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => (key.startsWith('krypton-') || key.startsWith('hustlertech-')) && key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never retain authenticated pages, API responses, or user records in shared browser caches.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.has('Authorization')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  const isStaticAsset =
    url.pathname === '/krypton-icon.png' ||
    url.pathname === '/icon-192.png' ||
    url.pathname === '/icon-512.png' ||
    url.pathname === '/krypton-logo.png' ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/_next/static/');

  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
