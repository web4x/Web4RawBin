<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.12: 2-way take-over (no-base fallback)

[task:uuid:f13fc976-7440-4818-90f0-3f201692083e]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.12 `[requirement:uuid:c6f127bc-9f13-4f5f-945a-55a6293101eb]`
  - down
    - [UC](./planning.md) `[uc:uuid:fbc0a539-1b97-4701-847c-d41af818c23e]`

## Task Description

Wire 2-way take-over as the no-base fallback: with no common base, the merge editor falls back to 2-way (ours/theirs) per-hunk resolution.

## Context

Covers R30.12 (c6f127bc). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.12). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [ ] (compute) NEW RbDiffEditor.computeTwoWayHunks(localLines, remoteLines) does an LCS 2-way line-diff, emitting one Conflict{a,b,pick,span} per differing region (change / pure-add remote-only / pure-del local-only), pick='a' default (keep Local). Pure, DOM-free, unit-testable.
- [ ] (wire) computeMergedCenter's base==='' branch sets this.conflicts = computeTwoWayHunks(...) instead of leaving [] ; twoWay=true stays; CENTER still starts = LOCAL (impl-edit to existing a0b30550, marker stays).
- [ ] (wire) renderMergeGutter (twoWay branch) draws the SAME gutter decos + accept-left/accept-right bar, labeled 'change #N (take-over)' with take-over styling (NOT 'conflict'); accept-left=keep Local, accept-right=take Version (impl-edit to existing e24dc98a, marker stays).
- [ ] (reuse) acceptChange (843d79d4, UNCHANGED) resolves a 2-way hunk by id (pick side -> rebuildCenter re-flattens CENTER) — works once conflicts[] is populated (same Conflict shape).
- [ ] (regression) The 3-way base-aware path (merge-base present) is UNTOUCHED — same diff3 conflicts, conflict styling, behavior.
- [ ] (verify) Tron visual re-check: comparing LOCAL to a version with NO merge-base now shows accept arrows that pull a compared-version line into CENTER (README-vs-first-version case); DET-3x on computeTwoWayHunks.

## Implementation

STOOD UP (planning) — status Planned; was requirement-only, minted for #126 traceability. Status to be advanced per PO/architect hop-signals (some R30.1x may already be shipped/gated — verify).

## Subtasks

None (atomic task).
