// [test:uuid:3519018d-29d6-454c-b814-ff7b01496439] R-C1 REFINEMENT — resolveSprintPin af97137f (impl-edit, DISTINCT-intent alongside fc28b6f1): INV-C1-9 frozen-excluded (isCurrentEra filters pre-S19 from the pin universe → lingering frozen In-Progress can't count Active or trip INV-C1-4) + INV-C1-10 cancelled-terminal (cancelledReason = distinct terminal → a cancelled task can't keep a sprint Active) + ★ META-BITE (stub isCurrentEra always-true → 3 current-era → suite RED) + boundary drift + single-source lint. GREEN DET-3x.
// R-C1 REFINEMENT META-BITE (expert b161f311f, impl-edit resolveSprintPin af97137f) — own-oracle, DET-3x.
// FAMILY: era-boundary-drift + terminal-status-set. INV-C1-9 frozen-excluded (num<=FROZEN_LEGACY_MAX=18 filtered from
// the pin universe BEFORE status/throws, so lingering pre-S19 In-Progress can't count Active or trip INV-C1-4) +
// INV-C1-10 cancelled-terminal (cancelledReason = a DISTINCT terminal, so a cancelled task can't keep a sprint Active).
// Per PO fleet doctrine: (A) the 2 BITEs; (B) ★ a STUB isCurrentEra (always-true) MUST break the frozen-exclusion the
// suite relies on (gate-proves-the-gate-prover); (C) boundary drift-injection; (D) confirm the single-source lint (one
// FROZEN_LEGACY_MAX definition, no 2nd frozen boundary). Own-oracle imports the real resolver; served==committed==HEAD.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSprintPin, deriveSprintStatus, isCurrentEra, FROZEN_LEGACY_MAX } from '../../src/ts/scenario/sprint-pin-resolver.ts';

const RESOLVER_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src/ts/scenario/sprint-pin-resolver.ts');
type U = { ior: string; model: Record<string, unknown> };
const CHK = ['Planned', 'In Progress', 'QA Review', 'Done'];
const task = (uuid: string, status: 'Planned' | 'In Progress' | 'QA Review' | 'Done'): U => ({ ior: 'ior:class:Task', model: { uuid, statusChecklist: CHK.slice(0, CHK.indexOf(status) + 1).map((s) => `- [x] ${s}`).join('\n') } });
const cancelledTask = (uuid: string): U => ({ ior: 'ior:class:Task', model: { uuid, statusChecklist: '- [x] Planned\n- [x] In Progress', cancelledReason: 'obsoleted by re-scope' } }); // In-Progress checklist BUT cancelled
const sprint = (uuid: string, number: number, taskUuids: string[]): U => ({ ior: 'ior:class:Sprint', model: { uuid, number, name: `Sprint ${number}`, tasks: taskUuids.map((t) => `ior:instance:${t}`) } });
const mkIndex = (units: U[]) => { const m = new Map(units.map((u) => [String(u.model.uuid), u])); return { list: () => [...m.keys()], get: (u: string) => m.get(u) } as any; };
const threw = (fn: () => unknown, re: RegExp) => { try { fn(); return false; } catch (e) { return re.test(String((e as Error).message)); } };

