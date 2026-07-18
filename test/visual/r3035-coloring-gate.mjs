// [test:uuid:5d8b3f47-1a29-4e6c-b0d4-7f2e9a63c815] R30.35 diff coloring by KIND + per-block IntelliJ merge actions. computeMergedCenter (a0b30550) derives kind from the diff3 region — oLength==0→ADDITION(green), abLength==0→DELETION(red), both>0→MODIFICATION(blue), stable:false→CONFLICT(brown) — fixing the bug where ALL one-sided changes rendered BLUE (a deletion looked like an addition). acceptChange (843d79d4): '>>' take Local→Result (a DELETION '>>' RE-ADDS the deleted line), '<<' take Repo→Result, 'x' dismiss.
// DETERMINISTIC SYNTHETIC FIXTURE (base + left + right, injected by overriding resolveBase) crafted so diff3 yields ALL 4 kinds in one file: a left-only MODIFY, a right-only DELETE (line local keeps, dev drops → result drops it → '>>'-take-local RE-ADDS it), a left-only ADD, and a both-diverge CONFLICT (stable:false). No prod-history hunt, no dependence on which kinds a real ref-pair happens to contain — the brown/conflict target is guaranteed.
// GATE (AC-gate, DET-3x, SCREENSHOT+PIXEL, NEVER DOM/element-count): sample each kind's rendered gutter-strip color → assert add=GREEN / delete=RED-not-blue / modify=BLUE / conflict=BROWN by hue; then '>>' on the DELETION block RE-ADDS the deleted line to CENTER. Read-only vs prod (fixture is in-memory; merge actions mutate CENTER in-memory; no save). SystemTester-only.
// STATUS: prep — pre-R30.35 the fixture's modify/delete/add all classify as 'change'/blue (2 colors only) = RED (the bug); flips GREEN when kind-derive + palette + per-kind actions land.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`; // just to MOUNT the 3-pane editor; content is replaced by the fixture
const OUT = new URL('../../test-results/r3035-coloring/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// --- synthetic 3-way fixture: diff3(LEFT, BASEC, RIGHT) → modify(left) / delete(right) / add(left) / conflict(both) ---
const BASEC = ['=fixhdr=', 'line-modify-BASE', 'mid-anchor-1', 'line-delete-BASE', 'mid-anchor-2', 'mid-anchor-3', 'line-conflict-BASE', '=fixftr='].join('\n');
const LEFT  = ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-anchor-1', 'line-delete-BASE', 'mid-anchor-2', 'line-added-by-LEFT', 'mid-anchor-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n');
const RIGHT = ['=fixhdr=', 'line-modify-BASE', 'mid-anchor-1', 'mid-anchor-2', 'mid-anchor-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n');
const DELETED_LINE = 'line-delete-BASE'; // right dropped it → result drops it → '>>' take-local must re-add it

const hueBucket = (p) => { const [r, g, b] = p; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 16) return 'gray';
  if (r >= g && r >= b) return (g > b + 10 && (r - g) < 75) ? 'brown' : 'red'; if (g >= r && g >= b) return 'green'; if (b >= r && b >= g) return 'blue'; return 'gray'; };
const EXPECT = { addition: 'green', add: 'green', deletion: 'red', delete: 'red', modification: 'blue', modify: 'blue', change: 'blue', conflict: 'brown', resolvable: 'green' };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edLocal'] && e['edCenter'] && e['edRemote']; }, { timeout: 20000 }).catch(() => {});
    await sleep(800);
    // inject the synthetic fixture (override resolveBase → 3-way diff3 with all 4 kinds)
    await page.evaluate(async ({ b, l, r }) => {
      const e = document.querySelector('rb-diff-editor');
      e.left = { path: 'fixture.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fixture.txt', ref: 'R', repo: '', content: r };
      e['edLocal'].setValue(l); e['edRemote'].setValue(r);
      e['resolveBase'] = async () => b;
      await e['computeMergedCenter']();
    }, { b: BASEC, l: LEFT, r: RIGHT });
    await sleep(900);
    const m = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
      const pRect = e.querySelector('.de-panes').getBoundingClientRect(); const cRect = e['mount']('center').getBoundingClientRect();
      const blocks = live.map(c => ({ kind: c.kind, id: c.id, aLen: c.a.length, bLen: c.b.length, a0: (c.a[0] || ''), screenY: Math.round(pRect.top + e['lineY'](e['edCenter'], c.span[0]) + 8), gutterX: Math.round(cRect.left + 6) }));
      return { twoWay: e['twoWay'], kinds: [...new Set(live.map(c => c.kind))], blocks };
    });
    if (i === 1) await page.screenshot({ path: OUT + 'fixture.png' }).catch(() => {});
    const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
    const colored = await page.evaluate(async ({ shot, blocks }) => {
      const img = new Image(); img.src = shot; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      return blocks.map(b => { let best = null, bc = 0; for (let dx = -2; dx < 14; dx++) for (let dy = -6; dy < 22; dy += 2) { const x = b.gutterX + dx, y = b.screenY + dy; if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue; const p = ctx.getImageData(x, y, 1, 1).data; const ch = Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]); if (ch > bc) { bc = ch; best = [p[0], p[1], p[2]]; } } return { ...b, px: best }; });
    }, { shot, blocks: m.blocks });
    const perKind = colored.map(b => ({ kind: b.kind, aLen: b.aLen, bLen: b.bLen, bucket: b.px ? hueBucket(b.px) : 'none', expect: EXPECT[b.kind] || '?', px: b.px }));

    // ACTION: '>>' (take Local→Result) on the DELETION block RE-ADDS the deleted line to CENTER
    const del = colored.find(b => /delet/i.test(b.kind) || (b.bLen === 0 && b.aLen > 0 && b.a0 === '')) || colored.find(b => /delet/i.test(b.kind));
    let reAdd = 'no-deletion-block';
    if (del) reAdd = await page.evaluate(async ({ id, line }) => {
      const e = document.querySelector('rb-diff-editor'); const before = e['edCenter'].getValue();
      const btn = e.querySelector(`[data-cid="${id}"][data-act="left"]`); if (btn) btn.click(); else if (e['acceptChange']) e['acceptChange'](id, 'left');
      await new Promise(r => setTimeout(r, 500)); const after = e['edCenter'].getValue();
      return (!before.includes(line) && after.includes(line)) ? 'RE-ADDED' : (after !== before ? 'changed-not-readd' : 'no-change');
    }, { id: del.id, line: DELETED_LINE });

    const colorsOk = perKind.every(k => k.expect === '?' || k.bucket === k.expect);
    const has4 = ['green', 'red', 'blue', 'brown'].every(c => perKind.some(k => k.bucket === c));
    const deleteNotBlue = !perKind.some(k => /delet/i.test(k.kind) && k.bucket === 'blue');
    const pass = colorsOk && has4 && deleteNotBlue && reAdd === 'RE-ADDED' && m.twoWay === false;
    results.push(pass);
    console.log(`iter ${i}: kinds=[${m.kinds}] | ${perKind.map(k => `${k.kind}:${k.bucket}${k.bucket === k.expect ? '✓' : '✗(exp ' + k.expect + ')'}`).join(' ')} | 4-colors=${has4} del-not-blue=${deleteNotBlue} | >>re-adds-deleted=${reAdd} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.35 coloring (4 kinds incl CONFLICT=brown, synthetic fixture) + actions (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (kind-coloring/actions not-yet-landed)');
console.log('screenshot: test-results/r3035-coloring/fixture.png');
process.exitCode = green ? 0 : 1;
