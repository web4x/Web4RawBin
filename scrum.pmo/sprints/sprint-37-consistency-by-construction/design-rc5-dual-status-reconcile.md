# R-C5 — Dual-status reconcile: ONE truth by construction (architect design, 2026-08-07)

**Basis:** doctrine `consistency-by-construction.md` + R-C2 CRUX flag. Unit 03fd79ff. PO sequenced R-C5 AHEAD of R-C1 — it GATES the honest-Done sprint closes (the planner audit is blocked on it). TRON-authorized guard sprint (S37).

## The DRY violation (measured, disk 2026-08-07)
A Task carries status in TWO independent fields that nothing keeps in sync:
- **`model.status`** — enum `{Planned, In Progress, QA Review, Done}` → drives the **planning.md checkbox** (Done-ness) (generate-sprint-md.ts:119).
- **`model.statusChecklist`** — the standard-template STRING (`- [x] Planned / - [ ] In Progress[4 sub-steps] / - [ ] QA Review / - [ ] Done`) → drives the **task-md `## Status`** verbatim (:67).
**MEASURED:** 496 Task units, 479 have a string checklist, **1 malformed (non-string)**, and **~69 DISAGREE** (`status != derive(checklist)`) — the exact drift-vector R-C2 could not touch. The DANGEROUS subset = **`status=Done` while the checklist's Done box is UNCHECKED** (e.g. "Sprint scenario units…") = a potential FALSE-DONE — the very thing the S33-36 honesty audit hunts.

## ★ ONE-TRUTH principle (by construction, DRY)
**`statusChecklist` = the SOURCE; `status` = a DERIVED projection.** Rationale: the checklist carries strictly MORE information (the sub-steps), so `status` is losslessly derivable from it but NOT vice-versa; the checklist is what the human works against in the task-md. Make `status` a **computed/generated field** (like the board itself) — then the two CANNOT disagree by construction.

**`deriveStatusEnum(checklist)` = the HIGHEST checked TOP-LEVEL box** (`Planned < In Progress < QA Review < Done`), 1:1 with the enum:
- `Done` iff the top-level `Done` box is `[x]`; else `QA Review` iff `QA Review` `[x]`; else `In Progress` iff `In Progress` `[x]`; else `Planned`. Pure, deterministic, sub-steps ignored for the coarse enum (they enrich the task-md only).

## ★ HARD CONSTRAINTS (the safety envelope — from the PO)
- **INV-S5a (no status-invention / NO FLIP):** R-C5 code MUST NOT silently flip a task's displayed Done-ness. For the ~69 EXISTING disagreements it does NOT auto-derive-override (that would flip the board checkbox = inventing a status). It DETECTS + SURFACES them; the OWNER resolves (below).
- **INV-S5b (fail-loud, not silently picked):** a disagreement HALTS (fail-loud CI) — "no silent broken state." The guard never picks a winner; it lists offenders for resolution.
- **INV-S5c (units→derivation only; no prod/other-field mutation):** deriving `status` from `statusChecklist` touches ONLY the `status` field of Task units, and ONLY once the disagreement is owner-resolved; never prod scenario data, never the checklist content (the source stays the human's).
- **INV-S5d (honest-Done gate):** the disagreement list IS the planner's audit worklist — R-C5 UNBLOCKS the honest closes by making "which tasks have un-established Done-ness" explicit + fail-loud, but the RESOLUTION of each (is it really Done?) is the TASK-level owner act (planner + TRON-QA per the honesty precondition), NOT R-C5 auto-deciding.

## IMPL-SHAPE (expert-buildable)
| # | Piece | Detail |
|---|-------|--------|
| 1 | **`deriveStatusEnum(checklist: string): Status`** pure fn (shared module, e.g. `scripts/generate-sprint-md.ts` or a small `src/ts/scenario/task-status.ts`) | highest-checked top-level box → `Done`/`QA Review`/`In Progress`/`Planned`; deterministic; sub-steps ignored for the enum. |
| 2 | **status becomes DERIVED (by-construction, going forward)** | the generator + any Task writer sets `model.status = deriveStatusEnum(model.statusChecklist)` — `status` is no longer independently hand-edited → the two CANNOT disagree for new/edited tasks (INV-S5 by construction). |
| 3 | **FAIL-LOUD detector `assertStatusConsistent`** | for every Task: assert `model.status == deriveStatusEnum(model.statusChecklist)`; `exit 1` listing EVERY offender + FLAG the `status=Done && Done-box-unchecked` subset as FALSE-DONE priority. Also flag the 1 malformed (non-string) checklist. Fold into `ci:gates` (the assertion is R-C5's; CI-wiring composes with R-C3). |
| 4 | **Migration — phase 2 (existing ~69): DETECT + owner-RESOLVE, never auto-flip** | the detector's list = the planner's honest-Done AUDIT WORKLIST. Each is resolved at the TASK level: the owner fixes the CHECKLIST (the source) to reflect TRUE state (+ TRON-QA for user-facing Done, honesty precondition), THEN `status` auto-derives + agrees. R-C5 code NEVER silently picks (INV-S5a/b). Fix the 1 malformed checklist → template. |

**Why checklist=source (not status):** the checklist is losslessly reducible to the enum (highest-box) but the enum cannot reconstruct sub-steps — so the richer field must be source (DRY: derive the poorer from the richer, never duplicate).

## GATE (drift-injection BITE — fail-loud proven, [[correct-by-construction-needs-gate-verification]])
1. **BITE-a (guard bites the false-Done):** plant `status=Done` on a task whose checklist Done-box is `[ ]` → `assertStatusConsistent` MUST `exit 1` naming it as FALSE-DONE.
2. **BITE-b (agreeing derives):** a task whose `status == deriveStatusEnum(checklist)` → passes; and setting `status=deriveStatusEnum(checklist)` on a fresh edit keeps them equal (by-construction, no new drift).
3. **RESOLVE path:** fix a disagreement's CHECKLIST to truth → re-derive → `status` agrees → guard GREEN. (Proves resolution flows checklist→status, never the reverse invention.)
4. **INV-S5c:** the derivation touches ONLY `model.status`; `statusChecklist` content + prod scenario data UNCHANGED (git-diff scoped to the status field).
5. **HONEST-DONE unblock:** the detector's worklist is handed to the planner = the exact set of tasks whose Done-ness must be re-established before S33-36 close honestly.

## CHAIN + deploy
- UC `taskStatus.deriveAndAssert` → Class (`SprintViewGenerator` or new `TaskStatus`) → Method `deriveStatusEnum` + `assertStatusConsistent` → Impl → **Test = the BITE** (plant false-Done → fail; agreeing → pass; resolve → agree). Distinct-intent Test (verify-owner-first, no cross-wire). req mints #126 at build-go; I backstop.
- **Deploy:** `deriveStatusEnum`/`assertStatusConsistent` are GENERATOR/CI-tooling (run at commit-time, not the prod server) → **NO server restart / NO version bump** IF confined to scripts/. If a shared module is also imported by the running server, then real-restart + R31.7. Prefer scripts/CI-only (no restart).
- **Sequence:** R-C5 (this) UNBLOCKS the planner honest-Done audit → then S33-36 closes (team, per doctrine) → R-C1 pin-resolver → R-C3 fail-loud guard (folds in assertStatusConsistent + the sprints.overview generator) → R-C4 self-heal.
