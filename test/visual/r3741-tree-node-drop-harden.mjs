// T37.41 (A10) — HARNESS-HARDEN the tree-NODE drop handler (PO: it IS mockable — you fired the app's real onDragStart for the
// ROOM #rrc-drop target and asserted zero-fetch; do the SAME for a tree NODE). Converts T37.20.4 from 'Tron's drag closes it'
// to MACHINE-VERIFIED so the caveat comes OFF the row. Feed the FOLDER tree-node drop handler a synthetic unit-ref DataTransfer
// and assert reparentUnitsIntoContainer FIRES (the DECISIVE signal = a POST to /api/room/<id>/move-unit) + the unit RE-PARENTS.
// STUB-MUST-FAIL: a files-only DataTransfer (the OLD handler's only input) fires NO move-unit → RED (proves the gate detects the
// silent no-op it exists to kill). My earlier synthetic gate could not fire it because it relied on onDragStart to fill the dt AND
// checked F.location (unreliable); here I set the rb-object-ref EXPLICITLY (serializeDragUnit's exact format) + capture the POST.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const post = (p, b) => new Promise((res) => { const u = new URL(`${BASE}${p}`); const data = Buffer.from(JSON.stringify(b)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(d)); }); req.on('error', () => res('')); req.write(data); req.end(); });
const iorLoc = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(String(JSON.parse(d)?.unit?.model?.location || '')); } catch { res(''); } }); }).on('error', () => res('')); });

// drive the FOLDER tree-node drop with a chosen DataTransfer content, capture whether a move-unit POST fired
async function dropOnFolder(page, roomId, { rbObjectRef, withFile }) {
  const before = page.__moveUnitPosts?.length || 0;
  const fired = await page.evaluate(({ rbObjectRef, withFile }) => {
    // select the SPECIFIC folder NodeTarget (not the Members/Files collections which are also type=folder)
    const folder = [...document.querySelectorAll('rb-object-item')].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes('NodeTarget')) || [...document.querySelectorAll('rb-object-item')].find((n) => (n.getAttribute('type') || '').toLowerCase() === 'folder');
    if (!folder) return { ok: false, why: 'no folder node' };
    const dt = new DataTransfer();
    if (rbObjectRef) { dt.setData('application/rb-object-ref', rbObjectRef); dt.setData('application/rb-unit', rbObjectRef); dt.setData('text/plain', rbObjectRef); }
    if (withFile) dt.items.add(new File([new Uint8Array([1, 2, 3])], 'n.bin', { type: 'application/octet-stream' }));
    folder.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    folder.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return { ok: true, types: [...dt.types] };
  }, { rbObjectRef, withFile });
  await sleep(3000);
  return { fired, moveUnitPosts: (page.__moveUnitPosts?.length || 0) - before };
}

const browser = await webkit.launch();
let servedVersion = '?', roomId = null; const res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  page.__moveUnitPosts = [];
  page.on('request', (r) => { if (r.method() === 'POST' && /\/api\/room\/[^/]+\/move-unit/.test(r.url())) { let body = {}; try { body = JSON.parse(r.postData() || '{}'); } catch {} page.__moveUnitPosts.push({ url: r.url(), target: body.target, unit: body.unit }); } }); // DECISIVE: reparentUnitsIntoContainer → this POST; capture the target it sent
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3741 node-drop', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) throw new Error('no room');
  await post(`/api/room/${roomId}/folder`, { name: 'NodeTarget', nestedPath: '', playerToken: SYS });
  const B = '----hB'; const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="dragme.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('drag-' + roomId), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
  const fUuid = (await up.json().catch(() => ({}))).uuid || '';
  await sleep(1200);
  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); } }, roomId);
  await sleep(1000);
  R(`  room=${roomId.slice(0, 12)} served=${servedVersion} folder=NodeTarget file=${fUuid.slice(0, 8)}`);

  // ── MAIN: synthetic unit-ref drop on the folder NODE → reparentUnitsIntoContainer must FIRE (move-unit POST) + F re-parents ──
  const ref = JSON.stringify([`file:${fUuid}`]); // serializeDragUnit's exact wire format: JSON.stringify(refs[])
  const main = await dropOnFolder(page, roomId, { rbObjectRef: ref, withFile: false });
  const fLoc = await iorLoc(fUuid);
  const lastPost = page.__moveUnitPosts[page.__moveUnitPosts.length - 1] || {};
  res.unitFires = { types: main.fired.types, moveUnitPosts: main.moveUnitPosts, target: lastPost.target, fLoc, fired: main.moveUnitPosts > 0, reparented: main.moveUnitPosts > 0 && /NodeTarget/.test(fLoc) };
  R(`  UNIT-REF drop → move-unit POST fired=${main.moveUnitPosts} target='${lastPost.target}' | F.location='${fLoc}' ⇒ reparentUnitsIntoContainer FIRED=${res.unitFires.fired} re-parented-into-folder=${res.unitFires.reparented ? 'YES' : 'NO'}`);

  // ── STUB-MUST-FAIL: a files-ONLY DataTransfer (the OLD handler's only input) must fire NO move-unit (goes the native path) ──
  const stub = await dropOnFolder(page, roomId, { rbObjectRef: null, withFile: true });
  res.filesOnlyNoMoveUnit = stub.moveUnitPosts === 0;
  R(`  STUB files-only drop → move-unit POST fired=${stub.moveUnitPosts} ⇒ correctly NO re-parent path (native only) = ${res.filesOnlyNoMoveUnit ? 'YES (teeth: the gate distinguishes unit-ref from files-only)' : 'NO'}`);

  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.41 tree-node-drop HARNESS — prod SERVED v${servedVersion} ═══`);
R(`  in-app unit-ref on a tree NODE → reparentUnitsIntoContainer fires + re-parents : ${res.unitFires?.reparented ? 'GREEN' : 'RED/INCONCLUSIVE'}`);
R(`  STUB-MUST-FAIL (files-only fires no move-unit) — the gate can tell them apart : ${res.filesOnlyNoMoveUnit ? 'GREEN' : 'RED'}`);
const green = res.unitFires?.reparented && res.filesOnlyNoMoveUnit;
R(`  ⇒ ${green ? 'MACHINE-VERIFIED: the tree-node drop fires the re-parent end-to-end (no Tron drag needed) → T37.20.4 caveat COMES OFF' : 'see rows'}`);
process.exit(green ? 0 : 1);
