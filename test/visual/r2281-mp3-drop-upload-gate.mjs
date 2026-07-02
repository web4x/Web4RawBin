// R22.5/v0.6.81 gate — dropping an MP3 into a room UPLOADS it (dispatch allowlist now
// includes audio/, drop-dispatcher.ts:96) + the uploaded file previews as <audio controls>.
// Fix 713e1a23c. Pre-fix: audio/ fell through to routeUnknown (no-op) -> MP3 drop rejected.
//
// Faithful real-drop path: in a room, fire the dropzone's own `rb-room-files-dropped`
// CustomEvent with an audio/mpeg File -> RoomView -> dropDispatcher.dispatch -> (audio/
// allowed) -> POST /api/room/<id>/upload. Then assert: a File scenario unit was created
// (name match + roomUuid + mimeType audio/*), and rb-file-detail renders <audio controls>.
// DET-3x. Uploaded test files deleted from disk after (flagged).

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// find a File scenario unit by exact name (returns {uuid, mime, file})
function findFileUnit(name) {
  let hit = null;
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (hit) return; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); if (u.ior === 'ior:class:File' && u.model?.name === name) hit = { uuid: u.model.uuid, mime: u.model.mimeType, roomUuid: u.model.roomUuid, file: p }; } catch {} } } })(SCEN);
  return hit;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
const tracePage = await ctx.newPage(); // for rb-file-detail render checks
const created = [];

async function seedDevice() { await page.evaluate(() => { localStorage.setItem('rawbin-device-privateKey', 'e2e'); localStorage.setItem('rawbin-device-publicKey', 'e2e'); localStorage.setItem('rawbin-device-signature', 'e2e'); }); }

try {
  // --- bootstrap profile + reach lobby ---
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
    await seedDevice();
    await page.fill('#pe-name', `r2281-${RUN}`); await page.fill('#pe-code', '1234'); await page.click('#pe-save');
    await page.waitForTimeout(3000);
    if (await page.locator('#de-code').isVisible({ timeout: 1500 }).catch(() => false)) { await seedDevice(); await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); }
  }
  await page.waitForSelector('#member-name', { timeout: 20000 });

  // --- create a room (owner) ---
  await page.click('#create-room-btn'); await page.waitForTimeout(400);
  await page.fill('#room-name', `r2281room-${RUN}`); await page.click('#confirm-create-btn');
  await page.waitForSelector('#rrc-drop', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const roomId = await page.evaluate(() => document.getElementById('room-tree')?.dataset.seedIor || '');
  await tracePage.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await tracePage.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 });
  console.log(`room created roomId=${roomId.slice(0, 8)}`);

  const chatHas = (s) => page.evaluate((str) => [...document.querySelectorAll('#cp-messages *')].some(e => (e.textContent || '').includes(str)), s);

  // PHASE 1 — 3 clean sequential drops (no inter-drop work that disrupts the room page)
  const iters = [];
  for (let i = 1; i <= 3; i++) {
    const fname = `r2281-${RUN}-${i}.mp3`;
    await page.waitForSelector('#rrc-drop', { state: 'attached', timeout: 15000 });
    await page.evaluate((nm) => {
      const dz = document.getElementById('rrc-drop');
      // UNIQUE content per drop — identical bytes dedup to one File unit (content-hash dedup).
      const bytes = new Uint8Array([0xff, 0xfb, 0x90, 0x00, ...Array.from(nm).map(c => c.charCodeAt(0) & 0xff)]);
      const f = new File([bytes], nm, { type: 'audio/mpeg' });
      dz.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files: [f] }, bubbles: true }));
    }, fname);
    let chatUploaded = false;
    for (let t = 0; t < 30; t++) { if (await chatHas(`File uploaded: ${fname}`)) { chatUploaded = true; break; } await sleep(400); }
    iters.push({ fname, chatUploaded });
  }

  // PHASE 2 — resolve each uploaded File unit + render check (rb-file-detail -> <audio controls>)
  const results = [];
  for (let i = 0; i < iters.length; i++) {
    const { fname, chatUploaded } = iters[i];
    let unit = null;
    for (let t = 0; t < 20; t++) { unit = findFileUnit(fname); if (unit) break; await sleep(400); }
    const uploadedOk = chatUploaded && !!unit && unit.roomUuid === roomId && /^audio\//.test(unit.mime || '');
    if (unit) created.push(unit);
    let audioOk = false;
    if (unit) {
      await tracePage.evaluate((u) => { document.querySelectorAll('.__a').forEach(e => e.remove()); const el = document.createElement('rb-file-detail'); el.className = '__a'; el.setAttribute('uuid', u); document.body.appendChild(el); }, unit.uuid);
      await tracePage.waitForSelector('.__a rb-preview-pane .pz-content audio', { timeout: 8000 }).catch(() => {});
      audioOk = await tracePage.evaluate(() => { const a = document.querySelector('.__a rb-preview-pane .pz-content audio'); return !!a && a.hasAttribute('controls'); });
    }
    const pass = uploadedOk && audioOk;
    results.push(pass);
    console.log(`iter ${i + 1}: drop ${fname} -> chatUploaded=${chatUploaded} unit=${unit ? unit.uuid.slice(0, 8) : 'NONE'}(mime=${unit?.mime || '-'}) <audio>controls=${audioOk} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT v0.6.81 MP3-drop-upload (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally {
  try { await browser.close(); } catch {}
  // cleanup uploaded test files from scenario/index (flag what can't be removed)
  let removed = 0; for (const u of created) { try { fs.unlinkSync(u.file); removed++; } catch {} }
  console.log(`cleanup: removed ${removed}/${created.length} uploaded test File units (r2281-${RUN}-*.mp3). NOTE: room r2281room-${RUN} + content blobs may persist — flag for purge.`);
}
