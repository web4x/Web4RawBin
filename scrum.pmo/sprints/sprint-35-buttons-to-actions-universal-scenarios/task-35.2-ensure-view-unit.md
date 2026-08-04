<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.2: Every item type resolves to a REAL on-disk ior:class:X unit (generalize A2 resolver -> ensureViewUnit) [R35.2, build FIRST]

[task:uuid:7b3c6a57-e50c-416e-81d2-3c54ab36866d]

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

DONE: R35.2 ensureViewUnit resolver built (EVERY item type -> real on-disk unit, generalized S34 A2 ensureFolderFileUnit, keyToUuid idempotent, MODEL_STORE-only prod-untouched, tree byte-unchanged fork-A) + chain-complete-to-Test (Impl a09b474d tests[]=[23a9f9fd,9bc0a109], markerPending=false; Test 9bc0a109 = 'R35.2 all-types-resolve + R35.3 fields-populated' shared gate) + REAL-WEBKIT @390 GREEN DET-3x (v0.8.48, served==HEAD 0.8.50, DATA-HAVING sample per type Folder=rawbin:ts/File=server.ts/PumlArtifact). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.2 `[requirement:uuid:030a1801-4ce0-4e08-85c0-80bf774b0794]`
  - down
    - None (atomic task)

## Task Description

GENERALIZE the S34 A2 resolver ensureFolderFileUnit -> ensureViewUnit(ior) so EVERY item type resolves to a REAL on-disk ior:class:X unit (MODEL_STORE) and both Scenario/Edit always work. Mint the currently-null cases: synthetic MOF folder refs (project:RawBin, rawbin:ts/puml/diagram/traceability, mof-m1, mof-m2) -> ior:class:Folder (keyToUuid('folder::'+ref)); puml-src leaves -> ior:class:File/PumlArtifact (keyToUuid('puml::'+path)). Deterministic idempotent lazy mint, prod scenario/index NEVER touched, tree/mofChildren byte-unchanged (fork-A, only /api/ior + /scenario resolve). Foundation cluster.

## Acceptance Criteria

- [x] (functional) EVERY item type rendered in a view resolves to a REAL ior:class:X unit on disk (MODEL_STORE) so Scenario (/scenario?ior) + Edit (scenarioEditorHref) both ALWAYS work, never dead/no-op. Generalizes ensureFolderFileUnit -> ensureViewUnit covering synthetic MOF folders (->Folder) + puml-src (->File/PumlArtifact).
- [x] (functional) INV-A2-2: deterministic keyToUuid ('folder::'+ref / 'puml::'+path) = idempotent LAZY mint - fetch twice yields the SAME uuid, no dup on re-open.
- [x] (security) INV-A2-3: units minted in MODEL_STORE ONLY; prod scenario/index NEVER touched.
- [x] (functional) INV-A2-1: tree/mofChildren output BYTE-unchanged (only /api/ior + /scenario resolve to the new unit) - fork-A.
- [x] (gate) GATE @390 real-WebKit: for EVERY item type, Scenario + Edit both resolve to a real unit (not dead) - DATA-HAVING sample per type: Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=a real puml/ leaf (NOT a degenerate entity).

## Subtasks

None (atomic task).
