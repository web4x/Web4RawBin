// R40.92 5-SHAPE END-TO-END MEASUREMENT (PO re-rank: PASS = the USER ACTION SUCCEEDS end-to-end — drop -> unit STORED -> RENDERS,
// NOT a well-formed error, NOT a lint 1->0). REAL fixtures via the APP'S OWN drop path (RoomView #rrc-drop → DropDispatcher), NOT
// a hand-built POST. Prod v0.8.192 (SLICE-A: uploads are unit-JSON PUT, multipart deleted). SystemTester room; cleanup after.
// Per shape report works / fails-with-what. iOS shapes carry a FIDELITY FLAG (desktop-webkit repro, not real iOS — R40.89).
import { webkit } from '@playwright/test';
import https from 'node:https';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYSTEST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const shaOf = (b) => crypto.createHash('sha256').update(b).digest('hex');
const getJson = (p) => new Promise((res) => { const u = new URL(BASE + p); https.get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res(null); } }); }).on('error', () => res(null)); });
const getBuf = (p) => new Promise((res) => { const u = new URL(BASE + p); https.get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, rejectUnauthorized: false }, (r) => { const c = []; r.on('data', (x) => c.push(x)); r.on('end', () => res({ status: r.statusCode, buf: Buffer.concat(c) })); }).on('error', () => res({ status: 0, buf: Buffer.alloc(0) })); });

