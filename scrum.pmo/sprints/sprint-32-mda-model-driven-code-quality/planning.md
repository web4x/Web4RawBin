<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 32 Planning — Sprint 32 — MDA Model-Driven Code Quality

## Sprint Goal

v0.8.0. Model-driven code quality: generate scenario-based MDA/MOF 3-level model elements (M3 Class+Relationship / M2 UML-profile / M1 TS-structures) with SAME-UUID-across-M-levels identity, from the TS compiler AST; a model tree (rb-trace-tree reuse) + interactive SVG diagrams in the details drawer (RbPanZoom) with drag itemView->composed views + relationship views; a PUML serializer/parser (no-dup, same-UUID round-trip); and action-driven M1/M2 sync (TS<->PUML). Delivered as a FeatureManager feature (R31.8). Reuse over re-fork; single-source/generated law (R31.7/R31.13) for the model.

**Status:** In Progress

## Tasks

- [x] [Task 32.0: v0.8.0 bump + MDA modeling registered as a FeatureManager feature](./task-32.0-v0.8.0-bump-mda-feature.md)
- [x] [Task 32.1: MDA MoF 3-level scenario model (M3/M2/M1, same-UUID across levels)](./task-32.1-mda-mof-model.md)
- [x] [Task 32.2: TS -> M1 generation from the TypeScript compiler base structures](./task-32.2-ts-to-m1.md)
- [x] [Task 32.3: Model tree = traceability-tree UX reused over the MDA units (drag source)](./task-32.3-model-tree.md)
- [x] [Task 32.4: Interactive SVG diagram surface in the details drawer (responsive, pan/zoom)](./task-32.4-diagram-surface.md)
- [ ] [Task 32.5: Drag itemView -> diagram VIEW (composed compartments, N-views=N-links, x/y, select/move)](./task-32.5-drop-to-view.md)
- [ ] [Task 32.6: Relationship views (attribute/getter/setter whose type is another unit)](./task-32.6-relationship-views.md)
- [ ] [Task 32.7: PUML serializer/parser (diagram <-> .puml, no-dup, same-UUID round-trip)](./task-32.7-puml-serializer.md)
- [ ] [Task 32.8: Action-driven M1/M2 sync (TS <-> model <-> PUML, same-UUID, no drift)](./task-32.8-m1-m2-sync.md)
- [ ] [T-R31.14: Deploy-hardening — scripted deploy + served!=committed monitor + pinned prod topology (S32 backlog, scheduled AFTER R32.5)](./task-r31.14-deploy-hardening.md)
