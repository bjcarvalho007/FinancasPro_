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
    if (!bills || !Array.isArray(bills) || bills.length === 0) return;

    const now = new Date();
    const currentDay = now.getDate();
    
    // Filter pending/expiring/overdue bills
    const pendingBills = bills.filter(bill => {
      if (bill.isOverdue) return true;
      const dueDay = parseInt(bill.due, 10);
      if (isNaN(dueDay)) return false;
      const diffDays = dueDay - currentDay;
      return diffDays >= 0 && diffDays <= 3;
    });

    if (pendingBills.length === 0) return;

    // Signature based on current bills list to re-notify if list updates
    const signature = pendingBills.map(b => `${b.id}-${b.amount || 0}-${b.due}-${b.isOverdue ? 'overdue' : 'due'}`).sort().join('|');
    const cacheKey = `/notified-all-${currentDay}-${signature}.json`;
    const alreadyNotified = await cache.match(cacheKey);

    if (!alreadyNotified) {
      let title = '';
      let body = '';

      const count = pendingBills.length;
      if (count === 1) {
        const bill = pendingBills[0];
        const valStr = bill.amount ? ` (R$ ${Number(bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : '';
        title = bill.isOverdue ? '🚨 CONTA EM ATRASO' : '⚠️ ATENÇÃO - VENCIMENTO';
        body = `A despesa "${bill.name}"${valStr} vence no dia ${bill.due}. Toque para abrir o FinançasPro.`;
      } else {
        const overdueCount = pendingBills.filter(b => b.isOverdue).length;
        if (overdueCount > 0) {
          title = `🚨 ATENÇÃO - ${count} CONTAS A PAGAR (${overdueCount} ATRASADA${overdueCount > 1 ? 'S' : ''})`;
        } else {
          title = `⚠️ ATENÇÃO - VENCIMENTO DE ${count} CONTAS`;
        }

        const maxDisplay = 5;
        const lines = pendingBills.slice(0, maxDisplay).map(b => {
          const valStr = b.amount ? ` - R$ ${Number(b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
          const statusStr = b.isOverdue ? ' [ATRASADA]' : ` (Dia ${b.due})`;
          return `• ${b.name}${valStr}${statusStr}`;
        });

        if (count > maxDisplay) {
          lines.push(`... e mais ${count - maxDisplay} conta(s).`);
        }

        body = `Você tem ${count} contas para regularizar:\n` + lines.join('\n');
      }

      await self.registration.showNotification(title, {
        body: body,
        icon: '/app_icon.png',
        badge: '/app_icon.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'financaspro-vencimentos-resumo',
        renotify: true,
        data: { url: '/', action: 'OPEN_APP' }
      });

      // Mark as notified for this signature today
      await cache.put(cacheKey, new Response('true'));
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

// Listener for notification click events (leads user directly to payment or client)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const notifData = event.notification.data || {};
  const isPaymentAction =
    notifData.action === 'OPEN_PAYMENT' ||
    (event.notification.tag && (
      event.notification.tag.includes('sub-expiry') ||
      event.notification.tag.includes('trial-expiry') ||
      event.notification.tag.includes('free-trial')
    ));

  const directPaymentUrl = 'https://mpago.la/1SfRUJ2';

  const clickPromise = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there is already an open window client for this app
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if ('focus' in client) {
        client.focus();
        if (isPaymentAction) {
          client.postMessage({ type: 'OPEN_PAYMENT', action: 'OPEN_PAYMENT' });
        }
        return;
      }
    }
    // If no window is currently open and it's a payment action, direct user straight to Mercado Pago checkout
    if (isPaymentAction) {
      if (clients.openWindow) {
        return clients.openWindow(directPaymentUrl);
      }
    } else {
      const targetPath = notifData.url || '/';
      const fullUrl = new URL(targetPath, self.location.origin).href;
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
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
