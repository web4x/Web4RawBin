<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 26.2: Cross-origin DnD federated-reference protocol

[task:uuid:491028f2-8fed-49de-b528-98ed03cc95ea]

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
    - Requirement R26.2 `[requirement:uuid:e36d585c-cbb1-4715-a175-fa844f375cde]`
  - down
    - [UC26.2: dnd.federatedReference](./planning.md#uc26-2) `[uc:uuid:13ce665c-0f13-4d1e-8d7d-1818f1e80ee1]`

## Task Description

Cross-origin drag puts a self-contained FEDERATED REFERENCE in the DataTransfer (application/rb-federated-ref = {ior@host, originHost, type, name, fetchUrl, contentHash?}) rather than the full scenario JSON (files are MB; DataTransfer is size-limited + sync-read). The receiver reads the ref and asks ITS OWN server to import from fetchUrl. A text/uri-list fallback stays for human/browser. Tiny units MAY inline full JSON to skip the round-trip.

## Context

Greenfield federation, scenario-first (#126). Design: federated-scenario-transfer.md (architect 7e940cf81). Class DropDispatcher. Builds on R26.1 (federated IOR) + R26.3 (fetch API).

## Intention

RawBin Federation: dragging a unit from server A to server B must carry a resolvable reference, not the payload — DataTransfer is size-limited + synchronous.

## Acceptance Criteria

- [x] (protocol) DataTransfer carries application/rb-federated-ref = { ior:'ior:instance:<uuid>@<originHost>', originHost, type, name, fetchUrl:'<originHost>/api/scenario/<uuid>?grant=<capabilityToken>', contentHash? }
- [x] (protocol-no-json) The full scenario JSON is NOT serialized into DataTransfer (files are MB; size-limited + synchronous-read); the ref is a reference + fetch URL
- [x] (fallback) A text/uri-list fallback = '<originHost>/app#<hash>' remains for human/browser (unchanged)
- [x] (flow) The receiver reads the federated-ref and asks ITS OWN server to import from fetchUrl (server-to-server, never browser->origin)
- [x] (optimization) For tiny units (URL WebItem, short text) the full JSON MAY be inlined in the ref to skip the round-trip; the canonical path stays reference+fetch

## Implementation

 GREEN → QA Review: impl v0.7.3 (b93966302); tester GREEN DET-3x c39128716 — application/rb-federated-ref. (#27 per-AC honest.) ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
