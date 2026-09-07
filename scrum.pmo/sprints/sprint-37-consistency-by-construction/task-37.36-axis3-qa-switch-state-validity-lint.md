<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.36: AXIS-3 lint — QA-is-a-SWITCH-STATE validity (every QA item names a waiting-on + switch-direction; evidence-invalidated => not-QA) [R37.34; seeds T40.85 RED]

[task:uuid:993b3f2d-f51d-4b6a-844b-b0904dd73655]

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

STOOD UP Planned (2026-09-06) on req R37.34 7698c63b, axis-3 of 3. OWNER = TESTER. Seeds T40.85 done-while-broken RED. UC 7b6d5d23 + covered-req resolved on disk. Minted SERVED. req 3-pt verifies. 0 Done till Tron.

## Task Description

Semantic-drift guard, axis-3 of R37.34 (7698c63b, child of R37.3). QA-Review is a SWITCH state, not a resting state (Tron): nothing parks in QA — it moves forward to Done (Tron's act) or BACK to In-Progress the moment evidence is invalidated. T40.85 rotted at 'Done-pending-Tron' for days while the customer's upload was broken = the scoreboard lying. This lint makes a parked/invalidated QA item RED by construction, deleting the hand-vigilance the PO performed all day. OWNER = TESTER (tester owns the lints). 1->0 failable.

## Context

Covers R37.34 7698c63b (AC-axis3-qa-switch-state-validity), UC 7b6d5d23. extendsRequirement -> R37.3 1530c79c. parent S37 b86b53cc.

## Intention

A QA-Review item must carry a named thing-it-waits-ON and a direction-it-switches-TO; a QA item with neither, or whose evidence is invalidated, goes RED — it cannot silently read as finished.

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
