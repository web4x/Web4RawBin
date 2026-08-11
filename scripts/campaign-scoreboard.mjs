// campaign-scoreboard.mjs — measure EVERY S30++ task from UNITS (units win over boards).
// Pure node (inlines the C4 (C) chain-edge logic from StepEvidence). No board reads.
import fs from 'fs';
import path from 'path';

const R = '/var/dev/Workspaces/web4x/Web4RawBin';
const IDX = path.join(R, 'scenario/index');
const bare = s => String(s ?? '').replace('ior:instance:', '');
const ORDER = ['Planned', 'In Progress', 'QA Review', 'Done'];
// full sprint uuids (prefix-match on parent walk)
const SPRINTS = { '2173e549': 'S30', '3c05f411': 'S31', '332585f3': 'S32', 'b86b53cc': 'S37', '8e8b32d6': 'S40' };
// CAMPAIGN-SCOPE BOUNDARY (PO ruling 2026-08-11): reqs minted DURING the finish-campaign in response to
// what we discovered are NEXT-PHASE hardening, NOT part of the S30++ finish-count (else the target recedes
// as fast as we advance = un-finishable). A task covering one of these leaves the remaining-count by
// construction (same shape as supersededBy). Extend this set as PO rules more discoveries next-phase.
const NEXT_PHASE_REQS = new Set([
  'dc353c14-ec76-4c79-a809-81ec318e8dbe', // R40.30 gate-rot: behavioural gates target stable test hooks
  '70bbaec5-a445-457a-b123-db0f2822ab16', // R40.31 gate-pollution
]);
const coversNextPhase = t => (t.m.coveredRequirements || []).some(r => NEXT_PHASE_REQS.has(bare(r)));
// BUILD-COUPLED overrides (expert-measured 2026-08-11): a task the coarse rule calls 'marker' but whose
// markerPending Impl credits a host decl that DOES NOT EXIST in src yet — placing the marker would be a
// FICTIONAL marker (AST-rejected, the lying-marker class). Its flip RIDES another task's build. The coarse
// script cannot grep src for the host decl, so these are measured overrides (task-uuid -> coupled-on note).
const BUILD_COUPLED = new Map([
  // (T40.6 95d74272 was here 2026-08-11 until buildTypedModel got BUILT on DeploymentModel.ts, strict-AST-flipped d3e02a99b durable on origin -> marker no longer fictional -> auto re-classifies to gate. Mechanism retained for future measured couplings.)
]);

const byUuid = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.scenario.json')) {
      try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); const m = j.model || {}; if (m.uuid) byUuid.set(m.uuid, { ior: j.ior, m }); } catch {}
    }
  }
})(IDX);
const get = u => byUuid.get(bare(u));

const deriveStatus = cl => {
  if (typeof cl !== 'string') return 'Planned';
  let best = 'Planned';
  for (const line of cl.split('\n')) { const mm = line.match(/^- \[x\] (Planned|In Progress|QA Review|Done)/); if (mm && ORDER.indexOf(mm[1]) > ORDER.indexOf(best)) best = mm[1]; }
  return best;
};

// resolve a task's sprint by walking parent chain to a known Sprint uuid (or sprintName fallback)
const sprintOf = t => {
  let cur = t, hops = 0;
  while (cur && hops++ < 8) {
    const pref = (cur.m.uuid || '').slice(0, 8);
    if (SPRINTS[pref]) return SPRINTS[pref];
    const par = cur.m.parent ? get(cur.m.parent) : null;
    if (!par) break; cur = par;
  }
  const sn = String(t.m.sprintName || '').match(/Sprint (30|31|32|37|40)\b/);
  return sn ? 'S' + sn[1] : null;
};

// chain walk: shippedImpl / anyImpl / anyTestWired / coveredByTest
const chainInfo = t => {
  let shippedImpl = false, anyImpl = false, anyTestWired = false, coveredByTest = false;
  for (const r of (t.m.coveredRequirements || []).map(get).filter(Boolean))
    for (const uc of (r.m.useCases || []).map(get).filter(Boolean)) {
      const M = uc.m.method ? get(uc.m.method) : null; if (!M) continue;
      for (const im of (M.m.implementations || []).map(get).filter(Boolean)) {
        anyImpl = true;
        if (im.m.markerPending === false) shippedImpl = true;
        for (const teu of (im.m.tests || [])) { anyTestWired = true; const te = get(teu); if (!te) continue; const tk = (te.m.implementations || []).some(x => bare(x) === im.m.uuid); if (tk && te.m.status === 'pass') coveredByTest = true; }
      }
    }
  return { shippedImpl, anyImpl, anyTestWired, coveredByTest };
};

const DEVICE = /device-only|iOS|never.?headless|Tron device|@390 Tron|Tron-real/i;
const EXCLUDERE = /superseded|deprecated|placeholder|abandoned/i;

