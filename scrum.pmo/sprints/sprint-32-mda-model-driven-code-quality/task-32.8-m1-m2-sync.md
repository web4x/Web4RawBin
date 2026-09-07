<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.8: Action-driven M1/M2 sync (TS <-> model <-> PUML, same-UUID, no drift)

[task:uuid:73f6f3b4-669c-4f22-a875-4378b332f135]

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
    - Requirement R32.8 `[requirement:uuid:782d4b8e-576e-4090-9de6-4c0cda5700fb]`
  - down
    - None (atomic task)

## Task Description

Keep M1 + M2 ALWAYS IN SYNC between the TS and PUML representations on EVERY action (class.add / class.remove / attribute.add / attribute.edit / ...). Bidirectional, action-driven model sync (TS <-> model <-> PUML), same UUID throughout - the single-source/generated law (R31.7/R31.13) applied to the model. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** AC1 (PO-refined 2026-07-30) - a 'Re-Sync from source' action button is available on the DIAGRAM TOOLBAR (rb-diagram-detail) of the model view (MODEL units only - Diagram/ModelElement - NOT trace units); on Re-Sync, ALL views (tree R32.3 + diagram/edges R32.4/R32.6 + PUML R32.7) AUTO-re-render via the 'rb-model-resynced' event. NO button on the shared rb-trace-tree header (that would leak a feature-button onto /trace, violating the generic-shared-component law - features supply DATA not buttons to the shared tree). A tree-side trigger on a dedicated model host is DEFERRED (R33 backlog).
- [ ] **(functional)** AC2 - Re-Sync re-runs generation on the model's OWN sourceFile via the EXISTING POST /api/model/generate (TsToModel.generate) - NO new server endpoint, NO fork (client-only action).
- [ ] **(functional)** AC3 - after Re-Sync, the R32.3 tree re-renders and shows the CURRENT model: added elements appear, removed elements disappear (INV-S2 reconcile: stale-drop + new-add + unchanged rebind).
- [ ] **(functional)** AC4 - after Re-Sync, the R32.4 diagram surface + the R32.6 relationship edges re-render to the current model.
- [ ] **(functional)** AC5 - after Re-Sync, the R32.7 exported PUML reflects the current model - TS <-> model <-> PUML consistent (INV-S4 all-views-consistent: tree + diagram + edges + PUML all re-read the one MODEL_STORE).
- [ ] **(functional)** AC6 / INV-S1 - unchanged elements keep the SAME uuid across re-sync: no duplicate, no re-mint (the R32.2 deterministic keyToUuid rebind + content-compared write; INV-P1/P2 lineage).
- [ ] **(functional)** AC7 / INV-S3 - Re-Sync mutates ONLY the isolated model-store (data/model-store); prod scenario/index is NEVER touched (the R32.5 safe-mechanism law) - gate-able: prod ModelElement count / git-clean unchanged across sync.
- [ ] **(functional)** AC8 - Re-Sync with NO source change is idempotent: 0-churn (wrote=0, store byte-identical, all views stable) - by construction from generate()'s content-compared write.

## Subtasks

None (atomic task).
