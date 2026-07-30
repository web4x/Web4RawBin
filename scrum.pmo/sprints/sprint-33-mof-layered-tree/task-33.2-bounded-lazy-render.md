<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.2: MOF tree bounded/lazy render + file-dir sub-grouping (@390 perf)

[task:uuid:73472bb5-aec0-47cb-a41d-0f29981aebe7]

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
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.2 `[requirement:uuid:7a178df1-4c07-4e79-8429-0ab0365a898b]`
  - down
    - None (atomic task)

## Task Description

S33-P2b: the /model MOF tree must render BOUNDED + LAZY at 390px so the 1195-node RawBin model does not flood/hang mobile. MEASURE-FIRST root cause (architect 582b0c27b): (1) the shell's <rb-trace-tree id='model-tree' data-always-expanded> (server.ts:1011) forces buildSeedNode to build ALL layers eagerly; (2) mofLayerRoots (server.ts:1554) INLINES the full nested tree (1195 nodes in one payload). rb-trace-tree is ALREADY lazy (R31.3 layer-by-layer + fetchAndRenderChildren + hasChildren) and /api/trace/children routes ModelElement->MODEL_STORE (R32.5) - data-always-expanded + inline-emission DEFEAT the existing lazy path. FIX (no fork): Part A - drop data-always-expanded on /model (client, mirror server-manager R31.3) + mofLayerRoots emits BOUNDED (folders/project/class with hasChildren+childCount, NO inlined members) so the client lazy-fetches each layer via /api/trace/children on expand; Part B - sub-group RawBin's 139 classes by sourceFile/dir into rb-trace-tree folders (26 file-folders for src/ts/scenario), not a flat 139-list. CHAIN (#126) RIDES R33.1's mofLayerRoots (Method, Impl 5afeafe9) - extended for bounded+sub-group - + UC model.mofTree (d42e1a1e); the R33.2 Test = the @390 render-perf gate (mints on build onto the extended mofLayerRoots Impl, tester independent). Reuse-only: rb-trace-tree R31.3 lazy + /api/trace/children MODEL_STORE (R32.5) + rb-trace-tree folders (R33.1); NEW = mofLayerRoots bounded emission + file/dir sub-grouping + drop data-always-expanded.

## Acceptance Criteria

- [x] AC1 / INV-P2b-1: the /model tree renders BOUNDED at 390px - ONLY the top layer (MOF folders, collapsed), NOT the full 1195 nodes. data-always-expanded is dropped on /model (client, mirror server-manager R31.3) so buildSeedNode does NOT eagerly build all layers; initial DOM << 1195.
- [x] AC2 / INV-P2b-2: deeper layers (project -> files -> classes -> members) load LAZILY on expand via /api/trace/children/<uuid> (MODEL_STORE-rerouted, R32.5) - each expand is ONE bounded layer fetch; members/deep grandchildren are NEVER inlined in the mofLayerRoots payload.
- [x] AC3 / INV-P2b-3: RawBin's 139 classes are SUB-GROUPED by sourceFile/dir into rb-trace-tree folders (e.g. src/ts/scenario -> 26 file-folder nodes -> their classes -> members), NOT a flat 139-list. Reuses the rb-trace-tree collection/folder rendering (same as the MOF layers).
- [x] AC4 / INV-P2b-4: a @390 RENDER-PERF gate - the 1195-node model does NOT hang/flood mobile (bounded initial DOM measured << 1195 + render fast; each expand asserted a bounded lazy /api/trace/children fetch, not one 1195 payload); real RawBin classes still reachable (P2-1 unregressed); /model owner-gated 403 non-member; /trace unregressed. Gate the RENDER-PERF, not merely 'loads'.

## Subtasks

None (atomic task).
