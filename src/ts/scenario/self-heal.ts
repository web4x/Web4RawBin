/**
 * C4.1 (T37.4.1) — MODEL self-heal on READ (design c4-mvc-view-pipeline-shape.md §MODEL). The symmetric READ-side of the
 * C4 controller (unit-controller.ts is the WRITE side): every unit READ recomputes its DERIVED fields to reality (fresh)
 * or REFUSES (throws, fail-loud) — a read NEVER returns a silently-drifted value (C2/C6: status stored 'Planned' while the
 * checklist had advanced). GENERIC: a per-ior self-healer REGISTERS (mirrors registerPolicy); ScenarioIndex.get invokes
 * it on every read; a class with NO registered healer is accepted as-is. A NEW class gains self-heal-on-read with ZERO
 * edits to this mechanism — registration only (the DRY property the gate proves).
 *
 * INVARIANT — healers are PURE + UNIT-LOCAL: recompute derived fields FROM the unit's own authored fields (no ScenarioIndex,
 * no I/O) so the get()-hook can NEVER recurse and adds only an O(1) Map lookup to a read that already does fs+parse.
 * Recompute-to-reality is the norm; THROW only to REFUSE an irreconcilable drift (fail-loud reaches the caller).
 */
import type { ScenarioUnit } from './types.js';

/** Mutate `unit.model` derived fields in-memory to reflect reality, OR throw to REFUSE (fail-loud). Pure + unit-local. */
export type SelfHeal = (unit: ScenarioUnit) => void;

const HEALERS = new Map<string, SelfHeal>();

/** Register the self-healer for an ior:class (Task = healer #1). Absent → default-accept (read returns the unit as-is). */
export function registerSelfHeal(ior: string, heal: SelfHeal): void { HEALERS.set(ior, heal); }

export function hasSelfHeal(ior: string): boolean { return HEALERS.has(ior); }

/** The read-side hook: recompute-to-reality (fresh) OR throw (refuse). No-op + returns the unit when its ior has no healer. */
export function selfHealOnRead(unit: ScenarioUnit): ScenarioUnit {
  const heal = HEALERS.get(unit.ior);
  if (heal) heal(unit); // fresh (mutates unit.model) OR throws to refuse — never returns a silently-drifted value
  return unit;
}
