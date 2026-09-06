// T37.20.4 folder-target CONFLICT settle (PO, by MEASUREMENT not reading): rb-object-item.ts:82 folder-drop handler reads ONLY
// dataTransfer.files. Question: (A) does an IN-APP UNIT dropped on a folder RE-PARENT (contract-routed)? (B) does a NATIVE FILE
// dropped on a folder still UPLOAD into it? Measure both on live prod. Expectation from source: A = silent no-op (in-app drag
// sets getData rb-object-ref, NOT files → files.length 0 → nothing), B = uploads. If so: BOTH paths must exist post-fix (add the
// unit-ref path, keep the files path) — so the expert's held fix is targeted, not a rewrite. SystemTester, ONE room, cleaned up.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const children = (ref) => new Promise((res) => { const u = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d).children || []); } catch { res([]); } }); }).on('error', () => res([])); });

const browser = await webkit.launch();
let servedVersion = '?', roomId = null;
const res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 950 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3720 folder-drop', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) throw new Error('no room');
  R(`  room=${roomId.slice(0, 12)} served=${servedVersion}`);

  // create a folder D (room endpoint) + upload a source File F (native multipart), both at Files root
  const mk = (path, body, ct) => page.request.post(`${BASE}${path}`, ct ? { headers: { 'content-type': ct }, data: body } : { data: body });
  await page.request.post(`${BASE}/api/room/${roomId}/folder`, { headers: { 'content-type': 'application/json' }, data: JSON.stringify({ name: 'DropTargetFolder', nestedPath: '', playerToken: SYS }) });
  const B = '----fdB'; const nativeBody = (name, bytes) => Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from(bytes), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const upF = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: nativeBody('source-F.bin', 'FFFF') });
  const fUuid = (await upF.json().catch(() => ({}))).uuid || '';
  await sleep(1500);
  const filesRoot = `roomcoll:${roomId}:files`;
  const folderRef = `roomcoll:${roomId}:files/DropTargetFolder`;
  R(`  setup: folder=DropTargetFolder file F=${fUuid.slice(0, 8)} at Files-root`);

  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); } }, roomId);
  await sleep(1200);

  // ── (A) IN-APP unit onto folder: real onDragStart on F's node → drop on the FOLDER node. Re-parent = folder gains F as a child.
  const folderKidsBeforeA = (await children(folderRef)).length;
  const aFired = await page.evaluate(({ fUuid }) => {
    const items = [...document.querySelectorAll('rb-object-item')];
    const fNode = items.find((n) => [...n.attributes].some((a) => a.value.includes(fUuid)));
    const folderNode = items.find((n) => (n.getAttribute('type') || '').toLowerCase() === 'folder');
    if (!fNode || !folderNode) return { ok: false, why: `f=${!!fNode} folder=${!!folderNode}` };
    const dt = new DataTransfer();
    (fNode.querySelector('.oi-icon') || fNode).dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt })); // app fills dt (rb-object-ref, NOT files)
    const types = [...dt.types]; const fileCount = dt.files.length;
    folderNode.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    folderNode.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return { ok: true, dtTypes: types, fileCount };
  }, { fUuid });
  await sleep(3500);
  const folderKidsAfterA = (await children(folderRef)).length;
  res.inAppReparent = { fired: aFired, before: folderKidsBeforeA, after: folderKidsAfterA, reparented: folderKidsAfterA > folderKidsBeforeA };
  R(`  (A) IN-APP unit → folder: dtTypes=${JSON.stringify(aFired.dtTypes)} dt.files=${aFired.fileCount} | folder children ${folderKidsBeforeA}→${folderKidsAfterA} ⇒ re-parent=${res.inAppReparent.reparented ? 'YES' : 'NO (silent no-op)'}`);

  // ── (B) NATIVE file onto folder: dispatch a drop with dataTransfer.files=[nativeFile] on the FOLDER node → should upload into it.
  const bFired = await page.evaluate(() => {
    const folderNode = [...document.querySelectorAll('rb-object-item')].find((n) => (n.getAttribute('type') || '').toLowerCase() === 'folder');
    if (!folderNode) return { ok: false };
    const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array([0x4e, 0x41, 0x54])], 'native-drop.bin', { type: 'application/octet-stream' }));
    folderNode.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    folderNode.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return { ok: true, fileCount: dt.files.length };
  });
  await sleep(3500);
  const folderKidsAfterB = (await children(folderRef)).length;
  res.nativeUpload = { fired: bFired, after: folderKidsAfterB, uploaded: folderKidsAfterB > folderKidsAfterA };
  R(`  (B) NATIVE file → folder: dt.files=${bFired.fileCount} | folder children ${folderKidsAfterA}→${folderKidsAfterB} ⇒ upload-into-folder=${res.nativeUpload.uploaded ? 'YES' : 'NO'}`);

  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20.4 FOLDER-DROP MEASURE — prod SERVED v${servedVersion} ═══`);
R(`  (A) in-app UNIT → folder re-parents : ${res.inAppReparent?.reparented ? 'YES (contract-routed)' : 'NO — silent no-op (unit-ref path missing on folder target)'}`);
R(`  (B) native FILE → folder uploads    : ${res.nativeUpload?.uploaded ? 'YES (files path works)' : 'NO'}`);
R(`  ⇒ ${res.nativeUpload?.uploaded && !res.inAppReparent?.reparented ? 'CONFIRMED: two behaviours — native-file works, in-app-unit is a NO-OP on folders → the fix must ADD the unit-ref path, KEEP the files path (do not rewrite).' : res.inAppReparent?.reparented && res.nativeUpload?.uploaded ? 'BOTH work — no hole.' : 'see rows'}`);
process.exit(0);
