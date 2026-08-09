<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-room-join-stale-takeover: joining from lobby must succeed (same-token takeover, never reject)

[task:uuid:3ca88df7-b761-4cba-96b0-b3029dd7a043]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [x] implementing (expert — same-token takeover, never reject; in flight)
  - [ ] testing (tester)
- [x] QA Review
- [ ] Done

## Task Description

R19.82 fix: joining a room from the lobby must succeed even when a stale connection holds the slot. Same-token takeover — the new connection takes over the stale one instead of rejecting the join. Expert fix in flight (same-token takeover, never reject). Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27).

## Subtasks
