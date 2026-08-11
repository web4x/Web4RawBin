/**
 * C4 hardening (C) — THE ONE evidence predicate, shared (design c4-mvc-view-pipeline-shape.md ## (C)).
 *
 * statusNext's evidence-precondition ("has this step's evidence landed?") and checklist-chain-audit's
 * under-recorded-progress detector ask the SAME question — does the traceability chain provide the REAL
 * chain-edge for a step. Two separate implementations = two definitions of evidence that can DISAGREE (the
 * controller refuses what the audit calls recorded, or advances what it calls unrecorded — the two-sources
 * disease at the heart of the very fix). So it lives here ONCE and BOTH consumers import it — never a 2nd copy.
 *
 * A "step" is an EVIDENCE KIND on the chain, extracted verbatim from checklist-chain-audit's chain-edge:
 *   'implementing' → the chain reached a SHIPPED Impl (Impl.markerPending === false).
 *   'testing'      → a TWO-KEYED passing Test: Test ∈ Impl.tests[] AND Test.implementations[] back-refs the Impl
 *                    AND Test.status === 'pass' (never prose/description — that is the phantom-coverage illusion).
 * The controller maps an FSM transition to the evidence kind it requires; the audit maps derived-status lag to it.
 *
 * Pure: takes a resolver so it works over BOTH a live ScenarioIndex-backed map and the audit's synthetic bite graphs.
 */
export type EvidenceStep = 'implementing' | 'testing';
export interface EvidenceUnit { ior: string; m: Record<string, any>; }
export type ResolveRef = (ref: string) => EvidenceUnit | undefined;

const bare = (s: unknown): string => String(s ?? '').replace('ior:instance:', '');

export class StepEvidence {
  // [impl:uuid:5021456d-3ec5-4265-8c4f-54afb86ea46a] StepEvidence.evidenceForStep (C4 (C) single-source real-chain-edge)
  static evidenceForStep(get: ResolveRef, task: EvidenceUnit, step: EvidenceStep): boolean {
    let shippedImpl = false, coveredByTest = false;
    const resolve = (x: unknown) => get(bare(x));
    for (const r of (task.m.coveredRequirements || []).map(resolve).filter(Boolean) as EvidenceUnit[]) {
      for (const uc of (r.m.useCases || []).map(resolve).filter(Boolean) as EvidenceUnit[]) {
        const M = uc.m.method ? resolve(uc.m.method) : null;
        if (!M) continue;
        for (const im of (M.m.implementations || []).map(resolve).filter(Boolean) as EvidenceUnit[]) {
          if (im.m.markerPending === false) shippedImpl = true;
          // CHAIN-EDGE coverage ONLY: two-keyed (Impl.tests[] <-> Test.implementations[]) + pass. Never prose.
          for (const teu of (im.m.tests || [])) {
            const te = resolve(teu);
            if (!te) continue;
            const twoKeyed = (te.m.implementations || []).some((x: unknown) => bare(x) === im.m.uuid);
            if (twoKeyed && te.m.status === 'pass') coveredByTest = true;
          }
        }
      }
    }
    return step === 'implementing' ? shippedImpl : coveredByTest;
  }
}
