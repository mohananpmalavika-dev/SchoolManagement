const CACHE = 'krypton-static-v7';
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
  if (event.data?.type === 'PUSH_LOGOUT') {
    event.waitUntil(Promise.all([
      self.registration.getNotifications().then(notifications => notifications.forEach(notification => notification.close())),
      self.registration.pushManager.getSubscription().then(subscription => subscription?.unsubscribe()),
    ]));
  }
});

function notificationDestination(value) {
  const fallback = new URL('/notifications', self.location.origin);
  try {
    const url = new URL(value || '/notifications', self.location.origin);
    return url.origin === fallback.origin && url.pathname === '/notifications' ? url.href : fallback.href;
  } catch { return fallback.href; }
}

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { /* Show a safe fallback for malformed payloads. */ }
  event.waitUntil(self.registration.showNotification('Krypton School ERP', {
    body: typeof data.body === 'string' ? data.body.slice(0, 200) : 'You have a new school update. Open the app to view it.',
    icon: '/icon-192.png', badge: '/icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 100) : 'school-update',
    data: { url: notificationDestination(data.url) },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = notificationDestination(event.notification.data?.url);
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const client = clients.find(item => item.url === url) || clients.find(item => new URL(item.url).origin === self.location.origin);
    if (client) {
      const navigated = await client.navigate(url);
      return (navigated || client).focus();
    }
    return self.clients.openWindow(url);
  }));
});

self.addEventListener('pushsubscriptionchange', event => {
  // Refresh account binding from an authenticated window. Never retain bearer tokens in the worker.
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients =>
    clients.forEach(client => client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }))));
});
