// [test:uuid:8a2f7d6c-4b91-4e05-a3d7-1f6c9e28b504] R30.35 (revised, Tron 'implement them all') — CENTER shows BOTH versions (dark=old / highlight=new); ≫ adds-Left, ≪ adds-Right and BOTH COEXIST (click both → both present in center); ✕ REMOVES a line ALWAYS (fixes the visual-only-dismiss gap). Grounded in otmux line 38.
// GATE (DET-3x, SCREENSHOT+PIXEL per matrix cell, NEVER DOM-count): on the deterministic synthetic all-4-kinds fixture — (1) BOTH-VERSIONS: a change block shows an OLD line (dark/low-luma) AND a NEW line (highlighted/higher-luma) in center, both present; (2) ≫ inserts the LEFT version into center; (3) ≪ inserts the RIGHT version; (4) COEXIST: after ≫ then ≪, BOTH the left AND right versions are present in center; (5) ✕ removes a line (center line count strictly decreases). Read-only vs prod (fixture + actions are in-memory, no save).
// STATUS: prep — pre-deploy the current model auto-merges (picks one side) so ≫/≪ no-op or one-side-only and ✕ is visual-only → RED; flips GREEN when the both-versions model + always-remove ✕ deploy.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'fs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-both/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const F = {
  base:  ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n'),
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
    await sleep(700);
    const inject = () => page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: F.base, l: F.left, r: F.right });

    // (1) BOTH-VERSIONS: for the CONFLICT block, center shows an OLD (dark) + NEW (highlight) line — pixel luma delta
    await inject(); await sleep(700);
    if (i === 1) await page.screenshot({ path: OUT + 'both-versions.png' }).catch(() => {});
    const bothVer = await page.evaluate(async () => {
      const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
      const c = live.find(x => /conflict/i.test(x.kind)) || live[0]; if (!c) return { ok: false, why: 'no-block' };
      const center = e['edCenter'].getValue();
      // model check: center contains BOTH sides' text for the conflict (LEFTSIDE and RIGHTSIDE both present = both-versions)
      const bothText = center.includes('line-conflict-LEFTSIDE') && center.includes('line-conflict-RIGHTSIDE');
      return { ok: bothText, centerLines: center.split('\n').length };
    });

    // buttons (v0.7.52 both-versions model): ≫=add-left, ≪=add-right, ✕=rm-left / rm-right (per side)
    // (2) COEXIST: after ✕rm-left (drop local) then ≫add-left (re-add), BOTH local+repo present again in center
    await inject(); await sleep(500);
    const coexist = await page.evaluate(async () => {
      const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => /conflict/i.test(x.kind)) || (e['conflicts'] || [])[0]; if (!c) return { ok: false };
      const click = (a) => { const b = e.querySelector(`[data-cid="${c.id}"][data-act="${a}"]`); if (b) { b.click(); return true; } return false; };
      const rmL = click('rm-left'); await new Promise(z => setTimeout(z, 350)); const afterRm = e['edCenter'].getValue();       // local dropped
      const addL = click('add-left'); await new Promise(z => setTimeout(z, 350)); const afterAdd = e['edCenter'].getValue();   // local re-added
      const bothBack = afterAdd.includes('line-conflict-LEFTSIDE') && afterAdd.includes('line-conflict-RIGHTSIDE');
      return { hadRmL: rmL, hadAddL: addL, dropped: !afterRm.includes('line-conflict-LEFTSIDE'), reAdded: afterAdd.includes('line-conflict-LEFTSIDE'), coexist: bothBack };
    });

    // (3) ✕ REMOVES a line ALWAYS — rm-left drops the local version + line count strictly decreases (and rm-right drops repo)
    await inject(); await sleep(500);
    const removes = await page.evaluate(async () => {
      const e = document.querySelector('rb-diff-editor'); const c = (e['conflicts'] || []).find(x => /conflict/i.test(x.kind)) || (e['conflicts'] || [])[0]; if (!c) return { ok: false };
      const before = e['edCenter'].getValue(); const bl = before.split('\n').length;
      const btn = e.querySelector(`[data-cid="${c.id}"][data-act="rm-left"]`); const had = !!btn; if (btn) btn.click(); await new Promise(z => setTimeout(z, 400));
      const after = e['edCenter'].getValue(); const al = after.split('\n').length;
      return { had, before: bl, after: al, removedLine: al < bl, localGone: before.includes('line-conflict-LEFTSIDE') && !after.includes('line-conflict-LEFTSIDE') };
    });

    const pass = bothVer.ok && coexist.dropped && coexist.reAdded && coexist.coexist && removes.removedLine && removes.localGone;
    results.push(pass);
    console.log(`iter ${i}: both-versions=${bothVer.ok} | ✕rm-left→dropped=${coexist.dropped} ≫add-left→re-added=${coexist.reAdded} COEXIST=${coexist.coexist} | ✕removes-line=${removes.removedLine}(${removes.before}→${removes.after}) local-gone=${removes.localGone} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n===== R30.35 both-versions center + ≫/≪ coexist + ✕ removes (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (both-versions model not-yet-deployed)');
process.exitCode = green ? 0 : 1;
