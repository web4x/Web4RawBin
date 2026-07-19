<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.51: Changes-focused code-folding in the 3-way merge editors

[task:uuid:4165a551-b7e0-4f43-b053-a70ef4c78c6c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect design DONE — design-folding.md, setHiddenAreas, Fold1-4)
  - [ ] creating test cases
  - [ ] implementing (BLOCKED — pending Tron context-margin K ruling + PO green-light)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:41a6ab2c-90ce-49cf-b975-ceae469e6ea2]`
  - crossRef
    - R30.9 base-aware / R30.16 line-align / R30.50 toolbar (shared RbDiffEditor)
  - down
    - [UC](./planning.md) `[uc:uuid:5dedb343-9457-4f02-bbc6-023f8fe42c78]`
    - [UC](./planning.md) `[uc:uuid:d5534ec3-c61b-4a70-b63b-fd4010947d02]`
    - [UC](./planning.md) `[uc:uuid:47fbd1d7-9890-484c-b1ae-d13947f5a3a0]`

## Task Description

The 3-way merge editors get changes-focused code-folding: expand/collapse SYNCS across all three panes (Local/Center/Repository); a foldable region that CONTAINS a change/conflict CANNOT be collapsed (stays expanded); and on open the initial fold state is fully auto-collapsed EXCEPT the change-holding regions. Monaco setHiddenAreas approach per the architect design.

## Context

Covers R30.51 (41a6ab2c) → 3 UCs (foldSyncAcrossPanes 5dedb343 / changeRegionNotCollapsible d5534ec3 / changesOnlyInitialFold 47fbd1d7) → RbDiffEditor. Architect design DONE (design-folding.md, Monaco setHiddenAreas, UCs Fold1-4, build order Fold3+Fold1→Fold2→Fold4). crossRef R30.9 (base-aware) / R30.16 (line-align) / R30.50 (toolbar). AC4 = the Monaco-folding-approach design-flag (architect resolved). Gate = screenshot DET-3x at Tron viewport.

## Intention

S30 diff/merge editor — R30.51 changes-focused code-folding (Tron feature): keep the eye on the changes, fold away the unchanged context, synced across the 3 panes.

## Acceptance Criteria

- [ ] Expand/collapse folding SYNCS across all THREE editors (Local/Center/Repository): folding a region in one pane folds the ALIGNED region in all three.
- [ ] A foldable region that CONTAINS a change/conflict CANNOT be collapsed - it stays expanded (changes are never hidden by folding).
- [ ] On open, the initial fold state is FULLY auto-collapsed EXCEPT the change-holding regions, which are expanded (a changes-only view).
- [ ] [DESIGN-FLAG] The Monaco-folding impl approach (folding-model sync / foldingRangeProvider exclusion of change regions / initial-fold timing) per architect derive-confirm; align this impl-AC on their confirmation.
- [ ] GATE (screenshot + behavior, DET-3x, at Tron's viewport): open a 3-way diff with changes -> only change regions expanded (rest collapsed); fold a NON-change region in one pane -> all 3 fold aligned; attempt to collapse a CHANGE region -> stays expanded.

## Implementation

IN PROGRESS @ DESIGN-COMPLETE (architect design DONE: design-folding.md, Monaco setHiddenAreas approach, UCs Fold1-4, build order Fold3+Fold1→Fold2→Fold4). ⛔ BUILD pending Tron's context-margin K ruling + PO green-light — NOT building yet. AC4 Monaco-folding-approach design-flag resolved by architect. Gate = screenshot DET-3x at Tron's viewport (Tron-visual feature).

## Subtasks

None (atomic task).
