// R40.86 PROD OUTAGE repro — Tron's iPhone: drop IMG_5381.png → 'Upload failed'. Our gate used a hand-built FormData POST;
// this drives the REAL client path: a DragEvent('drop') of a BINARY png File onto the room drop zone → RoomView handler →
// DropDispatcher.uploadFile → POST /api/room/<id>/upload (NO parent = room-root drop, Tron's case). Captures the server response.
// ARM_COMMIT=<sha> to BISECT the last-good version. Linux-WebKit (R40.89: NOT iOS Safari) — a PASS here means iOS-specific.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PLAYER = '11111111-2222-4333-8444-555555555555'; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMMIT = process.env.ARM_COMMIT || 'HEAD';
const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD !== '0' });
console.log(`REPRO arm=${COMMIT} served v${f.servedVersion} base=${f.base}`);
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  const posts = [];
  await page.route('**/api/room/**/upload', async (route) => { const resp = await route.fetch(); let body = ''; try { body = await resp.text(); } catch {} posts.push({ status: resp.status(), body: body.slice(0, 200) }); await route.fulfill({ response: resp, body }); });
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'D', secretCode: '4086' }));
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('D', 'D'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  await sleep(1500);
  // REAL DROP: a binary PNG File onto the room drop zone (#rrc-drop / the room body), NO parent
  const dropResult = await page.evaluate(async () => {
    // minimal valid PNG bytes
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 0, 0, 3, 1, 1, 0, 24, 221, 141, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const file = new File([png], 'IMG_5381.png', { type: 'image/png' });
    const zone = document.getElementById('rrc-drop') || document.getElementById('rrc-root') || document.querySelector('.rrc') || document.body;
    if (!zone) return { fired: false, why: 'no drop zone' };
    try {
      const dt = new DataTransfer(); dt.items.add(file);
      ['dragenter', 'dragover', 'drop'].forEach((type) => zone.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true })));
      return { fired: true, zone: zone.id || zone.className || 'body' };
    } catch (e) { return { fired: false, why: String(e && e.message) }; }
  });
  await sleep(3500);
  console.log('drop dispatched:', JSON.stringify(dropResult));
  console.log('via synthetic DROP event:', JSON.stringify(posts));
  // ISOLATE: the CLIENT's real multipart construction (drop-dispatcher.ts:58-65 — real File, file-first) with real PNG bytes,
  // bypassing the synthetic drop event → does the server see the bytes (size>0) or is the body dropped (size 0)?
  const direct = await page.evaluate(async (a) => {
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 0, 0, 3, 1, 1, 0, 24, 221, 141, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const file = new File([png], 'IMG_DIRECT.png', { type: 'image/png' });
    const fd = new FormData(); fd.append('file', file, file.name); fd.append('playerToken', a.tok); // EXACT client order
    try { const r = await fetch(`${a.base}/api/room/${a.roomId}/upload`, { method: 'POST', body: fd }); const t = await r.text(); return { status: r.status, body: t.slice(0, 160), pngBytes: png.length }; } catch (e) { return { err: String(e && e.message) }; }
  }, { base: f.base, roomId, tok: PLAYER });
  console.log('via CLIENT-multipart real File (isolates drop-event):', JSON.stringify(direct));
  // ISOLATE instrument-vs-product: does Playwright-WebKit even serialize a synthetic binary File's bytes? Test my ORIGINAL
  // WORKING config (playerToken-FIRST, file-LAST) but with BINARY content. size>0 → binary serializes → the client-order size0
  // is ORDER-sensitive (PRODUCT parse bug). size 0 → WebKit doesn't serialize the synthetic binary File (INSTRUMENT, retract 'reproduced').
  const iso = await page.evaluate(async (a) => {
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 0, 0, 3, 1, 1, 0, 24, 221, 141, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const fd = new FormData(); fd.append('playerToken', a.tok); fd.append('file', new Blob([png], { type: 'image/png' }), 'IMG_ISO.png'); // ORIGINAL order, BINARY blob
    try { const r = await fetch(`${a.base}/api/room/${a.roomId}/upload`, { method: 'POST', body: fd }); return { status: r.status, body: (await r.text()).slice(0, 120) }; } catch (e) { return { err: String(e && e.message) }; }
  }, { base: f.base, roomId, tok: PLAYER });
  console.log('via ORIGINAL-order BINARY blob (isolates serialization):', JSON.stringify(iso));
  // and a STRING blob file-FIRST (client order, text content) to isolate order-vs-content
  const strFirst = await page.evaluate(async (a) => { const fd = new FormData(); fd.append('file', new Blob(['HELLO_TEXT_BODY_' + Date.now()], { type: 'text/plain' }), 'IMG_STR.txt'); fd.append('playerToken', a.tok); try { const r = await fetch(`${a.base}/api/room/${a.roomId}/upload`, { method: 'POST', body: fd }); return { status: r.status, body: (await r.text()).slice(0, 120) }; } catch (e) { return { err: String(e && e.message) }; } }, { base: f.base, roomId, tok: PLAYER });
  console.log('via file-FIRST STRING blob (isolates order):', JSON.stringify(strFirst));
  // ★ DECISIVE — Playwright NATIVE multipart (sends a REAL body buffer node-side, bypassing browser-fetch serialization).
  // size>0 → browser-fetch was the instrument, server is FINE, Tron's failure is iOS-specific (needs prod log). size 0 → real server body-drop.
  try {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 0, 0, 3, 1, 1, 0, 24, 221, 141, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    const nr = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'IMG_NATIVE.png', mimeType: 'image/png', buffer: png } } });
    console.log('via PLAYWRIGHT-NATIVE multipart real body:', nr.status(), (await nr.text()).slice(0, 120), 'sentBytes=' + png.length);
  } catch (e) { console.log('native POST err:', String(e && e.message)); }
  const anyFail = posts.some((p) => p.status !== 200);
  console.log(`RESULT arm=${COMMIT} v${f.servedVersion}: real-drop upload ${posts.length === 0 ? 'NEVER POSTED (client path broke BEFORE the request)' : anyFail ? 'FAILED (' + posts.map((p) => p.status).join(',') + ')' : 'OK 200'}`);
  await ctx.close();
} finally { await browser.close().catch(() => {}); await f.teardown(); }
