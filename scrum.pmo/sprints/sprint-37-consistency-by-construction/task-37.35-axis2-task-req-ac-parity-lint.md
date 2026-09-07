<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.35: AXIS-2 lint — task<->req AC PARITY (task-md AC set == covered-req AC set, count+ids) [R37.34; seeds T37.20 6-vs-7 RED]

[task:uuid:33b28f6b-6cfe-489a-999a-206b67ec4dfe]

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

STOOD UP Planned (2026-09-06) on req R37.34 7698c63b, axis-2 of 3. OWNER = TESTER (builds the lint). Seeds the T37.20 6-vs-7 RED (byte-check blind). UC 7b6d5d23 + covered-req 7698c63b resolved from R37.34 on disk (NOT fabricated). Minted SERVED tree. req 3-pt verifies. 0 Done till Tron.

## Task Description

Semantic-drift guard, axis-2 of R37.34 (7698c63b, child of R37.3). R37.3's fail-loud pin==board==files byte-check is BLIND to task<->req AC drift: T37.20's task-md rendered 6 ACs while its covered req R37.20 had 7, and S37 still BYTE-MATCHED (the architect miscounted from the view, req was right from the unit). This lint asserts the semantic invariant the byte-check cannot see. OWNER = TESTER (tester owns the lints, req ruling). Same 1->0 failable shape as R37.2/R37.3 gates.

## Context

Covers R37.34 7698c63b (AC-axis2-task-req-ac-parity), UC 7b6d5d23 (gate-harness semantic drift). extendsRequirement chain -> R37.3 1530c79c. parent S37 b86b53cc.

## Intention

A task's rendered ACs (task-md) always equal its covering requirement's ACs — count AND ids — or the board goes RED. Semantic parity, not byte-identity.

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
