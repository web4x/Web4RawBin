// R30.35 VALIDATION PROBE (measure ACTUAL behavior, DO NOT change code) — for Tron's "let it be validated". Drives each
// {ADD/DELETE/MODIFY/CONFLICT} × {✕ dismiss / ≫ take-Local / ≪ take-Repo} on a deterministic synthetic all-4-kinds
// 3-way fixture (override resolveBase) + the edge states left-empty / right-empty, and reports what the action ACTUALLY
// does to CENTER: local line lands? repo line lands? removed? no-op? dismissed? button present? Behavior/screenshot, NOT DOM-count.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const OUT = new URL('../../test-results/r3035-matrix/', import.meta.url).pathname;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// all-4-kinds fixture: left MODIFY, right DELETE, left ADD, both-diverge CONFLICT
const F = {
  base:  ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'line-delete-BASE', 'mid-2', 'mid-3', 'line-conflict-BASE', '=fixftr='].join('\n'),
  left:  ['=fixhdr=', 'line-modify-LEFTCHANGE', 'mid-1', 'line-delete-BASE', 'mid-2', 'line-added-by-LEFT', 'mid-3', 'line-conflict-LEFTSIDE', '=fixftr='].join('\n'),
  right: ['=fixhdr=', 'line-modify-BASE', 'mid-1', 'mid-2', 'mid-3', 'line-conflict-RIGHTSIDE', '=fixftr='].join('\n'),
};
const KINDS = ['modif', 'delet', 'add', 'conflict']; const ACTS = [['ignore', '✕ dismiss'], ['left', '≫ take-Local'], ['right', '≪ take-Repo']];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
import fs from 'fs'; try { fs.mkdirSync(OUT, { recursive: true }); } catch {}
const rows = [];
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1500, height: 950 } });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e['edCenter']; }, { timeout: 20000 }).catch(() => {});
  await sleep(700);
  const inject = (fx) => page.evaluate(async ({ b, l, r }) => { const e = document.querySelector('rb-diff-editor'); e.left = { path: 'fx.txt', ref: 'L', repo: '', content: l }; e.right = { path: 'fx.txt', ref: 'R', repo: '', content: r }; e['edLocal'].setValue(l); e['edRemote'].setValue(r); e['resolveBase'] = async () => b; await e['computeMergedCenter'](); }, { b: fx.base, l: fx.left, r: fx.right });

  for (const [fxName, fx] of [['all-4-kinds', F], ['left-empty', { ...F, left: '' }], ['right-empty', { ...F, right: '' }]]) {
    const kindList = fxName === 'all-4-kinds' ? KINDS : ['*']; // edges: probe whatever kinds diff3 yields
    for (const kMatch of kindList) {
      for (const [act, actLabel] of ACTS) {
        await inject(fx);
        await sleep(400);
        const r = await page.evaluate(async ({ kMatch, act }) => {
          const e = document.querySelector('rb-diff-editor'); const live = (e['conflicts'] || []).filter(c => !(e['dismissed'] && e['dismissed'].has(c.id)));
          const c = kMatch === '*' ? live[0] : live.find(x => new RegExp(kMatch, 'i').test(x.kind));
          if (!c) return { kind: kMatch, absent: true, allKinds: [...new Set(live.map(x => x.kind))] };
          const localLine = (c.a[0] || '').trim(), repoLine = (c.b[0] || '').trim();
          const before = e['edCenter'].getValue();
          const btn = e.querySelector(`[data-cid="${c.id}"][data-act="${act}"]`); const hasBtn = !!btn;
          if (btn) btn.click(); // real UI click (fall through to nothing if no button — that itself is a finding)
          await new Promise(z => setTimeout(z, 450));
          const after = e['edCenter'].getValue(); const dismissed = !!(e['dismissed'] && e['dismissed'].has(c.id));
          const localIn = localLine ? after.includes(localLine) : null, repoIn = repoLine ? after.includes(repoLine) : null;
          const localWasIn = localLine ? before.includes(localLine) : null, repoWasIn = repoLine ? before.includes(repoLine) : null;
          return { kind: c.kind, hasBtn, changed: after !== before, dismissed, localLine, repoLine, localIn, repoIn, localWasIn, repoWasIn };
        }, { kMatch, act });
        let verdict;
        if (r.absent) verdict = `KIND-ABSENT (present: ${r.allKinds})`;
        else if (!r.hasBtn) verdict = 'NO BUTTON';
        else if (r.dismissed && !r.changed) verdict = 'dismissed (visual only, center unchanged)';
        else if (r.localIn && !r.localWasIn) verdict = 'LOCAL line ADDED to center' + (r.kind.match(/delet/i) ? ' = RE-ADDS deleted ✓' : '');
        else if (r.repoIn && !r.repoWasIn) verdict = 'REPO line added to center';
        else if (!r.localIn && r.localWasIn) verdict = 'LOCAL line REMOVED from center';
        else if (!r.repoIn && r.repoWasIn) verdict = 'REPO line REMOVED from center';
        else if (r.changed) verdict = 'center CHANGED (other)';
        else verdict = 'NO-OP (center unchanged)';
        rows.push({ fx: fxName, kind: r.kind || kMatch, act: act, actLabel, verdict });
        console.log(`[${fxName}] ${(r.kind || kMatch).padEnd(12)} × ${actLabel.padEnd(14)} => ${verdict}`);
      }
    }
  }
  await page.screenshot({ path: OUT + 'matrix-final.png' }).catch(() => {});
  await ctx.close();
} finally { await browser.close(); }
console.log('\nMEASURED — for the diagram validation column (architect 0.3 owns EXPECTED). screenshots: test-results/r3035-matrix/');
