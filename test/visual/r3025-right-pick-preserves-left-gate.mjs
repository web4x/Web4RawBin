// [test:uuid:2b9f6c17-8a4e-4d3c-b1f0-5e7a9c2d84b6] R30.25 (a604a1b5) "Picking a RIGHT ref preserves the LEFT side AND the RIGHT pick WINS" — impl-edits to populateLeftHistory (751934c1) + loadSide (c4da837c) + setSideRef/pickRef (f0b7ef57). THE Tron bug: opening a diff (working file → R30.17 auto-promote) then selecting a branch on the RIGHT must NOT (a) blank/reload the LEFT, NOR (b) let the promote overwrite the RIGHT pick (v0.7.36 subtle bug: LEFT preserved but promote clobbered RIGHT back to the working file). v0.7.37 (ec5d62dee) moves the right-reset into loadSide + early _rightUserPicked guard so RIGHT WINS.
// TWO cases, DET-3x each: CASE A = pick RIGHT DURING the promote's history fetch (the real race — the fetch window is WIDENED deterministically by an in-page fetch() override that delays /api/git/file-history; page.route did NOT intercept so we override fetch directly). CASE B = pick RIGHT AFTER the promote fully settles. Instrumentation trace (timestamped loadSide/cmc/promote) asserts on BOTH: (1) LEFT byte-identical, (2) CENTER re-evaluated, (3) NO post-pick loadSide('left'), (4) RIGHT pick WINS (rightRef===picked, not overwritten). SystemTester-only, read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const FILE = 'package.json';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// installed before any page script: widen the promote's history fetch on demand + trace the diff editor
const INIT = `(() => {
  window.__trace = []; window.__pickAt = 0; window.__histDelay = 0; window.__histInflight = false;
  const of = window.fetch;
  window.fetch = function(u, ...r) {
    const url = typeof u === 'string' ? u : (u && u.url) || '';
    if (window.__histDelay > 0 && url.indexOf('/api/git/file-history') !== -1) {
      window.__histInflight = true;
      return new Promise(res => setTimeout(res, window.__histDelay)).then(() => { window.__histInflight = false; return of.call(this, u, ...r); });
    }
    return of.call(this, u, ...r);
  };
  const iv = setInterval(() => {
    const C = customElements.get('rb-diff-editor'); if (!C) return; clearInterval(iv);
    const wrap = (name, tag) => { const o = C.prototype[name]; C.prototype[name] = function(...a) {
      window.__trace.push({ tag, side: a[0], ref: (a[1] && a[1].ref) || '', at: Date.now() }); return o.apply(this, a); }; };
    wrap('loadSide', 'loadSide'); wrap('computeMergedCenter', 'cmc'); wrap('populateLeftHistory', 'promote');
  }, 4);
})()`;

