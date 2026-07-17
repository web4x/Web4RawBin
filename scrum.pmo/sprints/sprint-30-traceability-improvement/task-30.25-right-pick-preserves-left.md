<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.25: Picking a RIGHT ref preserves the LEFT side (no blanking)

[task:uuid:1ea9288f-abc9-4afe-b70a-befeb976fa55]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.25 `[requirement:uuid:a604a1b5-9d7b-4b31-a465-d684dfc256c2]`
  - crossRef
    - preserves TRON4 auto-promote + R30.17 _leftUserPicked + R30.24 _deepLink suppression/round-trip
  - down
    - [UC diffEditor.rightPickPreservesLeft](./planning.md) `[uc:uuid:1bcee6db-1f2c-4b14-9f84-e7fc4085db7f]`

## Task Description

Fix the left-empties-on-right-select bug: picking a branch on the RIGHT pane must NOT blank the LEFT. TRON invariant — a RIGHT pick touches ONLY right+center, NEVER left. A symmetric _rightUserPicked guard (mirrors _leftUserPicked) makes a user-driven RIGHT win over the auto-promote so populateLeftHistory does not replace this.right nor run its default left-reload; the promote is serialized (await + generation token) so a stale promote's left-reload tail aborts on token mismatch.

## Context

Covers R30.25 (a604a1b5) → UC diffEditor.rightPickPreservesLeft (1bcee6db) → Class RbDiffEditor 18165081. Architect derive-PASS 72cbf9f49 (TRON-sharpened invariant 'RIGHT-pick touches ONLY right+center, NEVER left' + enforcement mapping + before/after left-identity AC). IMPL-EDIT, no new units (per PO+req 529795387). Must preserve TRON4 auto-promote + R30.17 _leftUserPicked + R30.24 _deepLink suppression / round-trip.

## Intention

S30 diff/merge editor regression (R30.25, Tron): open a working file (auto-promote older-on-left) then pick a RIGHT branch → LEFT was blanking. Restore left-identity under right-pick, including the race window (pick RIGHT while promote in flight).

## Acceptance Criteria

- [ ] (fires) Open a working file (promote→older-on-left), then pick a branch on the RIGHT: LEFT still renders its content, RIGHT = file@branch, center recomputes — LEFT NEVER blanks; includes the RACE WINDOW (pick RIGHT immediately after open, promote still in flight)
- [ ] (fix) A symmetric _rightUserPicked guard (set in setSideRef('right')/the right ref path) makes a user-driven RIGHT WIN over the auto-promote: populateLeftHistory does NOT replace this.right and does NOT run its default left-reload when _rightUserPicked (mirrors _leftUserPicked)
- [ ] (fix) The promote is serialized (await populateLeftHistory + a generation token); a stale promote's left-reload tail aborts on token mismatch so it can never reload LEFT over a fresh user pick; defaultIdx computed from a snapshot of this.left.content taken BEFORE the awaits, not live this.right.content
- [ ] (no-regression) TRON4 preserved: a working-file left load with NO right interaction still auto-promotes (older-on-left) as before
- [ ] (no-regression) R30.17 left PICK-WINS (_leftUserPicked) + R30.24 _deepLink promote-suppression both still hold; buildShareLink/openFromParams (R30.24) still round-trip after the right-pick
- [ ] (verify) DET-3x + instrumentation trace (addLog at promote entry/exit, loadSide, setSideRef): on the repro the event order shows NO post-pick left-reload; client fix → version-bump; Tron visual verify

## Implementation

IN PROGRESS — architect derive-PASS 72cbf9f49, EXPERT BUILDING now (impl-edit to RbDiffEditor: _rightUserPicked guard in setSideRef('right')/right-ref path + serialized promote with generation token; defaultIdx from a this.left.content snapshot taken BEFORE the awaits, not live this.right.content). → expert deploy → QA-Review → tester DET-3x GREEN (repro event-order shows NO post-pick left-reload) → Done. Planner advances status on gate. ⚠ chain-to-Test: ensure the Impl gets its Test unit wired before Done (R30.24/R30.11 lesson).

## Subtasks

None (atomic task).
