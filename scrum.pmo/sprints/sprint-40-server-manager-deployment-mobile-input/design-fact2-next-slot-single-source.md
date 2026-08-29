# fact-2 (make-current NEXT-demotion) — SHAPE RULING (architect, 2026-08-29)

Expert routed by PO: architect rules shape → expert builds → tester verifies. Family: authored-vs-derived / second-store / measurement-provenance (F1). Consistent with R40.18 (retire the stored current pointer) + R40.44/R40.49 (EXPLICIT-WINS-WHILE-VALID designation).

## Measured defect (3 loci, confirmed on disk)
- **CURRENT** (CurrentSprint.ts:268-290): the stored singleton `currentTaskUuid` is RETIRED from the derivation. current = max-`lastAdvancedAt` in-progress task, with a validity-checked **designation override** (EXPLICIT-WINS-WHILE-VALID, my R40.44) as the ONE sanctioned authored source.
- **make-current** (server.ts:2006): captures `priorCurrent` from `MC_CU.currentTaskUuid` — the **STORED singleton pointer R40.18 retired**. So the demote-target it captures is NOT the current the user actually saw (derived max-`lastAdvancedAt`, possibly masked by a prior designation). When the stored pointer is empty/stale → `priorCurrent=''` → no demote → NEXT stays the auto-scan (37.2). **This is the bug: the displaced-current is captured from a different source than the one that PRODUCED the visible current.**
- **NEXT** (CurrentSprint.ts:341-356): auto-scan (first non-terminal after current) + `nextBacklogOverride` honored if not-done. The override is a **second authored source** persisting what is derivable, and its writer reads the retired pointer.

## RULING: derive the displaced-NEXT from the SAME single source as CURRENT — eliminate nextBacklogOverride
`nextBacklogOverride` is NOT the right mechanism. It resurrects the retired stored pointer as a second authored source, exactly the second-store/authored-vs-derived defect we have killed all week. Do not re-point its input; **remove it.**

**The single-source shape** — current and its displacement both fall out of ONE comparison, using the ONE authored source current already has (the validity-checked designation):
- Let `derived` = the derived current (max-`lastAdvancedAt`, the R40.18 value), and `designated` = the valid EXPLICIT-WINS designation (or null).
- **CURRENT** = `designated` if valid, else `derived` (unchanged — R40.44).
- **NEXT (displaced slot)** = **the `derived` current that the designation is MASKING**, i.e. when `designated` is valid AND `designated.uuid !== derived.uuid`, NEXT = `derived`. Otherwise NEXT = the existing auto-scan (first non-terminal after current). No stored override.
- Rationale: after make-current(40.10), `designated`=40.10 (shown as current via EXPLICIT-WINS), `derived`=40.1 (still max-`lastAdvancedAt`; make-current does NOT bump it) → NEXT = 40.1. The displacement is a pure function of the two values current already computes. The demote is impossible to get "stale" because there is nothing stored to go stale — it is re-derived per read, same as current (R40.44 honest = validity-checked-and-observable, not silent-stale).

## make-current write change
- KEEP: `desIntent.currentTaskUuid = taskUuid` (+ `sprintName`) — the ONE sanctioned authored source (validated per read, expiring at Done per R40.44).
- **DROP: the `priorCurrent` capture (server.ts:2006) and the `nextBacklogOverride` write entirely.** The displaced-NEXT is now derived in getThreeSlots from (designated vs derived); make-current stores nothing about NEXT.
- Also DROP the `nextBacklogOverride` load (constructor :86-118) and the honor block (:356). One fewer stored field, one fewer second-source.

## Invariants
- **INV-1 (displacement-by-derivation):** with a valid designation D masking derived-current R (D≠R), getThreeSlots → current=D, next=R. No stored next field consulted.
- **INV-2 (no second source):** grep — `nextBacklogOverride` has 0 references after the fix (field, writer, loader, honorer all gone). The displacement derives solely from designated-vs-derived.
- **INV-3 (BUG-C preserved):** no uuid in >1 slot (the existing dedup at :358+ stands; verify D≠R≠lastCompleted).
- **INV-4 (expiry inherited):** when D reaches Done/re-designated/gone (R40.44 expiry), current falls back to R and the displacement vanishes — no orphaned stored next lingering (it was the failure mode of the removed override).

## FAILABLE (R40.54 family — stub-must-fail)
Tester's RED baseline: seed derived-current=Y, make-current(X≠Y) → assert NEXT slot == Y. Pre-fix this is RED (NEXT stays auto-scan/37.2); post-fix GREEN. Second stub: with NO designation, NEXT == auto-scan (regression guard that removing the override didn't break the normal next-backlog). Both must be able to fail (isolated fixture sprint, no prod mutation, R40.31).

## Scope / caution
- Confined to CurrentSprint.getThreeSlots (NEXT derivation) + the make-current write (server.ts:2000-2012 region). Do NOT touch the CURRENT derivation (:268-290) or the R40.44 designation-override semantics — this rides on them.
- Semantic note (non-blocking): NEXT now means "displaced-prior-current if a designation masks one, else next-upcoming-backlog." That dual meaning is inherited from the settled tester/PO expectation, not introduced here; if the PO ever wants them as two distinct surfaced slots, that is a separate design.
- Tree is on the hotfix branch pending the PO merge; this is a NEW design-note file (no merge conflict). Expert builds the code fix on the reconciled tree.
