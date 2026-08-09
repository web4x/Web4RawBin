<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.2: File & Folder are real ior:class:Folder/File units in MODEL_STORE, showing exact location (server) [R-A]

[task:uuid:7cb3d9dd-ea9e-45d8-b643-fe14414478c6]

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

DONE: R-A A2 built (File/Folder real MODEL_STORE units, deterministic keyToUuid R32.2, R32.5-isolated prod untouched) + chain-complete-to-Test (Impl a09b474d tests[]=[23a9f9fd], markerPending=false) + REAL-WEBKIT @390 GREEN DET-3x (S34 gate b87c8504d, served 0.8.44; HEAD 0.8.45 = A1 marker-only bump, behavior unchanged; Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.2 `[requirement:uuid:fe463924-154e-4f99-bf3d-2fabc388042c]`
  - down
    - None (atomic task)

## Task Description

R-A (server half). mofChildren MUST mint/use real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs) so each folder/file node resolves to a REAL unit with a detail view + the R34.1 default actions + its exact LOCATION. Deterministic uuid = keyToUuid(rel-path) (R32.2), MODEL_STORE-isolated (R32.5, prod untouched). Server; tree render unchanged.

## Acceptance Criteria

- [x] (functional) mofChildren mints/uses real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs); each resolves to a real unit with a detail view.
- [x] (functional) The File/Folder detail shows its exact LOCATION (rel-path).
- [x] (functional) File/Folder detail shows the R34.1 «Scenario»+«Edit» default pair (depends R34.1).
- [x] (functional) Unit uuid = keyToUuid(rel-path) (R32.2 deterministic) so re-derive re-binds the same unit - no duplicates.
- [x] (security) Units minted in MODEL_STORE ONLY; prod scenario/index untouched (R32.5 isolation); tree render unchanged (still rb-trace-tree folders); /trace detail unregressed.
- [x] (gate) GATE @390 real-WebKit: a File/Folder node opens a REAL detail with exact location + Scenario/Edit; prod scenario/index untouched.

## Subtasks

None (atomic task).
