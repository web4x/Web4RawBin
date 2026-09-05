// R40.86 UPLOAD CONTENT GATE — closes the r4086 FALSE-GREEN hole (owned): the old gate asserted the unit RENDERS but NEVER
// the file CONTENT (size>0 + bytes), so a broken/empty upload passed. Architect ruling: EVERY upload/unit gate asserts CONTENT
// not presence — EXISTS ⊂ CORRECT. Here: upload a REAL binary via page.request NATIVE multipart (a real body BUFFER sent
// node-side — NOT an in-page fetch/FormData, which Playwright-WebKit serializes to 0 bytes = the very instrument that masked
// the outage), then fetch the stored bytes back and assert (A) server-reported size == source AND (B) a full BYTE round-trip
// (served sha == source sha). ⚠ SCOPE (R40.89): Linux-WebKit proves the SERVER content path; it does NOT reproduce Tron's
// iOS-device 'Upload failed' — the device-side cause (e.g. a stale installed SW) stays a HYPOTHESIS (no prod log exists).
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PLAYER = '11111111-2222-4333-8444-555555555555';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMMIT = process.env.ARM_COMMIT || 'HEAD';
const R = (v) => console.log(v);

// a REAL binary body with KNOWN, RANDOM bytes: random defeats content-hash dedup across runs; 4KB (not a trivial 69-byte png)
// so a truncated/partial-parse cannot accidentally byte-match. srcSha is the round-trip oracle.
const SRC = crypto.randomBytes(4096);
const srcSha = crypto.createHash('sha256').update(SRC).digest('hex');

const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD !== '0' });
R(`scratch up: ${f.base} v${f.servedVersion} arm=${COMMIT} | srcBytes=${SRC.length} srcSha=${srcSha.slice(0, 12)}`);
const browser = await webkit.launch();
const results = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'D', secretCode: '4086' }));
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('D', 'D'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) { results.instrument = 'no-room-render (scratch room render gap, not product)'; throw new Error('no-room'); }

  // (A) UPLOAD via PLAYWRIGHT-NATIVE multipart — a REAL body buffer. Body-drop (Tron's symptom) → size 0.
  const up = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'R4086_CONTENT.bin', mimeType: 'application/octet-stream', buffer: SRC } } });
  const upStatus = up.status();
  let upBody = {}; try { upBody = JSON.parse(await up.text()); } catch {}
  const uuid = upBody.uuid || '';
  results.A_uploadSize = upStatus === 200 && Number(upBody.size) === SRC.length;
  R(`  A upload: status=${upStatus} reported-size=${upBody.size} (source=${SRC.length}) uuid=${uuid.slice(0, 12)} → ${results.A_uploadSize ? 'GREEN' : 'RED'}`);

  // (B) BYTE ROUND-TRIP: fetch the stored bytes back + compare sha to source (catches truncation/corruption/empty-store)
  let served = Buffer.alloc(0), getStatus = 0;
  if (uuid) { const g = await page.request.get(`${f.base}/api/room/file/${encodeURIComponent(uuid)}/content?token=${encodeURIComponent(PLAYER)}`); getStatus = g.status(); try { served = Buffer.from(await g.body()); } catch {} }
  const servedSha = crypto.createHash('sha256').update(served).digest('hex');
  results.B_byteRoundTrip = getStatus === 200 && served.length === SRC.length && servedSha === srcSha;
  R(`  B round-trip: get=${getStatus} served-bytes=${served.length} servedSha=${servedSha.slice(0, 12)} → ${results.B_byteRoundTrip ? 'GREEN' : 'RED'}`);
  await ctx.close();
} catch (e) { if (!/no-room/.test(String(e && e.message))) results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); await f.teardown(); }

R(`\n═══ R40.86 UPLOAD CONTENT GATE (assert CONTENT not presence — EXISTS ⊂ CORRECT) arm=${COMMIT} ═══`);
if (results.instrument) { R(`INSTRUMENT: ${results.instrument}`); process.exit(2); }
R(`  A upload-size    (server-stored size == source, >0)  : ${results.A_uploadSize ? 'GREEN' : 'RED'}`);
R(`  B byte-round-trip(served bytes == source, sha match) : ${results.B_byteRoundTrip ? 'GREEN' : 'RED'}`);
const green = results.A_uploadSize && results.B_byteRoundTrip;
R(`OVERALL arm=${COMMIT}: ${green ? 'GREEN — server content path PROVEN (real body in, exact bytes back)' : 'RED'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
R(`  ⚠ SCOPE (R40.89): proves the SERVER content path on Linux-WebKit; does NOT reproduce Tron's iOS-device 'Upload failed'. The device-side cause stays a HYPOTHESIS — no prod log exists to confirm it. This gate is the DURABLE regression catcher for the content path.`);
process.exit(green ? 0 : 1);
