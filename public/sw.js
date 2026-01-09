// Gastometria PWA Service Worker - Minimal Version
// Este service worker é apenas para funcionalidade PWA básica (instalação)
// Não faz cache agressivo de dados para manter o app leve

const CACHE_NAME = 'gastometria-v5';

// Apenas recursos estáticos essenciais para instalação PWA
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install - cache mínimo apenas para PWA
self.addEventListener('install', event => {
  console.log('[SW] Installing minimal service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - limpar caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Activating and cleaning old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remover todos os caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - apenas network, sem interceptação de cache
// Deixa o navegador fazer o cache padrão HTTP
self.addEventListener('fetch', event => {
  // Não interceptar requisições - deixar passar direto para a rede
  // Isso mantém o comportamento padrão de um site web normal
  return;
});

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
