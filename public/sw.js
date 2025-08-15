// Service Worker para Split Go PWA
const CACHE_NAME = 'split-go-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación - cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cachear recursos uno por uno para manejar errores
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - estrategia Network First para datos, Cache First para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests a Firebase Storage para evitar problemas de CORS
  if (url.hostname.includes('firebasestorage.googleapis.com')) {
    return; // No interceptar estas requests
  }

  // Ignorar requests de extensiones del navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Estrategia Cache First para assets estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      url.pathname.includes('.')) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).catch(() => {
          console.warn('Failed to fetch resource:', request.url);
          return new Response('Resource not available', { status: 404 });
        });
      })
    );
  } 
  // Estrategia Network First para datos de Firebase (excepto Storage)
  else if (url.hostname.includes('firestore.googleapis.com') || 
           url.hostname.includes('identitytoolkit.googleapis.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
  }
});
