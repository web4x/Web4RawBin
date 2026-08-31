<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.62: Render the CR diagram file-artefact — a CR dropped on a diagram renders as a FILE-shaped artefact reusing the existing file/pumlartifact path (no forked CR-diagram kind)

[task:uuid:bb9dec65-0ff0-4e90-b55b-09a48e5bc40c]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.62 `[requirement:uuid:a4c9340d-7cc6-4155-ab12-06a6ff4e5fa5]`
  - down
    - None (atomic task, plan-not-build; architect designs useCases at activation)

## Task Description

R40.62 diagram half (AC-render-diagram-file-artefact). Tron IMG_5175/5176: dragging a ChangeRequest onto a DIAGRAM accepts the drop (green + badge) but renders NOTHING. The AC was minted (1cbe69cd2, tree+diagram halves) but only the TREE half was built — the diagram half has no implementing task (the invisible untasked-AC the ac-untasked-audit now flags). This task implements the diagram render: a CR on a diagram renders as a FILE-shaped ARTEFACT reusing the EXISTING file/pumlartifact artefact path (Tron verbatim 'on diagrams an artefact like a file'), NOT a new CR-specific diagram kind. DRY gate: a forked CR-specific diagram renderer => RED (reuse the rb-modelelement-detail puml/artefact render, don't fork — DRY-by-copy is how the page-bootstrap bug got in). PLAN-NOT-BUILD (Tron: plan-a-task-to-fix-later): QUEUED AFTER the T40.1 checklist deploy + R37.24; architect supplies useCases + design at activation.

## Context

Covers R40.62 (a4c9340d) AC-render-diagram-file-artefact via the existing file/pumlartifact artefact render (rb-modelelement-detail). useCases pending architect design at activation (plan-not-build). The tree half (AC-render-tree-shared-itemview) shipped without a task = the meta-finding this task + the ac-untasked-audit detector close.

## Intention

Tron IMG_5175/6 device-QA (drag-CR-onto-diagram renders nothing) — plan the implementing task for R40.62's unbuilt diagram-render half. Covering task (#126) for req R40.62 AC-render-diagram-file-artefact; queued after the critical path per Tron 'plan-not-build-now'.

## Acceptance Criteria

- [ ] Dragging a ChangeRequest onto a DIAGRAM renders it as a FILE-shaped ARTEFACT (not just an accepted drop with a badge and nothing shown) — the artefact appears on the diagram. Closes Tron IMG_5175/5176 (drop accepted but renders nothing).
- [ ] The render REUSES the EXISTING file/pumlartifact artefact path (rb-modelelement-detail puml/artefact treatment), NOT a new CR-specific diagram kind. DRY.
- [ ] GATE (DRY, @390 + Tron device): a CR on a diagram routes through the existing file/pumlartifact artefact render and the artefact is VISIBLE; a forked CR-specific diagram renderer => RED (reuse, don't fork).

## Subtasks

None (atomic task, plan-not-build).
