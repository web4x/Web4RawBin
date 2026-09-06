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

- [ ] BUILD the lint (ci:gates qa-switch-state-validity): every QA-Review task carries a NAMED waiting-on (the thing it awaits) + a switch-DIRECTION (forward-to-Done / back-to-In-Progress); a QA item with neither => RED. A QA item whose named evidence is marked invalidated => RED (must have switched back).
- [ ] FAILABLE 1->0 (self-biting RED stub): seed a QA item with no waiting-on/direction (reproduces T40.85 done-while-broken parked-QA) -> RED; add the waiting-on+direction OR switch it back -> GREEN.
- [ ] FOLDED into ci:gates:raw + COUNTED (N QA items / M invalid listed) — mark-not-silence; a QA item with no movement is reported as a board defect, never hidden.
- [ ] SEEDS T40.85: on land, any parked-QA-on-invalidated-evidence is a tracked RED (T40.85 already switched back manually 2026-09-06; the lint makes the switch mandatory-by-construction).

## Subtasks

None (atomic lint task).
