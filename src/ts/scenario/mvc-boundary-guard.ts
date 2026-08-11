/**
 * C4.8 (C4-remainder pt2) — the MVC dominance property, lint-PROVABLE. The single-Done-writer law: NO code sets a Task
 * status to the literal 'Done' (a manufactured Done that bypasses the controller's derive) outside the ONE controller.
 * The sanctioned 4-state writer is `model.status = deriveStatusEnum(checklist)` in task-policy.ts — a DERIVE, not a
 * literal, so it is never a violation. approveByOwner (the R40.10 PRODUCT path) DELEGATES to statusNext (C4.3) and so
 * contains no direct Done-write.
 *
 * ★ LEGACY ALLOWLIST (PO ruling 2026-08-11, option-b): exactly ONE known direct Done-writer is grandfathered — the
 * skills/CLI FSM path task-fsm.tronApprove (task-fsm.ts:68), reached via skills.ts statusTransition. It is EXPLICIT +
 * NAMED with a SCHEDULED RETIREMENT (see design note c4-mvc-view-pipeline-shape.md §C4.8 allowlist). The allowlist may
 * NOT GROW (a bite fails if it does — an allowlist that quietly gains entries is a bypass with extra steps).
 *
 * ★ CONSEQUENCE (documented, not hidden): until tronApprove is retired, an approve through the CLI/skills path does NOT
 * enforce the testing-evidence precondition and CAN still manufacture a Done. The hardening is real for the PRODUCT path
 * Tron actually taps (R40.10 approve) and bypassable via CLI until retirement — which is why retirement is scheduled.
 */

/** The ONE grandfathered legacy Done-writer file (by basename). MUST NOT GROW — bite-enforced. Retirement scheduled. */
export const DONE_WRITER_ALLOWLIST: readonly string[] = ['task-fsm.ts'];

export interface DominanceViolation { file: string; line: number; text: string; }

export class MvcBoundaryGuard {
  /** PURE: finds a literal Done assigned to a .status field in one source (the manufacture-a-Done pattern) — distinct
   *  from the sanctioned `= deriveStatusEnum(...)` derive, which this deliberately does NOT match. */
  static detectDoneWrites(source: string, file: string): DominanceViolation[] {
    const out: DominanceViolation[] = [];
    source.split('\n').forEach((ln, i) => {
      if (/\.status\s*=\s*['"]Done['"]/.test(ln)) out.push({ file, line: i + 1, text: ln.trim() });
    });
    return out;
  }

  // [impl:uuid:a5c570c9-081a-4ea4-9d1e-102aed906290] MvcBoundaryGuard.assertControllerDominates — single-Done-writer dominance lint
  /** The property: no direct Done-write outside the controller, save the explicit legacy allowlist. Returns the
   *  violations (empty = property holds). Callers (the gate) exit non-zero on any violation. */
  static assertControllerDominates(files: { file: string; source: string }[]): DominanceViolation[] {
    const viol: DominanceViolation[] = [];
    for (const f of files) {
      const base = f.file.split('/').pop() ?? f.file;
      if (DONE_WRITER_ALLOWLIST.includes(base)) continue; // grandfathered legacy (tracked, retirement scheduled)
      viol.push(...MvcBoundaryGuard.detectDoneWrites(f.source, f.file));
    }
    return viol;
  }
}
