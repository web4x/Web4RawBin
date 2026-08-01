<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.8: Remove-from-diagram action: selected class-on-diagram -> action-bar removes its VIEW (inverse of add-view), model element untouched, edges reroute + refresh

[task:uuid:b628153b-736b-4d3d-8f4b-ff1c83d72b44]

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

DONE: chain-complete-to-Test (both chains 8c19ca178+a3eb41137, remove-from-diagram inverse-of-add-view v0.8.33) + REAL-WEBKIT @390 self-gated GREEN (r338, engine-swap sweep 90673e928, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.8 `[requirement:uuid:86219c51-48f6-426f-bfec-8a01f5c298d8]`
  - down
    - None (atomic task)

## Task Description

Tron IMG_4794 device ask ('i am lacking a remove from diagram button' + 'action'). A 'Remove from diagram' action in the R33.6.5 selection-driven action bar: when a class/element ON a diagram is selected, the action removes it FROM the diagram - drops its VIEW/view-link (the INVERSE of R33.5 add-view) WITHOUT deleting the underlying model ELEMENT/unit (it stays in MODEL_STORE, re-addable); then the diagram REFRESHES and connectors re-route/drop (R33.6.3 rerouteEdges). Reuse the R33.6.5 action-bar (ACTIONS_BY_TYPE, add a 'remove-from-diagram' verb for class-on-diagram) + a view-removal endpoint mirroring add-view (store-only, prod-safe). NO fork. ★ Connects to an R33.6.5 GAP: R33.6.5's spec (Tron round-2 item 5) was 'class -> rename/remove-from-diagram/delete/new-class' but ONLY 'Add to diagram' shipped for class selection (the R33.6.5 gate green-passed a PARTIAL action set). This req mints ONLY remove-from-diagram (Tron's explicit ask); the rename/delete/new-class remainder is FLAGGED to PO/Tron as a separate follow-up (NOT silently expanded here).

## Acceptance Criteria

- [x] When a class/element ON a diagram is selected, the R33.6.5 selection-driven action bar shows a 'Remove from diagram' action (added to the class-on-diagram action set alongside the shipped 'Add to diagram').
- [x] Clicking 'Remove from diagram' removes that element's VIEW/view-link from the diagram - the INVERSE of R33.5 add-view (store-only view-removal endpoint mirroring add-view). The underlying model ELEMENT/unit is UNTOUCHED (stays in MODEL_STORE, re-addable via Add-to-diagram); prod scenario/index never touched. NOT a delete of the model element.
- [x] After removal the diagram REFRESHES and the removed element's connectors re-route/drop (R33.6.3 rerouteEdges) - no stale edge left anchored to the removed box; other boxes + their edges untouched.
- [x] GATE @390 (screenshot/pixel + planted bite + Tron device): select a class on the diagram -> 'Remove from diagram' -> the box AND its edges are GONE from the diagram, the model element STILL EXISTS (re-addable), other boxes untouched. planted-defect: the action DELETES the model element (wrong - must only drop the view) OR leaves a stale edge = RED.

## Subtasks

None (atomic task).
