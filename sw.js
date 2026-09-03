const CACHE_NAME = 'visita-cache-v1';
const ASSETS = [
  './', './index.html', './app.js', './config.js', './db.js', './lab.js', './evolucao.js', './sync.js', './manifest.json',
  './favicon.ico', './icons/icon-32.png', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=> cache.addAll(ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=> self.clients.claim())
  );
});

// Só cacheia arquivos do próprio app (mesma origem). Chamadas ao Supabase passam direto.
self.addEventListener('fetch', (event)=>{
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(res=>{
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache=> cache.put(event.request, copy));
        return res;
      })
      .catch(()=> caches.match(event.request).then(cached=> cached || caches.match('./index.html')))
  );
});
