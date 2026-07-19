<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.50: 3-way merge toolbar — change-# indicator, apply-all-non-conflicting popup, guarded save

[task:uuid:7ed31b36-ba6f-4d25-8f22-7da1f74dbbb2]

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
    - Requirement `[requirement:uuid:32abea56-5631-41a1-8167-3b651c70c709]`
  - down
    - [UC](./planning.md) `[uc:uuid:0feaff70-e51d-464c-8874-f5ca16966094]`
    - [UC](./planning.md) `[uc:uuid:f27ee373-4bb4-4913-88ec-9855d5c3523f]`
    - [UC](./planning.md) `[uc:uuid:787e7755-4529-459e-9c53-803301d4b3cb]`
    - [UC](./planning.md) `[uc:uuid:3b9c1f72-50dd-44f4-9bb0-0a8fcb5b069b]`

## Task Description

The 3-way merge toolbar shows a live '- N selected' change-number indicator (updates as the user navigates changes up/down), an 'Apply All Non-Conflicting' popup offering 2 auto-resolve modes (LEFT-wins / RIGHT-wins), and a GUARDED save: Save only persists when 0 conflicts remain (else it jumps to the next unresolved conflict), turns GREEN after a successful save, and reverts to default on any subsequent change.

## Context

Covers R30.50 (32abea56) → UCs [0feaff70/f27ee373/787e7755/3b9c1f72] → RbDiffEditor toolbar. ⚠ AC6 is a DESIGN-FLAG (reconcile 'Non-Conflicting' label vs accept-all-by-side modes) — architect resolves in design. Gate = screenshot+behavior DET-3x at Tron's viewport (Tron-visual feature).

## Intention

S30 diff/merge editor — R30.50 merge-toolbar optimization (Tron feature): change-# indicator + apply-all popup + guarded/indicated save.

## Acceptance Criteria

- [ ] The toolbar shows '- N selected' where N is the CURRENT change/conflict number navigated to (up/down nav position), replacing 'X/Y open conflicts - modified'.
- [ ] N live-updates as the user navigates changes up/down.
- [ ] 'Apply All Non-Conflicting' opens a popup (automagic) offering 2 auto-resolve modes.
- [ ] Mode 1: accept-all so CENTER matches the LEFT file (LEFT wins).
- [ ] Mode 2: accept-all so CENTER matches the RIGHT file (RIGHT wins).
- [ ] [DESIGN-FLAG] Reconcile the 'Non-Conflicting' label with the accept-all-by-side modes (only-non-conflicting vs all-including-conflicts) at architect design-derive + PO ruling.
- [ ] Save only actually SAVES when there are 0 open conflicts (all resolved).
- [ ] If conflicts REMAIN, pressing Save instead JUMPS to the next UNRESOLVED conflict (and does not save).
- [ ] After a successful save, the Save button turns GREEN (saved indicator).
- [ ] On ANY subsequent change, the Save button returns to DEFAULT (unsaved indicator).
- [ ] GATE (screenshot + behavior, DET-3x, at Tron's viewport): navigate -> indicator shows current change#; apply-all left/right -> CENTER matches that side; Save with conflicts -> jumps to next unresolved; Save at 0 conflicts -> saves + button GREEN; then edit -> button DEFAULT. Per architect design + Tron visual.

## Implementation

IN PROGRESS @ BUILDING (PO green-lit expert A->C2->C1->B, 2026-07-19). Architect design derived. Building the merge-toolbar: change-# indicator + apply-all-non-conflicting popup (2 modes) + guarded save + save-indicator. AC6 design-flag resolved by architect. Gate = screenshot DET-3x at Tron viewport.

## Subtasks

None (atomic task).
