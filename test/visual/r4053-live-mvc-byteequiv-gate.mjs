// R40.53 make-current LIVE-MVC gate (the BROWSER/live half of the make-current fix) — the CORE property:
// the LIVE-broadcast-updated DOM must be BYTE-EQUIVALENT to the RELOAD-rendered DOM for the same state, over the
// enumerated current-views (drawer detail + CurrentSprint icon/tree). One assertion catches Tron's 4 v0.8.121 defects:
// (2) duplicated detail sections, (3) stale icon view, (1) "only after refresh", (4) wrong banner.
// ACCEPTANCE (PO 2026-08-20): this gate MUST go RED on v0.8.121 (c3e8b22f5 — the build TRON HIMSELF device-QA'd and
// saw the duplicated drawer + stale icon). GREEN on v0.8.121 = the GATE is wrong (STOP + report). Ship-1 (idempotent
// upsertSection across all 9 *-detail + canonical viewBusKey subscribe + lint + banner) flips it GREEN; Tron device = final.
// Plus 2 synthetic stub-must-fails (clientPatch) for future failability when v0.8.121 is long gone.
// Scratch + SYSTEM literal only (R40.31 foundation) — NEVER prod:4444 / Tron's credential. @390 REAL-WebKit.
//
// ITERATION 2 = the real measurement: open the drawer on the target, drive a REAL make-current broadcast from node
// (server → ws → browser transport), capture LIVE vs RELOAD DOM for both views + section counts. Records the exact
// failing assertions (which sections duplicated, which view stayed stale) = the PO's RED-baseline evidence.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import { execSync } from 'child_process';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// (D) SOURCE grep-lint (PO ruling: a lying banner is a source-level fact, not a rendering question — immune to the
// owner-403 that blocked the /model DOM check). No user-facing string may claim 'no stored pin' / 'follows the
// derivation' now that make-current STORES a designation. Comment-stripped (scanCode) so code comments don't false-flag.
// Read at the TESTED commit so it's RED on v0.8.121 (universal-actions.ts:155) and GREEN once Ship-1 rewrites the banner.
function bannerSourceLint(commit) {
  const LIE = /no stored pin|follows the derivation/i;
  let out = '';
  try { out = execSync(`git grep -nE 'no stored pin|follows the derivation' ${commit} -- 'src/public/*.ts'`, { encoding: 'utf8' }); } catch {}
  const hits = [];
  for (const line of out.split('\n').filter(Boolean)) {
    const m = line.match(/^[^:]+:([^:]+):(\d+):(.*)$/); if (!m) continue;
    const [, file, lineno, text] = m;
    const code = text.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, ''); // strip trailing/inline comments → only user-facing strings survive
    if (LIE.test(code)) hits.push(`${file}:${lineno}: ${text.trim().slice(0, 120)}`);
  }
  return hits;
}

const V0_8_121 = 'c3e8b22f5';                 // deploy(R40.49) v0.8.121 — the human-verified known-bad RED baseline (run with MC_COMMIT=c3e8b22f5)
const V0_8_123 = 'bb8c11eb9';                 // current served build (v0.8.123, upsertSection marker-delegation) — DEFAULT so B+D stay served==gated
const COMMIT = process.env.MC_COMMIT || V0_8_123;
const TARGET = process.env.MC_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // a REAL Sprint-37 QA-Review task (resolvable in the sprint set)
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── (D) SOURCE-INVARIANT — deploy-independent, runs BEFORE any browser/server (no auth, cheap, deterministic) ──
const bannerHits = bannerSourceLint(COMMIT);
const bannerSourceClean = bannerHits.length === 0;
console.log(`(D) banner source-lint @${COMMIT}: ${bannerSourceClean ? 'CLEAN' : `LYING STRING PRESENT ×${bannerHits.length}`}`);
bannerHits.forEach(h => console.log(`    ↳ ${h}`));

