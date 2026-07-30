<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.11: In-diagram drag-a-class-to-add-view works on /model (DnD is the vision, was not wired)

[task:uuid:42555b04-f47e-4d56-9fab-987fafc1df2b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

RESOLVED — R32.11-MOBILE tap-to-add @390 TOUCH RED→GREEN DET-3x (v0.8.15, Test 6cb4c205 wired Impl 20f8a19e); chain-complete-to-Test; PO-confirmed Done (MOBILE).

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.11 `[requirement:uuid:d981876f-4816-4cd0-b3e3-e28ed02c787d]` (Tron device-QA; placeholder — req canonicalizes)
  - down
    - None (atomic task)

## Task Description

Tron device-QA (2026-07-30): dragging a class card into the /model diagram does NOTHING - the drag-to-add-view is the ORIGINAL VISION, it is a BUG (never wired), NOT a drift. ROOT (architect-measured, 3 missing pieces): (1) rb-diagram-detail has ZERO dragover/drop/dataTransfer handlers (the 'drop a class to add a view' string :104 is a LABEL with no handler); (2) NO add-view endpoint (only POST /api/model/generate = drop a .ts FILE); (3) drop-dispatcher routes FILES, not a class-ref. So R32.5 gated drop-a-FILE->generate; the in-diagram drag-a-CLASS->add-view was never wired = the 3rd 'gated-path != interaction' miss. FIX (no fork): rb-diagram-detail .dm-surface dragover(preventDefault)+drop -> read the dragged ref (application/rb-object-ref, set by rb-object-item.onDragStart) + map drop point to x,y -> POST /api/model/diagram/add-view {diagramUuid, elementUuid, x, y} which appends {unit:'modelelement:X', x, y, viewKind:'class'} to the Diagram unit in MODEL_STORE (isolated, dedup) -> re-render (box+edges). DnD is PRIMARY; select-class -> auto-show its view via the SAME add-view path is an ADDITIVE complement (PO). Canonicalized in place from the planner placeholder (#43) per architect design 6a076e4f2.

## Context

Scenario-first (Tron device-QA reopen-family, S32): architect DIAGNOSING; req to formalize R32.11 (placeholder d981876f, canonicalize in place). Sibling of the T32.9/T32.10 device-QA findings (all 'gated-loads-not-works' — gate at the real interaction @390, not page-load).

## Intention

Make the /model diagram DROP interaction actually work on Tron's device — drop an itemView → generate/re-sync → the model view (tree/diagram/edges) renders. Gate the DROP @390.

## Acceptance Criteria

- [x] INV-R1 - dragging a class / model-instance card from the model tree onto the diagram's .dm-surface: rb-diagram-detail's NEW dragover(preventDefault) + drop handlers read the dragged ref (application/rb-object-ref, set by rb-object-item.onDragStart) and map the drop point to x,y (accounting for RbPanZoom) -> POST /api/model/diagram/add-view {diagramUuid, elementUuid, x, y} appends the view-link {unit:'modelelement:X', x, y, viewKind:'class'} to the Diagram unit -> the surface re-renders and the class box appears (with R32.6 edges to other on-diagram boxes).
- [x] INV-R2 - dropping the SAME class twice yields ONE view (the add-view endpoint dedups by element uuid); no duplicate box.
- [x] INV-R3 - add-view writes ONLY the isolated MODEL_STORE (data/model-store); prod scenario/index is NEVER touched (gate-able: prod git-clean across the drop).
- [x] INV-R4 - re-opening the diagram shows the added view (the view-link is PERSISTED to the Diagram unit, not just added in-DOM).
- [x] DnD is PRIMARY (the drag-to-add-view above). ADDITIVE complement (PO): selecting a class node (selection-changed) with the /model diagram open AUTO-appends that class's view via the SAME add-view path (idempotent, no 2nd mechanism) - the drag stays for deliberate curation, the select gives instant feedback.
- [x] GATE the DROP INTERACTION @390 (Tron viewport): empty diagram -> drag 'Circle' from the model tree -> drop -> Circle box appears; drag 'Point' -> 2nd box + R32.6 edges; drag Circle again -> NO dup (INV-R2); prod scenario/index git-clean (INV-R3); re-open the /model diagram -> views persist (INV-R4). Gate the DROP, NOT the label/generate-path [[gate-the-ac-surface]] - the 3rd 'gated-path != interaction' miss.

## Subtasks

None (atomic task).
