const CACHE_NAME = 'rawbin-v0.5.49';

const STATIC_SHELL = [
  '/app',
  '/app.css',
  '/manifest.json',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/trace',
  '/dist/trace-page-D3AQNRHR.js',
];

const OFFLINE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RawBin — Offline</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white;text-align:center;padding:20px}
.offline{max-width:400px}.offline h1{font-size:2rem;margin-bottom:16px}.offline p{opacity:0.7;margin-bottom:24px}
.retry{padding:12px 32px;background:white;color:#667eea;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer}</style>
</head><body><div class="offline"><h1>You're Offline</h1><p>RawBin needs a network connection. Check your internet and try again.</p>
<button class="retry" onclick="location.reload()">Retry</button></div></body></html>`;

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
      try {
        const res = await fetch('/dist/build-manifest.json');
        const manifest = await res.json();
        if (manifest['app.js']) {
          await cache.add('/dist/' + manifest['app.js']);
        }
      } catch {
        await cache.add('/dist/app.js').catch(() => {});
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
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
  const cached = await caches.match(request);
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
