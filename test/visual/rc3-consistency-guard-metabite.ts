// [test:uuid:caf74333-a969-4d62-a0ef-66fdb888d3dd] R-C3 refuseIfVacuous ee424581 — every vacuous path (null/undefined/empty-string/whitespace/non-string/empty-array/non-array/empty-object/no-ior/wrong-ior-class) REFUSES with a NAMED reason (INV-C3-1/3); valid input passes (no false refusal). GREEN DET-3x.
// [test:uuid:af6c8fe5-6b7f-47ad-9e42-46f934bc708a] R-C3 assertNonVacuous cf756307 — no-vacuous-truth (0-scanned/<min ≠ clean, INV-C3-2) + ★ META-BITE (a silent-passing stub guard fails the fail-closed meta-check → would turn the suite RED) + drift-injection on consistencyStrict (empty→refuse / pin-drift→refuse / clean→ok). GREEN DET-3x.
// R-C3 ConsistencyGuard META-BITE (expert dda311ad7 / 50b1b1196) — own-oracle, DET-3x.
// RUN: /opt/node22/bin/node --import tsx test/visual/rc3-consistency-guard-metabite.ts  (vscode-node tsx is DENIED)
// Verifies the fail-closed / no-vacuous-truth guards: refuseIfVacuous ee424581 + assertNonVacuous cf756307 +
// consistencyStrict. (A) per-guard × EVERY vacuous path → REFUSE with a NAMED reason (INV-C3-1/2/3); HOLD: valid
// input passes (no false refusal). (B) ★ META-BITE: a deliberately-vacuous-PASSING stub guard MUST fail the
// fail-closed meta-check (= would turn the suite RED) while the real guard passes it — gate-proves-the-gate-prover.
// (C) drift-injection on consistencyStrict: empty index → refuse (0-scanned ≠ clean, INV-C3-2) / no-Active pin-drift
// → refuse / clean single-Active pin → ok. Own-oracle imports the real guards; served==committed==HEAD v0.8.65.
import { refuseIfVacuous, assertNonVacuous, consistencyStrict, type GuardResult } from '../../src/ts/scenario/consistency-guard.ts';
import { resolveSprintPin } from '../../src/ts/scenario/sprint-pin-resolver.ts';

type U = { ior: string; model: Record<string, unknown> };
const task = (uuid: string, status: 'Planned' | 'In Progress' | 'QA Review' | 'Done'): U => ({
  ior: 'ior:class:Task',
  model: { uuid, statusChecklist: ['Planned', 'In Progress', 'QA Review', 'Done'].slice(0, ['Planned', 'In Progress', 'QA Review', 'Done'].indexOf(status) + 1).map((s) => `- [x] ${s}`).join('\n') },
});
const sprint = (uuid: string, number: number, taskUuids: string[]): U => ({ ior: 'ior:class:Sprint', model: { uuid, number, name: `Sprint ${number}`, tasks: taskUuids.map((t) => `ior:instance:${t}`) } });
const mkIndex = (units: U[]) => { const m = new Map(units.map((u) => [String(u.model.uuid), u])); return { list: () => [...m.keys()], get: (u: string) => m.get(u) } as any; };

const refusedWithReason = (r: GuardResult) => r.ok === false && typeof r.reason === 'string' && r.reason.length > 0;
const passed = (r: GuardResult) => r.ok === true && !r.reason;

function runChecks() {
  const c: Record<string, boolean> = {};

  // ── (A) refuseIfVacuous — EVERY vacuous path refuses w/ reason; valid passes ──
  const rv = refuseIfVacuous;
  c.rv_vacuous = [
    rv(null, { name: 'x' }), rv(undefined, { name: 'x' }),
    rv('', { name: 'x', expect: 'non-empty-string' }), rv('   ', { name: 'x', expect: 'non-empty-string' }), rv(123, { name: 'x', expect: 'non-empty-string' }),
    rv([], { name: 'x', expect: 'non-empty-array' }), rv({}, { name: 'x', expect: 'non-empty-array' }),
    rv({}, { name: 'x', expect: 'object' }),
    rv({ noior: 1 }, { name: 'x', expect: 'ior-class' }), rv({ ior: 'ior:class:Bug' }, { name: 'x', expect: 'ior-class', iorClass: 'ior:class:Sprint' }),
  ].every(refusedWithReason);
  c.rv_valid = [
    rv('hello', { name: 'x', expect: 'non-empty-string' }), rv([1], { name: 'x', expect: 'non-empty-array' }),
    rv({ a: 1 }, { name: 'x', expect: 'object' }), rv({ ior: 'ior:class:Sprint' }, { name: 'x', expect: 'ior-class', iorClass: 'ior:class:Sprint' }),
  ].every(passed);

  // ── (A) assertNonVacuous — vacuous set refuses; scanned set passes ──
  const av = assertNonVacuous;
  c.av_vacuous = [av(null, { name: 'y' }), av(undefined, { name: 'y' }), av('nope', { name: 'y' }), av([], { name: 'y', min: 1 }), av([1, 2], { name: 'y', min: 3 })].every(refusedWithReason);
  c.av_valid = [av([1], { name: 'y', min: 1 }), av([1, 2, 3], { name: 'y', min: 3 })].every(passed);

  // ── (B) ★ META-BITE: a guard is fail-closed IFF it refuses the vacuous [] set. Real guard passes; the silent-pass stub FAILS (→ would turn the suite RED). ──
  const metaCheck = (guardFn: (v: unknown) => GuardResult) => guardFn([]).ok === false;
  const realFailClosed = metaCheck((v) => assertNonVacuous(v, { name: 'real' }));       // real guard refuses [] → true
  const badGuard = (items: unknown): GuardResult => ({ ok: (Array.isArray(items) ? items : []).every(() => true) }); // every([])===true → silent-passes vacuous
  const stubDetected = metaCheck(badGuard) === false;                                   // stub does NOT refuse [] → suite catches it (RED on the stub)
  c.metaBite = realFailClosed === true && stubDetected === true;

  // ── (C) drift-injection on consistencyStrict ──
  const empty = consistencyStrict(mkIndex([]));
  c.drift_emptyRefused = empty.length > 0 && empty[0].ok === false && /scenario-index/.test(empty[0].reason || '');
  const pinDrift = consistencyStrict(mkIndex([sprint('s1', 1, ['t1']), task('t1', 'Done')])); // Closed only → no Active → pin.current null
  c.drift_pinCaught = pinDrift.some((r) => r.ok === false && /sprint-pin/.test(r.reason || ''));
  const cleanIdx = mkIndex([sprint('s2', 2, ['t2']), task('t2', 'In Progress')]);              // one Active → pin.current present
  c.drift_cleanPinOk = refuseIfVacuous(resolveSprintPin(cleanIdx).current, { name: 'pin', expect: 'present' }).ok === true;

  return c;
}

const results: boolean[] = [];
let last: Record<string, boolean> = {};
for (let i = 1; i <= 3; i++) {
  const c = runChecks(); last = c;
  const pass = Object.values(c).every(Boolean);
  results.push(pass);
  console.log(`iter ${i}: ${Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ')} => ${pass ? 'GREEN' : 'RED'}`);
}
console.log('\n===== R-C3 ConsistencyGuard META-BITE (DET-3x, own-oracle) =====');
const failed = Object.entries(last).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) console.log('FAILING:', failed.join(', '));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('markers on GREEN → req: refuseIfVacuous ee424581 (vacuous-path battery + meta-check) + assertNonVacuous cf756307 (no-vacuous-truth + META-BITE + drift-injection).');
process.exitCode = green ? 0 : 1;
