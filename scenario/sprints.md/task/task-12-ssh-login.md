# T12: SSH-Based Login (Challenge-Response)
[task:uuid:ce7f0047-334b-474c-ac99-897b9590a968]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

- up
  - [sprint-02-identity-ssh Planning](./planning.md)
- down
  - None

## Acceptance Criteria

- [x] Welcome includes unique challenge nonce
- [x] Client with device keys signs challenge and sends DEVICE_AUTH
- [x] Server verifies and marks connection as device-key authenticated
- [x] Invalid signatures rejected
- [x] No replay attacks (challenge is single-use)
- [x] Token-only clients still work (backward compatible)
- [x] authMethod tracked per connection
- [x] All tests pass

## QA Audit & User Feedback

## Subtasks
None (atomic task).

## Subtasks

None (atomic task).
