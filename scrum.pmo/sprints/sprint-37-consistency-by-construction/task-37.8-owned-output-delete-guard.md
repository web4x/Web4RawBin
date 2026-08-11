<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.8: Generated-output writes route through a shared owned-output guard — never clobber/delete an UNMARKED (hand-authored) file, fail-closed [R37.8]

[task:uuid:9ca4b58f-015f-44b8-9b27-62eeee31d4ea]

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

QA-Review (units-win; planner disk-verified chain-complete-to-Test BOTH directions): 3 Impls 3a716334/e1ff295f/fc520411 (owned-output-guard.ts guardedWrite/guardedDelete/guardedWriteRegion) markerPending=false strict-AST + tests[] wired BOTH-DIR to 3 BITE Tests 02cfb6ae/a1ff5bfc/e19a1882 (B1/B2b/B3), each status=pass (tester re-ran check:owned-output GREEN at set, commit 356a98100; SM independently ran the suite, zero drift). CI-registered chokepoint. Done-gate [ ] = Tron's act (R40.10 approve). Stood up scenario-first (PO-approved, R33.1.1 pattern — R37.8 had no covering task; honest bookkeeping of DELIVERED work, not manufacturing). Board 2026-08-09.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.8 `[requirement:uuid:1ddc8564-9f45-488f-965c-0b4fc1a76a1c]`
  - down
    - None (atomic task)

## Task Description

R37.8 (incident-driven, 2026-08-09). Every write/delete by the board generators (generate-sprint-md, sprint-overview) routes through ONE shared owned-output chokepoint (owned-output-guard.ts: guardedWrite/guardedWriteRegion/guardedDelete) that acts ONLY on a MARKED generated output (owned name / generated-header / owned region); an UNMARKED hand-authored file is NEVER clobbered or deleted; fail-closed (unknown/ambiguous -> refuse) + path-traversal-free. Permanent by-construction fix for the regen-collateral-delete class that removed 3 committed knowledge docs (pin-two-sources / R31-audit-RESULT / release-tagging). Sibling to the generated-view family R37.2/C6/C7. Architect design 38ba4a160; skill-expert guard 1851d2144.

## Acceptance Criteria

- [x] (shared-chokepoint) Both generators (generate-sprint-md guardedWrite + sprint-overview guardedWriteRegion) route ALL writes/deletes through the ONE shared owned-output-guard helper — no direct fs.write/unlink bypasses it.
- [x] (never-clobber-unmarked) An UNMARKED (hand-authored) file is NEVER overwritten: guardedWrite refuses to write over a path that is not an owned/generated name or lacks the generated header.
- [x] (never-delete-unmarked) An UNMARKED file is NEVER deleted: guardedDelete removes a path ONLY when it carries the generated header — hand-authored knowledge docs cannot be regen-collateral.
- [x] (fail-closed) On unknown/ambiguous ownership OR a path-traversal attempt, the guard REFUSES (does not write/delete) rather than proceeding.
- [x] (region-preserve) guardedWriteRegion rewrites ONLY the generated region (between markers) of sprints.overview.md and preserves the hand-authored narrative outside it.
- [x] (verify) Verified by tester BITEs B1 behavioural / B2a static chokepoint / B2b negative-bite / B3 fail-closed going GREEN with the guard present (correctly RED against its absence).

## Subtasks

None (atomic task).
