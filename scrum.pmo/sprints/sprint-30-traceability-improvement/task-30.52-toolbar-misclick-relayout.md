<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.52: 3-way merge toolbar re-layout — mis-click prevention ('N selected' own line, 'X/Y open' buffer)

[task:uuid:a0b24e6b-aa8b-4341-9f9d-ad158c5cb12e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing (expert RE-FIXING the N=14 regression)
  - [ ] testing (re-baselining at Tron's N=14 state, expect RED)
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:989471e8-c5f0-44fc-831f-4b1d1ad55d0c]`
  - refines
    - R30.50 (32abea56) toolbar-A — mis-click re-layout, new req per closure-freeze
  - impl-edit
    - renderMergeGutter e24dc98a (existing impl, no new Method/Impl)
  - down
    - [UC](./planning.md) `[uc:uuid:dce46e2a-c341-4251-be26-40497877e407]`

## Task Description

Re-layout the 3-way merge toolbar to prevent mis-clicks: 'N selected' moves to its OWN line directly under the '✨ Apply All' button (split from the compose), and the 'X/Y open conflicts' text moves DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls as a buffer. Both counts stay shown — repositioned, not removed.

## Context

Covers R30.52 (989471e8, refinementOf R30.50 32abea56 — NEW req per closure-freeze, R30.50 closed) → UC merge.toolbarMisclickLayout dce46e2a → RbDiffEditor. IMPL-EDIT on renderMergeGutter e24dc98a (NO new Method/Impl — a layout edit on the existing gutter impl). Gate = screenshot+behavior (Tron-visual).

## Intention

S30 diff/merge editor — R30.52 toolbar mis-click re-layout (refines R30.50-A after closure-freeze).

## Acceptance Criteria

- [ ] 'N selected' renders INLINE on the SAME horizontal row as 'Apply All' + the nav controls (not wrapped onto its own line). [CORRECTED 2026-07-19: 'own line' was a mis-read of Tron's horizontal-toolbar ASCII stack.]
- [ ] The 'X/Y open conflicts' text is MOVED DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls, as a NON-CLICKABLE buffer above ✓ (so a ▼ mis-click does not hit ✓).
- [ ] Both counts (N selected + X/Y open conflicts) are still shown - repositioned, not removed.
- [ ] GATE (screenshot+behavior): 'N selected' INLINE on the same row as Apply All + nav (not wrapped); 'X/Y open conflicts' between ▼ and ✓ as a non-clickable buffer; both counts visible; ▼ and ✓ no longer adjacent.

## Implementation

IN PROGRESS @ RE-FIXING — ⛔ HOLD flip (PO+SM). v0.7.75 gate r3052 was a WRONG-STATE FALSE-GREEN: tester gated at N=1 ('1 selected' shown), but Tron reports '14 selected' MISSING at N=14 AFTER 'Apply All -> Repository wins' — the inline fix introduced a NEW regression (missing '.de-selected'; AC3 counts-still-shown FAILS at Tron's N=14 state). Expert re-fixing + tester re-baselining at Tron's EXACT N=14 post-Apply-All state (expect RED). AC1 amended own-line->INLINE (Tron correction b1c489d8c). Flip only when the CORRECTED fix gates GREEN at the RIGHT state. Chain wired (Test 919d290d<->Impl renderMergeGutter e24dc98a) but the current gate tests the wrong state.

## Subtasks

None (atomic task).
