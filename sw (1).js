const CACHE_NAME = 'masari-v1.0.0';
const RUNTIME_CACHE = 'masari-runtime-v1.0.0';

// Assets essentiels
const ESSENTIAL_ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@300;400;500;700;800&family=DM+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.js',
  'https://nominatim.openstreetmap.org/search',
  'https://overpass-api.de/api/interpreter'
];

// Installation du SW
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Masari PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential assets');
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache (may be offline):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation du SW
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Masari PWA');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network First pour les API, Cache First pour assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls: Network First
  if (
    url.hostname.includes('nominatim') ||
    url.hostname.includes('overpass') ||
    url.pathname.includes('/api/') ||
    request.url.includes('osrm.org')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets (fonts, CSS, JS): Cache First
  if (
    url.pathname.match(/\.(js|css|woff2|ttf|svg|png|jpg|jpeg|gif|webp)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('cdn.jsdelivr.net')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documents & HTML: Network First with Cache Fallback
  event.respondWith(networkFirst(request));
});

// Network First Strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Offline fallback page
    return new Response(getOfflineFallback(), {
      headers: { 'Content-Type': 'text/html' },
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache and network failed:', request.url);
    return new Response(getOfflineFallback(), {
      headers: { 'Content-Type': 'text/html' },
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Offline Fallback Page
function getOfflineFallback() {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>مَسَاري — وضع بدون اتصال</title>
      <style>
        body {
          font-family: 'Tajawal', sans-serif;
          background: linear-gradient(135deg, #020b2e 0%, #0d1a6e 100%);
          color: #ffd700;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          margin: 0;
        }
        .container {
          text-align: center;
          max-width: 400px;
          background: rgba(2,11,46,0.88);
          padding: 40px 30px;
          border-radius: 20px;
          border: 2px solid rgba(255,215,0,0.3);
          box-shadow: 0 0 40px rgba(255,215,0,0.2);
          backdrop-filter: blur(16px);
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        h1 {
          font-size: 32px;
          margin: 0 0 15px;
          background: linear-gradient(160deg, #7a4e08, #ffd700, #ffe566, #ffd700, #7a4e08);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        p {
          color: #d4b86a;
          font-size: 16px;
          line-height: 1.6;
          margin: 15px 0;
        }
        .status {
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.3);
          padding: 15px;
          border-radius: 12px;
          margin: 20px 0;
          font-size: 14px;
          color: #ffe566;
        }
        .cache-info {
          font-size: 12px;
          color: rgba(255,215,0,0.5);
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>مَسَاري بدون اتصال</h1>
        <p>لا يتوفر اتصال بالإنترنت في الوقت الحالي</p>
        <div class="status">
          ⏳ جارٍ المحاولة... أعد تحديث الصفحة عندما يعود الاتصال
        </div>
        <div class="cache-info">
          ✓ تم حفظ بيانات التطبيق محليًا
        </div>
      </div>
      <script>
        // Listen for online event
        window.addEventListener('online', function() {
          location.reload();
        });
        // Auto-retry every 5 seconds
        setInterval(function() {
          fetch('./', {method: 'HEAD'}).then(function() {
            location.reload();
          }).catch(function() {});
        }, 5000);
      </script>
    </body>
    </html>
  `;
}

// Background Sync (optional — pour future functionality)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-masari-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncMasariData());
  }
});

async function syncMasariData() {
  // Placeholder pour sync future
  return Promise.resolve();
}

// Push Notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'إشعار جديد من مَسَاري',
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22%3E%3Crect fill=%22%230d1a6e%22 width=%22192%22 height=%22192%22 rx=%2245%22/%3E%3Ccircle cx=%2296%22 cy=%2296%22 r=%2260%22 fill=%22%23ffd700%22 opacity=%220.9%22/%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22%3E%3Crect fill=%22%23ffd700%22 width=%2296%22 height=%2296%22/%3E%3Ctext x=%2248%22 y=%2260%22 font-size=%2260%22 text-anchor=%22middle%22%3E👑%3C/text%3E%3C/svg%3E',
    tag: data.tag || 'masari-notification',
    requireInteraction: false
  };
  event.waitUntil(self.registration.showNotification('مَسَاري', options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === './' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
