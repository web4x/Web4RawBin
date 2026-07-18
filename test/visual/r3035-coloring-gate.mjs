// [test:uuid:5d8b3f47-1a29-4e6c-b0d4-7f2e9a63c815] R30.35 diff coloring by KIND + per-block IntelliJ merge actions. computeMergedCenter (a0b30550) derives kind from the diff3 region — oLength==0→ADDITION, abLength==0→DELETION, both>0→MODIFICATION, stable:false→CONFLICT — and CONFLICT_PALETTE maps add=GREEN / delete=RED / modify=BLUE / conflict=BROWN (fixes the bug where ALL one-sided changes rendered BLUE, so a deletion looked like an addition). acceptChange (843d79d4): '>>' take Local→Result (a DELETION '>>' RE-ADDS the deleted line), '<<' take Repo→Result, 'x' dismiss the block from center.
// GATE (AC-gate, DET-3x, SCREENSHOT+PIXEL, NEVER DOM/element-count): for each of the 4 kinds present in the 3-way diff, locate a block (via conflicts[] — a locate, not the verdict), sample the RENDERED gutter-strip pixel color, and assert it matches the semantic (add→green / delete→RED-not-blue / modify→blue / conflict→brown) by hue. Then exercise the actions on a DELETION block: '>>' RE-ADDS the deleted line to CENTER (content mutates to include it), '<<'/x behave per kind. Read-only except the merge actions mutate CENTER in-memory (no save/persist). SystemTester-only.
// STATUS: prep — pre-R30.35 the palette has only conflict/resolvable/change (no red/DELETE); RED at that point (the bug). Flips GREEN when the kind-derive + palette + per-kind actions land.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-coloring/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// classify an [r,g,b] pixel into a semantic color bucket (add=green/delete=red/modify=blue/conflict=brown)
const hueBucket = (p) => { const [r, g, b] = p; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 18) return 'gray';
  if (r >= g && r >= b) { return (g > b + 12 && r - g < 70) ? 'brown' : 'red'; } if (g >= r && g >= b) return 'green'; if (b >= r && b >= g) return 'blue'; return 'gray'; };

const measure = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
  // one representative block per kind, with its CENTER Y range (viewzone-aware) for pixel sampling
  const seen = {}; const blocks = [];
  for (const c of live) { if (seen[c.kind]) continue; seen[c.kind] = true;
    const y = e['lineY'](e['edCenter'], c.span[0]); const cRect = e['mount']('center').getBoundingClientRect(); const pRect = e.querySelector('.de-panes').getBoundingClientRect();
    blocks.push({ kind: c.kind, id: c.id, aLen: c.a.length, bLen: c.b.length, screenY: Math.round(pRect.top + y + 8), gutterX: Math.round(cRect.left + 6) }); }
  return { kinds: [...new Set(live.map(c => c.kind))], nConflicts: live.length, blocks };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter'] && (e['conflicts'] || []).length > 0; }, { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const m = await measure(page);
    if (i === 1) await page.screenshot({ path: OUT + 'diff.png' }).catch(() => {});
    const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
    // sample each kind's gutter-strip color from the screenshot (scan a small horizontal band at the block's gutter)
    const EXPECT = { addition: 'green', add: 'green', deletion: 'red', delete: 'red', modification: 'blue', modify: 'blue', change: 'blue', conflict: 'brown' };
    const colored = await page.evaluate(async ({ shot, blocks }) => {
      const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      return blocks.map(b => { let best = null, bestC = 0; for (let dx = -2; dx < 14; dx++) { for (let dy = -6; dy < 20; dy += 2) { const x = b.gutterX + dx, y = b.screenY + dy; if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue; const p = ctx.getImageData(x, y, 1, 1).data; const chroma = Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]); if (chroma > bestC) { bestC = chroma; best = [p[0], p[1], p[2]]; } } } return { ...b, px: best }; });
    }, { shot, blocks: m.blocks });
    const perKind = colored.map(b => ({ kind: b.kind, aLen: b.aLen, bLen: b.bLen, px: b.px, bucket: b.px ? hueBucket(b.px) : 'none', expect: EXPECT[b.kind] || '?' }));

    // ACTION: on a DELETION block (abLen==0 / kind delete), '>>' (take Local) must RE-ADD the deleted line to CENTER
    const del = perKind.find(k => /delet/i.test(k.kind) || (k.aLen > 0 && k.bLen === 0));
    let reAdd = 'no-deletion-block';
    if (del) {
      reAdd = await page.evaluate(async (id) => {
        const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => x.id === id); if (!c) return 'block-gone';
        const before = e['edCenter'].getValue(); const line = (c.a[0] || '').trim();
        const btn = e.querySelector(`.de-ribbons ~ * [data-cid="${id}"][data-act="left"], [data-cid="${id}"][data-act="left"]`);
        if (btn) btn.click(); else if (e['acceptChange']) e['acceptChange'](id, 'left');
        await new Promise(r => setTimeout(r, 500));
        const after = e['edCenter'].getValue();
        return (line && after.includes(line) && !before.includes(line)) ? 'RE-ADDED' : (after !== before ? 'changed-but-not-readd' : 'no-change');
      }, del.id);
    }

    const kindsPresent = [...new Set(perKind.map(k => k.kind))];
    const colorsOk = perKind.every(k => k.expect === '?' || k.bucket === k.expect);
    const has4 = ['green', 'red', 'blue', 'brown'].every(c => perKind.some(k => k.bucket === c));
    const deleteNotBlue = !perKind.some(k => /delet/i.test(k.kind) && k.bucket === 'blue'); // the core bug
    const actionOk = reAdd === 'RE-ADDED';
    const pass = colorsOk && has4 && deleteNotBlue && actionOk;
    results.push(pass);
    console.log(`iter ${i}: kinds=[${kindsPresent}] | colors=${perKind.map(k => `${k.kind}:${k.bucket}${k.bucket === k.expect ? '✓' : '✗exp' + k.expect}`).join(' ')} | 4-colors=${has4} delete-not-blue=${deleteNotBlue} | >>re-adds-deleted=${reAdd} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.35 diff coloring (4 kinds) + per-block actions (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (kind-coloring/actions not-yet-fully-landed)');
console.log('screenshots: test-results/r3035-coloring/');
process.exitCode = green ? 0 : 1;
