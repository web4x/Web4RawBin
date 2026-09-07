<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.37: AXIS-4 lint — drift-metric COMPLETENESS (excluded + checked == total; silent frozen-legacy / missing-file exclusion => RED) [R37.34; seeds 7-vs-200 RED]

[task:uuid:e48a1e0a-9c9f-4a1f-8492-1672e9565809]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06) on req R37.34 7698c63b, axis-4 of 3. OWNER = TESTER. Seeds the 7-vs-200 undercount RED. UC 7b6d5d23 + covered-req resolved on disk. Minted SERVED. req 3-pt verifies. 0 Done till Tron.

## Task Description

Semantic-drift guard, axis-4 of R37.34 (7698c63b, child of R37.3). The drift metric (generate-sprint-md --check) reported 7 artifacts while the deliberate reconcile-all touched 200 = it UNDERCOUNTED true drift ~28x because it silently EXCLUDES frozen-legacy + missing-file creation. Reporting a FLOOR as the total is the same false-confidence class the whole sprint kills; refines R37.3 no-vacuous-truth (all-or-nothing -> per-category-accounted). OWNER = TESTER. 1->0 failable.

## Context

Covers R37.34 7698c63b (AC-axis4-metric-completeness), UC 7b6d5d23. Refines R37.3 1530c79c no-vacuous-truth. parent S37 b86b53cc.

## Intention

The drift check accounts for every artifact: excluded + checked == total, each exclusion category counted and DECLARED; a silent exclusion that lets the metric undercount goes RED.

## Acceptance Criteria

- [ ] **(semantic-drift/parity)** AXIS-2: a task's rendered ACs (task-md) must MATCH its covering requirement's ACs (count + ids); a task-md showing N ACs while its covered req has M!=N => RED. The T37.20 case (task-md 6 vs req 7) that the byte-check stayed GREEN on is caught. 1->0.
- [ ] **(semantic-drift/qa-validity)** AXIS-3: a QA-Review item is a SWITCH STATE - it must carry a named waiting-on + switch-direction; a QA-Review item with no waiting-on/switch-direction OR whose evidence is INVALIDATED is NOT validly QA => RED. Catches T40.85 (sat Done-while-broken). 1->0.
- [ ] **(semantic-drift/completeness)** AXIS-4: the drift --check must NOT silently exclude any category (frozen-legacy, missing-file-creation) - every excluded unit/category is COUNTED or explicitly DECLARED-excluded (with a named reason), never silently dropped. The ~28x undercount (7 reported vs 200 true) => RED. Refines R37.3 no-vacuous-truth from all-or-nothing to per-category-accounted. 1->0.
- [ ] **(self-failability)** Each axis lint is FAILABLE with its own RED-proving stub (same 1->0 shape as the existing R37.3/R37.2 gates) - a lint that cannot go RED on its axis's seeded drift is unproven and inadmissible (generalizes R37.3 AC-BITE to the 3 semantic axes).
- [ ] **(axis2/ratchet)** RATCHET rollout (PO 2026-09-06): the parity lint RED count is a BASELINE (measured 140 across 417 tasks: 67 zero-AC + 73 count-mismatch) that must NEVER INCREASE. TOUCH-IT-FIX-IT: any task anyone TOUCHES (commits) must come out AT PARITY. A right rule with a wrong rollout gets abandoned; a ratchet converges without stopping delivery.
- [ ] **(axis2/current-era)** CURRENT-ERA MUST REACH ZERO: every S37 task that is In-Progress or QA-Review reconciles to parity (a bounded small set = the rows Tron reads). A current-era (In-Progress/QA-Review) task with an AC-count drift => RED.
- [ ] **(axis2/no-exclusion)** NO SILENT EXCLUSION EVER: the lint counts ALL 417 tasks and reports N-and-falling; the DENOMINATOR is never shrunk to make the number look better (ties AXIS-4 metric-completeness). A task silently excluded from the parity scan, or a shrunk denominator, => RED.

## Subtasks

None (atomic lint task).
