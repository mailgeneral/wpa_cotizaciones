const CACHE_NAME = 'imperdellanta-v1';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './precios.json',
  './qr-code.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});