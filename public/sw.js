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

// Helper to parse different bill due date patterns reliably in SW
function parseBillDueDay(dueStr, now) {
  if (!dueStr) return null;
  const s = String(dueStr).trim();
  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  // Format: DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/').map(Number);
    const d = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  // Format: "Dia 15" or just numbers "15"
  const match = s.match(/\d+/);
  if (match) {
    const day = parseInt(match[0], 10);
    const currentDay = now.getDate();
    return day - currentDay;
  }
  return null;
}

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
    
    // Filter pending/expiring/overdue bills with multi-format support
    const pendingBills = bills.map(bill => {
      const diffDays = parseBillDueDay(bill.due, now);
      const isOverdue = bill.isOverdue || (diffDays !== null && diffDays < 0);
      const isDueToday = diffDays === 0;
      const isUpcoming = diffDays !== null && diffDays > 0 && diffDays <= 3;
      return {
        ...bill,
        diffDays,
        isOverdue,
        isDueToday,
        isUpcoming,
        shouldAlert: isOverdue || isDueToday || isUpcoming
      };
    }).filter(b => b.shouldAlert);

    if (pendingBills.length === 0) return;

    // Signature based on current bills list to re-notify if list updates
    const signature = pendingBills.map(b => `${b.id}-${b.amount || 0}-${b.due}-${b.isOverdue ? 'overdue' : 'due'}`).sort().join('|');
    const cacheKey = `/notified-all-${currentDay}-${signature}.json`;
    const alreadyNotified = await cache.match(cacheKey);

    if (!alreadyNotified) {
      let title = '';
      let body = '';

      const count = pendingBills.length;
      const overdueList = pendingBills.filter(b => b.isOverdue);
      const todayList = pendingBills.filter(b => !b.isOverdue && b.isDueToday);

      if (count === 1) {
        const bill = pendingBills[0];
        const valStr = bill.amount ? ` (R$ ${Number(bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : '';
        if (bill.isOverdue) {
          title = '🚨 CONTA EM ATRASO - FinançasPro';
          body = `A despesa "${bill.name}"${valStr} está ATRASADA (Venceu dia ${bill.due}). Toque para regularizar.`;
        } else if (bill.isDueToday) {
          title = '⚠️ VENCE HOJE - FinançasPro';
          body = `A despesa "${bill.name}"${valStr} VENCE HOJE (${bill.due}). Aproveite para quitar e evitar juros.`;
        } else {
          title = '⚠️ PRÓXIMO DO VENCIMENTO - FinançasPro';
          body = `A despesa "${bill.name}"${valStr} vence em ${bill.diffDays} dia(s) (${bill.due}).`;
        }
      } else {
        if (overdueList.length > 0) {
          title = `🚨 ${count} CONTAS PENDENTES (${overdueList.length} ATRASADA${overdueList.length > 1 ? 'S' : ''})`;
        } else if (todayList.length > 0) {
          title = `⚠️ ${count} CONTAS (${todayList.length} VENCEM HOJE)`;
        } else {
          title = `⚠️ LEMBRETE: ${count} CONTAS A VENCER`;
        }

        const maxDisplay = 5;
        const lines = pendingBills.slice(0, maxDisplay).map(b => {
          const valStr = b.amount ? ` - R$ ${Number(b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
          let statusStr = ` (${b.due})`;
          if (b.isOverdue) statusStr = ' [ATRASADA]';
          else if (b.isDueToday) statusStr = ' [VENCE HOJE]';
          else if (b.diffDays !== null) statusStr = ` [Em ${b.diffDays}d]`;
          return `• ${b.name}${valStr}${statusStr}`;
        });

        if (count > maxDisplay) {
          lines.push(`... e mais ${count - maxDisplay} conta(s).`);
        }

        body = `Você tem ${count} conta(s) para regularizar:\n` + lines.join('\n');
      }

      const notifOptions = {
        body: body,
        icon: '/app_icon.png',
        badge: '/app_icon.png',
        tag: 'financaspro-vencimentos-resumo',
        renotify: true,
        data: { url: '/', action: 'OPEN_APP' }
      };

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        notifOptions.vibrate = [200, 100, 200, 100, 200];
      }

      try {
        await self.registration.showNotification(title, notifOptions);
      } catch (err) {
        // Fallback for strict browsers / mobile OS
        await self.registration.showNotification(title, { body: body, data: { url: '/', action: 'OPEN_APP' } });
      }

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
        tag: data.tag || payload.tag,
        data: data.data || payload.data
      };
    } catch (e) {
      // Fallback if data is raw text
      payload.body = event.data.text() || payload.body;
    }
  }

  const showNotif = async () => {
    try {
      const opts = {
        body: payload.body,
        icon: payload.icon || '/app_icon.png',
        badge: payload.badge || '/app_icon.png',
        tag: payload.tag || ('financaspro-' + Date.now()),
        renotify: true,
        data: payload.data || { url: '/', action: 'OPEN_APP' }
      };
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        opts.vibrate = [300, 100, 300, 100, 300];
      }
      return await self.registration.showNotification(payload.title, opts);
    } catch (err) {
      console.warn('[SW] showNotification com opções estendidas falhou, usando modo padrão:', err);
      try {
        return await self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/app_icon.png',
          data: payload.data || { url: '/', action: 'OPEN_APP' }
        });
      } catch (fallbackErr) {
        console.warn('[SW] Tentando fallback ultra-compatível:', fallbackErr);
        try {
          return await self.registration.showNotification(payload.title, {
            body: payload.body
          });
        } catch (critErr) {
          console.error('[SW] Erro crítico irrecuperável ao mostrar notificação:', critErr);
        }
      }
    }
  };

  event.waitUntil(showNotif());
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
