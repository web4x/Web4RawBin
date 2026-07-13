// [test:uuid:02117d3d-798a-4695-a140-219fd0265676] R30.9 RbDiffEditor.mountThreePane — 3-pane Local|Result|Repository shell + 3 Monaco panes
// [test:uuid:2b3b0d79-53bf-4c00-ad3d-eb35b7800c10] R30.9 RbDiffEditor.monacoLoader — Monaco panes load (panes>=3 rendered)
// [test:uuid:79139c01-754f-4867-9e77-bf9a255ce54f] R30.9 RbDiffEditor.applyAllNonConflicting — ✨Apply-All-Non-Conflicting control present
// [test:uuid:a7ad62f1-63a7-41da-838c-e860e45115ee] R30.9 GitApi.mergeBase — /api/git/merge-base live 200 + reject-first bad ref (guardRef)
// [test:uuid:eb4a550e-1151-49b0-a52a-db3ecaa16ee5] R30.9 RbDiffEditor.computeMergedCenter — base-aware diff3 3-way merge (5 cases) + 3-pane mount (DET-3x GREEN)
// R30.9 — IntelliJ 3-way merge (RbDiffEditor.computeMergedCenter, impl a0b30550, prod v0.7.18).
// Base-aware: diff3Merge(local, base, remote) → CENTER auto-applies non-conflicting, flags true
// conflicts. READ-ONLY by construction (pure diff3 unit cases + mounts the component with in-memory
// data; no writes/seed/restore). serviceWorkers:'block'. DET-3x.
//   PART A (computeMergedCenter CORE, pure diff3Merge — the expert's 5 cases, DOM-free):
//     only-local→auto local · only-remote→auto remote · non-adjacent both→auto-merge both (0 conflict)
//     · overlapping both→CONFLICT · both-identical→false-conflict-excluded→ok (0 conflict).
//   PART B (3-pane mount): connectedCallback builds Local | Result | Repository shell + Monaco panes;
//     ✨Apply-All-Non-Conflicting control present.

import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import https from 'https';
import fs from 'fs';
import path from 'path';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
// PART C — GitApi.mergeBase live + reject-first (guardRef on refs), same-origin authorized
const api = (pathq) => new Promise((res) => { const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pathq, method: 'GET', rejectUnauthorized: false, timeout: 8000, headers: { Origin: 'https://prod.wo-da.de:4444' } }, (resp) => { let b = ''; resp.on('data', c => b += c); resp.on('end', () => res({ status: resp.statusCode, body: b })); }); r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); }); r.end(); });
const NODE18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// PART A — pure diff3Merge cases via a tsx eval (server-independent, deterministic)
const evalSrc = `
import { diff3Merge, hasConflict } from './src/public/ts/vendor/diff3.ts';
const flat = (rs) => rs.flatMap(r => 'ok' in r ? r.ok : []);
const base = ['a','b','c','d','e'];
const cases = {
  onlyLocal:  diff3Merge(['a','X','c','d','e'], base, ['a','b','c','d','e']),
  onlyRemote: diff3Merge(['a','b','c','d','e'], base, ['a','b','c','Y','e']),
  bothNonAdj: diff3Merge(['a','X','c','d','e'], base, ['a','b','c','Y','e']),
  overlap:    diff3Merge(['a','P','c'], ['a','b','c'], ['a','Q','c']),
  identical:  diff3Merge(['a','Z','c'], ['a','b','c'], ['a','Z','c']),
};
const out = {
  onlyLocal:  !hasConflict(cases.onlyLocal)  && flat(cases.onlyLocal).join(',')  === 'a,X,c,d,e',
  onlyRemote: !hasConflict(cases.onlyRemote) && flat(cases.onlyRemote).join(',') === 'a,b,c,Y,e',
  bothNonAdj: !hasConflict(cases.bothNonAdj) && flat(cases.bothNonAdj).join(',') === 'a,X,c,Y,e',
  overlap:    hasConflict(cases.overlap),
  identical:  !hasConflict(cases.identical)  && flat(cases.identical).join(',')  === 'a,Z,c',
};
process.stdout.write(JSON.stringify(out));
`;
function runDiff3() {
  const tmp = path.join(REPO, '_r309diff3.ts');
  fs.writeFileSync(tmp, evalSrc);
  try { const out = execSync(`npx tsx _r309diff3.ts`, { cwd: REPO, encoding: 'utf8', timeout: 60000, env: { ...process.env, PATH: `${NODE18}:${process.env.PATH}` } });
    return JSON.parse(out.trim().split('\n').pop()); }
  catch (e) { return { error: ((e.stdout || '') + (e.stderr || '')).slice(0, 200) }; }
  finally { fs.rmSync(tmp, { force: true }); }
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const d = runDiff3();
    const diff3Ok = d && d.onlyLocal && d.onlyRemote && d.bothNonAdj && d.overlap && d.identical;

    // PART B — 3-pane mount
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/edit`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    const b = await page.evaluate(async () => {
      const el = document.createElement('rb-diff-editor'); document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 1500)); // connectedCallback + monacoLoader
      const panes = el.querySelectorAll('.de-pane, [class*=de-pane], .monaco-editor');
      const txt = (el.textContent || '');
      const threePane = /Local/i.test(txt) && /Result/i.test(txt) && /Repository/i.test(txt);
      const applyAll = !!el.querySelector('.de-apply-all');
      el.remove();
      return { threePaneLabels: threePane, panes: panes.length, applyAll };
    });
    await ctx.close();
    const mountOk = b.threePaneLabels && b.applyAll && b.panes >= 3;

    // PART C — GitApi.mergeBase: live resolves + reject-first on a bad ref (guardRef)
    const mbOk = (await api('/api/git/merge-base?repo=rawbin&a=main&b=main')).status === 200;
    const mbReject = [400, 403].includes((await api('/api/git/merge-base?repo=rawbin&a=main&b=' + encodeURIComponent('; id'))).status);
    const mergeBaseOk = mbOk && mbReject;

    const pass = diff3Ok && mountOk && mergeBaseOk;
    results.push(pass);
    console.log(`iter ${i}: diff3[oL=${d.onlyLocal} oR=${d.onlyRemote} both=${d.bothNonAdj} overlap→conflict=${d.overlap} ident=${d.identical}]=${diff3Ok} | 3pane[labels=${b.threePaneLabels} panes=${b.panes} applyAll=${b.applyAll}]=${mountOk} | mergeBase[live=${mbOk} rejectBadRef=${mbReject}]=${mergeBaseOk} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT R30.9 3-way merge (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
