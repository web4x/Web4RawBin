// [test:uuid:a7ae9ea8-940b-4125-a259-70b8f3b66785] R25.6 renderScenarioLink
// [test:uuid:e4147df1-3143-4ea0-a8a4-fc277a03f1b0] R25.5 previewAndImport
// v0.6.97 gate — R25.5 name/desc harvest + R25.6/R26.2 universal 📄 Scenario link + R26.1 clipboard
// preview-before-confirm. SystemTester ONLY, reuse dnd room, NO uploads (item 4 CANCELS the confirm).
//   (1) R25.5: WebItem name = domain/title, never 'link' for a valid URL.
//   (2) R25.5: description = full URL, distinct from the (short) name.
//   (3) R26.2: 📄 Scenario link on the WebItem detail AND every detail view.
//   (4) R26.1: tapping the drop zone previews the clipboard CONTENT TYPE in the confirm before upload.
// DET-3x.

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const WEBITEM = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';   // existing message: WebItem (dnd room)
const FILE_UUID = 'b57d2f42';                             // existing File (Volker engels.ics) — full resolved below
const SCEN = `${REPO}/scenario/index`;
const shard = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');
const fullFile = (() => { try { return execSync(`find ${SCEN}/b/5/7/d/2 -name 'b57d2f42*.scenario.json'`, { encoding: 'utf8' }).trim().split('\n')[0].split('/').pop().replace('.scenario.json', ''); } catch { return WEBITEM; } })();

// (1)+(2) pure R25.5 harvesting — deriveName never 'link'; description(url) != name(short)
function nameHarvest() {
  const out = execSync(`npx tsx -e "import {deriveName} from './src/ts/scenario/WebItem.ts';` +
    `const cases=[['https://open.spotify.com/episode/abc123'],['https://monumental-praline-249f71.netlify.app/'],['https://example.com/','link'],['https://news.ycombinator.com/item?id=1']];` +
    `for(const [u,fb] of cases){const n=deriveName(u,fb);console.log(JSON.stringify({u,fb:fb||'',name:n,isLink:/^link$/i.test(n),descEqName:(u===n)}));}"`,
    { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const rows = out.trim().split('\n').filter(l => l.startsWith('{')).map(JSON.parse);
  const namesOk = rows.length === 4 && rows.every(r => !r.isLink && r.name.length > 2);
  const spotifyOk = rows.some(r => /spotify/i.test(r.u) && /spotify/i.test(r.name));
  const descDistinct = rows.every(r => r.name !== r.u); // name(short) != url(description)
  return { namesOk, spotifyOk, descDistinct, rows };
}
// (2) also verify a real shipped WebItem unit: description present + != name
function existingWebItemDescDistinct() {
  try { const m = JSON.parse(fs.readFileSync(shard(WEBITEM), 'utf8')).model; return !!m.description && !!m.name && m.description !== m.name; } catch { return false; }
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

async function scenarioLinks() {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-webitem-detail') && !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
  const check = async (tag, uuid) => page.evaluate(async ({ tag, uuid }) => {
    document.querySelectorAll('.__d').forEach(e => e.remove());
    const el = document.createElement(tag); el.className = '__d'; el.setAttribute('uuid', uuid); document.body.appendChild(el);
    await new Promise(z => setTimeout(z, 2500));
    const t = el.textContent || '';
    return /📄\s*Scenario/.test(t) && !!el.querySelector('a[href*="scenario"], a[href*="ior="]');
  }, { tag, uuid });
  const webitem = await check('rb-webitem-detail', WEBITEM);
  const file = await check('rb-file-detail', fullFile);
  await ctx.close();
  return { webitem, file };
}

async function clipboardPreview(text) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
  const page = await ctx.newPage();
  let dialogMsg = ''; page.on('dialog', async d => { dialogMsg = d.message(); await d.dismiss(); }); // CANCEL -> no upload
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
  const card = page.locator('.room-card:has-text("dnd test")').first();
  await card.waitFor({ timeout: 10000 });
  const jb = card.locator('.btn-join').first();
  if (await jb.isVisible({ timeout: 1500 }).catch(() => false)) await jb.click(); else await card.click();
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(1500);
  await page.evaluate(async (t) => { try { await navigator.clipboard.writeText(t); } catch {} }, text);
  await page.click('#rrc-drop', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await ctx.close();
  // dialog previews the content type before confirm (we cancelled -> nothing uploaded)
  const hasConfirm = /Upload from clipboard\?/i.test(dialogMsg);
  const hasType = /🔗\s*URL|📄\s*Text|🖼\s*Image|📧\s*Email/.test(dialogMsg);
  return { ok: hasConfirm && hasType, msg: dialogMsg.replace(/\n/g, ' | ').slice(0, 90) };
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const nh = nameHarvest();
  const item1 = nh.namesOk && nh.spotifyOk;
  const item2 = nh.descDistinct && existingWebItemDescDistinct();
  const sl = await scenarioLinks();
  const item3 = sl.webitem && sl.file;
  const cp = await clipboardPreview(`https://open.spotify.com/episode/gate${i}`);
  const item4 = cp.ok;
  const pass = item1 && item2 && item3 && item4;
  results.push(pass);
  console.log(`iter ${i}: (1)names≠link=${item1} (2)desc≠name=${item2} (3)📄Scenario[wi=${sl.webitem},file=${sl.file}]=${item3} (4)clipPreview=${item4}[${cp.msg}] => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT v0.6.97 (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NO uploads (item 4 cancels the confirm). 0 new profiles/rooms/files.');
await browser.close();
process.exit(green ? 0 : 1);
