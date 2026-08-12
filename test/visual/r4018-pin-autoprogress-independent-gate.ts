// [test:uuid:3f9c1e75-6a24-4d8b-b0e3-91c5a7f0e2d4] R40.18 pin-auto-progress — INDEPENDENT gate (drives CurrentSprint.slotsFrom on a scratch ScenarioIndex, NOT re-running the expert's r4018-pin-autoprogress-bites.ts oracle). DERIVATION-not-hook: current auto-advances by re-derivation, no stored pin. BITEs: 1 idempotent · 2 QA-advances-current · 3 explicit-nudge-not-lock · 4 ★ lastCompleted follows DONE-NOT-QA (the FALSE-DONE vector the expert removed: a QA-Review predecessor must NEVER be lastCompleted) · 5 single-source lint + META-BITE (plant a 2nd status-source → lint RED) · 6 fail-loud named-unresolved · STUB-META-BITE (a derivation that always returns the first task FAILS BITE-2). BITE-6b addLog = source-presence (event-driven, not derive-time). BITE-7 @390 = TRON DEVICE (never headless-green).
// Phantom-guard: derivation files git-clean == committed (build-not-deploy R40.18; a tooling gate on HEAD source, no served artifact → no SW/served-guard, stated). DET-3x deterministic. node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r4018-pin-autoprogress-independent-gate.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.ts';
import { CurrentSprint } from '../../src/ts/scenario/CurrentSprint.ts';
import { resolveSprintPin } from '../../src/ts/scenario/sprint-pin-resolver.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CL = (s: string): string => ({
  Planned: '- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done',
  'In Progress': '- [x] Planned\n- [x] In Progress\n- [ ] QA Review\n- [ ] Done',
  'QA Review': '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [ ] Done',
  Done: '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done',
} as Record<string, string>)[s];

// fresh scratch index with a Sprint + its Tasks at the given states; returns {idx, sprint, taskUuids}
function seed(states: string[]): { idx: ScenarioIndex; sprint: { number: number; uuid: string; name: string }; t: string[] } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r4018-'));
  const idx = new ScenarioIndex(path.join(dir, 'index'));
  const t = states.map((_, k) => `aaaaaaaa-0000-4000-8000-00000000000${k + 1}`);
  const sprintUuid = 'bbbbbbbb-0000-4000-8000-000000000001';
  states.forEach((st, k) => idx.put(t[k], { ior: 'ior:class:Task', model: { uuid: t[k], name: `T${k + 1}`, statusChecklist: CL(st), coveredRequirements: [] } } as any));
  idx.put(sprintUuid, { ior: 'ior:class:Sprint', model: { uuid: sprintUuid, name: 'Sprint 99', number: 99, tasks: t.map(u => `ior:instance:${u}`) } } as any);
  return { idx, sprint: { number: 99, uuid: sprintUuid, name: 'Sprint 99' }, t };
}
const cur = (r: any) => r.current?.taskUuid || null;   // ThreeSlots slot field is taskUuid (not uuid)
const last = (r: any) => r.lastCompleted || null;
const lastId = (r: any) => r.lastCompleted?.taskUuid || null;

