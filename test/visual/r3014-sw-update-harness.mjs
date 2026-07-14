// [test:uuid:0ad9eaa2-ff76-4aa0-b280-5ba0710a03fb] R30.14 SW auto-update reload path (pollForWorkerUpdate f1456992 + claimClients 406e1e33)
// DETERMINISTIC v1→v2 harness for the register-vN → deploy-vN+1 → banner → reload path (the committed regression gate;
// the live-catch on a real deploy is the fidelity complement). Mirrors prod sw.js: message→SKIP_WAITING→skipWaiting,
// activate→clients.claim; page: reg.update() (pollForWorkerUpdate) → updatefound → 'Update Now' banner (arm A),
// tap → SKIP_WAITING → skipWaiting+claim → controllerchange → reload → new version live (arm B). NO auto-reload without the tap.
// Localhost loopback = secure context, so SW works with plain http (no cert). DET-3x.

import http from 'http';
import { chromium } from '@playwright/test';

// --- tiny origin serving a swappable SW version (v1 → v2) ---
let VER = 'v1';
const PAGE = `<!doctype html><meta charset=utf8><title>swtest</title>
<div id="banner" style="display:none">Update Now</div><div id="ver">loading</div>
<script>
let tapped=false, reg;
window.__banner=false; window.__tapped=false; window.__ver='?';
async function showVer(){ try{ const v=await (await fetch('/ver',{cache:'no-store'})).text(); document.getElementById('ver').textContent=v; window.__ver=v; }catch{} }
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(r=>{ reg=r; window.__reg=r;
    r.addEventListener('updatefound', ()=>{ const nw=r.installing; nw && nw.addEventListener('statechange', ()=>{
      if (nw.state==='installed' && navigator.serviceWorker.controller) { document.getElementById('banner').style.display='block'; window.__banner=true; } // arm A: banner on waiting worker
    }); });
  });
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if (tapped) location.reload(); }); // arm B: reload ONLY after tap
}
document.getElementById('banner').onclick=()=>{ tapped=true; window.__tapped=true; reg && reg.waiting && reg.waiting.postMessage('SKIP_WAITING'); };
window.__poll=()=>{ reg && reg.update(); };  // pollForWorkerUpdate
showVer();
</script>`;
const SW = () => `// service worker — version ${VER}
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('install', () => { /* no skipWaiting → new SW WAITS for the tap (banner-first) */ });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); }); // claimClients → controllerchange
`;
const server = http.createServer((req, res) => {
  if (req.url === '/sw.js') { res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store', 'service-worker-allowed': '/' }); res.end(SW()); }
  else if (req.url === '/ver') { res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end(VER); }
  else { res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }); res.end(PAGE); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const ORIGIN = `http://127.0.0.1:${PORT}/`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    VER = 'v1';
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    const page = await ctx.newPage();
    await page.goto(ORIGIN, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 15000 }).catch(() => {});
    await page.waitForFunction(() => window.__ver === 'v1', { timeout: 8000 }).catch(() => {});
    const v1 = await page.evaluate(() => ({ ver: window.__ver, controller: !!navigator.serviceWorker.controller, banner: window.__banner }));

    // deploy v2 + poll for update (pollForWorkerUpdate)
    VER = 'v2';
    await page.evaluate(() => window.__poll());
    const bannerShown = await page.waitForFunction(() => window.__banner === true, { timeout: 12000 }).then(() => true).catch(() => false); // arm A
    const bannerVisible = await page.locator('#banner').isVisible().catch(() => false);

    // NO auto-reload before the tap
    const noReloadPreTap = await page.evaluate(() => window.__ver === 'v1'); // still v1 (no reload yet)

    // tap Update Now → SKIP_WAITING → skipWaiting + claim → controllerchange → reload → v2 live (arm B)
    await page.click('#banner').catch(() => {});
    const reloadedToV2 = await page.waitForFunction(() => window.__ver === 'v2' && !!navigator.serviceWorker.controller, { timeout: 15000 }).then(() => true).catch(() => false);
    const v2 = await page.evaluate(() => ({ ver: window.__ver }));

    const pass = v1.ver === 'v1' && v1.controller && bannerShown && bannerVisible && noReloadPreTap && reloadedToV2 && v2.ver === 'v2';
    results.push(pass);
    console.log(`iter ${i}: v1ctl=${v1.controller}(ver=${v1.ver}) | armA banner=${bannerShown}/vis=${bannerVisible} noReloadPreTap=${noReloadPreTap} | armB reload→v2=${reloadedToV2}(ver=${v2.ver}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log('\n===== R30.14 SW auto-update reload path (v1→v2, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('  arm A = deploy visible → Update Now banner (pollForWorkerUpdate/updatefound)');
console.log('  arm B = tap → SKIP_WAITING → skipWaiting+clients.claim → controllerchange → reload → new version live');
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
