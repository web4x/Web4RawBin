<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-dnd-unknown-dispatcher: unknown format dropped onto room chat + extensible mimeType registry

[task:uuid:25c38ac0-ee8d-41e5-b99f-5012b2d7d049]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [x] creating test cases
  - [x] implementing expert (6afbc901 v0.5.157)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

When a dropped item format is unknown (not matched by any registered handler), dispatch it as a message to room chat. Extensible mimeType registry allows future handlers to claim specific formats. Covers R19.37.

## Subtasks