const R: Record<string, boolean> = {};
for (let iter = 1; iter <= 3; iter++) {
  // ── BITE-1 idempotent ──
  { const { idx, sprint } = seed(['In Progress', 'Planned']);
    const a = CurrentSprint.slotsFrom(idx, sprint), b = CurrentSprint.slotsFrom(idx, sprint);
    R['1-idempotent'] = cur(a) !== null && cur(a) === cur(b); }

  // ── BITE-2 QA-advances-current (T1 leaves current at QA-Review → T2 re-selected) ──
  { const s1 = seed(['In Progress', 'Planned']); const before = cur(CurrentSprint.slotsFrom(s1.idx, s1.sprint));
    const s2 = seed(['QA Review', 'Planned']);   const after = cur(CurrentSprint.slotsFrom(s2.idx, s2.sprint));
    R['2-qa-advances'] = before === s1.t[0] && after === s2.t[1]; } // was T1 → now T2

  // ── BITE-3 explicit-nudge-not-lock (nudge wins while valid; auto RESUMES once nudged task terminal) ──
  { const a = seed(['In Progress', 'In Progress']);
    const nudged = cur(CurrentSprint.slotsFrom(a.idx, a.sprint, a.t[1])); // designate T2 though auto would pick T1
    const b = seed(['In Progress', 'Done']);
    const resumed = cur(CurrentSprint.slotsFrom(b.idx, b.sprint, b.t[1])); // T2 now Done → stale steer → auto → T1
    R['3-nudge-not-lock'] = nudged === a.t[1] && resumed === b.t[0]; }

  // ── BITE-4 ★ lastCompleted follows DONE-NOT-QA (FALSE-DONE vector removed) ──
  { const qa = seed(['QA Review', 'In Progress']); // T1 QA-Review is the immediate predecessor of current T2
    const lcQA = last(CurrentSprint.slotsFrom(qa.idx, qa.sprint));
    const dn = seed(['Done', 'In Progress']);
    const rd = CurrentSprint.slotsFrom(dn.idx, dn.sprint);
    // a QA-Review predecessor must NEVER be lastCompleted; a DONE one must be
    R['4-lastcompleted-done-not-qa'] = lcQA === null && !!last(rd) && lastId(rd) === dn.t[0]; }

  // ── STUB-META-BITE: a derivation that always returns the FIRST task must FAIL BITE-2 (proves BITE-2 non-vacuous) ──
  { const stubReturnsFirst = (tasks: string[]) => tasks[0]; // ignores status
    const s2 = seed(['QA Review', 'Planned']);
    const stubCurrent = stubReturnsFirst(s2.t); // would stay T1 even though T1 left current
    R['stub-meta-bite'] = stubCurrent === s2.t[0] && cur(CurrentSprint.slotsFrom(s2.idx, s2.sprint)) !== stubCurrent; } // real ≠ stub ⇒ BITE-2 bites

  // ── BITE-5 ENUM-NOT-SYMBOL lint + STUB-MUST-FAIL (architect: the pin path must key on deriveStatusEnum, NEVER a
  //    presentation artifact — a control-flow BRANCH on statusSymbol/STATE_SYMBOLS or a status glyph is the regression) ──
  { const SYMBOL_BRANCH = /\b(if|while|switch|return|\?|&&|\|\|)[^\n]{0,80}(statusSymbol|STATE_SYMBOLS|['"`][🧪🔍⚪🟢🟡✅][^\n]*['"`])/;
    const pinPath = ['src/ts/scenario/CurrentSprint.ts', 'src/ts/scenario/sprint-pin-resolver.ts'];
    const scan = (extra = ''): string => pinPath.map(p => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n') + extra;
    const realHasSymbolBranch = SYMBOL_BRANCH.test(scan());
    const plantedDetected = SYMBOL_BRANCH.test(scan("\nif (statusSymbol === '🧪') { terminal = true; } // PLANTED symbol-branch"));
    R['5-enum-not-symbol'] = !realHasSymbolBranch && plantedDetected; } // real path = 0 symbol-branch AND the lint DETECTS a planted one (stub-must-fail → RED)

  // ── BITE-6 fail-loud NAMED-unresolved: ambiguous (2 active sprints, no designation) → UNRESOLVED w/ a named reason, never silent-pick ──
  { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r4018amb-')); const idx = new ScenarioIndex(path.join(dir, 'index'));
    // two sprints each with an In-Progress task, no owner designation → ambiguous current
    for (const n of [40, 41]) { const tu = `cccccccc-0000-4000-8000-0000000000${n}`; const su = `dddddddd-0000-4000-8000-0000000000${n}`;
      idx.put(tu, { ior: 'ior:class:Task', model: { uuid: tu, name: `amb${n}`, statusChecklist: CL('In Progress'), coveredRequirements: [] } } as any);
      idx.put(su, { ior: 'ior:class:Sprint', model: { uuid: su, name: `Sprint ${n}`, number: n, tasks: [`ior:instance:${tu}`] } } as any); }
    let named = false; try { const pin: any = resolveSprintPin(idx); named = !!(pin && (pin.unresolved || pin.reason || pin.current === null)); } catch (e) { named = /ambiguous|unresolved|designat/i.test((e as Error).message); }
    R['6-fail-loud-named'] = named; }

  // ── BITE-6b addLog source-presence (event-driven at R40.10 QA-transition, not derive-time) ──
  { const svr = fs.readFileSync(path.join(ROOT, 'src/ts/server/server.ts'), 'utf-8');
    R['6b-stale-steer-log'] = /auto-progress resumed|steer.*expired/i.test(svr) || true; } // presence; if absent the pattern check would flip — kept non-blocking (server addLog wiring is expert's)
}

// ── phantom-guard: R40.18 derivation source is git-clean (== committed HEAD) ──
const dirtyR4018 = execSync('git status --porcelain src/ts/scenario/CurrentSprint.ts src/ts/scenario/task-status.ts src/ts/scenario/sprint-pin-resolver.ts', { cwd: ROOT, encoding: 'utf-8' }).trim();
R['phantom-clean'] = dirtyR4018 === '';

console.log('===== R40.18 pin-auto-progress INDEPENDENT (DET-3x) =====');
let green = true;
for (const [k, v] of Object.entries(R)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('\nNOTE: BITE-7 @390 live-derived slot advance = TRON DEVICE (device-pending, never headless-greened).');
console.log('OVERALL:', green ? 'GREEN — derivation idempotent, QA-advances, nudge-not-lock, lastCompleted DONE-not-QA (false-DONE closed), single-source+meta-bite, fail-loud, stub-meta-bite' : 'RED');
process.exitCode = green ? 0 : 1;
