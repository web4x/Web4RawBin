// R40.56 Tron-open-defect DIAGNOSIS (discriminate, do NOT fix). Symptom /model @390 v0.8.124: pin row reads
// "📌 Current — Task 40.1" while THAT SAME task's drawer still offers "📌 Set as Current" (7a956c21). Two views, one
// screen, disagreeing. Discriminate 3 causes, cheapest-eliminator-first:
//   (A) STALE BUNDLE / SW CACHE — reproduce COLD (no SW, cache off). Vanishes cold + reproduces warm ⇒ A.
//   (B) STALE pinRole PAYLOAD — contradicts BEFORE a forced drawer refetch, AGREES AFTER ⇒ B (pinRole computed at
//       fetch time; a drawer fetched pre-designation carries the stale role — the staleness class we fixed for STATUS,
//       never applied to pinRole). action bar Set-as-Current shows when server-computed model.pinRole !== 'current'.
//   (C) PATH NOT COVERED — /trace agrees but /model contradicts ⇒ C.
// Capture the SAME FRAME Tron did: pin row AND action bar TOGETHER in ONE @390 frame = the cross-view-agreement assertion.
// Scratch at HEAD=v0.8.124 (phantom-guard servedVersion==prod), own owner session, ZERO prod mutation.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TASK = process.env.MC_TASK || '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1 — Tron's exact task
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const OUT = 'test-results/r4056-diagnose'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
const CSU = 'current-sprint-singleton-0000-000000000001';
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha} (prod=0.8.124; phantom-guard by servedVersion)`);

// TREE-SIDE TRUTH via the authoritative resolved-current API (the pin renders THIS) — robust vs parsing pin text.
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(() => null);
const resolvedCurrent8 = async () => { const d = await jf(`/api/trace/children/${CSU}`); const kids = d?.children || []; const cur = kids.find(c => /Current\b/.test(String(c.name || '')) && !/CurrentSprint/.test(String(c.name || ''))); return cur?.uuid?.slice?.(0, 8) || null; };
const statusOf = async (u) => { const d = await jf(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.status ?? d?.model?.status ?? null; };
// find tasks whose designation ACTUALLY resolves as current here (non-Done). Return [DESIG(prefer 40.1), PARK].
async function pickDesignatable() {
  const tryTask = async (u) => { const st = await fetch(`${f.base}/api/task/${u}/make-current`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0); return st === 200 && (await resolvedCurrent8()) === u.slice(0, 8); };
  const found = [];
  if (await tryTask(TASK)) found.push({ u: TASK, note: 'Tron 40.1' });
  const tree = await jf(`/api/trace/children/${CSU}`);
  for (const k of (tree?.children || [])) {
    if (found.length >= 2) break;
    if (k.uuid && /Task/i.test(k.type || '') && !found.some(x => x.u === k.uuid)) { const s = await statusOf(k.uuid); if (/Planned|In.?Progress|QA/i.test(s || '') && await tryTask(k.uuid)) found.push({ u: k.uuid, note: `${k.uuid.slice(0,8)}:${s}` }); }
  }
  return found;
}

const nameOf = async (u) => { const d = await jf(`/api/ior/ior:instance:${u}`); return d?.unit?.model?.name ?? d?.model?.name ?? ''; };
const browser = await webkit.launch({ headless: true });
// CONSUMER-VS-CONSUMER read on the RENDERED artifact (never view-vs-model). Two consumers of "is DESIG current":
//   consumer PIN (rb-trace-tree pin row) — does the rendered '📌 Current' row name DESIG?
//   consumer BAR (rb-detail-drawer action-bar, drawer open on DESIG) — offers 'Set as Current' ⇒ it thinks DESIG NOT current.
// AGREE: pin-says-DESIG-current  ⇔  bar-does-NOT-offer-Set-as-Current. Disagreement (post-broadcast) = the defect.
const readConsumers = (page, desigNum, desig8) => page.evaluate(({ desigNum, desig8 }) => {
  const tree = document.querySelector('rb-trace-tree');
  const pinRow = ((tree?.innerText || '').match(/📌 Current[^\n]*/) || [''])[0];
  const pinReadable = !!tree && !!pinRow;
  const pinSaysDesigCurrent = new RegExp(`\\b${desigNum.replace('.', '\\.')}\\b`).test(pinRow) || (desig8 && new RegExp(desig8, 'i').test(pinRow));
  const drawer = document.querySelector('rb-detail-drawer');
  const bar = drawer?.querySelector('.drawer-actionbar');
  const barReadable = !!bar;
  const barText = bar?.innerText || '';
  const drawerRef = drawer?.getAttribute('ref') || '';
  const drawerOnDesig = desig8 ? new RegExp(desig8, 'i').test(drawerRef) : false;
  const barOffersSetCurrent = /Set as Current/i.test(barText);
  return { pinReadable, pinRow, pinSaysDesigCurrent, barReadable, drawerRef, drawerOnDesig, barOffersSetCurrent, barText: barText.replace(/\s+/g, ' ').slice(0, 120) };
}, { desigNum, desig8 });

async function runSequence(route, mode, DESIG, DESIG_NUM, PARK) {
  const cold = mode === 'cold';
  const d8 = DESIG.slice(0, 8);
  // PARK the current away from DESIG (server-side) so DESIG genuinely STARTS not-current
  await fetch(`${f.base}/api/task/${PARK}/make-current`, { method: 'POST', headers: oh });
  const parkedCur = await resolvedCurrent8();

  const ctx = await browser.newContext({ ...IOS, serviceWorkers: cold ? 'block' : 'allow' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
  const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();

  if (!cold) { await page.goto(`${f.base}/${route}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}); await sleep(1500); } // warm: install SW + cache
  await page.goto(`${f.base}/${route}`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  await sleep(600);

  // 1) OPEN the drawer on DESIG while it is NOT current (real selection-changed) → bar SHOULD offer Set-as-Current
  await page.evaluate((u) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + u] } })), DESIG);
  await sleep(1800);
  const pre = await readConsumers(page, DESIG_NUM, d8); const preCur = await resolvedCurrent8();

  // 2) DESIGNATE DESIG via the seam (node POST → server make-current → ws broadcast to the open page). This is the REAL
  //    live-broadcast path (as R40.53): the subscribed tree re-derives; the drawer (per architect) does not. Drawer STAYS open.
  const mcStatus = await fetch(`${f.base}/api/task/${DESIG}/make-current`, { method: 'POST', headers: oh }).then(r => r.status).catch(() => 0);
  // ★ DYNAMIC POST-BROADCAST-SETTLE: the live re-derive chain (broadcast → _csPinUnsub → refreshCurrentSlot fetch →
  // :103 universalActionBar re-render) completes ~3.4s later (trace r4057-live-trace). Poll until the action-bar text
  // STABILISES (2 identical reads) up to 9s — a fixed 2.5s read caught the bar MID-re-derive = a settle-timing false-RED.
  let prevBar = null; for (let k = 0; k < 30; k++) { await sleep(300); const b = await page.evaluate(() => document.querySelector('rb-detail-drawer .drawer-actionbar')?.innerText || ''); if (b && b === prevBar) break; prevBar = b; }
  const tapped = `POST:${mcStatus}`;

  // 3) ASSERT CONSUMER-VS-CONSUMER (post-broadcast, no refetch): pin-consumer vs bar-consumer about the SAME task DESIG
  const live = await readConsumers(page, DESIG_NUM, d8); const liveCur = await resolvedCurrent8();
  // decisive cause check: the server's FRESH baked pinRole for DESIG (what a refetch WOULD deliver). single-source with slots
  // → should be 'current'. If 'current' while the bar still offers Set-as-Current ⇒ the bar is stale vs a CORRECT fresh
  // payload = MISSING DRAWER SUBSCRIPTION (a real refetch fixes it), not a second-source server bug.
  const iorD = await jf(`/api/ior/ior:instance:${DESIG}`); const serverPinRole = iorD?.unit?.model?.pinRole ?? iorD?.model?.pinRole ?? '(none)';
  const bothReadable = live.pinReadable && live.barReadable && live.drawerOnDesig; // fail-closed if a view is unreadable
  const consumersDisagree = live.pinSaysDesigCurrent && live.barOffersSetCurrent;  // pin: DESIG IS current · bar: DESIG NOT current
  const contradiction = bothReadable && consumersDisagree;                          // the cross-view divergence = RED
  await page.screenshot({ path: `${OUT}/r4056-frame-${route}-${mode}-v${f.servedVersion}.png` }); // one-frame POST-broadcast @390

  // 4) control: FORCE a drawer refetch (deselect→re-select DESIG) → a fresh payload makes the bar AGREE (proves staleness class)
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [] } })));
  await sleep(400);
  await page.evaluate((u) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + u] } })), DESIG);
  await sleep(1800);
  const after = await readConsumers(page, DESIG_NUM, d8);
  const agreesAfterRefetch = !after.barOffersSetCurrent;

  await ctx.close();
  const setupLanded = liveCur === d8; // server truth: the designation actually resolved DESIG as current
  return { route, mode, DESIG: d8, tapped, parkedCur, preCur, pre_barSetCurrent: pre.barOffersSetCurrent, liveCur, setupLanded, serverPinRole,
    pinSaysDesigCurrent: live.pinSaysDesigCurrent, barOffersSetCurrent: live.barOffersSetCurrent, drawerOnDesig: live.drawerOnDesig,
    bothReadable, contradiction, agreesAfterRefetch, pinRow: live.pinRow, barText: live.barText };
}

