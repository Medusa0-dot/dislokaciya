const CACHE_NAME = 'dislokaciya-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './logo_200.jpg'
];

// Установка Service Worker — кэшируем только статику
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.log('Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов — умная стратегия
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // НЕ перехватываем запросы к Google Apps Script
  if (url.includes('script.google.com') || 
      url.includes('googleapis.com')) {
    return; // Пусть идёт напрямую в сеть
  }
  
  // Для остальных запросов: сначала кэш, потом сеть
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          // Если сети нет и в кэше нет — для HTML возвращаем главную страницу
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});