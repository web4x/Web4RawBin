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

- [ ] BUILD the lint (ci:gates drift-metric-completeness): the drift check must satisfy excluded + checked == total across ALL board artifacts; each exclusion category (frozen-legacy, missing-file, hand-authored) is COUNTED and DECLARED in the report, never silently dropped. A silent exclusion that undercounts => RED.
- [ ] FAILABLE 1->0 (self-biting RED stub): seed a silent exclusion (reproduces the 7-vs-200 undercount) -> RED; declare+count the exclusion -> GREEN.
- [ ] FOLDED into ci:gates:raw; the drift report EMITS 'checked N / excluded M (by category) / total N+M' so a floor can never again be read as a total.
- [ ] SEEDS the 7-vs-200: on land, the current metric's silent frozen-legacy + missing-file exclusions are a tracked RED until the report accounts them.

## Subtasks

None (atomic lint task).
