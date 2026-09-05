// LIVE BUG (PO, higher prio than R40.84): Tron cannot upload files on 0.8.175 — dropped a png on the DROP AREA (not a folder),
// mime recognized image/png @495903 bytes, then "Upload failed". Reproduce INDEPENDENTLY in my OWN scratch room (never his).
// REASONING (PO): folder-create + file-upload share createFileUnit; folder-create WORKS, upload FAILS → the only material
// difference is BYTES. So: a folder add succeeds (control), a byte-carrying file fails. VARY bytes to learn size/mime/all-content:
//   (control) add a FOLDER (no content)                     — expect 200
//   (a) tiny png   (~70 bytes,  image/png)                  — bytes, small
//   (b) large png  (~495903 bytes, image/png = Tron's size) — bytes, large (his exact case)
//   (c) non-image  (~200 bytes, text/plain .txt)            — bytes, different mime
// The client only sees "Upload failed"; the REAL error+stack is in the server log (server.ts:2635 addLog) — read it.
// Also run the SAME on 0.8.174 (ARM_COMMIT) to tell REGRESSION vs long-standing. Self-owned room, prod:4444 untouched.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PLAYER = '33333333-4444-4555-8666-777777777777';
const COMMIT = process.env.ARM_COMMIT || 'HEAD';
const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD === '1' });
const serverLog = `/tmp/r4031-server-${process.pid}.log`;
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT} | serverLog=${serverLog}`);

const results = [];
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { const c = window.__rawbinClient; if (c && c.send) c.send({ type: 'UPDATE_PROFILE', name: 'UploadReproMember', secretCode: '4024' }); });
  await sleep(2000);
  const roomId = await page.evaluate(async () => {
    const c = window.__rawbinClient; if (!c || !c.createRoom) return null;
    c.createRoom('R4024 upload-repro room', 'SystemTester');
    for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); }
    return null;
  });
  console.log(`  CREATE_ROOM → roomId=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('no-room-render');
  await sleep(1200);

  // CONTROL: folder-create (createFileUnit WITHOUT content bytes) — should 200
  const folder = await page.evaluate(async (roomId) => { try { const r = await fetch(`/api/room/${roomId}/folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: 'CtrlFolder', nestedPath: '', playerToken: localStorage.getItem('rawbin-player-id') }) }); return { status: r.status, body: (await r.text()).slice(0, 160) }; } catch (e) { return { status: 0, body: String(e && e.message) }; } }, roomId);
  console.log(`  CONTROL folder-create (no bytes): ${folder.status} ${folder.body}`);

  // uploads: FormData(file, playerToken) → POST /api/room/<id>/upload (the real drop path)
  const upload = (roomId, sizeOrText, mime, name) => page.evaluate(async ({ roomId, sizeOrText, mime, name }) => {
    let bytes; if (typeof sizeOrText === 'number') { bytes = new Uint8Array(sizeOrText); bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47; for (let i = 8; i < bytes.length; i++) bytes[i] = i & 255; } else { bytes = new TextEncoder().encode(sizeOrText); }
    const file = new File([bytes], name, { type: mime });
    const fd = new FormData(); fd.append('file', file); fd.append('playerToken', localStorage.getItem('rawbin-player-id') || '');
    try { const r = await fetch(`/api/room/${roomId}/upload`, { method: 'POST', body: fd }); return { status: r.status, body: (await r.text()).slice(0, 160), size: bytes.length }; } catch (e) { return { status: 0, body: String(e && e.message), size: bytes.length }; }
  }, { roomId, sizeOrText, mime, name });

  const cases = [
    { label: 'a tiny-png', arg: 70, mime: 'image/png', name: 'tiny.png' },
    { label: 'b large-png(Tron)', arg: 495903, mime: 'image/png', name: 'photo.png' },
    { label: 'c non-image-txt', arg: 'hello world '.repeat(16), mime: 'text/plain', name: 'note.txt' },
  ];
  for (const c of cases) {
    const before = fs.existsSync(serverLog) ? fs.readFileSync(serverLog, 'utf8').length : 0;
    const r = await upload(roomId, c.arg, c.mime, c.name);
    await sleep(800);
    // pull the REAL server error for THIS upload from the server log (client only says 'Upload failed')
    let serverErr = '';
    try { const logNow = fs.readFileSync(serverLog, 'utf8').slice(before); const m = logNow.match(/\[upload\] ERROR:[^\n]*(\n\s+at [^\n]*){0,3}/); serverErr = m ? m[0].replace(/\s+/g, ' ').slice(0, 240) : (logNow.match(/\[upload\][^\n]*/g) || []).join(' | ').slice(0, 240); } catch {}
    results.push({ ...c, status: r.status, body: r.body, size: r.size, serverErr });
    console.log(`  UPLOAD ${c.label} (${r.size}b ${c.mime}): HTTP ${r.status} client="${r.body}" | SERVER-LOG="${serverErr}"`);
  }
  // ── REAL DROP PATH (what Tron actually does): dispatch rb-room-files-dropped on #rrc-drop → dropDispatcher.dispatch →
  //    uploadWithProgress (XHR) with this.client.playerToken. The direct POST above uses localStorage token + fetch; THIS
  //    exercises the real client plumbing (client.playerToken, XHR, dispatch mime-gate). Capture network + failure message. ──
  const netUpload = [];
  page.on('response', (r) => { if (/\/api\/room\/[^/]+\/upload/.test(r.url())) netUpload.push(r.status()); });
  const consoleErrs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 120)); });
  const drop = await page.evaluate(async () => {
    const c = window.__rawbinClient;
    const tokenClient = c && c.playerToken; const tokenLS = localStorage.getItem('rawbin-player-id');
    const bytes = new Uint8Array(495903); bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47;
    const file = new File([bytes], 'photo.png', { type: 'image/png' });
    // capture the RoomView 'Upload failed' system message by watching the chat sheet text after the drop
    const dz = document.getElementById('rrc-drop') || document.querySelector('.rrc, .room-view') || document.body;
    dz.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files: [file] }, bubbles: true }));
    return { tokenClientSet: !!tokenClient, tokenMatch: tokenClient === tokenLS, tokenClient: (tokenClient || '').slice(0, 8), tokenLS: (tokenLS || '').slice(0, 8) };
  });
  await sleep(4000);
  const dropOutcome = await page.evaluate(() => { const t = (document.body.textContent || ''); return { uploadFailed: /Upload failed: photo\.png|Failed: photo\.png|Upload error/i.test(t), uploaded: /Uploaded photo\.png/i.test(t) }; });
  console.log(`  ★ REAL DROP (rb-room-files-dropped, 495903b png via client.playerToken/XHR): client.playerToken set=${drop.tokenClientSet} match-localStorage=${drop.tokenMatch} (client=${drop.tokenClient} ls=${drop.tokenLS}) | net /upload statuses=${JSON.stringify(netUpload)} | uploadFailed=${dropOutcome.uploadFailed} uploaded=${dropOutcome.uploaded} | consoleErrs=${JSON.stringify(consoleErrs.slice(0, 3))}`);
  results.push({ label: '★ real-drop (client path)', status: dropOutcome.uploadFailed ? 500 : (netUpload.includes(200) ? 200 : 0), size: 495903, mime: 'image/png', serverErr: `net=${JSON.stringify(netUpload)} tokenMatch=${drop.tokenMatch} failedMsg=${dropOutcome.uploadFailed}` });
  await ctx.close();
} catch (e) { console.log('error:', String(e && e.message).slice(0, 200)); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

console.log(`\n═══ UPLOAD REPRO (arm=${COMMIT}) ═══`);
for (const r of results) console.log(`  ${r.label}: ${r.status === 200 ? 'OK' : 'FAIL(' + r.status + ')'} ${r.size}b ${r.mime} — ${r.status === 200 ? 'uploaded' : 'server: ' + r.serverErr}`);
const anyFail = results.some((r) => r.status !== 200);
console.log(`VERDICT: ${anyFail ? 'REPRODUCED — byte-carrying upload FAILS' : 'all uploads OK (not reproduced)'}`);
process.exit(anyFail ? 1 : 0);
