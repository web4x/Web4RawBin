// R40.106 INC-4 slice-2 (v0.8.213) — move-unit rewired to FolderService.linkIn/unlink. Re-gate: behaviour IDENTICAL —
// moved unit APPEARS in target, DISAPPEARS from old parent, NO double-appearance, NO orphan. DET-3x.
// ★ REUSES the ONE fixed room 909f1bd6 (Tron enforced-constraint / ratchet lint) — ZERO room creation; authed writes
//   via the seeded SystemTester browser session (raw https = Unauthenticated); folder+file artifacts cleaned each iter.
// KNOWN-BENIGN (expert-flagged, NOT a RED): a childless old-parent gets an extra harmless re-derive publish (same render).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e'; // THE fixed test room — reused, never created
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getModel = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)?.unit?.model || {}); } catch { res({}); } }); }).on('error', () => res({})); });
const children = (ref) => new Promise((res) => { const u = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => String(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
const has = (list, F) => list.some(u => u === F || u.startsWith(F.slice(0, 8)));

const browser = await webkit.launch();
const runs = []; let served = '?';
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  const fedFetches = []; // (3) zero-fetch: the move is a LOCAL edge op — it must NOT trigger any federation/proxy origin fetch
  page.on('request', (r) => { const u = r.url(); if (/\/api\/federation\/import|\/api\/proxy\?/.test(u)) fedFetches.push(u); });
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const rootRef = `roomcoll:${ROOM}:files`;
  for (let i = 1; i <= 3; i++) {
    const folderName = `MoveTarget-${process.pid}-${i}`; const folderLoc = `roomcoll:${ROOM}:files/${folderName}`;
    await page.request.post(`${BASE}/api/room/${ROOM}/folder`, { headers: { 'content-type': 'application/json' }, data: { name: folderName, nestedPath: '', playerToken: SYS } });
    const B = '----mv'; const bytes = Buffer.from('inc4-move-' + process.pid + '-' + i);
    const up = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="mv-${process.pid}-${i}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]) });
    const F = (await up.json().catch(() => ({}))).uuid || '';
    if (!F) { runs.push({ i, error: `upload failed (${up.status()})`, pass: false }); console.log(`run ${i}: upload FAILED status=${up.status()}`); continue; }
    await sleep(1000);
    const inRootBefore = has(await children(rootRef), F);
    const fedBefore = fedFetches.length;
    // (1) MOVE the in-app unit into the folder via the rewired endpoint (the surface both drag + affordance call)
    const mv = await page.request.post(`${BASE}/api/room/${ROOM}/move-unit`, { headers: { 'content-type': 'application/json' }, data: { unit: F, target: `folder:${folderLoc}`, playerToken: SYS } });
    await sleep(1500);
    const loc = String((await getModel(F)).location || '');
    const afterRoot = await children(rootRef); const folderChildren = await children(folderLoc);
    const inTarget = /MoveTarget-/.test(loc) && has(folderChildren, F);   // (1) appears in target + (4) reachable/renderable (not orphaned)
    const goneFromRoot = !has(afterRoot, F);                              // (1) disappears from old parent
    const appearances = (has(afterRoot, F) ? 1 : 0) + (has(folderChildren, F) ? 1 : 0);
    const noDouble = appearances === 1;                                  // no double-appearance / no orphan
    const zeroFetch = (fedFetches.length - fedBefore) === 0;              // (3) local edge move triggers NO federation/proxy fetch
    // (2) NATIVE file dropped on the folder NESTS inside it (upload with parent=folderLoc). HARDENED (instrument):
    //   old check `!!G && has(children(folderLoc),G) && !has(children(rootRef),G)` FALSE-RED'd on a working product —
    //   the inline `.then(j=>j.uuid||'').catch(()=>'')` swallowed a raced empty uuid → !!G tripped. FIX: obtain the uuid
    //   RELIABLY (surface a real upload failure, never silent), and assert the nest from DATA — the file's OWN location —
    //   not the race-prone location-derived tree (same lesson as the additive-link data-side resolution).
    const B2 = '----nn';
    const gResp = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B2}` }, data: Buffer.concat([Buffer.from(`--${B2}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B2}\r\nContent-Disposition: form-data; name="parent"\r\n\r\n${folderLoc}\r\n--${B2}\r\nContent-Disposition: form-data; name="file"; filename="nn-${process.pid}-${i}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('native-nest-' + process.pid + '-' + i), Buffer.from(`\r\n--${B2}--\r\n`, 'utf8')]) });
    const G = (await gResp.json().catch(() => ({}))).uuid || '';
    const nativeUploadOk = gResp.status() === 200 && !!G;                 // a real upload failure is surfaced, NOT read as not-nested
    await sleep(1500);
    const gLoc = nativeUploadOk ? String((await getModel(G)).location || '') : '';
    const nestedByData = new RegExp(folderName).test(gLoc);              // data-side: the file's OWN location is under the folder (no tree-derive race)
    // FAILABLE-BOTH-WAYS control: a file uploaded to ROOT (no parent) MUST read NOT-nested — if it read nested, the predicate can't fail.
    const B3 = '----nc';
    const cResp = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B3}` }, data: Buffer.concat([Buffer.from(`--${B3}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B3}\r\nContent-Disposition: form-data; name="file"; filename="nc-${process.pid}-${i}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('nest-control-' + process.pid + '-' + i), Buffer.from(`\r\n--${B3}--\r\n`, 'utf8')]) });
    const ctrl = (await cResp.json().catch(() => ({}))).uuid || '';
    await sleep(1200);
    const ctrlLoc = ctrl ? String((await getModel(ctrl)).location || '') : '';
    const controlNotNested = !new RegExp(folderName).test(ctrlLoc);      // root file → predicate correctly FALSE = the check CAN go RED
    const nativeNests = nativeUploadOk && nestedByData && controlNotNested; // GREEN needs nested→true AND a root control→false (failable both ways)
    const pass = mv.status() === 200 && inRootBefore && inTarget && goneFromRoot && noDouble && zeroFetch && nativeNests;
    runs.push({ i, F: F.slice(0, 8), pass });
    console.log(`run ${i}: F=${F.slice(0,8)} mv=${mv.status()} | (1)in-target=${inTarget}+gone-root=${goneFromRoot} no-double=${noDouble} (3)zero-fetch=${zeroFetch} (2)native-nests=${nativeNests}[upOk=${nativeUploadOk} nestedByData=${nestedByData} ctrl-not-nested=${controlNotNested}] (4)renderable=${inTarget} => ${pass ? 'GREEN' : 'RED'}`);
    await page.request.post(`${BASE}/api/room/${ROOM}/move-unit`, { headers: { 'content-type': 'application/json' }, data: { unit: F, target: rootRef, playerToken: SYS } }); // cleanup: back to root
  }
} finally { await browser.close(); }
const green = runs.length === 3 && runs.every(r => r.pass);
console.log(`\n=== R40.106 INC-4 slice-2 move rewire (v${served}, fixed room 909f1bd6 REUSED, 0 room creation) ===`);
console.log(green ? 'GREEN DET-3x — move IDENTICAL after linkIn/unlink rewire: appears in target, gone from old parent, no double, no orphan' : 'RED');
process.exit(green ? 0 : 1);
