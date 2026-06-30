// [test:uuid:b0a7a27d-8205-4399-a574-c39472a409fa] R25.2 WebItem.createAndLaunch — bare/scheme URL + .url/.webloc drop -> WebItem + launcher card (DET-3x GREEN)
// v0.6.88 R25.2 WebItem gate. URLs dropped into a room now become ior:class:WebItem (not
// bare text/uri-list File): server /upload drop-router (server.ts:739) routes url-types
// (uri-list / .url / .webloc / .desktop) -> createWebItemUnit; real bytes -> createFileUnit.
// WebItem derives scheme/badge/favicon/name; content endpoint serves WebItem.url so the
// v0.6.87 preview (scheme launcher card / iframe / YouTube embed) reuses. Fix 8ac5645d3.
// SystemTester (ce981242 — NO new user). DET-3x. One room, cleaned up.
//
// GATED (shipped): (1) URL drop -> WebItem not File. (2) badge auto-derives (mailto📧/maps📍/http🔗).
//   (3) preview launcher card w/ Open in app. (4) .url import -> WebItem. (5) .webloc import -> WebItem.
//   (b) real image -> still File.
// DEFERRED (flagged, NOT gated): favicon/badge ICON RENDERING in browser, folder tree,
//   Google-bookmarks import, WebItem skill class, legacy File->WebItem migration.
//
// VERDICT: v0.6.88 (8ac5645d3) = RED — bare/scheme URL drop -> ior:class:File (dispatchUrl
//   '<url>.url' naming shadowed extractUrl's bare-URL fallback). v0.6.89 (603be9b57) = GREEN
//   DET-3x — extractUrl now falls back to bare-line extraction; bare URL -> WebItem. FULL RED->GREEN.

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shardPath = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');

let roomId = '';
const created = [];
function findUnit(ior, needle) {
  let hit = null;
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (hit) return; const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); const m = u.model || {}; if (u.ior === ior && m.roomUuid === roomId && (String(m.url || '') + ' ' + String(m.name || '')).includes(needle)) hit = { uuid: m.uuid, scheme: m.scheme, badge: m.badge, url: m.url, name: m.name, file: p }; } catch {} } } })(SCEN);
  return hit;
}
const pollUnit = async (ior, needle) => { let u = null; for (let t = 0; t < 16; t++) { u = findUnit(ior, needle); if (u) break; await sleep(400); } return u; };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); localStorage.setItem('rawbin-device-privateKey', 'e2e'); localStorage.setItem('rawbin-device-publicKey', 'e2e'); localStorage.setItem('rawbin-device-signature', 'e2e'); });
const page = await ctx.newPage();
const tracePage = await ctx.newPage();

const dropUrl = async (val) => { await page.waitForSelector('#rrc-drop', { state: 'attached', timeout: 12000 }).catch(() => {}); await page.evaluate((v) => { const dz = document.getElementById('rrc-drop'); if (!dz) return; const dt = new DataTransfer(); dt.setData('text/uri-list', v); dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }, val); };
const dropFile = async (name, text, mime) => { await page.waitForSelector('#rrc-drop', { state: 'attached', timeout: 12000 }).catch(() => {}); await page.evaluate(({ n, t, m }) => { const dz = document.getElementById('rrc-drop'); if (!dz) return; const f = new File([t], n, { type: m }); dz.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files: [f] }, bubbles: true })); }, { n: name, t: text, m: mime }); };
async function previewCard(uuid) {
  await tracePage.evaluate((u) => { document.querySelectorAll('.__w').forEach(e => e.remove()); const el = document.createElement('rb-file-detail'); el.className = '__w'; el.setAttribute('uuid', u); document.body.appendChild(el); }, uuid);
  await tracePage.waitForSelector('.__w rb-preview-pane .pz-content', { timeout: 10000 }).catch(() => {});
  await tracePage.waitForTimeout(1500);
  return tracePage.evaluate(() => { const c = document.querySelector('.__w rb-preview-pane .pz-content'); if (!c) return {}; return { mailto: !!c.querySelector('a[href^="mailto:"]'), openInApp: /Open in app/i.test(c.textContent || ''), email: /Email/i.test(c.textContent || '') }; });
}

