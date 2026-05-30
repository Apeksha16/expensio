/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'expensio-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally left empty for now.
});
