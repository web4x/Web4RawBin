<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.2: Every item type resolves to a REAL on-disk ior:class:X unit (generalize A2 resolver -> ensureViewUnit) [R35.2, build FIRST]

[task:uuid:7b3c6a57-e50c-416e-81d2-3c54ab36866d]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster R35.2 (build FIRST, resolver foundation with R35.3; order R35.2/3->R35.4->R35.1). Generalizes S34 A2 ensureFolderFileUnit->ensureViewUnit (keyToUuid idempotent, MODEL_STORE-only, prod untouched, tree byte-unchanged fork-A). @390 real-WebKit gate (data-having sample per type) + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.2 `[requirement:uuid:030a1801-4ce0-4e08-85c0-80bf774b0794]`
  - down
    - None (atomic task)

## Task Description

GENERALIZE the S34 A2 resolver ensureFolderFileUnit -> ensureViewUnit(ior) so EVERY item type resolves to a REAL on-disk ior:class:X unit (MODEL_STORE) and both Scenario/Edit always work. Mint the currently-null cases: synthetic MOF folder refs (project:RawBin, rawbin:ts/puml/diagram/traceability, mof-m1, mof-m2) -> ior:class:Folder (keyToUuid('folder::'+ref)); puml-src leaves -> ior:class:File/PumlArtifact (keyToUuid('puml::'+path)). Deterministic idempotent lazy mint, prod scenario/index NEVER touched, tree/mofChildren byte-unchanged (fork-A, only /api/ior + /scenario resolve). Foundation cluster.

## Acceptance Criteria

- [ ] (functional) EVERY item type rendered in a view resolves to a REAL ior:class:X unit on disk (MODEL_STORE) so Scenario (/scenario?ior) + Edit (scenarioEditorHref) both ALWAYS work, never dead/no-op. Generalizes ensureFolderFileUnit -> ensureViewUnit covering synthetic MOF folders (->Folder) + puml-src (->File/PumlArtifact).
- [ ] (functional) INV-A2-2: deterministic keyToUuid ('folder::'+ref / 'puml::'+path) = idempotent LAZY mint - fetch twice yields the SAME uuid, no dup on re-open.
- [ ] (security) INV-A2-3: units minted in MODEL_STORE ONLY; prod scenario/index NEVER touched.
- [ ] (functional) INV-A2-1: tree/mofChildren output BYTE-unchanged (only /api/ior + /scenario resolve to the new unit) - fork-A.
- [ ] (gate) GATE @390 real-WebKit: for EVERY item type, Scenario + Edit both resolve to a real unit (not dead) - DATA-HAVING sample per type: Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=a real puml/ leaf (NOT a degenerate entity).

## Subtasks

None (atomic task).
