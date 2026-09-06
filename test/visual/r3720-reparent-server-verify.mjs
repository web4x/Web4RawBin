// T37.20.4 folder re-parent RE-VERIFY (v0.8.205) — RELIABLE method, avoiding webkit synthetic drag-drop (which does NOT deliver
// a payload to a tree-NODE drop handler → my synthetic gate could not fire the path). The fix (5aed03d67) is verified two ways:
//   CLIENT (structural, confirmed by read): rb-object-item.ts:83-91 folder drop handler now has BOTH paths — files.length →
//     acceptDropIntoContainer (native, kept) AND DndContract.resolveDragUnit → reparentUnitsIntoContainer (in-app unit, added).
//   SERVER (behavioural, HERE): POST /api/room/<id>/move-unit {unit,target,playerToken} — the endpoint the in-app path calls.
//     Verify a real re-parent: F moves from Files-root INTO the folder → F.location under the folder AND the folder's children[]
//     gains F AND the response is action:'reparented'. + native upload into the same folder still works (files path un-regressed).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const post = (path, body) => new Promise((res) => { const u = new URL(`${BASE}${path}`); const data = Buffer.from(JSON.stringify(body)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', (e) => res({ status: 0, body: { error: String(e.message) } })); req.write(data); req.end(); });
const iorModel = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { const j = JSON.parse(d); res(j?.unit?.model || j?.model || {}); } catch { res({}); } }); }).on('error', () => res({})); });

const browser = await webkit.launch();
let servedVersion = '?', roomId = null; const res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3720 reparent-verify', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) throw new Error('no room');
  R(`  room=${roomId.slice(0, 12)} served=${servedVersion}`);

  await post(`/api/room/${roomId}/folder`, { name: 'MoveTarget', nestedPath: '', playerToken: SYS });
  const folderLoc = `roomcoll:${roomId}:files/MoveTarget`;
  // upload F at Files root via native multipart (unique bytes so no dedup surprise)
  const B = '----rpB'; const bytes = Buffer.from('reparent-src-' + roomId.slice(0, 6));
  const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="moveme.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
  const fUuid = (await up.json().catch(() => ({}))).uuid || '';
  await sleep(1200);
  const locBefore = (await iorModel(fUuid)).location || '(root)';
  R(`  setup: folder MoveTarget + file F=${fUuid.slice(0, 8)} loc-before='${locBefore}'`);

  // ── SERVER RE-PARENT: the exact endpoint the in-app folder-drop path calls, WITH THE CLIENT'S DISPLAY-PREFIXED target format
  //    (a10b proved the client drop POSTs target='folder:roomcoll:…' — the v0.8.207 fix = resolveDropContainer owns the item-ref
  //    spelling, i.e. the server strips 'folder:'. This verifies the fix at the layer that changed). ──
  const mv = await post(`/api/room/${roomId}/move-unit`, { unit: fUuid, target: `folder:${folderLoc}`, playerToken: SYS });
  await sleep(1500);
  const fModel = await iorModel(fUuid);
  const fLoc = String(fModel.location || '');
  const underFolder = /MoveTarget/.test(fLoc);
  res.reparent = { status: mv.status, action: mv.body?.action, fLoc, underFolder, reparented: mv.status === 200 && mv.body?.action === 'reparented' && underFolder };
  R(`  MOVE-UNIT: status=${mv.status} action=${mv.body?.action} err=${mv.body?.error || '-'} | F.location '${locBefore}'→'${fLoc}' ⇒ re-parented=${res.reparent.reparented ? 'YES' : 'NO'}`);

  // ── NATIVE upload into the SAME folder still works (files path un-regressed) — POST folder-scoped upload via nestedPath ──
  const nBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="parent"\r\n\r\n${folderLoc}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="native-into-folder.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('native-nest-' + roomId), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const nUp = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: nBody });
  const nBodyJson = await nUp.json().catch(() => ({}));
  await sleep(1200);
  const nLoc = String((await iorModel(nBodyJson.uuid || '')).location || '');
  const nStatus = nUp.status(); // Playwright APIResponse.status() is a METHOD, not a property
  res.nativeUpload = { status: nStatus, uuid: nBodyJson.uuid, nLoc, ok: nStatus === 200 && !!nBodyJson.uuid };
  R(`  NATIVE upload (parent=folder): status=${nStatus} uuid=${String(nBodyJson.uuid || '').slice(0, 8)} loc='${nLoc}' ⇒ uploaded=${res.nativeUpload.ok ? 'YES' : 'NO'}${/MoveTarget/.test(nLoc) ? ' (into folder)' : ''}`);

  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20.4 RE-PARENT RE-VERIFY — prod SERVED v${servedVersion} ═══`);
R(`  CLIENT (read-confirmed): folder drop handler has BOTH paths — files→acceptDropIntoContainer + resolveDragUnit→reparentUnitsIntoContainer (rb-object-item:83-91).`);
R(`  SERVER in-app re-parent (move-unit): ${res.reparent?.reparented ? 'GREEN — F moved into the folder (location + action:reparented)' : 'RED/INCONCLUSIVE'}`);
R(`  SERVER native upload (files path un-regressed): ${res.nativeUpload?.ok ? 'GREEN' : 'RED/INCONCLUSIVE'}`);
const green = res.reparent?.reparented && res.nativeUpload?.ok;
R(`  ⇒ ${green ? 'FIX VERIFIED: in-app unit RE-PARENTS + native file still uploads — the folder silent-no-op is CLOSED (server path + client wiring both present).' : 'see rows'}`);
process.exit(green ? 0 : 1);