const tasks = [...byUuid.values()].filter(x => x.ior === 'ior:class:Task' && sprintOf(x));
const rows = [];
for (const t of tasks) {
  const sp = sprintOf(t);
  const derived = deriveStatus(t.m.statusChecklist);
  const drift = t.m.status && t.m.status !== derived ? `${t.m.status}!=${derived}` : '';
  const ci = chainInfo(t);
  const noChain = !(t.m.coveredRequirements || []).length;
  let gap = null;
  if (t.m.supersededBy) gap = 'SUPERSEDED';          // terminal by supersession (orthogonal to derived status) — leaves remaining
  else if (coversNextPhase(t)) gap = 'NEXT-PHASE';   // campaign-scope boundary — minted-during-campaign hardening, outside the finish-count
  else if (derived === 'Done' || derived === 'QA Review') gap = derived === 'Done' ? 'DONE' : 'QA-REVIEW';
  else if (BUILD_COUPLED.has(t.m.uuid)) gap = 'build-coupled'; // measured override — fictional-marker avoided; flip rides another task's build (still REMAINING)
  else if (ci.coveredByTest) gap = 'RIPE';           // chain-complete-to-Test, board-lag -> flip-ready
  else if (ci.shippedImpl) gap = ci.anyTestWired ? 'two-key' : 'gate';
  else if (ci.anyImpl) gap = 'marker';
  else gap = 'build';
  const device = DEVICE.test(t.m.acceptanceCriteria || '') || DEVICE.test(t.m.remainingIssues || '');
  const excl = EXCLUDERE.test(t.m.name || '') || EXCLUDERE.test(t.m.description || '') || (noChain && derived === 'Planned');
  rows.push({ sp, uuid: (t.m.uuid || '').slice(0, 8), name: (t.m.name || '').slice(0, 60), derived, drift, gap, device, excl, noChain });
}

// ---- report ----
const TERMINAL = new Set(['DONE', 'QA-REVIEW', 'SUPERSEDED', 'NEXT-PHASE']);
const remaining = rows.filter(r => !TERMINAL.has(r.gap));
const perSprint = sp => rows.filter(r => r.sp === sp);
const count = (arr, g) => arr.filter(r => r.gap === g).length;

console.log('=== CAMPAIGN SCOREBOARD (measured from units) ===');
console.log('TOTAL tasks S30++:', rows.length, '| Done:', rows.filter(r => r.gap === 'DONE').length, '| QA-Review:', rows.filter(r => r.gap === 'QA-REVIEW').length, '| SUPERSEDED(terminal):', rows.filter(r => r.gap === 'SUPERSEDED').length, '| NEXT-PHASE(scope-excl):', rows.filter(r => r.gap === 'NEXT-PHASE').length, '| REMAINING(<QA):', remaining.length);
console.log('\n-- per-sprint (Done / QA-Review / remaining) --');
for (const sp of ['S30', 'S31', 'S32', 'S37', 'S40']) {
  const a = perSprint(sp);
  console.log(`${sp}: total ${a.length} | Done ${a.filter(r => r.gap === 'DONE').length} | QA ${a.filter(r => r.gap === 'QA-REVIEW').length} | superseded ${a.filter(r => r.gap === 'SUPERSEDED').length} | remaining ${a.filter(r => !TERMINAL.has(r.gap)).length}`);
}
console.log('\n-- REMAINING by what it needs --');
console.log('RIPE(flip-ready):', count(remaining, 'RIPE'), '| two-key:', count(remaining, 'two-key'), '| gate:', count(remaining, 'gate'), '| marker:', count(remaining, 'marker'), '| build:', count(remaining, 'build'), '| build-coupled:', count(remaining, 'build-coupled'));
console.log('device-blocked (subset overlay):', remaining.filter(r => r.device).length);
console.log('\n-- RIPE (closest to QA-Review, flip-ready) --');
for (const r of remaining.filter(r => r.gap === 'RIPE')) console.log(`  ${r.sp} ${r.uuid} [${r.derived}${r.drift ? ' drift:' + r.drift : ''}] ${r.name}`);
console.log('\n-- two-key (next-closest) --');
for (const r of remaining.filter(r => r.gap === 'two-key')) console.log(`  ${r.sp} ${r.uuid} [${r.derived}] ${r.name}`);
console.log('\n-- ALL 13 REMAINING (sprint uuid [status] gap device? : name) --');
for (const r of remaining.sort((a,b)=>a.sp.localeCompare(b.sp))) console.log(`  ${r.sp} ${r.uuid} [${r.derived}] ${r.gap}${r.device?' DEVICE':''}${r.noChain?' NOCHAIN':''} : ${r.name}`);
console.log('\n-- EXCLUDE candidates (concept/superseded/no-chain) --');
for (const r of rows.filter(r => r.excl && r.gap !== 'DONE' && r.gap !== 'QA-REVIEW')) console.log(`  ${r.sp} ${r.uuid} [${r.derived}] noChain=${r.noChain} ${r.name}`);
console.log('\n-- status drift (unit.status != derived-from-checklist) --');
for (const r of rows.filter(r => r.drift)) console.log(`  ${r.sp} ${r.uuid} ${r.drift} ${r.name}`);
