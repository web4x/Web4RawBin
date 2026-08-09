<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.7: Back = real history.back(); the path label navigates to the containing folder (distinct)

[task:uuid:b6e4a7dd-0453-4658-98e9-25fcc0b864b0]

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

QA-Review (units-win; planner disk-verified BOTH directions, own standard not relayed): chain-complete-to-Test — ONE Test e5b1c9a3 (R30.11 shared-intent) rides BOTH impls: FWD 6b4d7714.tests[]=[e5b1c9a3] + 197054f9.tests[]=[e5b1c9a3]; REV Test.implementations[]=[6b4d7714,197054f9] + status=pass; gate r4019-history-back-gate.mjs GREEN DET-3x @390 real-WebKit (f43ea803b). Two-key CLOSED (tester VERIFIED-not-reflipped — req mint b0797bd82 already bidirectional). All In-Progress sub-steps [x]. Done-gate [ ] = Tron's act (R40.10 approve-control). ★ NOTE (PO-flagged, planner-measured): Test.ownerIor=6b4d7714 ON DISK (PO's earlier 'None' read was pre-update/stale — RESOLVED). OPEN Q to req: should a shared-intent Test riding 2 impls carry ownerIor=6b4d7714, unset, or a designated owner? = small follow-up mint if changed, NOT a re-open. Board re-derived from units (PO campaign 2026-08-09).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.7 `[requirement:uuid:6ce80195-a394-4ba3-b9ca-3db7a04d2ce2]`
  - down
    - None (atomic task)

## Task Description

R40.7 (Tron: 'back should be a real history back; the path label should do what back does today'). The '← Back' control performs GENUINE browser history back; clicking the '📁 scenario/...' path label navigates to the containing folder (the behaviour Back does TODAY). The two are distinct and neither does the other's job. Scenario-first: req mints R40.7 + ACs; architect designs; expert implements; tester gates @390.

## Acceptance Criteria

- [x] [AUTOMATABLE @390 real-WebKit] '← Back' performs genuine history back — proven by navigating 2+ steps then Back returns to the prior view (not the folder).
- [x] [AUTOMATABLE @390 real-WebKit] Clicking the '📁 scenario/...' path label navigates to the CONTAINING FOLDER (today's Back behaviour).
- [x] [AUTOMATABLE @390] The two are DISTINCT: Back does history, the path label does folder-nav; neither does the other's job (both asserted in one flow).

## Subtasks

None (atomic task).
