// R40.107 LIVE SERVER-RUNTIME probe (PO: present-in-source ≠ live-in-memory). Proves the RUNNING prod
// process's room-persist write path preserves member identity — on a SAFE SystemTester SCRATCH room only,
// never a real room, never writing real data. Reads the disk-backed Room unit via /api/ior (read-only).
//
// Method: create a scratch room (creator SystemTester, good name) → baseline name+createdAt from the persisted
// unit → drive REAL persists (folder add, file upload) AND attempt a name-blank (UPDATE_PROFILE '') → re-read
// the persisted unit → the running server must NOT have blanked the stored name nor moved createdAt.
// Honest scope: the guard's #5 THROW is swallowed by Room.persist's try/catch (manifests as "corrupt write
// skipped, disk keeps good value"); the exact profile-less-member corruption fires on RESTART reconstruction,
// not reproducible safely on live prod — so this proves the running write path PRESERVES (guard #1/#2 live),
// complementing the module-level 3-way refusal proof (expert gate + independent probe + stub-must-fail).

import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (path, body) => new Promise((res) => { const u = new URL(`${BASE}${path}`); const data = Buffer.from(JSON.stringify(body)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', (e) => res({ status: 0, body: { error: String(e.message) } })); req.write(data); req.end(); });
const roomUnit = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)?.unit?.model || {}); } catch { res({}); } }); }).on('error', () => res({})); });
const nameOf = (model, token) => { const m = (model.members || []).find((x) => String(x.ior || '').includes(token) || x.role === 'owner'); return m ? String(m.name ?? '') : '(absent)'; };

const browser = await webkit.launch();
const out = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  out.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('SEATBELT-PROBE scratch', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; }, );
  if (!roomId) throw new Error('no scratch room');
  out.roomId = roomId.slice(0, 12);

  // first real persist (folder-add) populates the persisted unit's members; THEN read a valid baseline
  await post(`/api/room/${roomId}/folder`, { name: 'probe-baseline', nestedPath: '', playerToken: SYS });
  let m = {};
  for (let i = 0; i < 40; i++) { m = await roomUnit(roomId); if (nameOf(m, SYS) !== '(absent)' && m.createdAt != null) break; await sleep(400); }
  out.nameBefore = nameOf(m, SYS);
  out.createdBefore = m.createdAt;

  // attempt a blank + drive MORE real persists: UPDATE_PROFILE '' then a folder-add (persist trigger)
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: '' })); // attempt to empty the in-memory name
  await sleep(800);
  await post(`/api/room/${roomId}/folder`, { name: 'probe-persist-1', nestedPath: '', playerToken: SYS }); // → Room.persist()
  await sleep(1000);
  // a second persist via file upload
  const B = '----seatbelt'; const bytes = Buffer.from('seatbelt-' + roomId.slice(0, 6));
  const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="seatbelt.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
  await sleep(1500);

  // re-read the persisted unit AFTER the blank-attempt + real persists
  m = await roomUnit(roomId);
  out.nameAfter = nameOf(m, SYS);
  out.createdAfter = m.createdAt;

  out.namePreserved = out.nameBefore && out.nameBefore.trim() && out.nameAfter === out.nameBefore;
  out.createdImmutable = out.createdBefore != null && out.createdAfter === out.createdBefore;
  out.pass = out.namePreserved && out.createdImmutable;
} catch (e) { out.error = String(e.message || e); out.pass = false; }
finally { await browser.close(); }

console.log('=== R40.107 LIVE server-runtime probe (scratch room, SystemTester) ===');
console.log(`  served=${out.served} room=${out.roomId}`);
console.log(`  creator name: '${out.nameBefore}' → '${out.nameAfter}'  (after UPDATE_PROFILE '' + folder-add + upload persists)`);
console.log(`  createdAt: ${out.createdBefore} → ${out.createdAfter}`);
console.log(`  namePreserved=${out.namePreserved} createdImmutable=${out.createdImmutable}`);
console.log(out.error ? `  ERROR: ${out.error}` : '');
console.log(out.pass ? 'LIVE: GREEN — the running process persisted through a blank-attempt WITHOUT blanking the name or moving createdAt (guard #1/#2 live-in-memory)' : 'LIVE: RED — investigate');
process.exit(out.pass ? 0 : 1);
