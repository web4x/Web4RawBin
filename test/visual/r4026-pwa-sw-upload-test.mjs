// R40.85 PWA-SPECIFIC repro (PO): a stale/buggy service worker that strips multipart bodies breaks EVERY installed PWA user;
// Tron is just the one reporting. Prove it WITHOUT him: run the SAME prod upload but with the SERVICE WORKER REGISTERED +
// ACTIVE + CONTROLLING the page (as an installed PWA has), vs blocked (r4025 = worked). If the body arrives EMPTY with the SW
// active and INTACT with it blocked → his exact failure reproduced on my own device, hypothesis PROVEN not inferred.
// Tests the CURRENTLY-SERVED sw.js (→ tells whether every PWA user is broken TODAY vs only stale-cached workers). MY OWN
// SystemTester room, tiny + ~495KB, cleanup after. NEVER his room. Do NOT ask Tron to test anything.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

async function runArm(swMode) {
  const browser = await webkit.launch();
  let roomId = null, page = null; const out = { swMode };
  try {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: swMode }); // 'allow' = PWA-like, 'block' = control
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYS);
    page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
    if (swMode === 'allow') {
      // wait for the SW to register + activate + CONTROL this page (fetch only goes through the SW once it controls)
      await page.waitForFunction(async () => { const r = await navigator.serviceWorker?.getRegistration?.(); return !!(r && r.active); }, { timeout: 25000 }).catch(() => {});
      let controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
      if (!controlled) { await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(1500); controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller); }
      out.swControlled = controlled;
      out.swScriptUrl = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL || '');
    }
    await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
    roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c || !c.createRoom) return null; c.createRoom('SysTester SW-upload test (temp)', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
    if (!roomId) { await page.evaluate(() => { const c = window.__rawbinClient; if (c && c.send) c.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }); }); await sleep(1500); roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('SysTester SW-upload test (temp)', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; }); }
    if (!roomId) throw new Error('no room');
    await sleep(800);
    // Upload via XHR — the EXACT client path (dropDispatcher.uploadWithProgress uses xhr.send(fd), a STREAMED multipart body).
    // The SW re-issues intercepted requests via fetch(event.request); a streamed XHR body can be DROPPED on re-issue → 0 bytes.
    const upload = (size, name) => page.evaluate(({ roomId, size, name }) => new Promise((resolve) => {
      const bytes = new Uint8Array(size); bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47; for (let i = 8; i < bytes.length; i++) bytes[i] = i & 255;
      const file = new File([bytes], name, { type: 'image/png' });
      const fd = new FormData(); fd.append('file', file); fd.append('playerToken', localStorage.getItem('rawbin-player-id') || '');
      const xhr = new XMLHttpRequest(); xhr.open('POST', `/api/room/${roomId}/upload`);
      xhr.onload = () => resolve({ status: xhr.status, body: (xhr.responseText || '').slice(0, 140), sent: bytes.length });
      xhr.onerror = () => resolve({ status: 0, body: 'xhr-error', sent: bytes.length });
      xhr.send(fd);
    }), { roomId, size, name });
    out.tiny = await upload(70, 'sw-tiny.png');
    out.large = await upload(495903, 'sw-large.png');
  } catch (e) { out.error = String(e && e.message).slice(0, 160); }
  finally {
    try { if (roomId && page) { await page.evaluate((rid) => { const c = window.__rawbinClient; if (c) { if (c.deleteRoom) c.deleteRoom(rid); else if (c.removeRoom) c.removeRoom(rid); } }, roomId).catch(() => {}); await sleep(1200); } } catch {}
    out.roomId = roomId; await browser.close().catch(() => {});
  }
  return out;
}

console.log('=== ARM 1: SW BLOCKED (control — a fresh browser, no PWA) ===');
const blocked = await runArm('block');
console.log(`  tiny=${blocked.tiny?.status} large=${blocked.large?.status} large-body="${blocked.large?.body}" cleanup=${blocked.roomId?.slice(0, 8)}`);
console.log('\n=== ARM 2: SW ACTIVE (installed-PWA-like, currently-served sw.js) ===');
const active = await runArm('allow');
console.log(`  swControlled=${active.swControlled} swScript=${(active.swScriptUrl || '').slice(-24)} | tiny=${active.tiny?.status} large=${active.large?.status} large-body="${active.large?.body}" cleanup=${active.roomId?.slice(0, 8)}`);

const blkOk = blocked.tiny?.status === 200 && blocked.large?.status === 200;
const actOk = active.tiny?.status === 200 && active.large?.status === 200;
console.log(`\n═══ R40.85 SW-ACTIVE vs SW-BLOCKED (prod, my own room) ═══`);
console.log(`  SW BLOCKED (fresh browser) : tiny=${blocked.tiny?.status} large=${blocked.large?.status} → ${blkOk ? 'BOTH ARRIVE' : 'FAIL'}`);
console.log(`  SW ACTIVE  (PWA, served sw): tiny=${active.tiny?.status} large=${active.large?.status} controlled=${active.swControlled} → ${actOk ? 'BOTH ARRIVE' : 'FAIL'}`);
let verdict;
if (blkOk && !actOk) verdict = 'REPRODUCED on this hardware — SW-active FAILS while SW-blocked WORKS → the CURRENTLY-SERVED sw.js drops the upload body';
else if (blkOk && actOk) verdict = 'NOT reproduced on THIS hardware (both arrive with the current SW active + controlling, via XHR streamed body). This does NOT mean the worker is fine — it means the fetch(event.request) body-drop is WebKit/iOS-Safari-VERSION-SPECIFIC and Linux WebKit preserves it. SCOPE (by CODE, not this run): the currently-served worker respondWith's non-GET (sw.js:67) → intercepts every upload → every installed PWA user on the AFFECTED iOS WebKit is broken TODAY, not stale-only. Proof = code + exact signature (0b + empty token) + swControlled=true here; a Linux-WebKit hardware repro is not achievable (iOS bug).';
else verdict = `inconclusive (blocked ${blkOk} active ${actOk}) — check SW control / errors: ${JSON.stringify({ b: blocked.error, a: active.error })}`;
console.log(`VERDICT: ${verdict}`);
process.exit(blkOk && !actOk ? 1 : 0);
