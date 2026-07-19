<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.52: 3-way merge toolbar re-layout — mis-click prevention ('N selected' own line, 'X/Y open' buffer)

[task:uuid:a0b24e6b-aa8b-4341-9f9d-ad158c5cb12e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing (expert building — impl-edit renderMergeGutter e24dc98a)
  - [ ] testing
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

- [ ] 'N selected' stays on its OWN line directly under the 'Apply All' button (split from the compose).
- [ ] The 'X/Y open conflicts' text is MOVED DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls, as a NON-CLICKABLE buffer above ✓ (so a ▼ mis-click does not hit ✓).
- [ ] Both counts (N selected + X/Y open conflicts) are still shown - repositioned, not removed.
- [ ] GATE (screenshot+behavior): 'N selected' on its own line under Apply All; 'X/Y open conflicts' between ▼ and ✓ as a non-clickable buffer; both counts visible; ▼ and ✓ no longer adjacent.

## Implementation

IN PROGRESS @ IMPLEMENTING (expert building now, PO green-lit). IMPL-EDIT on renderMergeGutter e24dc98a (no new Method/Impl — repositions 'N selected' + 'X/Y open' in the toolbar). refines R30.50-A (closure-freeze → new req R30.52). On tester gate → QA-Review. Gate = screenshot+behavior at Tron viewport.

## Subtasks

None (atomic task).
