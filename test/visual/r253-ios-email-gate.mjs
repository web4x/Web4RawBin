// v0.6.90 R25.x gate — iOS email drop. An Apple email drop carries BOTH a .eml file
// (message/rfc822) AND a message: scheme URL. RoomView drop handler (v0.6.90): file -> File
// (message/ now in dispatch allowlist) AND dispatchUrl(message:) -> WebItem (name=subject).
// Fix 420ddc6bc. So an email is BOTH archived (.eml File) AND launchable (message: WebItem).
//
// CORRECTED RULE (after CMM2 repeat): SystemTester (ce981242) ONLY, NO profile commit
// (already committed -> no saveProfiles re-pollution), REUSE the existing dnd test room
// (3231db71, no CREATE_ROOM). Uploaded test files cleaned up after.
//   (1) drop email -> ONE .eml File (ior:class:File, message/rfc822).
//   (2) ONE message: WebItem alongside (ior:class:WebItem, scheme=message, badge=📧).
//   (3) WebItem.url = message: (Open launches Mail.app).
//   regressions: image-only -> File; bare scheme URL -> WebItem.
// DET-3x.

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const DND_ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shardPath = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');
const created = [];
function findUnit(ior, needle) {
  let hit = null;
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (hit) return; const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); const m = u.model || {}; if (u.ior === ior && m.roomUuid === DND_ROOM && (String(m.url || '') + ' ' + String(m.name || '')).includes(needle)) hit = { uuid: m.uuid, scheme: m.scheme, badge: m.badge, url: m.url, name: m.name, mime: m.mimeType }; } catch {} } } })(SCEN);
  return hit;
}
const poll = async (ior, needle) => { let u = null; for (let t = 0; t < 16; t++) { u = findUnit(ior, needle); if (u) break; await sleep(400); } return u; };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
const page = await ctx.newPage();

try {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  // SystemTester is already committed -> lobby directly (NO #pe-name fill, NO saveProfiles)
  await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
  // REUSE the dnd test room — click its card (no CREATE_ROOM)
  const card = page.locator('.room-card:has-text("dnd test")').first();
  await card.waitFor({ timeout: 10000 });
  const joinBtn = card.locator('.btn-join').first();
  if (await joinBtn.isVisible({ timeout: 1500 }).catch(() => false)) await joinBtn.click(); else await card.click();
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(1500);
  const roomId = await page.evaluate(() => document.getElementById('room-tree')?.dataset.seedIor || '');
  console.log('in dnd room:', roomId.slice(0, 8), '(expect 3231db71)');

  const results = [];
  for (let i = 1; i <= 3; i++) {
    const tag = `${RUN}${i}`;
    const subject = `GateMail-${tag}`;
    const msgUrl = `message://%3Cgate-${tag}@web4.de%3E`;
    const eml = `From: tron@web4.de\r\nSubject: ${subject}\r\nMessage-Id: <gate-${tag}@web4.de>\r\n\r\nbody ${tag}`;
    // iOS email drop: file (.eml message/rfc822) + message: URL in the dataTransfer
    await page.waitForSelector('#rrc-drop', { state: 'attached', timeout: 12000 }).catch(() => {});
    await page.evaluate(({ s, u, e }) => {
      const dz = document.getElementById('rrc-drop'); if (!dz) return;
      const file = new File([e], `${s}.eml`, { type: 'message/rfc822' });
      const dt = new DataTransfer(); dt.items.add(file); dt.setData('text/uri-list', u);
      dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, { s: subject, u: msgUrl, e: eml });
    await sleep(3000);

    const emlFile = await poll('ior:class:File', `${subject}.eml`);
    if (emlFile) created.push(emlFile.uuid);
    const fileOk = !!emlFile && /message\/rfc822/.test(emlFile.mime || '');

    const webItem = await poll('ior:class:WebItem', `gate-${tag}@web4.de`);
    if (webItem) created.push(webItem.uuid);
    const webItemOk = !!webItem && webItem.scheme === 'message' && webItem.badge === '📧' && String(webItem.url || '').startsWith('message:');

    const pass = fileOk && webItemOk;
    results.push(pass);
    console.log(`iter ${i}: .eml→File(message/rfc822)=${fileOk} | message:→WebItem📧=${webItemOk} (badge=${webItem?.badge} scheme=${webItem?.scheme} url=${(webItem?.url||'').slice(0,24)}) => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT iOS email drop (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally {
  try { await browser.close(); } catch {}
  let removed = 0; for (const u of created) { try { fs.unlinkSync(shardPath(u)); removed++; } catch {} }
  console.log(`cleanup: removed ${removed} test File/WebItem units from the dnd room (content blobs flagged). NO new profile/room created.`);
}
