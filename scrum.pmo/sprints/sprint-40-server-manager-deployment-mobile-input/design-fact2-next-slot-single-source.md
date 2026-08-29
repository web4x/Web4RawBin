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

## make-current write change (scope-corrected)
- KEEP: `desIntent.currentTaskUuid = taskUuid` (+ `sprintName`) — the ONE sanctioned authored source for CURRENT (validated per read, expiring at Done per R40.44).
- **DROP: the `priorCurrent` capture (server.ts:2006) and make-current's `nextBacklogOverride` write.** The displaced-NEXT is now derived in getThreeSlots from (designated vs derived); make-current stores nothing about NEXT.
- **KEEP (do NOT drop):** the `nextBacklogOverride` field/load (:79/:118), the honor block (:352), `setNextBacklog`/`clearNextBacklogOverride`, and the owner `POST slot:next` — they serve the LEGITIMATE owner explicit designate-next (validity-checked per read = R40.44-conformant). Only make-current's AUTO-write of it dies.

## ★ SCOPE CORRECTION (expert-flagged, escalate-not-assume) — TWO writers, only ONE dies
`nextBacklogOverride` has a SECOND writer I missed: the OWNER explicit **`POST /api/current-sprint/designate` slot:next** (server.ts:2105) + `setNextBacklog`/`clearNextBacklogOverride`. That is a LEGITIMATE owner feature — the NEXT-slot analog of designate-CURRENT — and its honor block (CurrentSprint.ts:352) ALREADY re-validates per read (`!o.done && o.uuid !== currentUuid`) + the symmetric clear (:452) drops it when it becomes current. That is the R40.44 SANCTIONED "stored-with-revalidation" cure, NOT the silent-stale disease. So this is **(B-refined), not full-eliminate (A):**
- **KILL only** the make-current AUTO-demote: the `priorCurrent` capture (server.ts:2006, reads the R40.18-retired stored pointer) + make-current's auto-write of `nextBacklogOverride`. That auto-captured value is the silent-stale second-source = the bug.
- **KEEP** the owner explicit designate-next (POST slot:next + setNextBacklog + the :352 honor + :452 clear) — a sanctioned explicit override, already validity-checked per read.
- Meta: fact-2's fix IS an instance of the truth-decay family cure — the AUTO/silent stored value dies; the EXPLICIT/revalidated stored value lives. Never stored-and-silent; stored-with-revalidation is fine.

## PRIORITY (three-tier, mirrors current's designated-ELSE-derived)
NEXT = **owner-explicit designate-next** (if valid, :352 honor) ELSE **masked-derived-current** (the displacement: derived current R when a valid designation D masks it, D≠R) ELSE **auto-scan** (first non-terminal after current).

## Invariants (REVISED)
- **INV-1 (displacement-by-derivation):** absent an owner explicit-next, with a valid designation D masking derived-current R (D≠R), getThreeSlots → current=D, next=R. No stored next field written or read for the DISPLACEMENT.
- **INV-2 (no AUTO second source):** grep — the **make-current path** writes `nextBacklogOverride` 0 times (the auto-demote capture + write are gone). `nextBacklogOverride` survives ONLY as the owner explicit designate-next, and ONLY via its validity-checked-per-read honor (:352) — never silent-stale, never auto-captured.
- **INV-3 (BUG-C preserved):** no uuid in >1 slot (existing dedup at :358+; verify explicit-next / D / R / lastCompleted don't collide).
- **INV-4 (expiry):** the owner explicit-next expires per read (:352 done-check + :452 became-current clear); the make-current displacement is derived so it cannot linger (its removal fixes the orphan-stale failure mode of the old auto-write).

## FAILABLE (R40.54 family — stub-must-fail)
Tester's RED baseline: seed derived-current=Y, make-current(X≠Y) → assert NEXT slot == Y. Pre-fix this is RED (NEXT stays auto-scan/37.2); post-fix GREEN. Second stub: with NO designation, NEXT == auto-scan (regression guard that removing the override didn't break the normal next-backlog). Both must be able to fail (isolated fixture sprint, no prod mutation, R40.31).

## Scope / caution
- Confined to CurrentSprint.getThreeSlots (NEXT derivation) + the make-current write (server.ts:2000-2012 region). Do NOT touch the CURRENT derivation (:268-290) or the R40.44 designation-override semantics — this rides on them.
- Semantic note (non-blocking): NEXT now means "displaced-prior-current if a designation masks one, else next-upcoming-backlog." That dual meaning is inherited from the settled tester/PO expectation, not introduced here; if the PO ever wants them as two distinct surfaced slots, that is a separate design.
- Tree is on the hotfix branch pending the PO merge; this is a NEW design-note file (no merge conflict). Expert builds the code fix on the reconciled tree.
