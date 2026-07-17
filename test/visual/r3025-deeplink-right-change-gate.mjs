// [test:uuid:7d3e1a52-9c48-4b6f-a0d1-6e2f8b5c3a94] R30.25 / R30.25.1 TRON'S EXACT FLOW — deep-link (openFromParams) then change the RIGHT ref. Tron's refs: left=516ebb3, right=dev (repo=oosh). Picking a RIGHT branch while the deep-link is still loading must NOT (a) blank the LEFT, NOR (b) let the deep-link's own right-load clobber the user's pick.
// Two race WINDOWS: WIN-A = pick RIGHT during the deep-link's LEFT-load (delay ref=516ebb3) — this is the window R30.25.1 (v0.7.38 openFromParams token/guard) targets. WIN-B = pick RIGHT during the deep-link's own RIGHT-load (delay ref=dev) — the guard is checked BEFORE loadSide('right') so a pick landing inside it may still be clobbered. Each window (DET-3x) asserts: (1) LEFT byte-identical AND visually non-empty (edLocal.getValue()), (2) RIGHT pick WINS (ref AND content === the picked branch, not the deep-link dev), (3) CENTER re-evaluated, (4) NO post-pick loadSide('left'). SystemTester-only, read-only.
// LEFT-EMPTY WATCH: leftVis (Monaco editor) is captured separately from left.content — Tron reports the LEFT PANE going blank, which is the visual, not necessarily the data model.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const LEFT_REF = '516ebb3', LEFT_LEN = 119373, DEEP_RIGHT = 'dev', DEEP_RIGHT_LEN = 133728;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const INIT = (delayRef) => `(() => { window.__trace=[]; window.__pickAt=0;
  const of=window.fetch; window.fetch=function(u,...r){ const url=typeof u==='string'?u:(u&&u.url)||'';
    if(url.indexOf('/api/git/file?')!==-1 && url.indexOf('ref=${delayRef}&')!==-1){ return new Promise(res=>setTimeout(res,3000)).then(()=>of.call(this,u,...r)); }
    return of.call(this,u,...r); };
  const iv=setInterval(()=>{ const C=customElements.get('rb-diff-editor'); if(!C)return; clearInterval(iv);
    const w=(n,t)=>{const o=C.prototype[n]; C.prototype[n]=function(...a){window.__trace.push({t,side:a[0],ref:(a[1]&&a[1].ref)||'',at:Date.now()});return o.apply(this,a);};};
    w('loadSide','loadSide'); w('computeMergedCenter','cmc'); w('openFromParams','ofp'); },4); })()`;

async function runWindow(browser, delayRef, waitFn) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  await seedSystemTester(ctx); const page = await ctx.newPage(); await page.addInitScript(INIT(delayRef));
  await page.goto(DEEP, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(waitFn, DEEP_RIGHT, { timeout: 20000 }).catch(() => {});
  const disc = await page.evaluate(async (a) => {
    const branches = (await (await fetch('/api/git/branches?repo=oosh')).json()).branches || [];
    for (const b of branches) { if (b === a.deep) continue;
      const len = ((await (await fetch(`/api/git/file?ref=${b}&path=${a.path}&repo=oosh`)).json()).content || '').length;
      if (len > 0 && len !== a.deepLen) return { nb: b, nbLen: len }; }
    return { nb: '', nbLen: 0 };
  }, { deep: DEEP_RIGHT, deepLen: DEEP_RIGHT_LEN, path: 'otmux' });
  const pre = await page.evaluate((b) => { const e = document.querySelector('rb-diff-editor'); window.__pickAt = Date.now(); const lb = e.left.content; e['setSideRef']('right', b); return { leftLen: lb.length, leftHead: lb.slice(0, 60), leftTail: lb.slice(-60) }; }, disc.nb);
  await sleep(4500);
  const post = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const t = window.__trace, pa = window.__pickAt;
    const vis = (ed) => { try { return (ed && ed.getValue) ? ed.getValue().length : -1; } catch { return -2; } };
    return { leftRef: e.left.ref, leftLen: e.left.content.length, leftHead: e.left.content.slice(0, 60), leftTail: e.left.content.slice(-60), leftVis: vis(e['edLocal']),
      rightRef: e.right.ref, rightLen: e.right.content.length,
      postPickLeft: t.filter(x => x.t === 'loadSide' && x.side === 'left' && x.at > pa).length, cmcAfterPick: t.some(x => x.t === 'cmc' && x.at > pa),
      timeline: t.map(x => `${x.t}${x.side ? ':' + x.side : ''}${x.ref ? '@' + x.ref.slice(0, 7) : ''}${x.at > pa ? '*' : ''}`) }; });
  await ctx.close();
  // LEFT is CORRECT when it ends showing 516ebb3's content (data + visual), non-empty. (Not "identical to a snapshot":
  // in WIN-A the pick lands while LEFT is still loading, so a pre-snapshot is 0 — the invariant is the FINAL state.)
  const leftCorrect = post.leftRef === LEFT_REF && post.leftLen === LEFT_LEN && post.leftVis === post.leftLen;
  const leftVisEmpty = post.leftVis === 0;
  const rightWins = post.rightRef === disc.nb && post.rightLen === disc.nbLen && post.rightLen > 0;
  const pass = leftCorrect && !leftVisEmpty && rightWins && post.cmcAfterPick && post.postPickLeft === 0;
  return { pass, disc, post, leftCorrect, leftVisEmpty, rightWins, cmc: post.cmcAfterPick, noLeftReload: post.postPickLeft === 0 };
}

const WINS = {
  A: { name: 'WIN-A pick during LEFT-load  (R30.25.1 target)', delay: LEFT_REF, wait: `(dr)=>{const e=document.querySelector('rb-diff-editor'); return e && e.right && e.right.ref===dr && (e.left?.content?.length||0)===0;}` },
  B: { name: 'WIN-B pick during RIGHT-load (residual window)', delay: DEEP_RIGHT, wait: `(dr)=>{const e=document.querySelector('rb-diff-editor'); return e && (e.left?.content?.length>0) && (e.right?.content?.length||0)===0 && e.right.ref===dr;}` },
};
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const out = {}; let leftEmptySeen = false;
try {
  for (const key of ['A', 'B']) {
    const w = WINS[key]; const waitFn = eval('(' + w.wait + ')'); out[key] = [];
    for (let i = 1; i <= 3; i++) {
      const r = await runWindow(browser, w.delay, waitFn);
      out[key].push(r.pass); if (r.leftVisEmpty) leftEmptySeen = true;
      if (i === 1) console.log(`  ${key}-TRACE: ${r.post.timeline.join(' | ')}`);
      console.log(`${w.name} #${i}: LEFT-ok=${r.leftCorrect} leftVIS=${r.post.leftVis}${r.leftVisEmpty ? ' <<<EMPTY' : ''} | RIGHT-wins=${r.rightWins}(ref=${r.post.rightRef.slice(0, 10)}:${r.post.rightLen} exp ${r.disc.nbLen}) | CENTER=${r.cmc} | no-left-reload=${r.noLeftReload} => ${r.pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log('\n===== R30.25.1 deep-link change-RIGHT (Tron refs 516ebb3/dev), v0.7.38 =====');
console.log('  WIN-A (pick during left-load, fix target):', out.A.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' '));
console.log('  WIN-B (pick during right-load, residual):  ', out.B.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' '));
console.log('  LEFT-EMPTY (visual blank) reproduced anywhere:', leftEmptySeen ? 'YES' : 'NO');
const aGreen = out.A.length === 3 && out.A.every(Boolean);
console.log('OVERALL WIN-A:', aGreen ? 'GREEN DET-3x' : 'RED');
process.exitCode = aGreen ? 0 : 1;
