/// <reference lib="webworker" />

const CACHE_NAME = 'wheeldo-v1'
const OFFLINE_URL = '/offline'

// Assets to cache on install
const PRECACHE_ASSETS = [OFFLINE_URL]

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API requests - never cache sensitive data
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip auth-related paths
  if (
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('callback') ||
    url.pathname.includes('signin') ||
    url.pathname.includes('signout')
  ) {
    return
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // Handle static assets (JS, CSS, images)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached, but also update cache in background
          fetch(request)
            .then((response) => {
              if (response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response)
                })
              }
            })
            .catch(() => {
              // Ignore fetch failures for background updates
            })
          return cached
        }

        // Not cached - fetch and cache
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }
})

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.svg',
    badge: data.badge || '/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    tag: data.tag || 'wheeldo-notification',
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'WheelDo', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if none found
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