try {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) { await page.fill('#pe-name', 'SystemTester'); await page.fill('#pe-code', '4242'); await page.click('#pe-save'); await page.waitForTimeout(2500); }
  await page.waitForSelector('#member-name', { timeout: 20000 });
  await page.click('#create-room-btn'); await page.waitForTimeout(400); await page.fill('#room-name', `WebItemGate-${RUN}`); await page.click('#confirm-create-btn');
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(1500);
  roomId = await page.evaluate(() => document.getElementById('room-tree')?.dataset.seedIor || '');
  await tracePage.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await tracePage.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 });
  console.log('room', roomId.slice(0, 8));

  const results = [];
  for (let i = 1; i <= 3; i++) {
    const tag = `${RUN}${i}`;
    // (1)+(2)+(3) mailto: URL -> WebItem(scheme=mailto,badge=📧) + launcher card
    await dropUrl(`mailto:tron+${tag}@web4.de`); await sleep(2200);
    const wm = await pollUnit('ior:class:WebItem', `tron+${tag}`);
    if (wm) created.push(wm.uuid);
    const pm = wm ? await previewCard(wm.uuid) : {};
    const mailtoOk = !!wm && wm.scheme === 'mailto' && wm.badge === '📧' && pm.mailto && pm.openInApp;

    // (2) http URL -> WebItem(badge=🔗)
    await dropUrl(`https://gate-${tag}.example.com/page`); await sleep(2200);
    const wh = await pollUnit('ior:class:WebItem', `gate-${tag}.example.com`);
    if (wh) created.push(wh.uuid);
    const httpOk = !!wh && wh.scheme === 'https' && wh.badge === '🔗';

    // (4) .url file (Windows INI) -> WebItem (extractUrl)
    await dropFile(`shortcut-${tag}.url`, `[InternetShortcut]\r\nURL=https://win-${tag}.example.org/x\r\n`, 'application/x-url'); await sleep(2200);
    const wu = await pollUnit('ior:class:WebItem', `win-${tag}.example.org`);
    if (wu) created.push(wu.uuid);
    const urlFileOk = !!wu && wu.url.includes(`win-${tag}.example.org`) && wu.badge === '🔗';

    // (5) .webloc file (macOS plist) -> WebItem (extractUrl)
    await dropFile(`bookmark-${tag}.webloc`, `<?xml version="1.0"?><plist version="1.0"><dict><key>URL</key><string>https://mac-${tag}.example.net/y</string></dict></plist>`, 'application/octet-stream'); await sleep(2200);
    const ww = await pollUnit('ior:class:WebItem', `mac-${tag}.example.net`);
    if (ww) created.push(ww.uuid);
    const weblocOk = !!ww && ww.url.includes(`mac-${tag}.example.net`);

    // (b) real image (PNG bytes) -> File, NOT WebItem
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, i, RUN.charCodeAt(0), 0x00]);
    await page.evaluate(({ n, bytes }) => { const dz = document.getElementById('rrc-drop'); const f = new File([new Uint8Array(bytes)], n, { type: 'image/png' }); dz.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files: [f] }, bubbles: true })); }, { n: `img-${tag}.png`, bytes: Array.from(png) }); await sleep(2200);
    const imgFile = await pollUnit('ior:class:File', `img-${tag}.png`);
    const imgNotWebItem = !findUnit('ior:class:WebItem', `img-${tag}.png`);
    if (imgFile) created.push(imgFile.uuid);
    const imageOk = !!imgFile && imgNotWebItem;

    const pass = mailtoOk && httpOk && urlFileOk && weblocOk && imageOk;
    results.push(pass);
    console.log(`iter ${i}: mailto→WebItem📧+card=${mailtoOk} http→WebItem🔗=${httpOk} .url→WebItem=${urlFileOk} .webloc→WebItem=${weblocOk} image→File=${imageOk} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT R25.2 WebItem (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  console.log('DEFERRED (not gated): favicon/badge icon RENDERING, folder tree, Google-bookmarks import, WebItem skill class, File→WebItem migration.');
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally {
  try { await browser.close(); } catch {}
  let removed = 0; for (const u of [...created, roomId].filter(Boolean)) { try { fs.unlinkSync(shardPath(u)); removed++; } catch {} }
  console.log(`cleanup: removed ${removed} WebItem/File units + room (WebItemGate-${RUN}); content blobs flagged.`);
}
