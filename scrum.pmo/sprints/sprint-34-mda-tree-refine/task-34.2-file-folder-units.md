<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.2: File & Folder are real ior:class:Folder/File units in MODEL_STORE, showing exact location (server) [R-A]

[task:uuid:7cb3d9dd-ea9e-45d8-b643-fe14414478c6]

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

Planned — cluster R-A server half (build LAST, pairs with R34.1). Real Folder/File units, deterministic keyToUuid (R32.2), MODEL_STORE-isolated (R32.5 prod untouched). Gate real-WebKit @390 on ship.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.2 `[requirement:uuid:fe463924-154e-4f99-bf3d-2fabc388042c]`
  - down
    - None (atomic task)

## Task Description

R-A (server half). mofChildren MUST mint/use real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs) so each folder/file node resolves to a REAL unit with a detail view + the R34.1 default actions + its exact LOCATION. Deterministic uuid = keyToUuid(rel-path) (R32.2), MODEL_STORE-isolated (R32.5, prod untouched). Server; tree render unchanged.

## Acceptance Criteria

- [ ] (functional) mofChildren mints/uses real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs); each resolves to a real unit with a detail view.
- [ ] (functional) The File/Folder detail shows its exact LOCATION (rel-path).
- [ ] (functional) File/Folder detail shows the R34.1 «Scenario»+«Edit» default pair (depends R34.1).
- [ ] (functional) Unit uuid = keyToUuid(rel-path) (R32.2 deterministic) so re-derive re-binds the same unit - no duplicates.
- [ ] (security) Units minted in MODEL_STORE ONLY; prod scenario/index untouched (R32.5 isolation); tree render unchanged (still rb-trace-tree folders); /trace detail unregressed.
- [ ] (gate) GATE @390 real-WebKit: a File/Folder node opens a REAL detail with exact location + Scenario/Edit; prod scenario/index untouched.

## Subtasks

None (atomic task).
