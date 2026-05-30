// Service Worker for FinançasPro background push notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
