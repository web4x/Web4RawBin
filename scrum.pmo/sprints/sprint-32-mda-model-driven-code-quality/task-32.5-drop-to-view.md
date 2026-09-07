<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.5: Drag itemView -> diagram VIEW (composed compartments, N-views=N-links, x/y, select/move)

[task:uuid:abaf9f83-978f-4722-af21-c2b0ee76b8a2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

Structural/live go-live gate GREEN DET-3x (5801ff08e). AWAITING TRON VISUAL go-live demo: the populated model tree + diagram render @390 + his sign-off (visual-feature discipline — NOT Done on structural GREEN alone). req crediting Test (chain-complete-to-Test).

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.5 `[requirement:uuid:ec0e1754-a1f0-4959-b1d1-0e9bfeb6408d]`
  - down
    - None (atomic task)

## Task Description

Dropping an MDA-unit itemView onto a diagram creates a VIEW (e.g. a class view). Views contain COMPOSED views: a class UML SVG has an attribute compartment (attribute views), a methods compartment (method views), a properties compartment (getter/setter views). N diagrams can hold N views of the SAME unit -> each view = a LINK from the diagram to the unit (views are references, NOT copies - identity-by-reference, R25.7 kinship); the unit records its N diagram-links. Drop x,y = position; the view is then selectable + movable. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** Dropping a TS file on a model drop-zone (REUSE the existing drop-dispatcher) POSTs its path/content to a NEW `POST /api/model/generate` endpoint, which runs TsToModel.generate (R32.2 REUSE) - no drop or generate fork.
- [ ] **(functional)** Generation writes to an ISOLATED ScenarioIndex dir `data/model-store/index/` via TsToModel.generate({ indexDir: MODEL_STORE, write: true }) (TsToModel.ts:96 hook) - prod `scenario/index` is NEVER mutated (the PO don't-force-prod-mutation safe-mechanism law). The store is demo-scoped + resettable; its M2 metaclasses are seeded once so instanceOf/modelFacetType resolve self-contained.
- [ ] **(functional)** The ONE server read-change: `/api/model/tree` reads MODEL_STORE (not prod scenario/index); `/api/trace/children`, when the uuid is a ModelElement, resolves from MODEL_STORE (UNION - trace units stay in prod scenario/index, model units come from the store). rb-trace-tree + the R32.3 forward-key walk are UNCHANGED - they just read a store that now has data (this is why R32.3 correctly returned roots=0 on empty prod).
- [ ] **(functional)** Generation produces the M1/M2 ModelElement units PLUS a demo Diagram unit with Layer-2 view-links (one per generated class/interface, viewKind 'class', DETERMINISTIC auto-layout x,y grid/row) so the R32.4 surface has nodes. View-links are REFERENCES (R25.7 identity-by-ref): the unit lives in the store, position lives on the link - N views across N diagrams = N links, editing the unit reflects in all its views.
- [ ] **(functional)** The R32.3 tree (/api/model/tree -> store) AND the R32.4 diagram surface (rb-diagram-detail over the demo Diagram's view-links) render the generated model LIVE - a DEMONSTRABLE drop->populated tree + diagram that Tron can SEE (the go-live milestone): classes -> members with correct M2 icons/badges (R32.3) + UML class boxes on the surface (R32.4).
- [ ] **(functional)** Re-dropping the same TS file yields the SAME UUIDs (R32.2 deterministic sourceFile::qualifiedName) -> idempotent: 0 duplicate units, 0 duplicate diagram nodes; the store re-binds rather than re-mints.
- [ ] **(functional)** The whole pipeline is REUSE-ONLY: drop-dispatcher + TsToModel.generate + rb-trace-tree (R32.3) + rb-diagram-detail (R32.4) + Layer-2 view-links - NO forks of any of them. The only new code is the MODEL_STORE const + read-reroute + the /api/model/generate endpoint + drop-zone wiring.
- [ ] **(functional)** ISOLATION PROVEN (gate-able): the count of ior:class:ModelElement units in prod `scenario/index` is UNCHANGED after generation (all model writes hit the store). And /trace + Server Manager + room detail-views + prod traceability stay UNREGRESSED (model reads hit the store, trace reads hit prod). Server change -> real restart + R31.7 served==committed invariant re-stamped.

## Subtasks

None (atomic task).
