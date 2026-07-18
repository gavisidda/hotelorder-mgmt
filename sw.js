const CACHE_NAME = 'restaurant-order-v2';
const CORE_ASSETS = ['index.html', 'styles.css', 'firebase-config.js', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for Firestore/Firebase calls (never cache live data),
// cache-first for the app shell so the menu page still opens offline.
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('googleapis.com')) {
    return; // let these go straight to the network
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
