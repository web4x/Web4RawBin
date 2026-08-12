<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.22: IOR carries a clear origin (class+host+path) for cross-instance DnD, reconciled with federated ior@host (no fork)

[task:uuid:fdee4809-8a48-4ecf-92fc-bc5ac5d2c28b]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver R37.22: cross-instance IORs carry a clear origin reconciled onto the existing federated ior:instance:<uuid>@<originHost> scheme (no 2nd format); prod<->test drops resolve the real unit. Architect designs the reconciliation first (scenario-first #126).

## Context

Covers R37.22 (aedd0e83) via UC ior.carryOrigin (180512d8); reconciles federated-scenario-transfer.md.

## Intention

Tron 2026-08-12: IORs need a clear origin for prod<->test DnD; reconcile with the existing federated scheme, don't fork.

## Acceptance Criteria

- [ ] AC-C-clear-origin: cross-instance IOR carries class+host+unit-path origin.
- [ ] AC-C-reconcile-no-fork: reconcile with ior:instance:<uuid>@<originHost> (path from uuid-sharding, class from unit), NO 2nd format.
- [ ] AC-C-cross-instance-resolves: prod->test drop resolves via origin, not a plain-URL WebItem.
- [ ] AC-C-DEVICE [@390 Tron]: prod<->test drop carries origin + resolves, verified on device.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

None (architect may split at design).
