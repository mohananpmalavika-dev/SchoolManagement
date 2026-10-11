// Service Worker for Krypton School ERP Parent Portal
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `krypton-parent-portal-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// API routes that should be cached with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/v1\/students\/my-children/,
  /\/api\/v1\/attendance/,
  /\/api\/v1\/fees/,
  /\/api\/v1\/examinations/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
        console.error('[ServiceWorker] Cache addAll error:', err);
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/').then((response) => {
          return response || new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
    );
    return;
  }

  // Handle all other requests with cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy: Try cache first, fallback to network
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version and update cache in background
    updateCache(request, cache);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch error:', error);
    return new Response('Network error', {
      status: 408,
      statusText: 'Request Timeout',
    });
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses for offline use
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No internet connection. Please try again when online.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Update cache in background
async function updateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Background sync for offline payment submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

async function syncPayments() {
  // This would sync any pending payments when connection is restored
  console.log('[ServiceWorker] Syncing pending payments');
  
  // Get pending payments from IndexedDB and retry submission
  // Implementation depends on your offline storage strategy
}

// Push notification support
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Krypton School';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
