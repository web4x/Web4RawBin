# T10: Device Key Enrollment
[task:uuid:a37159a8-6d81-4edf-b144-a2284f800308]

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

- [x] New device with committed profile prompted for secret code
- [x] Correct code → device keypair generated, signed, stored in localStorage
- [x] Device public key added to user's authorized_keys
- [x] Wrong code → DEVICE_ENROLL_FAILED with reason
- [x] User without SSH keys cannot enroll
- [x] Device keys persist in localStorage across page reloads
- [x] All tests pass

## QA Audit & User Feedback

## Subtasks
None (atomic task).

## Subtasks

None (atomic task).
