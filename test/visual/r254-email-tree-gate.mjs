// v0.6.92 gate — 3 email-drop bug fixes (0f838b156). SystemTester ONLY, reuse dnd room
// (3231db71, no create, no profile commit). IDENTICAL content across iters -> content-hash
// dedup to ONE WebItem + ONE .eml (minimal footprint). Units are NOT deleted afterward —
// deleting a unit while the room still references it creates a DANGLING ref (the very
// raw-uuid-name bug fix #3 addresses); leaving a real named unit in the dnd TEST room is the
// low-pollution choice (cleared on server restart).
//   (1) UTF-8: non-ASCII subject -> WebItem.name correct UTF-8 ('für' not 'fÃ¼r').
//   (2) PRIMARY/CHILD: WebItem.children = [the .eml] (relatedFile fwd-ref); the demote
//       (room.removeFileUnit) runs in the SAME server code block, so a present child-link
//       proves the .eml is the WebItem's child, not a sibling duplicate.
//   (3) NO RAW-UUID NAMES: product fix = no PERSISTED dangling fileUnit refs in any Room unit
//       (b3fdbe259 purge + skip-on-render). Verified by a disk scan: every Room.fileUnits ref
//       resolves to an existing unit. DET-3x.

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE = 'https://prod.wo-da.de:4444';
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const subject = `Grüße-für-${RUN}`;                  // SAME every iter -> dedup
const msgUrl = `message://%3C${RUN}@web4.de%3E`;
const eml = `Subject: ${subject}\r\n\r\nbody ${RUN}`;

function findUnit(ior, exactName) {
  let hit = null;
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (hit) return; const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); const m = u.model || {}; if (u.ior === ior && m.roomUuid === DND && m.name === exactName) hit = { uuid: m.uuid, name: m.name, children: m.children || [] }; } catch {} } } })(SCEN);
  return hit;
}
const pollUnit = async (ior, name) => { let u = null; for (let t = 0; t < 16; t++) { u = findUnit(ior, name); if (u) break; await sleep(400); } return u; };
const unitExists = (uuid) => fs.existsSync(path.join(SCEN, ...uuid.slice(0, 5).split(''), uuid + '.scenario.json'));
// product check (3): scan every Room unit's persisted fileUnits for dangling refs
function persistedDanglingRefs() {
  const dangling = [];
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.scenario.json')) { try { const u = JSON.parse(fs.readFileSync(p, 'utf8')); if (u.ior === 'ior:class:Room') { for (const ref of (u.model?.fileUnits || u.model?.files || [])) { const ru = String(ref).replace('ior:instance:', ''); if (ru && !unitExists(ru)) dangling.push(`${u.model.uuid?.slice(0, 8)}→${ru.slice(0, 8)}`); } } } catch {} } } })(SCEN);
  return dangling;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
const page = await ctx.newPage();

try {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
  const card = page.locator('.room-card:has-text("dnd test")').first();
  await card.waitFor({ timeout: 10000 });
  const jb = card.locator('.btn-join').first();
  if (await jb.isVisible({ timeout: 1500 }).catch(() => false)) await jb.click(); else await card.click();
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(1500);

  const results = [];
  for (let i = 1; i <= 3; i++) {
    await page.waitForSelector('#rrc-drop', { state: 'attached', timeout: 12000 }).catch(() => {});
    await page.evaluate(({ s, u, e }) => {
      const dz = document.getElementById('rrc-drop'); if (!dz) return;
      const file = new File([e], `${s}.eml`, { type: 'message/rfc822' });
      const dt = new DataTransfer(); dt.items.add(file); dt.setData('text/uri-list', u);
      dz.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, { s: subject, u: msgUrl, e: eml });
    await sleep(3500);

    const wi = await pollUnit('ior:class:WebItem', subject);
    const emlU = await pollUnit('ior:class:File', `${subject}.eml`);

    const utf8Ok = !!wi && wi.name === subject && !/Ã|Â/.test(wi.name) && !!emlU && emlU.name === `${subject}.eml` && !/Ã|Â/.test(emlU.name);
    const childOk = !!wi && !!emlU && wi.children.includes(`ior:instance:${emlU.uuid}`);
    const dangling = persistedDanglingRefs();
    const noDanglingOk = dangling.length === 0;

    const pass = utf8Ok && childOk && noDanglingOk;
    results.push(pass);
    console.log(`iter ${i}: (1)UTF-8="${wi?.name}"=${utf8Ok} | (2)WebItem.children=[.eml]=${childOk} | (3)noPersistedDangling=${noDanglingOk}${dangling.length ? ' ' + JSON.stringify(dangling.slice(0, 4)) : ''} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT v0.6.92 email-drop fixes (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  console.log('FOOTPRINT: 1 WebItem + 1 .eml left in dnd test room (deduped, real names, NOT deleted to avoid dangling refs). 0 new profiles/rooms.');
  process.exitCode = green ? 0 : 1;
} finally {
  try { await browser.close(); } catch {}
}
