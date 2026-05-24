import { Serwist, NetworkFirst, StaleWhileRevalidate, CacheFirst } from "serwist";

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
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        request.url.endsWith(".svg") ||
        request.url.endsWith(".png") ||
        request.url.endsWith(".ico"),
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
      }),
    },
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "images",
      }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
});

serwist.addEventListeners();
