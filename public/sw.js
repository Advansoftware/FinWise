// Gastometria PWA Service Worker
const CACHE_NAME = 'gastometria-cache-v4';
const RUNTIME_CACHE = 'gastometria-runtime-v4';
const DATA_CACHE = 'gastometria-data-v4';

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

// Fetch event - interceptar requisições de rede
self.addEventListener('fetch', event => {
  // Só lidar com requests GET para navegação
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar requests para outros domínios
  if (url.origin !== location.origin) return;

  // Para navegação de páginas (documentos HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se conseguir buscar da rede, armazenar no cache e retornar
          return caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Se falhar (offline), tentar buscar no cache
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              // Se não estiver no cache, retornar a página principal (SPA)
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Para recursos Next.js (_next/) - Network First para evitar 404s após deploy
  if (event.request.url.includes('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para outros recursos estáticos (CSS, JS, imagens não-Next)
  if (event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then(cache => cache.put(event.request, responseClone));
              return response;
            });
        })
    );
    return;
  }

  // Para APIs (cache com network first para dados dinâmicos)
  if (url.pathname.startsWith('/api/')) {
    // Strategy: Network First (sempre tentar rede primeiro, cache como fallback)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Só cachear respostas bem-sucedidas para dados
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar buscar no cache
          return caches.match(event.request);
        })
    );
  }
});

// Background Sync para quando voltar online
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Push notifications para pagamentos e outras atualizações
self.addEventListener('push', event => {
  console.log('[SW] Push Received.');

  let data = {
    title: 'Gastometria',
    body: 'Nova atualização disponível!',
    type: 'general',
    url: '/dashboard'
  };

  // Tentar parsear os dados da notificação
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Configurar opções com base no tipo de notificação
  let options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.type === 'payment_request' ? `payment-${data.paymentRequestId}` : 'general',
    renotify: true,
    requireInteraction: data.type === 'payment_request',
    data: {
      ...data,
      dateOfArrival: Date.now(),
    },
    actions: []
  };

  // Ações específicas para solicitação de pagamento
  if (data.type === 'payment_request') {
    options.actions = [
      {
        action: 'pay',
        title: '💳 Pagar Agora',
      },
      {
        action: 'later',
        title: '⏰ Depois',
      }
    ];
    options.body = data.body || `Pagamento de R$ ${data.amount?.toFixed(2)} para ${data.receiverName}`;
  } else {
    options.actions = [
      {
        action: 'explore',
        title: 'Ver detalhes',
      },
      {
        action: 'close',
        title: 'Fechar',
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gastometria', options)
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click Received:', event.action);

  event.notification.close();

  const data = event.notification.data || {};

  // Se for uma notificação de pagamento
  if (data.type === 'payment_request') {
    if (event.action === 'pay') {
      // Abrir página de confirmação de pagamento
      const url = `/confirmar?id=${data.paymentRequestId}`;
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then(clientList => {
            // Verificar se já existe uma janela aberta
            for (const client of clientList) {
              if (client.url.includes('/confirmar') && 'focus' in client) {
                return client.focus().then(c => c.navigate(url));
              }
              if ('focus' in client) {
                return client.focus().then(c => c.navigate(url));
              }
            }
            // Abrir nova janela
            return clients.openWindow(url);
          })
      );
    } else if (event.action === 'later') {
      // Apenas fechar, o usuário pode ver depois no app
      console.log('[SW] Payment deferred');
    } else {
      // Clique no corpo da notificação - abrir página de confirmação
      const url = `/confirmar?id=${data.paymentRequestId}`;
      event.waitUntil(clients.openWindow(url));
    }
    return;
  }

  // Notificações gerais
  if (event.action === 'explore' || !event.action) {
    const url = data.url || '/dashboard';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          for (const client of clientList) {
            if ('focus' in client) {
              return client.focus().then(c => c.navigate(url));
            }
          }
          return clients.openWindow(url);
        })
    );
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
