<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.44: REMOVE the dead /api/current-sprint/designat

[task:uuid:b749e786-fc67-44ac-810d-827718eb639b]

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

Deliver + verify requirement R40.44 (REMOVE the dead /api/current-sprint/designat). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.44; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** /api/current-sprint/designate + handlePinDesignate are REMOVED OUTRIGHT (deleted, not disabled/commented) — the owner-gated write endpoint no longer exists in the server.
- [ ] **(rationale)** Rationale: leaving it is a latent TWO-SOURCE RE-ENTRY point — a re-wired button writes a stored pin pointer and the drift R40.17/R40.18 killed returns. Removal makes re-entry impossible-by-construction.
- [ ] **(security)** Removes needless owner-gated-write attack surface (a live write endpoint nothing uses).
- [ ] **(prohibition)** A future explicit-steer capability is a CLEAN NEW req + NEW route, NEVER this route resurrected — recorded so no one revives the dead path instead of designing fresh.
- [ ] **(verify)** Verify: no reference to /api/current-sprint/designate or handlePinDesignate remains (grep-clean, no caller/button wired).

## Subtasks
