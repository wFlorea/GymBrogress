// Service worker: shows the weekly check-in reminder sent by /api/cron/weight-reminder and opens the app on a tap.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'GymBrogress', {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      // A newer reminder replaces an unread one.
      tag: 'weekly-check-in',
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (!open) return self.clients.openWindow(url)
      await open.focus()
      // Only pages this worker controls can be navigated; the others just come to the front.
      return open.navigate(url).catch(() => undefined)
    })()
  )
})
