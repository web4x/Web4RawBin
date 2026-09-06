<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.41: Harness-harden the tree-node drop handler — machine-verify drag-onto-tree with a synthetic unit-ref DataTransfer (removes the T37.20.4 instrument-limited caveat) [R37.20]

[task:uuid:cb015b3d-14d5-46fc-81e5-e6119b210273]

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

STOOD UP Planned (2026-09-06) on PO ruling off the planner's customer-not-tester flag (the drag-onto-tree limit is a HARNESS gap, not un-mockable — tester already synthesized a room-target drag tonight). OWNER=TESTER, TIER-A, take AFTER A2 (T37.36). On GREEN -> removes T37.20.4's caveat. Covers R37.20 AC-tree-folder-drop-target-routes-contract (machine-verify). req 3-pt verifies. 0 Done till Tron.

## Task Description

TIER-A harness gap, NOT a physics limit (PO 2026-09-06): the tester already synthesized a REAL drag for the ROOM target tonight (fired the app's own onDragStart, asserted zero-fetch). So the tree-node drop handler CAN be machine-verified with a synthetic unit-ref DataTransfer — it was just not yet instrumented, which is why T37.20.4 carries a 'full drag-onto-tree gesture instrument-limited, Tron's drag closes' caveat. This task closes that harness gap so the folder-drop is machine-verified end-to-end and Tron just ACCEPTS instead of verifying. This is the customer-not-tester law applied: machine-verify whatever CAN be, lean on his gesture only for the genuinely un-mockable (iOS suspend, not this). OWNER = TESTER (take after A2 per PO).

## Context

Machine-verification of R37.20 03e0f803 AC-tree-folder-drop-target-routes-contract. Unblocks removing the T37.20.4 (369b8636) caveat. parent S37 b86b53cc.

## Intention

The full user drag onto a tree node is exercised in-harness with a synthetic unit-ref payload — no reliance on Tron's drag to verify the mechanism.

## Acceptance Criteria

- [ ] The harness fires the TREE-NODE drop handler with a SYNTHETIC unit-ref DataTransfer (same technique already used for the ROOM target's onDragStart synthesis) and asserts the in-app unit routes through the ONE contract: reparentUnitsIntoContainer fires, the unit re-parents (children count moves), NO silent no-op.
- [ ] STUB-MUST-FAIL: revert the tree-node handler to files-only -> the test goes RED (proves it exercises the real gesture, not a mock of it).
- [ ] ON GREEN: the T37.20.4 caveat ('full drag-onto-tree gesture instrument-limited') is REMOVED from its acceptance-list row + unit — the folder-drop is machine-verified end-to-end, Tron ACCEPTS not verifies.

## Subtasks

None (atomic harness task).
