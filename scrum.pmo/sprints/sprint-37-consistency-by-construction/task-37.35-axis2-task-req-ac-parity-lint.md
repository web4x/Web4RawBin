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

- [ ] BUILD the lint (ci:gates task-req-ac-parity): for EACH task, the task-md AC set == the covered-requirement AC set (COUNT + ids); a task-md showing N ACs while its covered req has M!=N => RED. Correct-by-construction over ALL current-era tasks, no silent skip.
- [ ] FAILABLE 1->0 (self-biting RED stub): seed a task-md AC count != its covered-req AC count -> the lint goes RED (reproduces the T37.20 6-vs-7 the byte-check stayed GREEN on); resolve parity -> GREEN. Proves the lint can fail.
- [ ] FOLDED into ci:gates:raw (runs every gate pass) + COUNTED (N tasks checked / M parity-violations listed) — mark-not-silence, never a silent exclusion.
- [ ] SEEDS T37.20: on land, T37.20's own task-md<->R37.20 parity is a tracked RED until reconciled (the concrete first catch).

## Subtasks

None (atomic lint task).
