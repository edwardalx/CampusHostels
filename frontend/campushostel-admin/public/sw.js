// Service worker for manager Web Push alerts. Served from /manager/sw.js, so its scope is /manager/.
// Payloads are deliberately generic (no tenant names): they can appear on a locked screen.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // Fall through to the defaults below.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CampusHostels', {
      body: data.body || 'There is new activity.',
      icon: '/manager/favicon.svg',
      tag: data.url || 'activity',
      data: { url: data.url || '/manager/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Only ever open pages of this app, whatever the payload says.
  const requested = new URL(event.notification.data?.url || '/manager/', self.location.origin)
  const target = requested.origin === self.location.origin && requested.pathname.startsWith('/manager/')
    ? requested.href
    : new URL('/manager/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin + '/manager/'))
      if (open) return open.focus().then((w) => ('navigate' in w ? w.navigate(target) : w))
      return self.clients.openWindow(target)
    }),
  )
})
