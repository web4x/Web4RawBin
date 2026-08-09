// S35 R35.4 DRY-fix — the traceability folder MIRRORS the existing /trace current+sprints-overview (NOT flat 497 req
// roots). traceabilityRoots (helper of mofChildren b6c88d83, server.ts:1264) + /api/trace/sprints (server.ts:2104) both
// use the SHARED sprintOverviewNodes → parity by construction. real-WebKit (Safari 605.1.15) @390, DET-3x, served 0.8.51.
// GATE: (1) rawbin:traceability children = CurrentSprint PINNED first + Sprints S1→S35 IN ORDER (kind sprint/currentsprint,
// NOT Requirement; ~36 not 497); (2) PARITY — the sprint uuids (minus CurrentSprint) EXACTLY == /api/trace/sprints uuids in
// the SAME order (DRY shared helper); (3) a Sprint EXPANDS (→ tasks/reqs) and one level deeper reaches the chain; (4) UI @390
// — expandPath reveals SPRINT nodes in the tree (not a 497-flat flood).
// [test:uuid:83abce21-bd4e-4b5f-bc94-7e71517aeee8] S35 R35.4 traceability DRY-parity (Impl b6c88d83 mofChildren, RE-POINTED
// from the retired flat-497 assertion to this parity gate) @390 real-WebKit DET-3x served v0.8.51: rawbin:traceability MIRRORS
// the existing /trace current+sprints-overview via the SHARED sprintOverviewNodes helper — children = CurrentSprint pinned +
// Sprints S01→S35 IN ORDER (NOT flat 497 Requirement roots; ~36 nodes), the sprint uuids EXACTLY == /api/trace/sprints in the
// same order (structural parity by construction), a Sprint expands to its reqs→chain, and the tree renders sprint nodes @390.
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R354_TARGET || '0.8.51';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r354-parity') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;height:100dvh;display:flex;flex-direction:column}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}#err{color:#f85149}</style></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div><script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); let throws = 0; page.on('pageerror', () => throws++);
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.getElementById('model-tree'), { timeout: 15000 }).catch(() => {});

  // DATA + PARITY (fetched on the served origin)
  const data = await page.evaluate(async () => {
    const j = async (u) => { try { return await (await fetch(u)).json(); } catch { return null; } };
    const traceRaw = await j('/api/trace/children/rawbin:traceability');
    const kids = (traceRaw?.children || traceRaw || []);
    const sprintsOverview = await j('/api/trace/sprints') || [];
    const isCurrent = (n) => /current/i.test((n.name || '') + (n.icon || '') + (n.type || '') + (n.uuid || ''));
    const current = kids[0] || {};
    const traceSprints = kids.filter(n => !isCurrent(n));
    const first = traceSprints[0] || {};
    // expand a sprint → its children (tasks/reqs), then one deeper → chain
    const sChildren = first.uuid ? (await j('/api/trace/children/' + first.uuid)) : null;
    const sKids = (sChildren?.children || sChildren || []);
    const deep = sKids[0]?.uuid ? (await j('/api/trace/children/' + sKids[0].uuid)) : null;
    const deepKids = (deep?.children || deep || []);
    return {
      total: kids.length,
      currentPinned: isCurrent(current),
      childrenAreSprints: kids.every(n => !/requirement/i.test((n.type || '') + (n.icon || ''))) && kids.some(n => /sprint/i.test((n.type || '') + (n.icon || '') + (n.name || ''))),
      notFlat497: kids.length < 100,
      parityUuids: traceSprints.map(n => n.uuid).join(',') === sprintsOverview.map(n => n.uuid).join(','),
      parityCount: traceSprints.length === sprintsOverview.length,
      ordered: sprintsOverview.every((n, k) => k === 0 || Number(sprintsOverview[k - 1].number || 0) <= Number(n.number || 0)),
      sprintExpands: sKids.length > 0,
      reachesChain: deepKids.length > 0,
      sampleFirst: (traceSprints[0]?.name || '').slice(0, 20), sprintOverviewLen: sprintsOverview.length,
    };
  });

  // UI @390: expandPath reveals SPRINT nodes (not a 497-flat flood)
  await page.evaluate(async () => { const t = document.getElementById('model-tree'); if (t?.expandPath) await t.expandPath(['mof-m1', 'project:RawBin', 'rawbin:traceability']); });
  await sleep(2500);
  const ui = await page.evaluate(() => {
    const items = [...document.querySelectorAll('rb-object-item')];
    return { rendered: items.length, hasSprintNode: items.some(el => /sprint/i.test((el.getAttribute('ref') || '') + (el.textContent || ''))) };
  });
  if (i === 1) await page.screenshot({ path: OUT + 'traceability.png' });
  await ctx.close();
  return { ...data, uiRendered: ui.rendered, uiHasSprint: ui.hasSprintNode, throws };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); } finally { await browser.close(); }

console.log(`\n===== S35 R35.4 traceability PARITY @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x (served ${servedVersion}) =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const det = k => runs.length === 3 && runs.every(R => R[k] === true);
const structure = det('currentPinned') && det('childrenAreSprints') && det('notFlat497');
const parity = det('parityUuids') && det('parityCount') && det('ordered');
const expand = det('sprintExpands') && det('reachesChain');
const ui = runs.every(R => R.uiHasSprint) && runs.every(R => R.uiRendered < 100); // sprint nodes, not 497-flat
const noThrows = runs.every(R => R.throws === 0);
console.log(`\nSTRUCTURE (CurrentSprint pinned + Sprints, NOT flat 497): ${structure ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PARITY (rawbin:traceability sprints == /api/trace/sprints, ordered): ${parity ? 'GREEN DET-3x' : 'RED'}`);
console.log(`EXPAND (Sprint→tasks/reqs→chain): ${expand ? 'GREEN DET-3x' : 'RED'}`);
console.log(`UI @390 (sprint nodes render, not 497-flood): ${ui ? 'GREEN' : 'RED'} | no throws: ${noThrows ? 'GREEN' : 'RED'}`);
const green = structure && parity && expand && ui && noThrows && servedVersion === TARGET;
console.log('OVERALL R35.4 PARITY:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