async function openDiff(browser, delayMs) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await page.goto(`${BASE}/edit/${FILE}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#tb-diff', { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const ce = document.querySelector('rb-code-editor'); return ce && ce.getValue && ce.getValue().length > 0; }, { timeout: 20000 }).catch(() => {});
  const disc = await page.evaluate(async () => {
    const br = await (await fetch('/api/git/branches')).json().catch(() => ({}));
    const hi = await (await fetch('/api/git/file-history?path=package.json')).json().catch(() => ({}));
    const branches = br.branches || [];
    const pick = branches.includes('dev') ? 'dev' : (branches.find(b => b !== 'main' && b !== 'master') || branches[0] || 'HEAD~1');
    return { branch: pick, historyLen: (hi.history || []).length };
  });
  await page.evaluate((d) => { window.__trace = []; window.__histDelay = d; }, delayMs);
  await page.click('#tb-diff', { timeout: 8000 }).catch(() => {});
  return { ctx, page, disc };
}

// read side state + the post-pick trace signals
const readAfter = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor'); const t = window.__trace, pa = window.__pickAt;
  return {
    leftLen: e.left.content.length, leftHead: e.left.content.slice(0, 60), leftTail: e.left.content.slice(-60),
    rightRef: e.right.ref, rightLen: e.right.content.length,
    postPickLeftReloads: t.filter(x => x.tag === 'loadSide' && x.side === 'left' && x.at > pa).length,
    cmcAfterPick: t.some(x => x.tag === 'cmc' && x.at > pa),
    timeline: t.map(x => `${x.tag}${x.side ? ':' + x.side : ''}${x.ref ? '@' + x.ref.slice(0, 7) : ''}${x.at > pa ? '*' : ''}`),
  };
});
// pick RIGHT and snapshot LEFT + the pre-pick RIGHT ref immediately before (rightBefore proves (4) non-vacuous:
// the promote's reset has made rightRef='' (working) here; a GREEN then requires the pick to flip it back to the branch)
const doPick = (page, branch) => page.evaluate((b) => {
  const e = document.querySelector('rb-diff-editor');
  const lb = e.left.content; const rightBefore = e.right.ref; window.__pickAt = Date.now();
  e['setSideRef']('right', b);
  return { len: lb.length, head: lb.slice(0, 60), tail: lb.slice(-60), rightBefore };
}, branch);

const judge = (pre, post, branch) => {
  const leftIdentical = post.leftLen === pre.len && post.leftHead === pre.head && post.leftTail === pre.tail && post.leftLen > 0;
  const centerRecomputed = post.cmcAfterPick;
  const noLeftReload = post.postPickLeftReloads === 0;
  const rightWins = post.rightRef === branch && post.rightLen > 0;   // (4) the pick is NOT overwritten by the promote
  return { pass: leftIdentical && centerRecomputed && noLeftReload && rightWins, leftIdentical, centerRecomputed, noLeftReload, rightWins };
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const A = [], B = [];
try {
  for (let i = 1; i <= 3; i++) {
    // ── CASE A: pick RIGHT DURING the (widened) promote history fetch — the real race ──
    {
      const { ctx, page, disc } = await openDiff(browser, 3500);
      if (disc.historyLen === 0) { A.push(false); console.log(`A${i}: SETUP-FAIL no history => RED`); }
      else {
        // wait until the promote is parked at the delayed history fetch (in-flight), tail not yet fired
        await page.waitForFunction(() => {
          const t = window.__trace, e = document.querySelector('rb-diff-editor');
          const pi = t.findIndex(x => x.tag === 'promote');
          if (pi < 0 || !window.__histInflight || !(e && e.right && e.right.content !== undefined) || !(e.left?.content?.length > 0)) return false;
          return !t.slice(pi + 1).some(x => x.tag === 'loadSide' && x.side === 'left');
        }, { timeout: 20000 }).catch(() => {});
        const pre = await doPick(page, disc.branch);
        await sleep(4500); // > 3500ms history delay + promote resume + pick load
        const post = await readAfter(page);
        const j = judge(pre, post, disc.branch);
        A.push(j.pass);
        if (i === 1) console.log(`  A-TRACE: ${post.timeline.join(' | ')}`);
        console.log(`A${i}: branch=${disc.branch} | LEFT-ident=${j.leftIdentical}(${pre.len}→${post.leftLen}) | CENTER=${j.centerRecomputed} | no-left-reload=${j.noLeftReload}(${post.postPickLeftReloads}) | RIGHT-wins=${j.rightWins}(before='${pre.rightBefore}'→after='${post.rightRef}') => ${j.pass ? 'GREEN' : 'RED'}`);
      }
      await ctx.close();
    }
    // ── CASE B: pick RIGHT AFTER the promote fully settles ──
    {
      const { ctx, page, disc } = await openDiff(browser, 0);
      if (disc.historyLen === 0) { B.push(false); console.log(`B${i}: SETUP-FAIL no history => RED`); }
      else {
        // wait for the promote to complete: its line-627 left-reload (older-on-left) has landed
        await page.waitForFunction(() => {
          const t = window.__trace; const pi = t.findIndex(x => x.tag === 'promote');
          return pi >= 0 && t.slice(pi + 1).some(x => x.tag === 'loadSide' && x.side === 'left');
        }, { timeout: 20000 }).catch(() => {});
        await sleep(800);
        const pre = await doPick(page, disc.branch);
        await sleep(2500);
        const post = await readAfter(page);
        const j = judge(pre, post, disc.branch);
        B.push(j.pass);
        console.log(`B${i}: branch=${disc.branch} | LEFT-ident=${j.leftIdentical}(${pre.len}→${post.leftLen}) | CENTER=${j.centerRecomputed} | no-left-reload=${j.noLeftReload}(${post.postPickLeftReloads}) | RIGHT-wins=${j.rightWins}(before='${pre.rightBefore}'→after='${post.rightRef}') => ${j.pass ? 'GREEN' : 'RED'}`);
      }
      await ctx.close();
    }
  }
} finally { await browser.close(); }

console.log('\n===== R30.25 RIGHT-pick preserves LEFT + RIGHT-wins (DET-3x, v0.7.37) =====');
console.log('  CASE A (pick during promote fetch):', A.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' '));
console.log('  CASE B (pick after promote):       ', B.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' '));
const green = A.length === 3 && B.length === 3 && [...A, ...B].every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (both cases)' : 'RED');
process.exitCode = green ? 0 : 1;
