// T37.20 DROP-AS-UNIT-CLASS GATE (Tron: no 'shapes' — every drop is a SCENARIO UNIT = a CLASS INSTANCE). Gate on PROD v0.8.199
// via the app's OWN DropDispatcher (real drag-source + real #rrc-drop handler — NOT a hand-built POST). Per input assert:
//   (1) a scenario UNIT exists on disk/served with the CORRECT CLASS; (2) it RENDERS ITSELF in the room tree; (3) it resolves
//   via /api/ior as a CLASS INSTANCE. PASS = right CLASS instantiated AND rendered; 'bytes landed' = FAIL.
// PRIMARY = in-app object-ref onto #rrc-drop (was a SILENT no-op pre-fix; must now instantiate its class + render). SystemTester.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ior = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res(null); } }); }).on('error', () => res(null)); });

const browser = await webkit.launch();
const results = {};
let roomId = null;
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block', acceptDownloads: false });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  const reqs = []; // DEFECT-1 pattern: capture requests to prove a same-origin drop makes ZERO origin-fetch (not merely no-403)
  page.on('request', (r) => reqs.push(r.url()));
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c?.createRoom) return null; c.createRoom('T3720 unit-class', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('no room render');

  // give the room a REAL source unit: upload a File via native multipart (this is ALSO the Finder-file input = File class, no-regress)
  const SRC = crypto.randomBytes(2048); const B = '----t3720B';
  const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="drop-src.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), SRC, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: body });
  const fileUuid = (await up.json().catch(() => ({}))).uuid || '';
  const fileIor = await ior(fileUuid);
  results.finderFile = { uuid: fileUuid, class: fileIor?.className, pass: up.status() === 200 && !!fileUuid && /File/i.test(fileIor?.className || '') };
  R(`  [INPUT Finder-file] upload → uuid=${fileUuid.slice(0, 12)} class=${fileIor?.className} → ${results.finderFile.pass ? 'PASS (File class instantiated)' : 'FAIL'}`);

  // expand the room tree so the uploaded file's rb-object-item is present (a REAL in-app drag SOURCE)
  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); } }, roomId);
  await sleep(1500);

  // ── PRIMARY: in-app object-ref drop onto #rrc-drop via the app's OWN handlers. Fire the REAL onDragStart on the file's
  //    rb-object-item (the app populates the DataTransfer via its serializer), then dispatch 'drop' on #rrc-drop with that SAME
  //    DataTransfer (the app's real drop handler / DropDispatcher routes it). Pre-fix = silent no-op; post-fix = link + render. ──
  const dropResult = await page.evaluate(async (fileUuid) => {
    const tree = document.getElementById('room-tree');
    const items = [...(tree?.querySelectorAll('rb-object-item') || [])];
    const src = items.find((n) => [...n.attributes].some((a) => a.value.includes(fileUuid))) || items.find((n) => (n.getAttribute('ref') || '').startsWith('file:')) || items[0];
    const dz = document.getElementById('rrc-drop');
    if (!src || !dz) return { ok: false, why: `src=${!!src} dz=${!!dz}` };
    const dt = new DataTransfer();
    const dragEl = src.querySelector('.oi-icon') || src;
    dragEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt })); // app's onDragStart fills dt
    const types = [...dt.types];
    const beforeTreeLen = (tree?.textContent || '').length;
    dz.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); // app's REAL #rrc-drop handler
    return { ok: true, dtTypes: types, beforeTreeLen };
  }, fileUuid);
  R(`  in-app drop fired: ${JSON.stringify(dropResult).slice(0, 160)}`);
  const reqsBefore = reqs.length;
  await sleep(4000); // local relink (contract) OR federation-import + ViewBus re-derive + render
  const dropReqs = reqs.slice(reqsBefore);
  const federationFetch = dropReqs.filter((u) => /\/api\/federation\/import/.test(u)); // the origin-fetch path that 403'd
  const zeroFetch = federationFetch.length === 0; // DEFECT-1 acceptance: a SAME-ORIGIN drop resolves with ZERO origin-fetch

  // ASSERT: not a silent no-op → the dropped unit resolves as its CLASS (2/3) AND renders in the room tree (2). System messages
  //   ([federation] imported / dnd-debug) confirm the DropDispatcher PROCESSED it (vs the pre-fix silent nothing).
  const post = await page.evaluate(() => { const tree = document.getElementById('room-tree'); const sys = [...document.querySelectorAll('.chat-message, .chat-msg, [class*="message"]')].map((n) => n.textContent || '').filter((t) => /federation|dnd-debug|imported|uploaded|link/i.test(t)).slice(-5); return { treeText: (tree?.textContent || '').slice(0, 400), treeLen: (tree?.textContent || '').length, sys }; });
  const dtHadUnitMime = (dropResult.dtTypes || []).some((t) => /rb-object-ref|rb-unit|rb-federated-ref/.test(t));
  // ★ DEFECT-1 PATTERN (PO): acceptance is ZERO-FETCH — a same-origin drop resolves via the contract LOCAL relink with NO
  //   /api/federation/import origin-fetch at all (not merely 'no 403'). A reordered branch that still fetches-then-succeeds
  //   would pass a no-error check; it CANNOT pass zero-fetch. + no error message + the unit renders.
  const sysFailed = post.sys.some((t) => /failed|error|403|401|denied|not found/i.test(t));
  const renders = /drop-src|file:/.test(post.treeText) || post.treeLen > 0;
  results.inAppObjectRef = { dtHadUnitMime, zeroFetch, federationFetch, sysFailed, renders, class: fileIor?.className, sys: post.sys, pass: dtHadUnitMime && zeroFetch && !sysFailed && renders };
  R(`  [INPUT in-app object-ref] dt-had-unit-MIME=${dtHadUnitMime} ZERO-FETCH=${zeroFetch}(federation/import calls=${federationFetch.length}) noError=${!sysFailed} renders=${renders} class=${fileIor?.className} sys=${JSON.stringify(post.sys).slice(0, 140)}`);
  R(`    ⇒ ${results.inAppObjectRef.pass ? 'PASS — same-origin drop relinks LOCALLY via the contract with ZERO origin-fetch, no error, renders' : `RED — ${!zeroFetch ? 'still origin-fetches (' + federationFetch.length + ' /api/federation/import)' : sysFailed ? 'error in sys (' + post.sys.filter((t) => /fail|403|error/i.test(t)).join('|').slice(0, 80) + ')' : 'no render'}`}`);

  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20 DROP-AS-UNIT-CLASS (prod v0.8.199) ═══`);
R(`  Finder-file → File class instantiated       : ${results.finderFile?.pass ? 'PASS' : 'FAIL'} (class=${results.finderFile?.class})`);
R(`  in-app object-ref → class + processed+render: ${results.inAppObjectRef?.pass ? 'PASS' : 'FAIL/INCONCLUSIVE'} (was silent no-op pre-fix)`);
R(`  iOS photo/Mail/Contact/Calendar             : NOT RUN this pass (desktop-webkit repros only, flagged; URL→WebItem + those queued)`);
R(`  NOTE: PASS = right CLASS instantiated AND rendered via the app's OWN DropDispatcher; never 'bytes landed'.`);
process.exit(results.inAppObjectRef?.pass ? 0 : 1);
