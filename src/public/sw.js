const CACHE_NAME = 'rawbin-v0.6.47';
// [test:uuid:ed935b58-cea8-4e8a-8079-e592d21ecda2]
// [impl:uuid:3f6a9ce1-c9b9-43fa-9bd1-b2bfa38e92f2] OfflinePage.reloadButton

const STATIC_SHELL = [
  '/app',
  '/app.css',
  '/manifest.json',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/trace',
  '/dist/trace-page-S64NDQKU.js',
  '/scenario',
  '/dist/scenario-view-UDPCCBRY.js',
  '/dist/app-7P3QCZBS.js',
];

const OFFLINE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RawBin — Offline</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white;text-align:center;padding:20px}
.offline{max-width:400px}.offline h1{font-size:2rem;margin-bottom:16px}.offline p{opacity:0.7;margin-bottom:24px}
.retry{padding:12px 32px;background:white;color:#667eea;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer}
.flush{padding:12px 32px;background:#e53935;color:white;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px}</style>
</head><body><div class="offline"><h1>You're Offline</h1><p>RawBin needs a network connection. Check your internet and try again.</p>
<button class="retry" onclick="location.reload()">Retry</button>
<button class="flush" onclick="flushCache()">Flush Cache</button></div>
<script>
// [impl:uuid:4bb96a28-cfe7-4f0a-9a38-909a930e8345] ServiceWorker.flushAndReload implementation (split for Servi
// [impl:uuid:79505a42-6591-4fdb-a967-2767b7df4518] ServiceWorker.flushAndReload
async function flushCache(){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));await navigator.serviceWorker.register('/sw.js');location.reload();}
</script></body></html>`;

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_SHELL);
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/md/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  // [impl:uuid:cec00d7f-9258-4ac1-8c35-3e45dce8a5a9] ServiceWorker.ignoreSearchNav R19.31/32
  const isNavigation = request.mode === 'navigate';
  const cached = await caches.match(request, isNavigation ? { ignoreSearch: true } : undefined);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineResponse();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html' },
  });
}
