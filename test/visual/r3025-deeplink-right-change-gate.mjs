// [test:uuid:7d3e1a52-9c48-4b6f-a0d1-6e2f8b5c3a94] R30.25 (a604a1b5) TRON'S EXACT FLOW — deep-link then change RIGHT. Tron opens a diff via a DEEP-LINK (openFromParams, both sides set: left=516ebb3, right=dev) then picks a different branch on the RIGHT. The v0.7.36/v0.7.37 fixes guarded the R30.17 promote path (populateLeftHistory/setSideRef) but NOT openFromParams: its authoritative `await loadSide('right', <deeplink-right>)` (line 586) has no _rightUserPicked/_promoteToken guard, so when a user RIGHT-pick lands while that load is in flight, the deep-link's right-load fires LAST and OVERWRITES the user's pick (right ends as the deep-link value, not the pick). LESSON banked: gate the USER's exact flow, not a proxy — the promote gate (r3025-right-pick-preserves-left) was GREEN while THIS live path is RED.
// DETERMINISTIC: an in-page fetch() override delays ONLY the deep-link's right-load (ref=dev) so openFromParams parks in its RIGHT-load phase; the user RIGHT-pick (a different branch) runs at full speed during that window, then the delayed dev-load resolves LAST and clobbers the pick. Asserts: (1) LEFT byte-identical, (2) RIGHT pick WINS (right.ref AND right.content === the picked branch, not the deep-link dev), (3) CENTER re-evaluated, (4) NO post-pick loadSide('left'). SystemTester-only, read-only.
// STATUS: RED baseline on v0.7.37 (openFromParams overwrites the RIGHT pick) → flips GREEN once openFromParams is made token/guard-aware (abort its right-load when a user RIGHT-pick superseded it).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const LEFT_REF = '516ebb3', LEFT_LEN = 119373, DEEP_RIGHT = 'dev', DEEP_RIGHT_LEN = 133728;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// delay ONLY the deep-link right-load (ref=dev&) — leaves left-load, discovery, and the user pick at full speed
const INIT = `(() => { window.__trace=[]; window.__pickAt=0;
  const of=window.fetch; window.fetch=function(u,...r){ const url=typeof u==='string'?u:(u&&u.url)||'';
    if(url.indexOf('/api/git/file?')!==-1 && url.indexOf('ref=dev&')!==-1){ return new Promise(res=>setTimeout(res,3000)).then(()=>of.call(this,u,...r)); }
    return of.call(this,u,...r); };
  const iv=setInterval(()=>{ const C=customElements.get('rb-diff-editor'); if(!C)return; clearInterval(iv);
    const w=(n,t)=>{const o=C.prototype[n]; C.prototype[n]=function(...a){window.__trace.push({t,side:a[0],ref:(a[1]&&a[1].ref)||'',at:Date.now()});return o.apply(this,a);};};
    w('loadSide','loadSide'); w('computeMergedCenter','cmc'); w('openFromParams','ofp'); },4); })()`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(DEEP, { waitUntil: 'domcontentloaded' });
    // park in openFromParams' RIGHT-load phase: LEFT loaded (516ebb3), the deep-link RIGHT (dev) still in flight
    await page.waitForFunction((dr) => { const e = document.querySelector('rb-diff-editor'); return e && (e.left?.content?.length > 0) && (e.right?.content?.length || 0) === 0 && e.right.ref === dr; }, DEEP_RIGHT, { timeout: 20000 }).catch(() => {});
    // pick a stable different RIGHT branch that actually has otmux + differs from dev; capture its expected length
    const disc = await page.evaluate(async (a) => {
      const branches = (await (await fetch('/api/git/branches?repo=oosh')).json()).branches || [];
      for (const b of branches) {
        if (b === a.deep) continue;
        const len = ((await (await fetch(`/api/git/file?ref=${b}&path=${a.path}&repo=oosh`)).json()).content || '').length;
        if (len > 0 && len !== a.deepLen) return { nb: b, nbLen: len };
      }
      return { nb: a.left, nbLen: a.leftLen }; // fallback: the left commit (known to have otmux, len differs from dev)
    }, { deep: DEEP_RIGHT, deepLen: DEEP_RIGHT_LEN, path: 'otmux', left: LEFT_REF, leftLen: LEFT_LEN });
    // pick RIGHT (exactly what the ⎇ overlay's onPick calls) while openFromParams' dev right-load is in flight
    const pre = await page.evaluate((b) => { const e = document.querySelector('rb-diff-editor'); window.__pickAt = Date.now(); const lb = e.left.content; e['setSideRef']('right', b); return { leftLen: lb.length, leftHead: lb.slice(0, 60), leftTail: lb.slice(-60) }; }, disc.nb);
    await sleep(4500); // let the delayed deep-link dev-load resolve LAST
    const post = await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); const t = window.__trace, pa = window.__pickAt; return {
      leftRef: e.left.ref, leftLen: e.left.content.length, leftHead: e.left.content.slice(0, 60), leftTail: e.left.content.slice(-60),
      rightRef: e.right.ref, rightLen: e.right.content.length,
      postPickLeft: t.filter(x => x.t === 'loadSide' && x.side === 'left' && x.at > pa).length,
      postPickDevLoad: t.filter(x => x.t === 'loadSide' && x.side === 'right' && x.ref === 'dev' && x.at > pa).length, // the overwrite
      cmcAfterPick: t.some(x => x.t === 'cmc' && x.at > pa),
      timeline: t.map(x => `${x.t}${x.side ? ':' + x.side : ''}${x.ref ? '@' + x.ref.slice(0, 7) : ''}${x.at > pa ? '*' : ''}`),
    }; });
    if (i === 1) console.log(`  TRACE: ${post.timeline.join(' | ')}`);

    const leftIdentical = post.leftRef === LEFT_REF && post.leftLen === pre.leftLen && post.leftHead === pre.leftHead && post.leftTail === pre.leftTail && post.leftLen > 0;
    const rightWins = post.rightRef === disc.nb && post.rightLen === disc.nbLen && post.rightLen > 0; // ref AND content are the PICK, not the deep-link dev
    const centerRecomputed = post.cmcAfterPick;
    const noLeftReload = post.postPickLeft === 0;
    const pass = leftIdentical && rightWins && centerRecomputed && noLeftReload;
    results.push(pass);
    console.log(`iter ${i}: pick=${disc.nb}(exp ${disc.nbLen}b) | LEFT-ident=${leftIdentical}(${post.leftRef}:${post.leftLen}) | RIGHT-wins=${rightWins}(ref=${post.rightRef}:${post.rightLen}, dev-overwrite=${post.postPickDevLoad}) | CENTER=${centerRecomputed} | no-left-reload=${noLeftReload} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.25 DEEP-LINK then change RIGHT — Tron exact flow (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (deep-link openFromParams overwrites the RIGHT pick — not-yet-fixed)');
process.exitCode = green ? 0 : 1;
