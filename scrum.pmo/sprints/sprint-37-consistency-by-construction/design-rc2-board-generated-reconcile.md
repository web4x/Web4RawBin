# R-C2 — Board GENERATED view + one-time reconcile-all (architect design, 2026-08-07)

**Basis:** doctrine `session/knowledge-base/consistency-by-construction.md` (ARON/TRON) + scope `scrum.pmo/consistency-guard-scope.md` (planner). Unit eec7ebb7. S37 build-order FIRST. TRON-authorized strategic increment (the guard sprint); R-C2 = reflect-reality bookkeeping made structural.

## Principle (DRY, from the doctrine)
**The scenario UNITS on disk are the ONE source of truth. The board (planning.md, task-*.md, requirements.md, sprints.overview.md) is a GENERATED VIEW.** A generated view cannot drift from its source — so the fix for 29 sprints of drift is not hand-editing 29 boards, it is **regenerating every board from its units in one pass** (reconcile-all). The drift exists because md copies were hand-edited away from their units; regeneration overwrites the hand-edit with the unit-derived truth.

## Measured drift (planner, disk 2026-08-07)
- Active S33/34/35/36 boards **byte-match** `generate-sprint-md --check` ✓.
- **29 older sprints DRIFT:** 24 `requirements.md`, a handful `planning.md`/`task-*.md` — hand-maintained copies disagree with their units.

## R-C2 scope (2 parts)
- **(a) GUARANTEE board = generated view** — the board is ALREADY generated (`generate-sprint-md`); R-C2 confirms there is NO hand-authoring path that is treated as truth (md carries the `GENERATED … DO NOT HAND-EDIT` header; truth flows units→md only).
- **(b) ONE-TIME reconcile-all** — regenerate EVERY sprint's views from its units in ONE run, clearing the 29-sprint historical drift. NOT hand-fixed (that would be CMM2 vigilance again).

## ★ HARD INVARIANTS (the safety envelope — these bound the reconcile-all)
- **INV-C1 (units untouched — direction is units→md ONLY):** reconcile-all READS scenario units and WRITES md views. It MUST NOT write/mutate any scenario unit. => sprint-unit statuses + Task-unit statuses + prod scenario data are BYTE-UNCHANGED (git-clean on scenario/index after the run). This satisfies PO constraint (d): does NOT disturb sprint-unit statuses (S33-36 close = separate TRON governance) nor prod data.
- **INV-C2 (idempotent / round-trip byte-stable):** running reconcile-all twice yields ZERO changes on the 2nd run (`git diff` empty). Requires the generator to be DETERMINISTIC (stable ordering, no timestamps/random) — the R32.7-puml byte-identical discipline applied to md.
- **INV-C3 (generated-only surface):** reconcile-all writes ONLY generated view files (planning.md, task-*.md, requirements.md, sprints.overview.md under scrum.pmo/sprints/). It does NOT touch code, prod scenario/index, MODEL_STORE, or any non-generated doc.
- **INV-C4 (no status invention):** the regenerated md reflects EXACTLY the unit statuses as they are — reconcile-all NEVER flips a task Done/Reopened/etc. (that is planner audit + the honesty gate, a SEPARATE act). It only makes the VIEW match the units. A drifted board where the UNIT itself is wrong is NOT R-C2's job (that is the S33-36 honesty audit under the correction).
