# T9: SSH Key Generation on Profile Commit
[task:uuid:e7fbf79b-c564-4751-8144-dbfb6688946d]

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
  - [sprint-2-identity-ssh Planning](./planning.md)
- down
  - None

## Acceptance Criteria

- [x] Profile commit creates data/users/<token>/.ssh/ tree
- [x] RSA-2048 keypair in PEM format
- [x] OOSH directory pattern (public_keys/, private_key/ with named copies)
- [x] File permissions: 700 dirs, 600 files
- [x] Idempotent (no regen on second call)
- [x] sshKeysGenerated set in UserProfile
- [x] All tests pass

## QA Audit & User Feedback

## Subtasks
None (atomic task).

## Subtasks

None (atomic task).
