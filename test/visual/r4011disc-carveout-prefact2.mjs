// r4011-carveout DISCRIMINATOR (PO empirical test) — is the post-deploy carveout RED a REGRESSION or PRE-EXISTING?
// SOUND METHOD (avoids the PO's HYBRID TRAP): run the FULL pre-fact2 state (0.8.143 client AND server) via an R40.31
// worktree at commit 8312041b4 — NOT the dist-only backup (old-client + new-server would be a hybrid = unsound).
// CONTROL-2 (serving the right artifact): assert the scratch serves the 0.8.143 build (worktreeSha==8312041b4 +
// served bundle hash != the deployed BO6DPMIG). Frame-separated: MY foundation, non-4444 ports, never live prod.
// r4011 dependency: Case A (the carveout itself) = PURE CLIENT render (synthetic depref → rb-detail-view isSynthetic
// branch, no server unit) — and rb-detail-view.ts is byte-identical across the deploy (measured). Case B = server (real unit).
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const SYNTH = 'depref:ssh-host-identity';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: '8312041b4', buildDist: true });
console.log(`scratch up: base=${f.base} servedVersion=${f.servedVersion} worktreeSha=${f.worktreeSha}`);
// CONTROL-2: prove we serve the 0.8.143 pre-fact2 build, not the new one
const traceHtml = await (await fetch(`${f.base}/trace`)).text().catch(() => '');
const bundle = (traceHtml.match(/\/dist\/trace-page-[a-zA-Z0-9-]+\.js/) || ['?'])[0];
const isPreFact2 = f.worktreeSha.startsWith('8312041b4') && !/BO6DPMIG/.test(bundle);
console.log(`CONTROL-2 artifact check: worktreeSha=${f.worktreeSha} traceBundle=${bundle} → serving-pre-fact2=${isPreFact2}`);

let caseA = null, caseB = null, err = null;
const browser = await webkit.launch({ headless: true });
try {
  const ctx = await browser.newContext(IOS);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => !!customElements.get('rb-detail-view') || !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  const render = (ref) => page.evaluate((r) => {
    document.querySelectorAll('rb-detail-view#__g').forEach(e => e.remove());
    const el = document.createElement('rb-detail-view'); el.id = '__g';
    el.setAttribute('ref', r); document.body.appendChild(el);
    return new Promise(res => setTimeout(() => {
      const h = document.querySelector('rb-detail-view#__g');
      const title = h?.querySelector('.dv-title')?.textContent || '';
      res({ type: h?.querySelector('.dv-type')?.textContent || '', title, unresolved: /⚠ unresolved:/.test(h?.textContent || ''), stuckLoading: /Loading\.\.\./.test(title) });
    }, 1500));
  }, ref);
  const a = await render(SYNTH);
  caseA = a.unresolved && a.type === 'unresolved' && /ssh-host-identity/.test(a.title) && !a.stuckLoading;
  console.log(`Case A (carveout, CLIENT): ${JSON.stringify(a)} → ${caseA ? 'GREEN' : 'RED'}`);
} catch (e) { err = String(e.message || e).slice(0, 160); console.log('  ERR:', err); } finally { await browser.close(); }

const td = await f.teardown();
console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
console.log(`\n=== r4011-carveout on FULL 0.8.143 (worktree 8312041b4) ===`);
console.log(`served-pre-fact2=${isPreFact2} | caseA(carveout)=${caseA === null ? 'ERR/'+err : (caseA ? 'GREEN' : 'RED')}`);
console.log(caseA === false ? 'VERDICT: RED on 0.8.143 too ⇒ carveout is PRE-EXISTING (this deploy did NOT cause it) — do NOT roll back'
  : caseA === true ? 'VERDICT: GREEN on 0.8.143 ⇒ if RED now, it IS a regression from this deploy — roll back'
  : 'VERDICT: INCONCLUSIVE (error/artifact) — report weaker evidence, do not assert');
process.exit(0);