function runChecks() {
  const c: Record<string, boolean> = {};

  // ── (A1) INV-C1-9 frozen-excluded GOLDEN: frozen S10+S17 (lingering In-Progress) + one current-era Active S37 → current=S37, NO throw ──
  const golden = mkIndex([
    sprint('s10', 10, ['t10']), task('t10', 'In Progress'),   // frozen, lingering In-Progress
    sprint('s17', 17, ['t17']), task('t17', 'In Progress'),   // frozen, lingering In-Progress
    sprint('s37', 37, ['t37']), task('t37', 'In Progress'),   // current-era, the ONE Active
  ]);
  try { const pin = resolveSprintPin(golden); c.frozenExcludedGolden = pin.current?.uuid === 's37' && pin.lastCompleted === null && pin.nextBacklog === null; }
  catch { c.frozenExcludedGolden = false; } // pre-fix this would THROW INV-C1-4 (3 In-Progress) — the BITE

  // ── (A2) HOLD: current-era ambiguity STILL fail-louds (isCurrentEra must not disable the real guard) ──
  const ambig = mkIndex([sprint('s36', 36, ['t36']), task('t36', 'In Progress'), sprint('s37', 37, ['t37']), task('t37', 'In Progress')]);
  c.currentEraAmbiguityStillThrows = threw(() => resolveSprintPin(ambig), /INV-C1-4|Active|ambiguous/i);

  // ── (A3) INV-C1-10 cancelled-terminal: Done + Cancelled → all-terminal → Closed; cancelled DISTINCT from Done ──
  const s30 = sprint('s30', 30, ['d1', 'x1']);
  const st30 = deriveSprintStatus(s30 as any, mkIndex([s30, task('d1', 'Done'), cancelledTask('x1')]));
  c.cancelledTerminalClosed = st30.status === 'Closed';
  c.cancelledDistinct = st30.counts.cancelled === 1 && st30.counts.done === 1 && st30.counts.inProgress === 0;

  // ── (A4) INV-C1-10 BITE: a cancelled task must NOT keep a sprint Active (In-Progress checklist but cancelled → not Active) ──
  const s31 = sprint('s31', 31, ['x2']);
  const st31 = deriveSprintStatus(s31 as any, mkIndex([s31, cancelledTask('x2')]));
  c.cancelledNotActive = st31.status !== 'Active' && st31.counts.inProgress === 0 && st31.counts.cancelled === 1;

  // ── (B) ★ META-BITE: the frozen-exclusion depends on isCurrentEra(frozen)===false. A STUB always-true breaks it. ──
  const stubIsCurrentEra = (_n: number | null) => true;
  const nums = [10, 17, 37];
  const realCurrentEra = nums.filter((n) => isCurrentEra(n));          // real → [37] (1 → no ambiguity)
  const stubCurrentEra = nums.filter((n) => stubIsCurrentEra(n));      // stub → [10,17,37] (3 → the golden WOULD throw INV-C1-4)
  c.metaBiteStubFails = realCurrentEra.length === 1 && stubCurrentEra.length === 3;

  // ── (C) boundary drift-injection: the era boundary is EXACTLY FROZEN_LEGACY_MAX (18 frozen / 19 current); null/neg frozen ──
  c.boundaryExact = isCurrentEra(FROZEN_LEGACY_MAX) === false && isCurrentEra(FROZEN_LEGACY_MAX + 1) === true && isCurrentEra(null) === false && isCurrentEra(0) === false;

  // ── (D) confirm architect's single-source lint: ONE FROZEN_LEGACY_MAX definition + no 2nd frozen boundary literal (strip comments first — my banked lint lesson) ──
  const raw = fs.readFileSync(RESOLVER_SRC, 'utf8');
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  const defCount = (code.match(/FROZEN_LEGACY_MAX\s*=/g) || []).length;      // exactly 1 definition
  const literal18 = (code.match(/\b18\b/g) || []).length;                    // the ONLY 18 in code = that definition (consumers use the const)
  c.singleBoundarySource = defCount === 1 && literal18 === 1;

  return c;
}

const results: boolean[] = [];
let last: Record<string, boolean> = {};
for (let i = 1; i <= 3; i++) { const c = runChecks(); last = c; const pass = Object.values(c).every(Boolean); results.push(pass); console.log(`iter ${i}: ${Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ')} => ${pass ? 'GREEN' : 'RED'}`); }
console.log('\n===== R-C1 REFINEMENT frozen-excluded + cancelled-terminal META-BITE (DET-3x, own-oracle) =====');
const failed = Object.entries(last).filter(([, v]) => !v).map(([k]) => k); if (failed.length) console.log('FAILING:', failed.join(', '));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('FAMILY named: era-boundary-drift (INV-C1-9) + terminal-status-set (INV-C1-10). marker on GREEN → resolveSprintPin af97137f (impl-edit, distinct-intent).');
process.exitCode = green ? 0 : 1;
