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
