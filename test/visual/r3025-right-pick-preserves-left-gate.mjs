// [test:uuid:2b9f6c17-8a4e-4d3c-b1f0-5e7a9c2d84b6] R30.25 (a604a1b5) "Picking a RIGHT ref preserves the LEFT side" — impl-edits to populateLeftHistory (751934c1) + loadSide (c4da837c) + setSideRef/pickRef (f0b7ef57). THE Tron bug repro: after opening a diff (working file → R30.17 auto-promote), selecting a branch on the RIGHT must NOT blank/reload the LEFT. Root cause = asymmetric race: the promote fires fire-and-forget with no _rightUserPicked guard; its line-627 left-reload tail runs AFTER the user's right-pick and clobbers LEFT.
// DETERMINISTIC race (no flaky network timing): the prototype wrap of populateLeftHistory triggers setSideRef('right') SYNCHRONOUSLY right after the promote's sync prefix has set this.right (line 609) and parked at its first await — i.e. the pick provably lands while the promote is in-flight, every run. Instrumentation trace (timestamped loadSide/computeMergedCenter/populateLeftHistory) then asserts, per AC-verify: (1) LEFT byte-identical, (2) CENTER recomputed to the new left↔right, (3) NO post-pick loadSide('left') fires. DET-3x. SystemTester-only, read-only (same-origin GET; no mint).
// STATUS: RED baseline expected on un-fixed prod (promote's stale tail reloads LEFT) → flips GREEN once the _rightUserPicked guard + serialized-promote token deploy.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const FILE = 'package.json';            // primary-repo (rawbin) working file with git history → promote reaches its left-reload
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// prototype-level instrumentation + the deterministic in-flight pick, installed BEFORE any rb-diff-editor instance upgrades
const INIT = `(() => {
  window.__trace = []; window.__pickAt = 0; window.__pickBranch = ''; window.__picked = false; window.__leftBefore = null;
  const iv = setInterval(() => {
    const C = customElements.get('rb-diff-editor'); if (!C) return; clearInterval(iv);
    const wrap = (name, tag) => { const o = C.prototype[name]; C.prototype[name] = function(...a) {
      window.__trace.push({ tag, side: a[0], ref: (a[1] && a[1].ref) || '', at: Date.now() }); return o.apply(this, a); }; };
    wrap('loadSide', 'loadSide'); wrap('computeMergedCenter', 'cmc');
    // populateLeftHistory: log entry, run the original (sync prefix sets this.right @609, then parks at the history await),
    // THEN synchronously fire the RIGHT pick so it deterministically lands inside the in-flight window.
    const op = C.prototype.populateLeftHistory;
    C.prototype.populateLeftHistory = function(...a) {
      window.__trace.push({ tag: 'promote', at: Date.now() });
      const p = op.apply(this, a);
      if (window.__pickBranch && !window.__picked) {
        window.__picked = true; window.__leftBefore = this.left.content; window.__pickAt = Date.now();
        this['setSideRef']('right', window.__pickBranch);   // the exact bug trigger, mid-promote (sets _rightUserPicked in the FIXED build)
      }
      return p;
    };
  }, 4);
})()`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(`${BASE}/edit/${FILE}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#tb-diff', { timeout: 20000 }).catch(() => {});
    // wait for the code-editor buffer to actually hold the working file — so [Open Diff] preselects LEFT with real
    // content (Tron's real flow), not an empty buffer. Otherwise LEFT starts empty and leftIdentical is meaningless.
    await page.waitForFunction(() => { const ce = document.querySelector('rb-code-editor'); return ce && ce.getValue && ce.getValue().length > 0; }, { timeout: 20000 }).catch(() => {});

    // discover a RIGHT branch + confirm the file has history (else the promote never left-reloads → race can't fire)
    const disc = await page.evaluate(async () => {
      const br = await (await fetch('/api/git/branches')).json().catch(() => ({}));
      const hi = await (await fetch('/api/git/file-history?path=package.json')).json().catch(() => ({}));
      const branches = br.branches || [];
      const pick = branches.includes('dev') ? 'dev' : (branches.find(b => b !== 'main' && b !== 'master') || branches[0] || 'HEAD~1');
      return { branch: pick, branches, historyLen: (hi.history || []).length };
    });
    if (disc.historyLen === 0) { results.push(false); console.log(`iter ${i}: SETUP-FAIL — ${FILE} has no git history (promote can't fire) => RED`); await ctx.close(); continue; }

    // arm the deterministic in-flight pick, then open the diff (LEFT = working file, no ref) → promote fires → pick lands in-flight
    await page.evaluate((b) => { window.__trace = []; window.__picked = false; window.__pickBranch = b; }, disc.branch);
    await page.click('#tb-diff', { timeout: 8000 }).catch(() => {});
    await page.waitForFunction(() => window.__picked === true, { timeout: 20000 }).catch(() => {});
    await sleep(2500); // let the promote's racing tail (line 627) AND the pick's own load fully settle

    const post = await page.evaluate(() => {
      const e = document.querySelector('rb-diff-editor');
      const t = window.__trace, pa = window.__pickAt, lb = window.__leftBefore || '';
      return {
        leftBeforeLen: lb.length, leftBeforeHead: lb.slice(0, 60), leftBeforeTail: lb.slice(-60),
        leftLen: e.left.content.length, leftHead: e.left.content.slice(0, 60), leftTail: e.left.content.slice(-60),
        rightRef: e.right.ref, rightLen: e.right.content.length,
        postPickLeftReloads: t.filter(x => x.tag === 'loadSide' && x.side === 'left' && x.at > pa).length,
        cmcAfterPick: t.some(x => x.tag === 'cmc' && x.at > pa),
        timeline: t.map(x => `${x.tag}${x.side ? ':' + x.side : ''}${x.ref ? '@' + x.ref.slice(0, 7) : ''}${x.at > pa ? '*' : ''}`),
      };
    });
    if (i === 1) console.log(`  TRACE(iter1, *=post-pick): ${post.timeline.join(' | ')}`);

    const leftIdentical = post.leftLen === post.leftBeforeLen && post.leftHead === post.leftBeforeHead && post.leftTail === post.leftBeforeTail && post.leftLen > 0;
    const centerRecomputed = post.cmcAfterPick && post.rightRef === disc.branch && post.rightLen > 0; // right actually changed + center re-evaluated
    const noLeftReload = post.postPickLeftReloads === 0;                                               // AC-verify: NO post-pick left-reload
    const pass = leftIdentical && centerRecomputed && noLeftReload;
    results.push(pass);
    console.log(`iter ${i}: branch=${disc.branch} | LEFT-unchanged=${leftIdentical}(${post.leftBeforeLen}→${post.leftLen}b) | CENTER-recomputed=${centerRecomputed}(right=${post.rightRef}:${post.rightLen}b) | no-left-reload=${noLeftReload}(${post.postPickLeftReloads} post-pick) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.25 RIGHT-pick preserves LEFT (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (bug reproduces / not-yet-fixed)');
process.exitCode = green ? 0 : 1;
