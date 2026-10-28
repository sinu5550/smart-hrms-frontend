const CACHE_NAME = 'hrms-core-pwa-v3';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Do not interfere with API, HMR, or non-GET requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('/_next/')) {
    return;
  }

  // Network-first strategy for navigation / pages so updates reflect instantly
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match('/portal/attendance').then((fallback) => fallback || caches.match('/'));
        })
    );
    return;
  }

  // Cache-first only for static static images/icons
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'HRMS Notification', {
      body: data.body || 'You have a new update.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.url || '/portal/attendance',
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data || '/portal/attendance');
    })
  );
});
