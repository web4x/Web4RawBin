// R40.85 DECISIVE ENV TEST (PO GO): does the multipart UPLOAD BODY arrive at the PROD endpoint from a working client?
// Prod log for Tron's attempt read: "upload received 0b … file empty … size 0b token empty … ERROR auth failed token empty"
// → the whole multipart body never arrived from HIS device (0 bytes + empty token; nothing to write, so NOT filesystem).
// This test uploads from MY device (real WebKit @390 like his phone) to the REAL prod endpoint, MY OWN SystemTester room
// (NEVER his), tiny then ~495KB, and CLEANS UP. Distinguishes exactly two things:
//   both arrive (200, size matches) → prod INGRESS is fine → the failure is HIS device/connection/session
//   body arrives EMPTY (0b/401)     → prod INGRESS problem (TLS-term / proxy / multipart buffering fronting 4444)
// (A size split — tiny-ok/large-fail — additionally points at a body-size limit at the ingress.)
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df'; // SystemTester (canonical test identity; my own, established member on prod)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const browser = await webkit.launch();
let roomId = null, page = null;
const out = {};
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYS);
  page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
  out.wsConnected = await page.evaluate(() => (window.__rawbinClient && window.__rawbinClient.connected) === true);
  // create MY OWN room (SystemTester should already have a committed profile on prod; if not, name-preserving UPDATE_PROFILE)
  roomId = await page.evaluate(async () => {
    const c = window.__rawbinClient; if (!c || !c.createRoom) return null;
    c.createRoom('SysTester upload-env test (temp)', 'SystemTester');
    for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); }
    return null;
  });
  if (!roomId) { // profile may be needed — send name-PRESERVING UPDATE_PROFILE (never change SystemTester's name), retry
    await page.evaluate(() => { const c = window.__rawbinClient; if (c && c.send) c.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }); });
    await sleep(1500);
    roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('SysTester upload-env test (temp)', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  }
  console.log(`  WS=${out.wsConnected} | MY room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('could not create my own SystemTester room on prod');
  await sleep(1000);

  const upload = (size, name) => page.evaluate(async ({ roomId, size, name }) => {
    const bytes = new Uint8Array(size); bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47; for (let i = 8; i < bytes.length; i++) bytes[i] = i & 255;
    const file = new File([bytes], name, { type: 'image/png' });
    const fd = new FormData(); fd.append('file', file); fd.append('playerToken', localStorage.getItem('rawbin-player-id') || '');
    const t0 = performance.now();
    try { const r = await fetch(`/api/room/${roomId}/upload`, { method: 'POST', body: fd }); const body = (await r.text()).slice(0, 160); return { status: r.status, body, sentBytes: bytes.length, ms: Math.round(performance.now() - t0) }; }
    catch (e) { return { status: 0, body: String(e && e.message), sentBytes: bytes.length, ms: Math.round(performance.now() - t0) }; }
  }, { roomId, size, name });

  out.tiny = await upload(70, 'env-tiny.png');
  console.log(`  ★ PROD UPLOAD tiny  (${out.tiny.sentBytes}b sent): HTTP ${out.tiny.status} ${out.tiny.ms}ms body="${out.tiny.body}"`);
  out.large = await upload(495903, 'env-large.png');
  console.log(`  ★ PROD UPLOAD large (${out.large.sentBytes}b sent, Tron's size): HTTP ${out.large.status} ${out.large.ms}ms body="${out.large.body}"`);
  await ctx.close();
} catch (e) { out.error = String(e && e.message).slice(0, 200); console.log('error:', out.error); }
finally {
  // CLEANUP: delete MY temp room (removes its uploaded files too) — never leave test pollution on prod
  try {
    if (roomId && page) { await page.evaluate((rid) => { const c = window.__rawbinClient; if (c) { if (c.deleteRoom) c.deleteRoom(rid); else if (c.removeRoom) c.removeRoom(rid); } }, roomId).catch(() => {}); await sleep(1500); }
  } catch {}
  await browser.close().catch(() => {});
  console.log(`  cleanup: requested deleteRoom(${roomId ? roomId.slice(0, 8) : 'none'})`);
}

const tinyOk = out.tiny && out.tiny.status === 200, largeOk = out.large && out.large.status === 200;
console.log(`\n═══ R40.85 PROD-ENDPOINT UPLOAD (my device → prod, own room) ═══`);
console.log(`  tiny  70b     : ${tinyOk ? 'ARRIVED (200)' : 'FAILED ' + JSON.stringify(out.tiny)}`);
console.log(`  large 495903b : ${largeOk ? 'ARRIVED (200)' : 'FAILED ' + JSON.stringify(out.large)}`);
let verdict;
if (tinyOk && largeOk) verdict = 'BOTH ARRIVE on prod → prod INGRESS is FINE → the failure is TRON-SPECIFIC (his device/connection/session), NOT the code or the ingress';
else if (!tinyOk && !largeOk) verdict = 'BOTH FAIL on prod (while both succeed on localhost) → PROD INGRESS problem (TLS-term/proxy/multipart buffering fronting 4444)';
else verdict = `SIZE SPLIT (tiny=${tinyOk} large=${largeOk}) → a BODY-SIZE LIMIT at the ingress fronting 4444`;
console.log(`VERDICT: ${verdict}`);
process.exit(tinyOk && largeOk ? 0 : 1);
