// SABI Service Worker — offline-first for low-connectivity Nigerian campuses
//
// Cache strategy per resource type:
//   /_next/static/**        → cache-first  (content-hashed, safe forever)
//   /_next/image/**         → cache-first
//   Google Fonts            → cache-first
//   Our images              → cache-first
//   HTML navigation         → network-first → cached page → root shell
//   Next.js RSC payloads    → network-first → cached RSC
//   Supabase API            → network-only  (anon push, silent offline fail)
//   Everything else         → network-first → cached

const SHELL_VERSION = 'sabi-v3'
const SHELL_CACHE   = `${SHELL_VERSION}-shell`
const RUNTIME_CACHE = `${SHELL_VERSION}-runtime`

const PRECACHE_ROUTES = ['/', '/check-in', '/screen', '/results', '/sos']
const PRECACHE_ASSETS = [
  '/logo.png',
  '/ai%20bot%20face.png',
]

// ── Install: resilient — one failure must not abort the whole install ─
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(async (cache) => {
        // Use allSettled so a single 404 doesn't kill the install
        await Promise.allSettled([
          ...PRECACHE_ROUTES.map(url => cache.add(new Request(url, { credentials: 'same-origin' })).catch(() => {})),
          ...PRECACHE_ASSETS.map(url => cache.add(new Request(url, { credentials: 'same-origin' })).catch(() => {})),
        ])
      })
      .then(() => self.skipWaiting())
  )
})

// ── Activate: clean up stale caches from previous shell versions ─────
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

// ── Fetch ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept GET
  if (request.method !== 'GET') return

  // Supabase: network-only (push is fire-and-forget; offline queue in supabase.js handles it)
  if (url.hostname.includes('supabase.co')) return

  // Next.js content-hashed static assets: cache-first, populate on first load
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Next.js image optimiser
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Next.js RSC data fetches (client-side navigation payloads)
  // These arrive as XHR/fetch with Accept: text/x-component
  if (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    url.searchParams.has('_rsc')
  ) {
    event.respondWith(networkFirstRSC(request))
    return
  }

  // Google Fonts (stylesheet + woff2 files): cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE))
    return
  }

  // Our own static images
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // HTML page navigations: network-first, fall back to cached page, then root shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request))
    return
  }
})

// ── Strategy helpers ──────────────────────────────────────────────────

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
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
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
    // Try exact URL, then try root shell (React app handles client-side routing)
    return (
      (await caches.match(request)) ??
      (await caches.match('/')) ??
      new Response('<h1>SABI is offline</h1><p>Please reconnect to the internet.</p>', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      })
    )
  }
}

async function networkFirstRSC(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return (await caches.match(request)) ?? new Response(null, { status: 503 })
  }
}
