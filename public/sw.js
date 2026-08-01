// Service Worker for FinançasPro background push notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkExpiringBillsAndNotify() // Check immediately when service worker wakes up / activates
    ])
  );
});

// Scheduler Background Checker Routine
async function checkExpiringBillsAndNotify() {
  try {
    const cache = await caches.open('financaspro-alarms');
    const response = await cache.match('/scheduled-bills.json');
    if (!response) return;
    
    const bills = await response.json();
    const now = new Date();
    const currentDay = now.getDate();
    
    for (const bill of bills) {
      const dueDay = parseInt(bill.due, 10);
      if (isNaN(dueDay)) continue;
      
      const diffDays = dueDay - currentDay;
      // If due in the next 3 days (urgency window)
      if (diffDays >= 0 && diffDays <= 3) {
        const cacheKey = `/notified-${bill.id}-${currentDay}.json`;
        const alreadyNotified = await cache.match(cacheKey);
        
        if (!alreadyNotified) {
          await self.registration.showNotification('FinançasPro', {
            body: `Atenção: A despesa "${bill.name}" vence no dia ${bill.due}.`,
            icon: '/app_icon.png',
            badge: '/app_icon.png',
            vibrate: [200, 100, 200],
            tag: `financaspro-bill-${bill.id}`,
            renotify: true,
            data: { url: '/' }
          });
          
          // Mark as notified today to prevent double alerts
          await cache.put(cacheKey, new Response('true'));
        }
      }
    }
  } catch (e) {
    console.warn('[SW] Falha ao escanear vencimentos em segundo plano:', e);
  }
}

// Background sync to trigger check when browser restores connection
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-vencimentos' || event.tag === 'sync' || !event.tag) {
    event.waitUntil(checkExpiringBillsAndNotify());
  }
});

// Periodic Sync helper if supported by PWA platform
self.addEventListener('periodicsync', (event) => {
  event.waitUntil(checkExpiringBillsAndNotify());
});

// Message communications from the main browser window
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_REMINDERS') {
    event.waitUntil(
      caches.open('financaspro-alarms').then(async (cache) => {
        await cache.put('/scheduled-bills.json', new Response(JSON.stringify(event.data.bills || [])));
        // Run check once to ensure latest synchronization registers alerts immediately
        await checkExpiringBillsAndNotify();
      })
    );
  }
});

// Listener for background Web Push API events
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Alerta FinançasPro',
    body: 'Há atualizações importantes na sua gestão de caixa.',
    icon: '/app_icon.png',
    badge: '/app_icon.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        icon: data.icon || payload.icon,
        badge: data.badge || payload.badge,
        data: data.data || payload.data
      };
    } catch (e) {
      // Fallback if data is raw text
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationPromise = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ]
  });

  event.waitUntil(notificationPromise);
});

// Listener for notification click events (leads user directly to client)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  const clickPromise = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there is already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }
    // If not, open a new window
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(clickPromise);
});

// Standard Fetch proxy event interceptor to satisfy PWA installation audits
self.addEventListener('fetch', (event) => {
  // Let the browser fetch standard assets naturally; fallback if completely offline
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