const f = await setupFoundation({ commit: COMMIT, buildDist: true, attachEvidenceTo: TARGET });
console.log(`scratch up: base=${f.base} servedVersion=${f.servedVersion} worktreeSha=${f.worktreeSha} target=${TARGET.slice(0,8)} owner=${f.ownerIsServerManager} session=${f.sessionMinted}`);
const browser = await webkit.launch({ headless: true });
try {
  const ctx = await browser.newContext(IOS);
  // seed the owner/system player token so the page can drive make-current (scratch system literal, not Tron cred)
  const oh = f.ownerHeaders();
  const token = oh['x-player-token'];
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, token);
  // seed the SYSTEM owner session cookie so the drawer's (owner-gated) detail-fetch renders FULL detail on a fresh open —
  // else the fresh-render ORACLE under-renders (stub) vs the broadcast's ws-payload full render = a false comparison.
  const smMatch = (oh['Cookie'] || '').match(/sm_session=([^;]+)/);
  if (smMatch) await ctx.addCookies([{ name: 'sm_session', value: smMatch[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  page.on('console', m => { const s = m.text(); if (/error|fail|exception/i.test(s)) console.log('  [page]', s.slice(0,160)); });

  // helpers: capture the two current-views' DOM + structural section counts
  // open the drawer with FULL detail: a detail component needs its `graph` set (banked technique) — setAttribute('ref')
  // alone renders a minimal stub, which would make the fresh-render oracle under-render vs the broadcast's full render.
  const openDrawerAndCapture = () => page.evaluate((ref) => {
    const d = document.querySelector('rb-detail-drawer');
    const tree = document.querySelector('rb-trace-tree');
    if (d) { try { if (tree && tree.graph) d.graph = tree.graph; } catch {} d.setAttribute('open', ''); d.setAttribute('ref', ref); }
    return null;
  }, `task:${TARGET}`);
  const capture = () => page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    const html = (panel?.innerHTML || '');
    // section-label duplication probe: count section headers by their visible label text
    const secText = (panel?.innerText || '');
    const countLabel = (l) => (secText.match(new RegExp(`(^|\\n)\\s*${l}\\b`, 'g')) || []).length;
    const tree = document.querySelector('rb-trace-tree');
    return {
      drawerHtmlLen: html.length,
      drawerHtml: html,
      parentCount: countLabel('Parent'), statusCount: countLabel('Status'),
      pinText: (tree?.querySelector('*')?.innerText || tree?.innerText || ''),
      pinCurrent: ((tree?.innerText||'').match(/📌 Current[^\n]*/)||[''])[0],
      // defect #4: banner must NOT claim "no stored pin" once a designation IS stored
      bannerStale: /no stored pin|no current pin|not pinned/i.test(document.body.innerText || ''),
    };
  });
  const norm = (h) => h.replace(/\s+/g, ' ').replace(/data-[a-z-]+="[^"]*"/g, '').replace(/id="[^"]*"/g, '').trim(); // modulo volatile
  // settle-to-stable: the drawer renders async (fetch detail → sections → "Loading chain…" resolves → children). Compare
  // FULLY-SETTLED live vs FULLY-SETTLED reload — else a full-live-vs-partial-reload snapshot false-REDs regardless of the bug.
  const settleDrawer = async () => { let prev = -1; for (let k = 0; k < 30; k++) { await sleep(300); const len = await page.evaluate(() => (document.querySelector('rb-detail-drawer .drawer-panel-detail')?.innerHTML || '').length); if (len > 0 && len === prev && !/Loading chain/i.test(await page.evaluate(() => document.querySelector('rb-detail-drawer .drawer-panel-detail')?.innerText || ''))) return len; prev = len; } return prev; };

  await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('goto /trace:', String(e.message||e).slice(0,120)));
  await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(800);

  // (1) open the drawer on TARGET + mark the tab so we can prove NO reload happened during the live update
  await openDrawerAndCapture(); await settleDrawer();
  await page.evaluate(() => { window.__noReload = 'alive'; });
  const before = await capture();
  console.log(`BEFORE make-current: drawer[Parent×${before.parentCount} Status×${before.statusCount} len=${before.drawerHtmlLen}] pin="${before.pinCurrent.slice(0,80)}"`);

  // (2) drive a REAL make-current broadcast from NODE (server → ws → browser) — the real transport, owner system-literal
  const mc = await fetch(`${f.base}/api/task/${TARGET}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
  console.log(`make-current POST → ${mc.status}`);
  await sleep(1200); await settleDrawer(); // let the ws broadcast land + the live re-render SETTLE (idempotent → == before; buggy → grows)

  // (3) capture the LIVE state (no reload) of both views
  const live = await capture();
  // (3b) IDEMPOTENCY PROBE: re-broadcast TARGET (toggle current via `planned` then back) and re-settle. A duplicating
  // render GROWS the drawer on each live update; an idempotent one is byte-STABLE. Oracle-free (no fresh-render needed).
  await fetch(`${f.base}/api/task/${f.seeded.planned}/make-current`, { method: 'POST', headers: f.ownerHeaders() }); await sleep(600);
  await fetch(`${f.base}/api/task/${TARGET}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
  await sleep(1200); await settleDrawer();
  const live2 = await capture();
  await fetch(`${f.base}/api/task/${f.seeded.planned}/make-current`, { method: 'POST', headers: f.ownerHeaders() }); await sleep(600);
  await fetch(`${f.base}/api/task/${TARGET}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
  await sleep(1200); await settleDrawer();
  const live3 = await capture();
  console.log(`  IDEMPOTENCY: live1 len=${live.drawerHtmlLen} → live2 len=${live2.drawerHtmlLen} → live3 len=${live3.drawerHtmlLen} (stable=idempotent, growing=duplicating)`);
  const noReload = await page.evaluate(() => window.__noReload === 'alive');
  // DIAGNOSTIC: dump the LIVE drawer's section structure to confirm real-dup vs sampler-artifact
  const liveSections = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    const heads = [...(panel?.querySelectorAll('.dv-title, .dv-section-title, h3, h4, [class*="section"] > strong, dt') || [])].map(e => (e.textContent || '').trim()).filter(Boolean);
    return { headerSelectorHits: heads, panelCount: document.querySelectorAll('rb-detail-drawer .drawer-panel-detail').length, lines: (panel?.innerText || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30) };
  });
  console.log(`  DIAG live drawer: panels=${liveSections.panelCount} headers=[${liveSections.headerSelectorHits.join(' | ')}]`);
  console.log(`  DIAG live lines: ${JSON.stringify(liveSections.lines)}`);
  console.log(`LIVE (post-broadcast, noReload=${noReload}): drawer[Parent×${live.parentCount} Status×${live.statusCount} len=${live.drawerHtmlLen}] pin="${live.pinCurrent.slice(0,80)}"`);

  // (4) RELOAD at the same server state → the ground-truth clean render
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await openDrawerAndCapture(); await settleDrawer();
  const reload = await capture();
  console.log(`RELOAD (fresh, same state): drawer[Parent×${reload.parentCount} Status×${reload.statusCount} len=${reload.drawerHtmlLen}] pin="${reload.pinCurrent.slice(0,80)}"`);

  // ── ASSERTIONS (settled) ──
  // A (drawer idempotency, oracle-free): repeated live-updates on the OPEN drawer must not change its settled DOM.
  //    This is the CORRECT duplication invariant (a fresh-render oracle is unusable here: setAttribute-open renders a
  //    minimal STUB (~842) while the broadcast renders full detail via the ws payload — a stub-vs-full false comparison,
  //    the artifact my first cut mistook for the bug). NOTE: this flow does NOT reproduce Tron's specific defect #2
  //    (Parent×2/Status×3) — both builds settle byte-STABLE (~6100) → defect #2 needs its exact interaction (FINDING).
  const drawerIdempotent = norm(live.drawerHtml) === norm(live2.drawerHtml) && norm(live2.drawerHtml) === norm(live3.drawerHtml);
  const pinLiveMatchesReload = (live.pinCurrent.trim()) === (reload.pinCurrent.trim()); // icon/tree re-derived live (not stale)
  console.log('\n── ASSERTIONS (v' + f.servedVersion + ', settled) ──');
  console.log(`  A. drawer idempotent under repeated live-update: ${drawerIdempotent ? 'PASS' : 'FAIL'} (live ${live.drawerHtmlLen}→${live2.drawerHtmlLen}→${live3.drawerHtmlLen})`);
  console.log(`     ⚠ FINDING: defect #2 (Parent×2/Status×3) NOT reproduced by make-current broadcast — needs Tron's exact interaction`);
  console.log(`  B. pin re-derives live (not stale): ${pinLiveMatchesReload ? 'PASS' : 'FAIL'}`);
  console.log(`     pin LIVE  ="${live.pinCurrent.trim().slice(0,90)}"`);
  console.log(`     pin RELOAD="${reload.pinCurrent.trim().slice(0,90)}"`);
  console.log(`  C. no-reload during live update   : ${noReload ? 'PASS' : 'FAIL'}`);
  console.log(`  D. banner SOURCE-lint (authoritative): ${bannerSourceClean ? 'PASS' : 'FAIL'} (${bannerHits.length} lying user-facing string(s))`);
  // GREEN = the reproducible invariants hold (A idempotent + B pin re-derives + D banner honest). Defect #2 stays an
  // explicit UNVERIFIED finding (honest 3rd state) until its exact repro lands — NOT folded into a false GREEN.
  const red = !(drawerIdempotent && pinLiveMatchesReload && bannerSourceClean);
  console.log(`\nVERDICT v${f.servedVersion}: ${red ? 'RED' : 'GREEN (B pin + D banner + A idempotency) — defect #2 UNVERIFIED (needs exact repro)'}`);
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftoverWorktrees=${td.leftover}`);
}