const cfg = await getJson('/api/config');
R(`prod ${BASE} v${cfg?.version}`);
const browser = await webkit.launch();
const results = [];
let roomId = null;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYSTEST);
  const page = await ctx.newPage();
  const logs = []; page.on('console', (m) => { if (/Uploaded|Failed|Saved|dnd-debug|error/i.test(m.text())) logs.push(m.text().slice(0, 120)); });
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(2000);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('R4092 5-shape measure', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('no room');
  await sleep(1500);

  // faithful drop: build a REAL DataTransfer + dispatch the app's own 'drop' on #rrc-drop; the APP builds the unit-JSON PUT.
  const dropFile = (bytesB64, name, type) => page.evaluate(({ bytesB64, name, type }) => {
    const bin = atob(bytesB64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const file = new File([arr], name, { type });
    const dz = document.getElementById('rrc-drop'); if (!dz) return 'no-dropzone';
    const dt = new DataTransfer(); dt.items.add(file);
    dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    return 'dropped';
  }, { bytesB64, name, type });
  const dropUrl = (url) => page.evaluate((url) => { const dz = document.getElementById('rrc-drop'); if (!dz) return 'no-dropzone'; const dt = new DataTransfer(); dt.setData('text/uri-list', url); dt.setData('text/plain', url); dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); return 'dropped'; }, url);
  const dropObjRef = (ref) => page.evaluate((ref) => { const dz = document.getElementById('rrc-drop'); if (!dz) return 'no-dropzone'; const dt = new DataTransfer(); dt.setData('application/rb-object-ref', ref); dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); return 'dropped'; }, ref);

  // STORED = a new file unit under the room Files with matching bytes; RENDERS = the room-tree shows it (name in textContent after re-seed)
  const filesBefore = async () => (((await getJson(`/api/trace/children/roomcoll:${roomId}:files`))?.children) || []).map((c) => c.uuid);
  const verify = async (name, srcSha, before) => {
    await sleep(3500);
    const kids = ((await getJson(`/api/trace/children/roomcoll:${roomId}:files`))?.children) || [];
    const fresh = kids.filter((c) => !before.includes(c.uuid));
    const match = fresh.find((c) => (c.name || '').includes(name.replace(/\.[^.]+$/, '')) || (c.name || '') === name) || fresh[0];
    let stored = false, bytes = 0;
    if (match) { const g = await getBuf(`/api/room/file/${encodeURIComponent(match.uuid)}/content?token=${SYSTEST}`); bytes = g.buf.length; stored = g.status === 200 && (srcSha ? shaOf(g.buf) === srcSha : g.buf.length > 0); }
    const renders = await page.evaluate((nm) => { const t = document.getElementById('room-tree'); return (t?.textContent || '').includes(nm.replace(/\.[^.]+$/, '')) || (t?.textContent || '').includes(nm); }, name).catch(() => false);
    return { stored, renders, bytes, uuid: match?.uuid?.slice(0, 8), freshCount: fresh.length };
  };
  const record = (id, flag, v, note) => { const pass = v.stored && v.renders; results.push({ id, pass, ...v, flag, note }); R(`  ${id}: STORED=${v.stored}(${v.bytes}b uuid=${v.uuid || '-'}) RENDERS=${v.renders} ⇒ ${pass ? 'WORKS' : 'FAILS'}${note ? ' — ' + note : ''}${flag ? ' [' + flag + ']' : ''}`); };

  // open Files so RENDERS is observable
  const openFiles = async () => { await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); } }, roomId); await sleep(600); };

  // ── SHAPE 1: Finder file (real File drop) ──
  { const b = crypto.randomBytes(2048); const before = await filesBefore(); await dropFile(b.toString('base64'), 'finder-doc.bin', 'application/octet-stream'); const v = await verify('finder-doc.bin', shaOf(b), before); await openFiles(); v.renders = v.renders || await page.evaluate(() => (document.getElementById('room-tree')?.textContent || '').includes('finder-doc')); record('1 Finder file      ', 'desktop File→app path', v); }
  // ── SHAPE 4: URL (real uri-list drop → WebItem). NAME = the URL tail (dispatchUrl: name = url.split('/').pop()). ──
  { const tail = `r4092-${crypto.randomBytes(4).toString('hex')}`; const url = `https://example.com/${tail}`; const before = await filesBefore(); await dropUrl(url); const v = await verify(tail, '', before); await openFiles(); v.renders = v.renders || await page.evaluate((nm) => (document.getElementById('room-tree')?.textContent || '').includes(nm), tail); record('4 URL               ', '', v, `url=${url.slice(0, 40)} name=${tail}`); }
  // ── SHAPE 2: iOS photo (real image File @390) ──
  { const b = crypto.randomBytes(4096); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); const before = await filesBefore(); await dropFile(b.toString('base64'), 'IMG_photo.png', 'image/png'); const v = await verify('IMG_photo.png', shaOf(b), before); await openFiles(); record('2 iOS photo         ', 'desktop-webkit repro, NOT real iOS (R40.89)', v); }
  // ── SHAPE 3: iOS Mail message (.eml message/rfc822 File) ──
  { const eml = Buffer.from('From: a@b.com\r\nSubject: R4092 test\r\n\r\nbody'); const before = await filesBefore(); await dropFile(eml.toString('base64'), 'mail.eml', 'message/rfc822'); const v = await verify('mail.eml', shaOf(eml), before); await openFiles(); record('3 iOS Mail message  ', 'iOS-Mail fidelity gap — needs real device/captured bytes', v); }
  // ── SHAPE 5: in-app object-ref → the room drop zone does NOT handle application/rb-object-ref (only files/uri/html/fedref) ──
  { const anyUnit = (await filesBefore())[0] || '00000000'; const before = await filesBefore(); await dropObjRef(`file:${anyUnit}`); const v = await verify('__none__', '', before); record('5 in-app object-ref ', 'object-ref path', v, v.stored ? '' : 'room #rrc-drop drop handler ignores application/rb-object-ref (only files/uri-list/html/federated-ref) → silent no-op on the room; the object-ref→FOLDER-node path is separate (rb-object-item), measure there'); }

  R(`  console: ${JSON.stringify(logs.slice(-8))}`);
  // cleanup
  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1500);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ R40.92 5-SHAPE END-TO-END (prod, real drops, PASS = STORED AND RENDERS) ═══`);
for (const r of results) R(`  ${r.id}: ${r.pass ? 'WORKS' : 'FAILS'}  (stored=${r.stored} renders=${r.renders})${r.flag ? ' [' + r.flag + ']' : ''}${r.note ? ' — ' + r.note : ''}`);
R(`  ⚠ room ${roomId?.slice(0, 8)} deleteRoom sent; disk-cleanup any residual units via r4090-cleanup-exec pattern.`);
