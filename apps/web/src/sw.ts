import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'serwist';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: [
    {
      matcher: ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.url.endsWith('.svg') ||
        request.url.endsWith('.png') ||
        request.url.endsWith('.ico'),
      handler: new StaleWhileRevalidate({
        cacheName: 'static-assets',
      }),
    },
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'images',
      }),
    },
    {
      matcher: ({ request, url }) => url.pathname.startsWith('/api/') && request.method === 'GET',
      handler: new NetworkFirst({
        cacheName: 'api-get-cache',
      }),
    },
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.mode === 'navigate',
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (err) {
    console.error('Failed to parse push event data as JSON:', err);
    // Provide a safe fallback if payload is malformed
    data = {
      title: 'New Notification',
      body: 'You have a new update in Expensio.',
      url: '/',
    };
  }

  const options = {
    body: data.body || 'You have a new update.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: {
      url: data.url || '/',
    },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Expensio', options));
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients: any[]) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
