// Service Worker for FinançasPro background push notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkAllScheduledNotifications() // Check immediately when service worker wakes up / activates
    ])
  );
});

// Scheduler Background Checker Routine for Bills
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
      // If due in the next 3 days or overdue
      if ((diffDays >= 0 && diffDays <= 3) || diffDays < 0) {
        const cacheKey = `/notified-${bill.id}-${currentDay}.json`;
        const alreadyNotified = await cache.match(cacheKey);
        
        if (!alreadyNotified) {
          const isOverdue = diffDays < 0;
          const notificationTitle = isOverdue ? '🚨 Conta Atrasada! - FinançasPro' : '⚠️ Conta Próxima do Vencimento';
          const notificationBody = isOverdue
            ? `A despesa "${bill.name}" está em atraso desde o dia ${bill.due}. Regularize para evitar juros.`
            : `A despesa "${bill.name}" vence no dia ${bill.due}. Mantenha suas contas em dia!`;

          await self.registration.showNotification(notificationTitle, {
            body: notificationBody,
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

// Scheduler Background Checker Routine for Smart Insights (Category alerts, monthly balance congrats, financial tips)
async function checkSmartInsightsAndNotify() {
  try {
    const cache = await caches.open('financaspro-alarms');
    
    // Smart throttle: Maximum 1 smart insight notification every 3 days (72 hours) so it's not annoying
    const lastNotifiedRes = await cache.match('/last-smart-notification.json');
    const nowMs = Date.now();
    if (lastNotifiedRes) {
      const lastData = await lastNotifiedRes.json();
      const lastTime = lastData.timestamp || 0;
      if (nowMs - lastTime < 259200000) { // 3 days (72h)
        return;
      }
    }

    const response = await cache.match('/scheduled-insights.json');
    if (!response) return;

    const insights = await response.json();
    if (!Array.isArray(insights) || insights.length === 0) return;

    // Pick an active unsent insight
    const insight = insights[0];
    if (insight && insight.body) {
      await self.registration.showNotification(insight.title || 'FinançasPro', {
        body: insight.body,
        icon: '/app_icon.png',
        badge: '/app_icon.png',
        vibrate: [200, 100, 200],
        tag: `financaspro-insight-${insight.id || 'tip'}`,
        renotify: true,
        data: { url: '/' }
      });

      // Update throttle timestamp
      await cache.put('/last-smart-notification.json', new Response(JSON.stringify({
        timestamp: nowMs,
        insightId: insight.id
      })));
    }
  } catch (e) {
    console.warn('[SW] Falha ao escanear insights inteligentes em segundo plano:', e);
  }
}

async function checkAllScheduledNotifications() {
  await checkExpiringBillsAndNotify();
  await checkSmartInsightsAndNotify();
}

// Background sync to trigger check when browser restores connection
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-vencimentos' || event.tag === 'check-insights' || event.tag === 'sync' || !event.tag) {
    event.waitUntil(checkAllScheduledNotifications());
  }
});

// Periodic Sync helper if supported by PWA platform
self.addEventListener('periodicsync', (event) => {
  event.waitUntil(checkAllScheduledNotifications());
});

// Message communications from the main browser window
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_REMINDERS') {
    event.waitUntil(
      caches.open('financaspro-alarms').then(async (cache) => {
        if (event.data.bills) {
          await cache.put('/scheduled-bills.json', new Response(JSON.stringify(event.data.bills || [])));
        }
        if (event.data.insights) {
          await cache.put('/scheduled-insights.json', new Response(JSON.stringify(event.data.insights || [])));
        }
        await checkAllScheduledNotifications();
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
