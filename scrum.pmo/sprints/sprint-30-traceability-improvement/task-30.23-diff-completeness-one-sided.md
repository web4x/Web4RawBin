<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.23: Diff completeness — 3-way one-sided changes surfaced

[task:uuid:d6b57c68-722a-4d93-a094-7fbc3a6c824e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.23 `[requirement:uuid:940a92d8-9254-44dc-99aa-ad6f8b1d2e1c]`
  - down
    - [UC diffEditor.threeWayChangeCoverage](./planning.md) `[uc:uuid:18604655-55c6-4b4c-953a-8b18659a3f89]`

## Task Description

3-way merge one-sided changes (local-only / repo-only auto-merged regions) are surfaced as change blocks + ribbons + take-arrows, not swallowed as stable ok-runs. computeMergedCenter emits Conflict{kind:'change', pick:'local'|'repo'} into conflicts[] so downstream renderers (center/side change-blocks, connector ribbons, jumpToChange) show every one-sided change while keeping the merge result byte-identical. (IMG_4522: a 'merged, 0 true-conflicts' file still shows every one-sided change.)

## Context

Covers R30.23 (940a92d8) → UC diffEditor.threeWayChangeCoverage (18604655). Class RbDiffEditor. Impl = computeMergedCenter marker a0b30550 (impl-edit; computeOneSidedHunks is a PRIVATE helper under it, architect 5d50099ef — NOT a minted Method). ⚠ BACKFILL: task unit minted post-hoc to repair the PO-acknowledged pipeline-skip (#126 gap — code shipped v0.7.33 before this Task unit existed). Going forward: req→planner-task→architect→expert.

## Intention

S30 diff/merge editor completeness (R30.23, IMG_4522) — no one-sided-invisibility; a change that auto-merged still gets a block/ribbon/arrow.

## Acceptance Criteria

- [x] (origin) A local-only change (diff3 ok-region whose content differs from its BASE slice) is emitted as Conflict{kind:'change', pick:'local'} into conflicts[]/centerSeq → change block on the LOCAL (left) side, not swallowed as a stable ok-run
- [x] (origin) A repo-only change is emitted as Conflict{kind:'change', pick:'repo'} → change block on the REPOSITORY (right) side
- [x] (both) A both-sides divergence stays a true conflict (kind:'conflict'), NOT double-counted as a repo change
- [x] (result) Auto-pick keeps the MERGE RESULT byte-identical (the change stays applied) — ADDS visibility + a take-over arrow only; a truly-stable ok-region (content==BASE) remains an ok-run
- [x] (downstream) renderCenterChangeBlocks + R30.19 renderSideChangeBlocks + renderConnectorRibbons + jumpToChange iterate the SAME conflicts[] → each surfaced change gets block+ribbon+arrow, NO new rendering code (impl-edit to computeMergedCenter marker a0b30550 only)
- [x] (verify) IMG_4522 repro + DET-3x: a 'merged, 0 true-conflicts' file still shows every one-sided change as block/ribbon/arrow; merge output byte-identical
- [x] (label-count / R30.23.1) The conflict-count label counts TRUE conflicts only (v0.7.34) — one-sided changes are changes, not conflicts

## Implementation

DONE v0.7.33 GREEN DET-3x (gate f35ca2c69 edit-BMERY5NZ.js; expert 67c8793d2; architect design 808144a5e). Chain-to-Test on origin: Test ab33b3e8 (f6d54c82c) wired onto Impl computeMergedCenter a0b30550 (e07baf8ed, keeps R30.9 eb4a550e). SUB-NOTE R30.23.1 label accuracy (v0.7.34, 23a927aff edit-W5ST5LB6.js): the conflict-count label counts TRUE conflicts only (one-sided changes are changes, not conflicts) — see AC (label-count).

## Subtasks

None (atomic task; R30.23.1 label-count folded as the last AC).
