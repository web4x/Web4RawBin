<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.3: Model tree = traceability-tree UX reused over the MDA units (drag source)

[task:uuid:6b479dec-4c0d-4322-a7ed-b1eeab10c0af]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.3 `[requirement:uuid:d07b2dc0-7499-4877-952c-655170a7a99a]`
  - down
    - None (atomic task)

## Task Description

The Model tree is conceptually the SAME as the traceability tree - REUSE the rb-trace-tree components + functionality (skill-expert lane, NO re-fork) to render the MDA scenario units; it is the drag SOURCE for diagram views. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** The model tree renders the MDA ModelElement units via the SHARED rb-trace-tree component (same expand/collapse/lazy/icons/badges) - NO tree-mechanics fork (same law as the Server Manager tree, R31.3/R31.11): a feature supplies only DATA + forward-key config, never new tree logic. Built on the R32.1/R32.2 foundation (ModelElement multi-facet units already generated + gated GREEN).
- [ ] **(functional)** chain-model CHAIN_TYPE_CONFIG gains ONE ADDITIVE entry `ModelElement: { scenarioFwd:['members'], traceFwd:['members'], clientFwd:['members'], expectedChildren:[] }` - the composition forward-key so a class/interface's `members` (attributes/methods/properties, reverse `memberOf`) render as tree children via the R31.11 forwardKeysForMode single-source mechanism (all model units carry ior:class:ModelElement -> the server type = 'ModelElement' -> ONE entry drives the whole model tree). Nothing else in the tree changes.
- [ ] **(functional)** Each model node's type/icon derives from its M2 MODEL-facet instanceOf metaclass (UmlClass/UmlInterface/UmlAttribute/UmlMethod/UmlProperty/UmlFunction): the server children entry sets the node `type` = the M2 metaclass so rb-object-item renders TRACE_ICONS[type] for the model kind. Small DATA add: TRACE_ICONS Uml* entries (icons.ts) - data, not tree logic. `hasChildren` = members.length>0.
- [ ] **(functional)** The member-count badge = `members.length` via the REUSED R31.11 `node.dataset.childRefCount` stamp - no new badge code.
- [ ] **(functional)** `relatesTo` (a typed attribute/getter/setter pointing at another element) is NOT a tree child forward-key - nesting cross-type edges as tree children would create cycles / wrong structure. relatesTo edges surface in the node DETAIL-view (the shared drawer) and are the input to R32.6 relationship/diagram views, NOT the R32.3 composition tree.
- [ ] **(functional)** Re-parse / re-render yields the SAME UUIDs (R32.2 deterministic sourceFile::qualifiedName uuid) so the model tree is STABLE across re-runs - no churn, no duplicate nodes, expansion state coherent.
- [ ] **(functional)** The shared rb-trace-tree stays UNREGRESSED: /trace, Server Manager, and room trees still render + expand + badge exactly as before, because the ModelElement forward-key entry is ADDITIVE (other node types untouched). Regression-green is part of acceptance (shared-component law).
- [ ] **(functional)** Each MDA unit itemView in the model tree is a drag SOURCE (draggable). The drag TARGET / diagram-drop is R32.5 (drag itemView -> diagram view); R32.3 asserts only that the model-tree node is draggable.
- [ ] **(stub-must-fail/by-construction)** GREP-LINT INVARIANT (enforces this req NO-re-fork claim by construction, not by reminder): /trace AND /model BOTH mount rb-trace-tree, and NO second tree renderer is defined ANYWHERE - so a future dev cannot fork a /model-specific tree and re-create the divergence family (same shape as the sprint-sort two-implementation bug). Architect MEASURED the current state CLEARED: model.ts imports + mounts the shared ../trace/rb-trace-tree.js, grep finds NO second renderer, every node is the same rb-object-item with the same .oi-expand (ONE renderer, ONE node element, two entry-ROOT sets). But legitimate-today != legitimate-by-construction (the sort was legitimate once too). stub-must-fail: define a SECOND tree renderer (a forked /model tree) => lint RED.

## Subtasks

None (atomic task).
