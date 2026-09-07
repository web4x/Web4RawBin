<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.22: IOR carries a clear origin (class+host+path) for cross-instance DnD, reconciled with federated ior@host (no fork)

[task:uuid:fdee4809-8a48-4ecf-92fc-bc5ac5d2c28b]

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

FLIPPED Planned -> QA-Review 2026-09-07 (closed by measurement, PO ruling): the cross-instance origin capability is DELIVERED by the T37.20 contract (dnd-contract.ts:6 parseFederatedIor + isLocalOrigin = THE ONE origin-decision helper; the federated ior:instance:<uuid>@<originHost> IS the class+host+path origin). Tester RE-VERIFIED CURRENT on v0.8.211 (not carry-forward): r260-t262 drag-source GREEN DET-3x (emits ior:instance:UUID@origin + fetchUrl, NOT a plain URL) + r263-t267 e2e import GREEN DET-3x (drop RESOLVES to a REAL unit with originHost provenance, children lazy @host, idempotent — NOT an app#file.show WebItem). Together = prod<->test drop resolves-via-origin. AC-C-clear-origin + reconcile-no-fork + cross-instance-resolves = MET. ★ CLOSING AC = AC-C-DEVICE @390 (Tron real prod<->test drop on phone) = a genuine device physics limit (Tron ACCEPTS, we do not ask him to test). QA-Review ceiling; 0 Done till Tron.

## Task Description

Deliver R37.22: cross-instance IORs carry a clear origin reconciled onto the existing federated ior:instance:<uuid>@<originHost> scheme (no 2nd format); prod<->test drops resolve the real unit. Architect designs the reconciliation first (scenario-first #126).

## Context

Covers R37.22 (aedd0e83) via UC ior.carryOrigin (180512d8); reconciles federated-scenario-transfer.md.

## Intention

Tron 2026-08-12: IORs need a clear origin for prod<->test DnD; reconcile with the existing federated scheme, don't fork.

## Acceptance Criteria

- [ ] **(functional)** A cross-instance IOR carries a CLEAR ORIGIN — class + origin HOST + unit path — so a prod<->test DnD resolves the source unit unambiguously ('it should have a clear origin').
- [ ] **(functional)** The origin RECONCILES with the EXISTING federated IOR ior:instance:<uuid>@<originHost> (+ model.originHost/originIor) — do NOT fork a 2nd origin format (single-source). Path derived from uuid-sharding, class from the resolved unit => ONE format carries class+host+path by-reference. Local IORs omit @host (back-compatible).
- [ ] **(functional)** A unit dragged from WODA.prod dropped on WODA.test resolves via its origin (fetch by-reference through the federated scheme), NOT a plain-URL WebItem (the A2 defect at instance scope).
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron, NEVER headless-green, TRON-ONLY] Tron verifies a prod<->test drop carries the origin and resolves the real unit.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

None (architect may split at design).
