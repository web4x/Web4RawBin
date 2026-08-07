/**
 * R-C3 — ConsistencyGuard: the fail-CLOSED / no-vacuous-truth meta-guard (Sprint 37 consistency-by-construction).
 *
 * Generalises the fail-closed hole-class (narrative-loss / vacuous-dir / slug-drift ad-hoc guards) into ONE shared
 * pair called at the TOP of every S37 guard, so a guard can NEVER silently pass on absent/empty/malformed input:
 *   - refuseIfVacuous(value, {name, expect})  — refuse a single input that is null/empty/wrong-shape (INV-C3-1/3).
 *   - assertNonVacuous(items, {name, min})    — refuse a POSITIVE assertion over an empty/absent set (INV-C3-2:
 *                                               "0 offenders because 0 were scanned" must NOT read as clean).
 * Every refusal carries a human reason STRING (never a bare false / exit 1) so CI says WHY (INV-C3-3).
 * consistencyStrict(idx) composes the S37 guards (pin R-C1 + dual-status R-C5), each fronted by the pair — the
 * backing for the `consistency:strict` ci:gate + the meta-BITE (a deliberately-vacuous-passing stub must turn RED).
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';
import { resolveSprintPin } from './sprint-pin-resolver.js';
import { assertStatusConsistent } from './task-status.js';

export interface GuardResult { ok: boolean; reason?: string }
export type VacuousExpect = 'present' | 'non-empty-string' | 'non-empty-array' | 'object' | 'ior-class';
export interface VacuousOpts { name: string; expect?: VacuousExpect; iorClass?: string }

/** True iff a positive assertion over `value` would be vacuous / the value is absent or the wrong shape. */
function vacuousReason(value: unknown, opts: VacuousOpts): string | null {
  const { name, expect = 'present', iorClass } = opts;
  if (value === null || value === undefined) return `${name}: absent (null/undefined) — refuse (unresolvable/null-output)`;
  if (expect === 'non-empty-string') {
    if (typeof value !== 'string') return `${name}: expected a string, got ${typeof value} — refuse`;
    if (value.trim() === '') return `${name}: empty/whitespace string — refuse (missing-or-empty-file)`;
  }
  if (expect === 'non-empty-array') {
    if (!Array.isArray(value)) return `${name}: expected an array, got ${typeof value} — refuse`;
    if (value.length === 0) return `${name}: 0 items where >=1 expected — refuse (vacuous set)`;
  }
  if (expect === 'object') {
    if (typeof value !== 'object' || Array.isArray(value)) return `${name}: expected an object — refuse`;
    if (Object.keys(value as object).length === 0) return `${name}: empty object (no keys) — refuse`;
  }
  if (expect === 'ior-class') {
    const ior = (value as { ior?: unknown })?.ior;
    if (typeof ior !== 'string' || ior.length === 0) return `${name}: not a scenario unit (no ior) — refuse (wrong-ior-class)`;
    if (iorClass && ior !== iorClass) return `${name}: wrong ior-class ${ior}, expected ${iorClass} — refuse (wrong-ior-class)`;
  }
  return null;
}

// [impl:uuid:ee424581-c246-48b7-bdc8-54a37f686b02] ConsistencyGuard.refuseIfVacuous (named refusal on every vacuous shape, shared)
/** The ONE shared fail-closed check called at the TOP of every guard. Returns a NAMED refusal, never a silent pass. */
export function refuseIfVacuous(value: unknown, opts: VacuousOpts): GuardResult {
  const reason = vacuousReason(value, opts);
  return reason ? { ok: false, reason } : { ok: true };
}

// [impl:uuid:cf756307-2e0b-474d-b494-7874180096c0] ConsistencyGuard.assertNonVacuous (consistency:strict composed gate + meta-BITE backing)
/**
 * No-vacuous-truth guard: a POSITIVE assertion (e.g. "0 offenders => clean") is only valid if the scan actually
 * covered >= `min` items. An empty/absent set defaults to FAIL for a gate — every([])===true must NOT read clean.
 */
export function assertNonVacuous(items: unknown, opts: { name: string; min?: number }): GuardResult {
  const { name, min = 1 } = opts;
  if (items === null || items === undefined) return { ok: false, reason: `${name}: nothing scanned (null/undefined set) — a positive assertion over it is vacuously true; refuse (INV-C3-2)` };
  if (!Array.isArray(items)) return { ok: false, reason: `${name}: expected a scanned array to assert over, got ${typeof items} — refuse` };
  if (items.length < min) return { ok: false, reason: `${name}: only ${items.length} scanned (< ${min}) — "clean because nothing was checked" is not clean; refuse (vacuous truth, INV-C3-2)` };
  return { ok: true };
}

/**
 * consistency:strict composed gate (INV-C3-4): each sub-guard fronted by refuseIfVacuous/assertNonVacuous so a
 * vacuous input FAILS rather than passes. Returns every refusal reason; empty => consistent. Board-drift (R-C2,
 * check:sprint-md) + migration-refuse (R-C7, proveComplete) compose at the CLI/ci:gates:raw layer (they own their
 * own fail-closed guards); this composes the in-process resolvers pin (R-C1) + dual-status (R-C5).
 */
export function consistencyStrict(idx: ScenarioIndex): GuardResult[] {
  const results: GuardResult[] = [];

  // (0) the index itself must be non-vacuous, else every downstream assertion is vacuously "clean".
  const units: ScenarioUnit[] = [...idx.list()].map(u => idx.get(u)!).filter(Boolean);
  const idxGuard = assertNonVacuous(units, { name: 'consistency:strict/scenario-index' });
  results.push(idxGuard);
  if (!idxGuard.ok) return results; // nothing trustworthy downstream

  // (a) sprint-pin resolves to a single current sprint (R-C1); current:null = unresolvable = refuse.
  const pin = resolveSprintPin(idx);
  results.push(refuseIfVacuous(pin.current, { name: 'consistency:strict/sprint-pin.current', expect: 'present' }));

  // (c) dual-status consistency (R-C5): unit-status == board checkbox. Non-empty offenders = drift = fail.
  const offenders = assertStatusConsistent(idx);
  results.push(offenders.length === 0
    ? { ok: true }
    : { ok: false, reason: `consistency:strict/dual-status: ${offenders.length} status drift(s) (e.g. ${offenders[0].name}: declared ${offenders[0].declared} != derived ${offenders[0].derived}) — refuse` });

  return results;
}
