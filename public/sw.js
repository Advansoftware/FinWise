// Gastometria PWA Service Worker
const CACHE_NAME = 'gastometria-cache-v2';
const RUNTIME_CACHE = 'gastometria-runtime-v2';
const DATA_CACHE = 'gastometria-data-v2';

// Recursos essenciais para cache
const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/categories',
  '/budgets',
  '/goals',
  '/wallets',
  '/import',
  '/settings',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo.svg'
];

// APIs que devem ser cached para funcionalidade offline
const API_CACHE_PATTERNS = [
  /^\/api\/data\//,
  /^\/api\/auth\//,
];

// Install event - cache recursos essenciais
self.addEventListener('install', event => {
  console.log('[SW] Install Event');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching offline page');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Activate Event');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== DATA_CACHE) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - estratégia de cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégias diferentes para diferentes tipos de requisições
  if (request.method === 'GET') {
    // Para páginas HTML - Network First com fallback para cache
    if (request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(request)
          .then(response => {
            // Clonar a resposta porque é um stream
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            return caches.match(request).then(response => {
              return response || caches.match('/');
            });
          })
      );
      return;
    }

    // Para APIs de dados - Cache First com atualização em background
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(
        caches.open(DATA_CACHE).then(cache => {
          return cache.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
              // Atualizar cache em background
              cache.put(request, networkResponse.clone());
              return networkResponse;
            }).catch(() => {
              // Se não há internet, retornar dados em cache
              return cachedResponse;
            });

            // Retornar cache imediatamente se disponível, senão esperar network
            return cachedResponse || fetchPromise;
          });
        })
      );
      return;
    }

    // Para recursos estáticos - Cache First
    if (request.url.includes('/icons/') ||
      request.url.includes('/logo.svg') ||
      request.url.includes('/_next/static/')) {
      event.respondWith(
        caches.match(request).then(response => {
          return response || fetch(request).then(response => {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          });
        })
      );
      return;
    }
  }

  // Para todas as outras requisições - Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background Sync para quando voltar online
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Push notifications (para futuras implementações)
self.addEventListener('push', event => {
  console.log('[SW] Push Received.');

  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gastometria', options)
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click Received.');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/dashboard'));
  }
});

// Mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Função auxiliar para sincronizar transações pendentes
async function syncPendingTransactions() {
  try {
    // Recuperar transações pendentes do IndexedDB
    const pendingTransactions = await getPendingTransactions();

    for (const transaction of pendingTransactions) {
      try {
        await fetch('/api/data/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction)
        });

        // Remover da lista de pendentes após sucesso
        await removePendingTransaction(transaction.id);
      } catch (error) {
        console.log('[SW] Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync failed:', error);
  }
}

// Placeholder para funções do IndexedDB (serão implementadas no cliente)
async function getPendingTransactions() {
  // Esta função será implementada no lado do cliente
  return [];
}

async function removePendingTransaction(id) {
  // Esta função será implementada no lado do cliente
  return Promise.resolve();
}
