<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 26.5: Conflict reconcile — uuid already exists locally

[task:uuid:7dd49936-1075-45ff-9eff-bd4309289b38]

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
    - [Sprint 26 Planning](./planning.md)
    - Requirement R26.5 `[requirement:uuid:f7e4c1cc-c2a5-423c-bbaa-d010a2d1fa79]`
  - down
    - [UC26.5: federation.conflictReconcile](./planning.md#uc26-5) `[uc:uuid:1f097e01-7d45-4e8c-b403-5a5ff5f0bfe6]`

## Task Description

On import, a uuid that already exists locally is RECONCILED, never blind-duplicated. Same uuid + same originHost = idempotent re-transfer (update only if the remote is newer, else no-op). Same uuid + different originHost = a genuine collision: re-mint under a fresh local uuid, keep model.originIor for provenance, and rewrite all inbound forward refs (the import remap pass). Content files dedup by contentHash regardless of uuid. A reference-rewrite pass keeps the chain intact across the boundary.

## Context

Greenfield federation, scenario-first (#126). Design: federated-scenario-transfer.md (architect 7e940cf81). Class Transfer. The import-side counterpart to R26.4 (eager/lazy) — closes the round-trip safely.

## Intention

RawBin Federation: importing must never blind-duplicate a uuid — idempotent re-transfer, collision re-mint + provenance, and a reference-rewrite pass that keeps the chain intact across the server boundary.

## Acceptance Criteria

- [x] (idempotent) Same uuid + same originHost -> idempotent re-transfer: update the local copy IF the remote is newer (updatedAt/version), else no-op (re-dragging is safe)
- [x] (remint) Same uuid + DIFFERENT originHost -> re-mint under a fresh local uuid, set model.originIor = ior:instance:<oldUuid>@<host>, and rewrite all inbound forward refs to the new uuid (import remap)
- [x] (dedup) Content files dedup by contentHash regardless of uuid (same bytes = same content unit)
- [x] (remap) Reference-rewrite pass on import: for every forward ref (children[]/parentFolder/class/etc) — target in this transfer -> remap to its new local uuid; stays remote -> keep as a federated @host IOR (lazy resolve); already local -> relink. The chain stays intact across the boundary
- [x] (provenance) Always record originHost + originIor so a federated copy can attribute + re-sync later

## Implementation

 impl v0.7.5 (a789a5d40, Transfer.reconcileConflict); NO committed tester GREEN yet — testing hop OPEN. Per-AC gate incl the security ACs (never blindly trust/execute foreign JSON). GREEN → QA Review: tester GREEN DET-3x (af907f925). same-origin re-drag → idempotent (noop, NOT remapped); diff-origin collision → re-mint fresh uuid + originHost/originIor provenance (remapped); contentHash dedup. 5/5 ACs. ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
