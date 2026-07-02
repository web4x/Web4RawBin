// v0.6.98 gate — R25.5 page-title names + name≠description + R25.6 photo-serve + UTF-8 + clipboard
// first-line name. FULLY READ-ONLY on Tron's REAL shipped units in the dnd room — ZERO uploads,
// ZERO pollution (the cleanest possible gate). SystemTester context only for the browser img-load.
//   (1) R25.5: http WebItem name = page TITLE, not the hostname.
//   (2) R25.5: name != description(=url).
//   (3) R25.6: photo File preview renders (<img> loads, naturalWidth>0), not a broken icon.
//   (4) R25.5: no mojibake in any name (e.g. 'für' not 'fÃ¼r').
//   (5) R26.1: clipboard text File name = its content's first line.
// DET-3x.

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const SCEN = `${REPO}/scenario/index`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const full = (p) => { try { return execSync(`find ${SCEN}/${p[0]}/${p[1]}/${p[2]}/${p[3]}/${p[4]} -name '${p}*.scenario.json'`, { encoding: 'utf8' }).trim().split('\n')[0].split('/').pop().replace('.scenario.json', ''); } catch { return ''; } };
const unit = (u) => JSON.parse(fs.readFileSync(path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json'), 'utf8')).model;
const WEBITEMS = ['90322673', '5316df18'].map(full);
const PHOTO = full('5e380e73');
const CLIP = full('ac90d742');

// (1) http WebItem name is a page title, not the hostname (a title has spaces/words and is not the domain)
function titleNames() {
  return WEBITEMS.every(u => { const m = unit(u); const host = (m.url || '').replace(/^https?:\/\//i, '').split(/[/?#]/)[0].replace(/^www\./, ''); const n = (m.name || '').toLowerCase(); return !!n && n !== host.toLowerCase() && !n.includes(host.toLowerCase()) && !/^https?:/i.test(m.name) && /\s/.test(m.name); });
}
// (2) name != description
function nameDescDistinct() {
  return WEBITEMS.every(u => { const m = unit(u); return m.name && m.description && m.name !== m.description; });
}
// (4) no mojibake anywhere in the dnd room unit names
function noMojibake() {
  const m = unit(DND); const refs = (m.fileUnits || m.files || []).map(r => String(r).replace('ior:instance:', ''));
  const bad = [];
  for (const r of refs) { try { const n = unit(r).name || ''; if (/Ã.|Â|â€|Ã¼|Ã¶|Ã¤/.test(n)) bad.push(r.slice(0, 8) + ':' + n.slice(0, 20)); } catch {} }
  return { ok: bad.length === 0, bad };
}
// (5) clipboard text File name = first line of content
function clipFirstLine() {
  const m = unit(CLIP);
  let content = ''; try { content = fs.readFileSync(path.join(SCEN, ...CLIP.slice(0, 5).split(''), CLIP + '.content'), 'utf8'); } catch {}
  // R26.1: name = first line of content (+ .txt). Compare raw (name preserves original chars).
  const firstLine = content.split('\n')[0].trim().slice(0, 60);
  const nameBase = (m.name || '').replace(/\.txt$/i, '');
  return { ok: !!nameBase && !!firstLine && nameBase === firstLine, name: m.name, firstLine };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
// (3) photo preview renders (img loads) — read-only mount of the existing photo File
async function photoRenders() {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
  const ok = await page.evaluate(async (u) => {
    document.querySelectorAll('.__p').forEach(e => e.remove());
    const el = document.createElement('rb-file-detail'); el.className = '__p'; el.setAttribute('uuid', u); document.body.appendChild(el);
    for (let t = 0; t < 20; t++) { await new Promise(z => setTimeout(z, 400)); const img = el.querySelector('img'); if (img && img.complete && img.naturalWidth > 0) return true; }
    const img = el.querySelector('img'); return !!(img && img.complete && img.naturalWidth > 0);
  }, PHOTO);
  await ctx.close();
  return ok;
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const item1 = titleNames();
  const item2 = nameDescDistinct();
  const item3 = await photoRenders();
  const mj = noMojibake(); const item4 = mj.ok;
  const cf = clipFirstLine(); const item5 = cf.ok;
  const pass = item1 && item2 && item3 && item4 && item5;
  results.push(pass);
  console.log(`iter ${i}: (1)title≠host=${item1} (2)name≠desc=${item2} (3)photoRenders=${item3} (4)noMojibake=${item4}${mj.bad.length ? ' ' + JSON.stringify(mj.bad) : ''} (5)clipFirstLine=${item5}["${cf.name?.slice(0, 30)}"] => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT v0.6.98 (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('FULLY READ-ONLY on shipped units — 0 uploads, 0 new profiles/rooms/files.');
await browser.close();
process.exit(green ? 0 : 1);
