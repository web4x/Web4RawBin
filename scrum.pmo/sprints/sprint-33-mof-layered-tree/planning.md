<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 33 Planning — Sprint 33 — MDA v4 MOF-layered tree

## Sprint Goal

Present the MDA model as a proper MOF 4-layer TREE (M3/M2/M1/M0 folders) instead of the current FLAT r32.2-demo list (Tron IMG_4716). M3 = MOF meta-meta model; M2 = UML profile classes (UmlClass/UmlInterface/UmlAttribute/... — instances of M3); M1 = PROJECTS (RawBin as a REAL M1 project — its TS classes + PUML as code AND as SVG); M0 = dist folder (runtime instances). Builds on R32.1 ModelElement multi-facet instanceOf (same-UUID across M-levels ALREADY exist — present them as folders, not a flat list). Subsumes + expands R33 (RawBin real multi-file model = M1's RawBin project). PHASED (architect-assessed, Tron go): P1 present M2+M1 MOF folders (low-risk reuse of rb-trace-tree folders + multi-facet M-levels); P2 RawBin real M1 multi-file (subsumes R33 backlog); P3 M3 + M0/dist. Scenario-first: architect designs the MOF-layer tree model + presentation → req formalizes → build.

**Status:** Planned

## Tasks

- [x] [Task 33.1: MOF-layered model tree: /model presents M2·UML Profile + M1·Projects folders (P1)](./task-33.1-mof-layered-tree.md)
- [x] [Task 33.2: MOF tree bounded/lazy render + file-dir sub-grouping (@390 perf)](./task-33.2-bounded-lazy-render.md)
- [x] [Task 33.3: Working interactive diagram: DnD -> selectable MOVABLE SVG class boxes (S33 RE-SCOPE)](./task-33.3-interactive-diagram.md)
- [ ] [Task 33.5: Diagram UX polish on the working R33.3 editor (add-shows / select-keeps-diagram / drag-no-pan / puml-populated)](./task-33.5-diagram-ux-polish.md)
- [ ] [Task 33.6.1: BUG: drag-to-add is broken for NEW/empty diagrams - dropping an element into a new diagram adds nothing](./task-33.6.1-drag-add-new-diagram.md)
- [ ] [Task 33.6.2: Suppress browser page-scroll during element drag; diagram edge-autoscroll ONLY when the element is dragged slightly outside the diagram boundary](./task-33.6.2-suppress-scroll.md)
- [ ] [Task 33.6.3: After moving a diagram element, recalculate relationships and re-route the connector lines to the element's new position](./task-33.6.3-reroute-connectors.md)
- [ ] [Task 33.6.5: Action bar lives inside the drawer (below the handle-bar, above the content), always present, with contents dynamically driven by the current selection](./task-33.6.5-action-bar-drawer.md)
- [ ] [Task 33.7.1: Zoom-out always grows the SVG diagram canvas (fixes the space problem) with per-diagram persisted zoom where 1 = 100% = whole diagram](./task-33.7.1-canvas-grow-zoom.md)
- [ ] [Task 33.7.2: Adding or discovering an element wires its model-graph relationships onto the diagram (auto-on-add + 'Discover relationships' 1-level action)](./task-33.7.2-discover-relationships.md)
- [x] [Task 33.7.4: Selecting a diagram element scrolls and expands the model tree to reveal that element (reuse R33.5 expandPath, selection-triggered)](./task-33.7.4-tree-reveal-select.md)
- [ ] [Task 33.8: Remove-from-diagram action: selected class-on-diagram -> action-bar removes its VIEW (inverse of add-view), model element untouched, edges reroute + refresh](./task-33.8-remove-from-diagram.md)
