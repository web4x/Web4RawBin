/**
 * C4 SINGLETON 1 — the ONE controller (design c4-mvc-view-pipeline-shape.md). EVERY unit mutation (any ior:class:*)
 * flows through UnitController.apply: (1) VALIDATE via the registered policy for that ior (or default-accept); (2) APPLY
 * the policy's in-memory mutation; (3) PERSIST via ScenarioIndex.put (the one disk-write chokepoint); (4) EMIT
 * UNIT_CHANGED. Nothing bypasses it — that single-writer property is what MvcBoundaryGuard.assertControllerDominates
 * enforces structurally. Policies REGISTER (Task FSM = Policy #1); other classes register their own or none.
 *
 * EMIT BOUNDARY: this is a SHARED scenario module (no server import), so step-4 publishes through an INJECTED `publish`
 * callback — the server wires it to the real UNIT_CHANGED wsClients broadcast (R37.12 viewBus.emitUnitChanged), and
 * bites inject a spy. Keeps the controller transport-agnostic + testable while staying the ONE emit point.
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

export interface UnitIntent { [k: string]: unknown }
export interface UnitPolicy {
  /** Throw to REFUSE (fail-loud); return to accept. Evidence-preconditions live here. */
  validate(idx: ScenarioIndex, unit: ScenarioUnit, intent: UnitIntent): void;
  /** Mutate unit.model IN MEMORY only (persist + emit are the controller's job). */
  apply(idx: ScenarioIndex, unit: ScenarioUnit, intent: UnitIntent): void;
}
export type PublishFn = (ior: string, uuid: string) => void;

const POLICIES = new Map<string, UnitPolicy>();
/** Register the policy for an ior:class (Task FSM = Policy #1). Absent → default-accept (no validate/mutate). */
export function registerPolicy(ior: string, policy: UnitPolicy): void { POLICIES.set(ior, policy); }
export function policyFor(ior: string): UnitPolicy | undefined { return POLICIES.get(ior); }

export class UnitController {
  // [impl:uuid:b5f72641-a75c-4b8f-98fc-2380ced1a42a] UnitController.apply — the generic PRIMARY: the SOLE mutation entry for ANY ior:class:* unit
  // (validate → apply → persist → emit). This SUBSUMES statusNext; statusNext is a thin Task façade over this.
  static apply(idx: ScenarioIndex, ior: string, uuid: string, intent: UnitIntent = {}, opts: { actor?: string; publish?: PublishFn } = {}): ScenarioUnit {
    const unit = idx.get(uuid);
    if (!unit) throw new Error(`unitController.apply: no unit ${uuid}`);
    if (unit.ior !== ior) throw new Error(`unitController.apply: ior mismatch (${unit.ior} != ${ior})`);
    const policy = POLICIES.get(ior);
    if (policy) {
      policy.validate(idx, unit, intent); // (1) VALIDATE — throws to refuse (evidence-precondition lives here)
      policy.apply(idx, unit, intent);     // (2) APPLY — in-memory model mutation
    } else {
      // (A) DEFAULT-MERGE (architect 5bf98afb6): no registered policy → shallow-merge the intent's fields INTO unit.model,
      // so the INTERNAL mutate routes are mechanical + INV-T byte-diff==0 (identical bytes to the old inline `model.X=Y`).
      // ★ INTERNAL/IN-PROCESS ONLY — this generic merge must NEVER be reached from an HTTP/agent caller (that would be an
      // arbitrary-field write surface). GUARD: identity fields (uuid/ior/ownerIor) are NEVER overwritten.
      const model = unit.model as Record<string, unknown>;
      for (const [k, v] of Object.entries(intent)) if (k !== 'uuid' && k !== 'ior' && k !== 'ownerIor') model[k] = v;
    }
    UnitController._write(idx, ior, uuid, unit, opts.publish); // (3) PERSIST + (4) EMIT via the shared _write chokepoint
    return unit;
  }

  // UnitController.create — the NEW-unit PRIMITIVE (sibling of apply, NOT an upsert): fail-loud if the unit ALREADY
  // exists (mirror of apply's throw-if-absent — a typo'd create must never silently clobber an existing unit). Persist +
  // emit through the SAME _write chokepoint so create-of-a-new-unit is LIVE — the injected publish fans out the
  // container/list refs (R37.12 viewBus / R40.17 graph) so a new unit appears at once in list/tree views. Impl marker
  // pending architect mint (create Method+Impl, distinct from apply's b5f72641).
  static create(idx: ScenarioIndex, ior: string, uuid: string, unit: ScenarioUnit, opts: { actor?: string; publish?: PublishFn } = {}): ScenarioUnit {
    if (idx.has(uuid)) throw new Error(`unitController.create: unit ${uuid} already exists (use apply to mutate)`);
    if (unit.ior !== ior) throw new Error(`unitController.create: ior mismatch (${unit.ior} != ${ior})`);
    UnitController._write(idx, ior, uuid, unit, opts.publish);
    return unit;
  }

  // _write — the SINGLE persist+emit chokepoint shared by apply (mutate-existing) and create (new). ScenarioIndex.put is
  // the sole disk-write; emit is its INSEPARABLE consequence, so no seam entry can persist WITHOUT notifying. That binding
  // is what the mutation-seam lint enforces structurally: no idx.put / graph-write outside UnitController.{apply,create}.
  private static _write(idx: ScenarioIndex, ior: string, uuid: string, unit: ScenarioUnit, publish?: PublishFn): void {
    idx.put(uuid, unit);                   // (3) PERSIST — the one disk-write chokepoint
    UnitController.emit(ior, uuid, publish); // (4) EMIT — inseparable from persist
  }

  // [impl:uuid:6b03b619-c55f-48fc-9753-9e9375980864] UnitController.emit — publish step-4: delegates the injected publish (the server's R37.12
  // viewBus.emitUnitChanged / UNIT_CHANGED wsClients broadcast). No-op when no publisher is wired (e.g. a pure bite).
  static emit(ior: string, uuid: string, publish?: PublishFn): void {
    publish?.(ior, uuid);
  }
}
