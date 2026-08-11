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
  // [impl:uuid:b5f72641] UnitController.apply — the generic PRIMARY: the SOLE mutation entry for ANY ior:class:* unit
  // (validate → apply → persist → emit). This SUBSUMES statusNext; statusNext is a thin Task façade over this.
  static apply(idx: ScenarioIndex, ior: string, uuid: string, intent: UnitIntent = {}, opts: { actor?: string; publish?: PublishFn } = {}): ScenarioUnit {
    const unit = idx.get(uuid);
    if (!unit) throw new Error(`unitController.apply: no unit ${uuid}`);
    if (unit.ior !== ior) throw new Error(`unitController.apply: ior mismatch (${unit.ior} != ${ior})`);
    const policy = POLICIES.get(ior);
    if (policy) {
      policy.validate(idx, unit, intent); // (1) VALIDATE — throws to refuse (evidence-precondition lives here)
      policy.apply(idx, unit, intent);     // (2) APPLY — in-memory model mutation
    }
    idx.put(uuid, unit);                   // (3) PERSIST — the one disk-write chokepoint
    UnitController.emit(ior, uuid, opts.publish); // (4) EMIT
    return unit;
  }

  // [impl:uuid:6b03b619] UnitController.emit — publish step-4: delegates the injected publish (the server's R37.12
  // viewBus.emitUnitChanged / UNIT_CHANGED wsClients broadcast). No-op when no publisher is wired (e.g. a pure bite).
  static emit(ior: string, uuid: string, publish?: PublishFn): void {
    publish?.(ior, uuid);
  }
}
