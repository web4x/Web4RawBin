<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.2: Owner-only access gate (server-side, by-construction, incl websocket UPGRADE ticket)

[task:uuid:d4a153d7-918a-402c-b088-345c86802537]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:5bc9683e-384d-4170-8fcf-a2e7ca981d7b]`
  - down
    - [UC](./planning.md) `[uc:uuid:40802701-db2c-49d4-85cd-aa421f06e61d]`

## Task Description

The Server Manager UI AND every backing API/websocket are restricted to owner token 41ad88c4-... enforced SERVER-SIDE by a single shared owner-guard: non-owner gets 403 and never reaches otmux/terminal APIs. The ws is gated at the UPGRADE via a single-use ~30s owner-bound ticket (browsers cannot set ws auth headers, so post-connect checks are NOT acceptance).

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.2 = the security FOUNDATION (build first; nothing ships without it). Correct-by-construction owner-guard.

## Acceptance Criteria

- [ ] Owner check is SERVER-SIDE on every Server Manager endpoint; the authenticated token is the source of truth (not a client flag).
- [ ] Requests from token 41ad88c4-4dee-49ac-afcb-8a2026657b2d to every Server Manager endpoint + ws handshake succeed (200 / ws upgrade).
- [ ] Requests from ANY other authenticated token to every Server Manager endpoint AND the ws handshake return 403 and never reach otmux/terminal APIs.
- [ ] A SINGLE shared owner-guard (one function/middleware) gates all endpoints + the ws handshake - correct-by-construction, not per-call ad-hoc checks.
- [ ] The websocket is gated at the UPGRADE: an owner-gated HTTP endpoint issues a single-use ~30s owner-bound TICKET; the ws upgrade validates ?ticket= and a non-owner (invalid/absent/expired/reused) gets 403 with the socket NEVER opening. Post-connect token checks are NOT acceptance. Per architect 9920f6832.

## Subtasks

None (atomic task).
