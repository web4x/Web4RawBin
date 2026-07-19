<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.53: Changes-focused code-folding via NATIVE Monaco collapse/expand (fold by method boundaries)

[task:uuid:183475f6-400a-47f3-927a-620185798c22]

## Status
- [x] Planned
- [x] In Progress
  - [~] refinement (architect REDESIGNING native FoldingController)
  - [ ] creating test cases
  - [ ] implementing (build after architect confirm → correct v0.7.77)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:ac3338b6-07a1-4fa6-9040-d9144db16ee8]`
  - supersedes
    - R30.51 (41a6ab2c) setHiddenAreas — Tron-rejected + reverted
  - down
    - [UC](./planning.md) `[uc:uuid:fcf8b48f-8e84-47d4-905b-4cdfb355e528]`
    - [UC](./planning.md) `[uc:uuid:8451731c-bb67-43ab-9a40-27a43e817d77]`
    - [UC](./planning.md) `[uc:uuid:48d56602-bfa0-4df3-ae48-81f65e936430]`

## Task Description

REDESIGN of code-folding using Monaco's NATIVE folding (standard chevron collapse/expand + '...' placeholder), foldable regions = METHOD boundaries; collapsing an unchanged method-block syncs across all 3 editors; change-holding method-blocks stay expanded. Replaces the Tron-rejected setHiddenAreas mechanism (R30.51).

## Context

Covers R30.53 (ac3338b6, supersedes R30.51 41a6ab2c) → 3 UCs (fcf8b48f/8451731c/48d56602) → RbDiffEditor. Architect REDESIGNING a native FoldingController (foldByMethodBoundaries / syncNativeFold / keepChangeMethodsExpanded). AC4 = the native-Monaco approach design-flag. Gate = screenshot+behavior DET-3x incl 390 mobile (Tron-visual).

## Intention

S30 diff/merge editor — R30.53 native-Monaco code-folding (supersedes R30.51 after Tron rejection).

## Acceptance Criteria

- [ ] Code-folding uses Monaco NATIVE folding: standard chevron collapse/expand + '...' placeholder for a collapsed region (NOT setHiddenAreas hide-lines).
- [ ] Foldable regions are the METHOD boundaries - folding collapses a whole method block.
- [ ] Collapsing an UNCHANGED method-block collapses the corresponding block SYNCED across all 3 editors (Local/Center/Repository); method-blocks containing a change/conflict STAY EXPANDED.
- [ ] [DESIGN-FLAG] The native-Monaco folding impl approach (FoldingController / folding-range provider by method / native fold-state sync) per architect derive-confirm; align this impl-AC on their confirmation.
- [ ] GATE (screenshot+behavior, DET-3x incl 390 mobile): native chevrons collapse/expand method-blocks with '...' placeholder; collapse an unchanged method-block -> all 3 collapse synced; change-containing method-blocks stay expanded. (Mobile MUST work - the setHiddenAreas regression that broke mobile is the reason for the redesign.)

## Implementation

IN PROGRESS @ DESIGN (architect redesigning native FoldingController: foldByMethodBoundaries / syncNativeFold / keepChangeMethodsExpanded). ⛔ BUILD pending architect confirm → expert builds the correct v0.7.77. Supersedes R30.51 (Tron-rejected setHiddenAreas). Gate = screenshot DET-3x incl 390 mobile at Tron viewport.

## Subtasks

None (atomic task).
