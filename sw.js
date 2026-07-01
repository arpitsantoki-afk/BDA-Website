const CACHE = 'bda-inq-v1';
const STATIC = ['/', '/login.html', '/users.html', '/manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(STATIC); }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Never cache API calls
  if (url.includes('inquiries.bluedoorarchitects.com') || url.includes('workers.dev')) return;
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});
