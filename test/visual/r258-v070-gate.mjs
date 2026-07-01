// [test:uuid:c4b17a15-0e68-40e3-b2aa-23c048155c1c] R25.7 evictAbsorbedFromRooms — orphan-ghost skip, Heartspaces 1 Marcel
// [test:uuid:cca392d6-7cb4-4751-ae3f-9be13a99542f] R25.7 dedupMembersOnLoad — Heartspaces 1 Marcel
// v0.7.0 gate — R25.7 room identity dedup + 3 drop/scenario fixes. SystemTester ONLY, reuse dnd
// room, NO pollution (item 3 drops about:blank which the guard BLOCKS -> nothing created).
//   (1) R25.7: Heartspaces shows exactly 1 Marcel Donges (resolveToken dedup), not 3.
//   (2) v0.7.0: ✏️ Edit pencil next to 📄 Scenario on detail views.
//   (3) v0.7.0: dropping about:blank mints NO WebItem (drop-dispatcher guard /^about:/).
//   (4) v0.7.0: a bare message: URL WebItem name = 'Email message'/subject, never the raw message: URL.
// Legacy pre-fix violations on disk are REPORTED (fix prevents NEW ones; old data is a separate purge).
// DET-3x.

import { chromium } from '@playwright/test';
import WebSocket from 'ws';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const SCEN = `${REPO}/scenario/index`;
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const HEART = '6c04f959-f3d6-42eb-818f-5e2e4498bf91';
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const WEBITEM = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';
const fullFile = execSync(`find ${SCEN}/b/5/7/d/2 -name 'b57d2f42*.scenario.json'`, { encoding: 'utf8' }).trim().split('/').pop().replace('.scenario.json', '');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// (1) Heartspaces member count — resolved Marcels
function heartMarcels() {
  return new Promise((res) => {
    const ws = new WebSocket(BASE.replace('https', 'wss'), { rejectUnauthorized: false }); let done = false;
    ws.on('message', (r) => { let m; try { m = JSON.parse(r); } catch { return; }
      if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'st-h' }));
      else if (m.type === 'PROFILE') setTimeout(() => ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: HEART, playerName: 'SystemTester', playerToken: ST })), 400);
      else if (m.type === 'ROOM_JOINED' && !done) { done = true; const members = m.members || m.room?.members || []; const marcels = members.filter(x => /Marcel Donges/i.test(JSON.stringify(x))).length; ws.send(JSON.stringify({ type: 'LEAVE_ROOM' })); setTimeout(() => { ws.close(); res(marcels); }, 150); } });
    ws.on('error', () => { if (!done) res(-1); });
    setTimeout(() => { if (!done) { try { ws.close(); } catch {} res(-1); } }, 7000);
  });
}
// (4) pure: deriveName for a bare message: URL is a label, never the raw url
function messageNameOk() {
  try {
    const out = execSync(`npx tsx -e "import {deriveName} from './src/ts/scenario/WebItem.ts';const u='message:%3Ch2T09I_ZS@geopol.de%3E';console.log(JSON.stringify(deriveName(u)));"`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const name = JSON.parse(out.trim().split('\n').filter(l => l.startsWith('"')).pop());
    return { ok: !!name && !/^message:/i.test(name), name };
  } catch (e) { return { ok: false, name: 'ERR' }; }
}
// legacy scans (report only)
function legacyScan() {
  let aboutBlank = 0, rawMsg = 0;
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); if (u.ior === 'ior:class:WebItem') { const m = u.model; if (/^about:/i.test(m.url || '')) aboutBlank++; if (m.scheme === 'message' && /^message:/i.test(m.name || '')) rawMsg++; } } catch {} } } })(SCEN);
  return { aboutBlank, rawMsg };
}
function dndWebItemCount(urlNeedle) {
  const m = JSON.parse(fs.readFileSync(path.join(SCEN, '3', '2', '3', '1', 'd', DND + '.scenario.json'), 'utf8')).model;
  let n = 0; for (const r of (m.fileUnits || m.files || [])) { const ru = String(r).replace('ior:instance:', ''); try { const u = JSON.parse(fs.readFileSync(path.join(SCEN, ...ru.slice(0, 5).split(''), ru + '.scenario.json'), 'utf8')); if (u.ior === 'ior:class:WebItem' && String(u.model.url || '').includes(urlNeedle)) n++; } catch {} } return n;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

// (2) ✏️ Edit pencil + 📄 Scenario on detail views
async function pencilLinks() {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-webitem-detail') && !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
  const check = (tag, uuid) => page.evaluate(async ({ tag, uuid }) => {
    document.querySelectorAll('.__e').forEach(e => e.remove());
    const el = document.createElement(tag); el.className = '__e'; el.setAttribute('uuid', uuid); document.body.appendChild(el);
    await new Promise(z => setTimeout(z, 2500)); const t = el.textContent || '';
    return /📄\s*Scenario/.test(t) && /✏️\s*Edit/.test(t) && !!el.querySelector('a[href^="/edit/scenario"]');
  }, { tag, uuid });
  const wi = await check('rb-webitem-detail', WEBITEM);
  const file = await check('rb-file-detail', fullFile);
  await ctx.close();
  return wi && file;
}
// (3) about:blank drop is BLOCKED (no WebItem minted)
async function aboutBlankBlocked() {
  const before = dndWebItemCount('about:blank');
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
  const card = page.locator('.room-card:has-text("dnd test")').first(); await card.waitFor({ timeout: 10000 });
  const jb = card.locator('.btn-join').first(); if (await jb.isVisible({ timeout: 1500 }).catch(() => false)) await jb.click(); else await card.click();
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const dz = document.getElementById('rrc-drop'); const dt = new DataTransfer(); dt.setData('text/uri-list', 'about:blank'); dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
  await sleep(3000);
  await ctx.close();
  const after = dndWebItemCount('about:blank');
  return after === before; // guard blocked -> no new about:blank WebItem
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const marcels = await heartMarcels();
  const item1 = marcels === 1;
  const item2 = await pencilLinks();
  const item3 = await aboutBlankBlocked();
  const mn = messageNameOk(); const item4 = mn.ok;
  const pass = item1 && item2 && item3 && item4;
  results.push(pass);
  console.log(`iter ${i}: (1)heartMarcels=${marcels}(=1?${item1}) (2)✏️Edit+📄=${item2} (3)aboutBlankBlocked=${item3} (4)msgName≠rawUrl=${item4}["${mn.name}"] => ${pass ? 'GREEN' : 'RED'}`);
}
const legacy = legacyScan();
console.log('\n=== VERDICT v0.7.0 (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log(`LEGACY (pre-fix, report for data-purge — fix prevents NEW): ${legacy.aboutBlank} about:blank WebItem(s), ${legacy.rawMsg} raw-message:-URL-named WebItem(s).`);
await browser.close();
process.exit(green ? 0 : 1);
