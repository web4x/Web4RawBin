<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.21: Credentials-in-URLs -> capability-not-identi

[task:uuid:a3932852-6ed9-41fa-8fd8-bf46c0e3a1be]

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

Deliver + verify requirement R40.21 (Credentials-in-URLs -> capability-not-identi). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.21; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(auth-off-url)** In-app auth uses the sm_session cookie / x-player-token HEADER — NO identity credential in any URL parameter.
- [ ] **(cap-for-sharing)** Shareable resource URLs carry ?cap=signed({resourceId,exp,scope}) reusing the T26.3 capability-grant HMAC — opens ONLY that one resource, short-lived/expiring, scoped.
- [ ] **(stub-must-fail-cap-gate)** The capability gate is STUB-MUST-FAIL: a forged / expired / wrong-scope cap FAILS (proven), never opens the resource.
- [ ] **(INV-URL-1-5)** INV-URL-1..5 per the LOCAL design: no identity token in a URL; cap scoped to exactly one resource; cap expires; wrong/missing cap -> 403/404 no-leak; old identity-in-URL links inert post-migration.
- [ ] **(phased-migration)** Phased migration: accept BOTH (identity-URL + cap) -> then REJECT identity-in-URL; post-rotation old links are inert and 404 GRACEFULLY (no leak, no crash).
- [ ] **(device-390)** @390 owner-device (Tron): the share + capability-open flow works on his phone.

## Subtasks
