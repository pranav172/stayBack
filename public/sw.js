// Service Worker for mujAnon PWA
// Provides offline splash + FCM push notification handling

const CACHE_NAME = 'mujanon-v1'
const OFFLINE_URL = '/offline.html'

// Shell assets to cache
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.png',
]

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first, fall back to cache, fall back to offline page for nav
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || new Response('Offline', { status: 503 }))
      )
    )
    return
  }
  // For static assets: cache-first
  if (event.request.destination === 'script' || event.request.destination === 'style' || event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((r) => r || fetch(event.request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
        return res
      }))
    )
  }
})

// Push notifications (FCM)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'mujAnon'
  const body = data.body || 'Someone is looking to chat!'
  const icon = '/icon.png'
  const badge = '/icon.png'
  const tag = data.tag || 'mujanon-notification'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  )
})

// Notification click: open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
