// This is a basic service worker. It's recommended to use a library like Workbox for more complex scenarios.

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Add a call to skipWaiting here if you want the new service worker to activate immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
});

self.addEventListener('fetch', (event) => {
  // We are letting the browser handle all fetch requests.
  // The offline persistence is handled by Firebase Firestore SDK.
  // For full offline capability of the app shell (HTML, CSS, JS), you would need a caching strategy here.
});

// Listen for messages from the client to trigger the update
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