const raw = { servedVersion: f.servedVersion, sha: f.worktreeSha, runs: [] };
try {
  // pick DESIG (a task whose designation actually resolves as current here) + PARK (another designatable, non-Done)
  const picks = await pickDesignatable();
  if (picks.length < 2) { console.log(`⚠ SETUP: need 2 designatable tasks, found ${picks.length} — cannot stage the frame. Report as finding, NOT a green.`); }
  const desig = picks[0]; const park = (picks[1] || picks[0]).u;
  const desigName = await nameOf(desig.u); const DESIG_NUM = (desigName.match(/Task\s+([0-9]+\.[0-9]+)/) || desigName.match(/([0-9]+\.[0-9]+)/) || ['', desig.u.slice(0, 8)])[1];
  console.log(`DESIG=${desig.u.slice(0,8)} num="${DESIG_NUM}" (${desig.note}) · PARK=${park?.slice(0,8)}`);
  raw.desig = { uuid8: desig.u.slice(0, 8), num: DESIG_NUM, note: desig.note };

  // ★ DECISIVE SERVER-SIDE PROBE (no browser): does the baked pinRole TRACK the designation? For each task, designate it
  // then read its OWN /api/ior pinRole. pinRole=='current' ⇔ the payload agrees with slots. A designated task whose fresh
  // pinRole is 'other' while slots.current==it ⇒ SECOND SOURCE at the server (attachTaskPinRole.currentTaskUuidFromSlots
  // disagrees with the pin resolver) — a subscription fix cannot cure it. Distinguishes cross-sprint-specific vs general.
  const pinRoleProbe = [];
  for (const t of picks.map(p => p.u)) {
    await fetch(`${f.base}/api/task/${t}/make-current`, { method: 'POST', headers: oh });
    const rc = await resolvedCurrent8(); const ior = await jf(`/api/ior/ior:instance:${t}`); const pr = ior?.unit?.model?.pinRole ?? ior?.model?.pinRole ?? '(none)';
    const nm = await nameOf(t);
    pinRoleProbe.push({ uuid8: t.slice(0, 8), num: (nm.match(/([0-9]+\.[0-9]+)/) || ['', '?'])[1], designated_is_slotsCurrent: rc === t.slice(0, 8), freshPinRole: pr, AGREES: rc === t.slice(0, 8) && pr === 'current' });
  }
  console.log('DECISIVE pinRole-vs-slots probe (designate each → read its own fresh pinRole):');
  pinRoleProbe.forEach(p => console.log(`  task ${p.num} (${p.uuid8}): slots.current==self=${p.designated_is_slotsCurrent} freshPinRole=${p.freshPinRole} → AGREES=${p.AGREES}`));
  raw.pinRoleProbe = pinRoleProbe;

  // ORDER: /model cold (A-eliminate + primary repro), /trace cold (C), /model warm (A-confirm)
  for (const [route, mode] of [['model', 'cold'], ['trace', 'cold'], ['model', 'warm']]) {
    const r = await runSequence(route, mode, desig.u, DESIG_NUM, park);
    raw.runs.push(r);
    console.log(`\n[${route} ${mode}] designate=${r.tapped} DESIG=${r.DESIG} setupLanded(server current==DESIG)=${r.setupLanded}`);
    console.log(`  PRE  : resolvedCurrent=${r.preCur} (parked=${r.parkedCur}) bar-offers-SetCurrent=${r.pre_barSetCurrent}`);
    console.log(`  POST-BROADCAST consumers: PIN-says-DESIG-current=${r.pinSaysDesigCurrent} · BAR-offers-SetCurrent=${r.barOffersSetCurrent} · drawerOnDesig=${r.drawerOnDesig} readable=${r.bothReadable} · SERVER-fresh-pinRole=${r.serverPinRole}`);
    console.log(`    → CONSUMERS DISAGREE (RED) = ${r.contradiction}   pin="${r.pinRow}" bar="${r.barText}"`);
    console.log(`  control after-refetch: bar-drops-SetCurrent=${r.agreesAfterRefetch}`);
    if (!r.setupLanded) console.log(`  ⚠ SETUP DID NOT LAND (server current=${r.liveCur} != DESIG ${r.DESIG}) — this run's verdict is INVALID, not a green`);
  }

  // ── R40.57 GATE VERDICT + DISCRIMINATION ──
  const mCold = raw.runs.find(r => r.route === 'model' && r.mode === 'cold');
  const tCold = raw.runs.find(r => r.route === 'trace' && r.mode === 'cold');
  const mWarm = raw.runs.find(r => r.route === 'model' && r.mode === 'warm');
  console.log('\n════ R40.57 CROSS-VIEW-AGREEMENT GATE — verdict on served v' + f.servedVersion + ' ════');
  // GATE RED = at least one enumerated consumer-pair DISAGREES in the post-broadcast state (live specimen = the real bug)
  const gateRed = raw.runs.some(r => r.contradiction);
  console.log(`  GATE (must RED on v0.8.124 live specimen): ${gateRed ? 'RED ✓ (consumers disagree post-broadcast — the real bug)' : 'GREEN ✗ — if GREEN here the gate asserts the WRONG property; STOP, do NOT tune to force RED'}`);
  // DISCRIMINATION for the architect/expert (which cause — informs the fix). Use the run(s) that STAGED the frame
  // (setupLanded + both consumers readable). /model pin is unreadable in scratch (documented /model data-gap) → /trace
  // is the readable-both-consumers surface; the defect (drawer missing subscription) is surface-agnostic.
  const staged = raw.runs.filter(r => r.setupLanded && r.bothReadable);
  const anyDisagree = staged.some(r => r.contradiction);
  const freshRoleCurrent = staged.some(r => r.contradiction && r.serverPinRole === 'current'); // fresh payload IS correct → bar is just stale
  const coldReproduced = raw.runs.some(r => r.mode === 'cold' && r.contradiction);
  const warmOnly = !coldReproduced && raw.runs.some(r => r.mode === 'warm' && r.contradiction);
  let cause = 'UNDETERMINED (no run staged both readable consumers — report setup finding, NOT a green)';
  if (warmOnly) cause = 'A — STALE BUNDLE / SW CACHE (vanishes cold, reproduces warm)';
  else if (anyDisagree && freshRoleCurrent) cause = 'B — MISSING DRAWER SUBSCRIPTION (post-broadcast the pin says DESIG current + bar still offers Set-as-Current, WHILE the server FRESH pinRole for DESIG == "current" → the served payload is CORRECT single-source with slots; the drawer simply never re-fetches on the currentsprint broadcast. A refetch fixes it; architect 08d90e60f. NOT a second-source server bug.)';
  else if (anyDisagree && !freshRoleCurrent) cause = 'B-DEEPER / SECOND-SOURCE — post-broadcast disagreement AND the server FRESH pinRole for DESIG != "current" while slots.current==DESIG → pinRole computation disagrees with slots at the SERVER (R40.56 second-source class in the pinRole consumer). Fix is at the source, not just a subscription.';
  console.log(`  reproduced COLD=${coldReproduced} · staged-runs-disagree=${anyDisagree} · server-fresh-pinRole-on-disagree=${staged.find(r=>r.contradiction)?.serverPinRole}`);
  console.log(`  ► CAUSE: ${cause}`);
  raw.gateRed = gateRed; raw.cause = cause;
  fs.writeFileSync(`${OUT}/r4056-diagnose-raw-v${f.servedVersion}.json`, JSON.stringify(raw, null, 2));
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
