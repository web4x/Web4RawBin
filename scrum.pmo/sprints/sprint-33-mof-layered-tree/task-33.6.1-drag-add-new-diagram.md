<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.6.1: BUG: drag-to-add is broken for NEW/empty diagrams - dropping an element into a new diagram adds nothing

[task:uuid:eec77e5b-ffb9-4c97-ad20-f77a8fa4e08d]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Machine-gated GREEN (drag-add-new-diagram CLOSED, dual-impl Test 0aaae49a, chain-complete-to-Test). QA-Review awaiting Tron @390 device confirm.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.6.1 `[requirement:uuid:a5205512-ec17-4a23-b4d1-7f5c58223d10]`
  - down
    - None (atomic task)

## Task Description

Tron item-1 (HIGHEST PRIORITY, bug). Dragging a tree element INTO a NEW or EMPTY diagram STILL adds nothing - the drop-to-add diagram-model write is broken specifically for new/empty diagrams (works once a diagram already has boxes). Likely related to R33.5 item-1 addDiagram / the diagram model-write path (empty-diagram init or the drop handler keying off existing elements). Route architect(diagnose measure-first)->expert(fix)->tester(catch @390). Reuse the existing drop/diagram-write path, NO fork.

## Acceptance Criteria

- [x] Dragging a tree element (class) and dropping it INTO a freshly-created NEW or EMPTY diagram adds a box to the diagram model AND renders it immediately - the drop-to-add path fires for a zero-element diagram, not only for diagrams that already contain boxes.
- [x] The dropped element PERSISTS to the diagram model (the create/add-view write returns ok) and SURVIVES a fresh re-mount of the diagram (round-trip), identical to dropping into an already-populated diagram.
- [x] GATE @390 on REAL drag-drop (screenshot/pixel + planted-defect bite, NOT 'loads'): create a new empty diagram -> drag a class in -> a box APPEARS and persists across re-mount; planted-defect (write rejected) -> NO box (bite). Real server restart + boot-verify if the write path is server-side.

## Subtasks

None (atomic task).
