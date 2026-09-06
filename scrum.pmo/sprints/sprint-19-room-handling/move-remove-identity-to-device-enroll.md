<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-move-remove-identity: re-home Remove-Local-Identity button from ProfileEditor to DeviceEnrollDialog

[task:uuid:73297bf1-0d00-47e6-acfa-e4f5be34feb1]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

Move the red Remove-Local-Identity button + handler (ProfileEditor L68/L154 impl 25884b0c) to DeviceEnrollDialog. Same logic, different host component. Remove from ProfileEditor gate-mode template.

## Subtasks
