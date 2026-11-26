/* Service Worker Oficial — Sistema de Tesistas Ing. Industrial UNT (PWA + Web Push) */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: '🎓 Novedad en tu trámite de tesis — UNT',
    body: 'Ingresa al sistema de Ingeniería Industrial para revisar el avance oficial de tu expediente.',
    url: '/',
    icon: '/images/logo-industrial.png',
    badge: '/images/logo-unt.png',
    tag: 'unt-tesis-aviso'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/logo-industrial.png',
    badge: data.badge || '/images/logo-unt.png',
    tag: data.tag || 'unt-tesis-aviso',
    renotify: true,
    vibrate: [180, 80, 180],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.navigate && targetUrl) {
            client.navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
