<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 23.3: Identity merge cleans up room membership (no ghost members)

[task:uuid:5f282c18-fa43-4a95-be10-65694949f981]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 23 Planning](./planning.md)
    - Requirement R23.3 `[requirement:uuid:75853976-72f9-464a-9f23-d35173a8b48e]`
  - down
    - [UC-IM.1: identityMerge.cleanupRoomMembership](./planning.md#uc-im1) `[uc:uuid:fc7356af-8c3f-4f2c-bdf6-30d2a6b139f9]`

## Task Description

When profiles are merged (Link Account / consolidate, leaving the target tombstoned with redirectTo set), the merge MUST clean up room membership so a tombstoned profile never appears as a ghost member: a room shows exactly ONE canonical member per merged identity. Link Account MUST succeed when the secret code is correct, and the flow MUST NOT create a phantom empty profile.

## Context

Room member list + identity/Link-Account merge flow. Observed in Heartspaces: two Marcel Donges (ghost member from a tombstoned profile) + Link Account silently failing with a correct secret code + a phantom empty profile (6a27140d).

## Intention

Tron: "in the heartspaces are 2 marcel donges users. i tried to link accounts but it did not work though my secret number was correct."

## Acceptance Criteria

- [ ] (ghost members) After a merge, tombstoned profiles (redirectTo set) are removed/redirected from every room member list — no duplicate "ghost" member
- [ ] A room with merged identities shows exactly ONE canonical member per person (Heartspaces shows one Marcel Donges, not two)
- [ ] (link works) Link Account / consolidate SUCCEEDS when the entered secret code matches the target's secretCode
- [ ] A correct secret code never yields a silent failure; a wrong code yields an explicit CONSOLIDATE_FAILED 'Wrong secret code'
- [ ] (no phantom) The identity/link flow does NOT create a phantom empty/uncommitted profile (e.g. the observed 6a27140d)
- [ ] Existing ghost members from past merges are reconciled (cleanup is retroactive for already-tombstoned profiles in rooms)
- [ ] Verified live (headless) in a real room — merge 2+ profiles, room member list collapses to one canonical member

## Implementation

Shipped v0.6.84 (a30315bcc, LIVE): collapse consolidated (redirectTo) members to PRIMARY in room member list — Room.ts (membership collapse) + server.ts; sw.js + version bumped (#15/#16). Tester gating NOW — testing hop OPEN until committed GREEN verdict (#102); AC remain unchecked until tester DET-3x proves on a real room (no-ghost / link-works / no-phantom / retroactive cleanup).

## Subtasks

None (atomic task).
