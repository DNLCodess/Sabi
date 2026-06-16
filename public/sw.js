// SABI Service Worker
// Strategy:
//   /_next/static/**  → cache-first  (content-hashed, safe forever)
//   /_next/image/**   → cache-first
//   Google Fonts      → cache-first
//   Our images        → cache-first
//   Navigation (HTML) → network-first, fallback to cached page, fallback to /
//   Supabase API      → network-only (fire-and-forget; silent failure is fine)

const SHELL_VERSION = 'sabi-v2'
const SHELL_CACHE   = `${SHELL_VERSION}-shell`
const RUNTIME_CACHE = `${SHELL_VERSION}-runtime`

// Routes to warm-cache on install so the app works immediately offline
const PRECACHE_ROUTES = ['/', '/check-in', '/screen', '/results']
const PRECACHE_ASSETS = ['/logo.png', '/favicon.png', '/ai bot face.png']

// ── Install ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll([...PRECACHE_ROUTES, ...PRECACHE_ASSETS]))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: remove old caches ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('sabi-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept GET
  if (request.method !== 'GET') return

  // Supabase: always go to network (push is fire-and-forget; reads fail silently offline)
  if (url.hostname.includes('supabase.co')) return

  // Next.js content-hashed static chunks — safe to cache forever
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Next.js image optimiser
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Google Fonts (stylesheet + font files)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Our own static images
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // HTML page navigations: network-first, cached fallback, then root shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request))
    return
  }
})

// ── Strategy helpers ─────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Truly offline and not in cache — return empty 503
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstNav(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Exact route cached → serve it; otherwise fall back to root (React handles routing)
    return (await caches.match(request)) ?? (await caches.match('/'))
  }
}
