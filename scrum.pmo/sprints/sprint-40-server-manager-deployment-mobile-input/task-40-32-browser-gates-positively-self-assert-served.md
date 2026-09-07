<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.32: Browser gates positively self-assert served=

[task:uuid:e6663c08-21f3-4966-8390-8714eb5962e1]

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

Deliver + verify requirement R40.32 (Browser gates positively self-assert served=). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.32; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** Each of the 16 browser gates positively self-asserts served==committed (served bundle-hash / /api/config {cache:no-store} version check), rather than relying on the network-first SW backstop to deliver fresh content — the gate proves the DEPLOY, not just the cache.
- [ ] **(context)** This is NOT a false-green: sw.js is network-first for navigations/shell/dist (cache-first only for immutable hashed static = which IS the deploy); proven live r3014-network-first-gate GREEN DET-3x @0.8.91. Lower-grade 'doesn't self-prove the deploy' debt, not a cache-blind false-green.
- [ ] **(containment)** r3014-network-first-gate is the STANDING REGRESSION-LOCK on the SW backstop: if the SW regresses to cache-first, r3014 goes RED. The debt's containment holds while r3014 is green (r3014 EXCLUDED from the 16 — it self-asserts the served hash, safe-by-design).
- [ ] **(functional)** Remediation is WHEN-TOUCHED (cheap, not a last-mile campaign): when any of the 16 gates is next re-run for its own reason, add the served==committed guard (r3014/r403b pattern) or neutralise the SW. Do NOT mass-re-run 16 old gates during the campaign — the network-first backstop covers them.
- [ ] **(tracking)** The full 16-gate list + risk-rank (higher=user-facing visual: drawer/vcard/lobby/file-detail/audio/task-detail/detail-chain/newtab...; lower=federation/non-visual: federated-dnd/counterpart-enrichment) is durable at scrum.pmo/sw-cache-gate-debt-2026-08-12.md — this req makes it a tracked backlog item, not memory.

## Subtasks
