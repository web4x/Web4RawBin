<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.50: 3-way merge toolbar — change-# indicator, apply-all-non-conflicting popup, guarded save

[task:uuid:7ed31b36-ba6f-4d25-8f22-7da1f74dbbb2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
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
    - [UC](./planning.md) `[uc:uuid:6780cb2e-42fb-46d8-9061-05d117304d47]`

## Task Description

The 3-way merge toolbar shows a live '- N selected' change-number indicator (updates as the user navigates changes up/down), an 'Apply All Non-Conflicting' popup offering 2 auto-resolve modes (LEFT-wins / RIGHT-wins), and a GUARDED save: Save only persists when 0 conflicts remain (else it jumps to the next unresolved conflict), turns GREEN after a successful save, and reverts to default on any subsequent change.

## Context

Covers R30.50 (32abea56) → UCs [0feaff70/f27ee373/787e7755/3b9c1f72] → RbDiffEditor toolbar. ⚠ AC6 is a DESIGN-FLAG (reconcile 'Non-Conflicting' label vs accept-all-by-side modes) — architect resolves in design. Gate = screenshot+behavior DET-3x at Tron's viewport (Tron-visual feature).

## Intention

S30 diff/merge editor — R30.50 merge-toolbar optimization (Tron feature): change-# indicator + apply-all popup + guarded/indicated save.

## Acceptance Criteria

- [x] The toolbar composes '- N selected . X/Y open' (KEEP the open-conflict count per Tron) where N is the CURRENT change/conflict number navigated to (nav position).
- [x] N live-updates as the user navigates changes up/down.
- [x] 'Apply All Non-Conflicting' opens a popup (automagic) offering 2 auto-resolve modes.
- [x] Mode 1: accept-all so CENTER matches the LEFT file (LEFT wins).
- [x] Mode 2: accept-all so CENTER matches the RIGHT file (RIGHT wins).
- [x] [RESOLVED - Tron ruling] 3-MODE ADD (not replace): the 'Apply All' popup offers 'Non-conflicting only' (existing 91c452ae kept) + 'All-Local wins' + 'All-Repo wins'; button relabelled 'Apply All'. (architect reconciled the label in the design derivation; shipped build A→C2→C1→B, r3050 GREEN.)
- [x] Save only actually SAVES when there are 0 open conflicts (all resolved).
- [x] If conflicts REMAIN, pressing Save instead JUMPS to the next UNRESOLVED conflict (and does not save).
- [x] After a successful save, the Save button turns GREEN (saved indicator).
- [x] On ANY subsequent change, the Save button returns to DEFAULT (unsaved indicator).
- [ ] GATE (screenshot + behavior, DET-3x, at Tron's viewport): navigate -> indicator shows current change#; apply-all left/right -> CENTER matches that side; Save with conflicts -> jumps to next unresolved; Save at 0 conflicts -> saves + button GREEN; then edit -> button DEFAULT. Per architect design + Tron visual. — DET-3x GREEN ✓ (r3050 522c34b01 v0.7.73, 4 method-Tests + rides 8fa42d89/79139c01, served==gated); Tron VISUAL (screenshot at Tron viewport) pending.

## Implementation

QA-REVIEW: merge-toolbar BUILT+GATED v0.7.73. Gate r3050 GREEN DET-3x (522c34b01), chain both-directions — 4 new-method Tests (openApplyAllMenu 9e1bfc3d/applyAllFromSide 4d2260ea/saveOrJumpToConflict 690f963c/updateSaveButtonState 5296e852) + A rides renderMergeGutter 8fa42d89 + non-conflicting rides 79139c01. served==gated. 10/11 ACs (AC11 gate Tron-visual pending). HELD rule#9 -> Tron VISUAL (screenshot at viewport) -> Done.

## Subtasks

None (atomic task).
