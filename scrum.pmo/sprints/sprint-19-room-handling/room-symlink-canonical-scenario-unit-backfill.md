<!-- GENERATED FROM SCENARIO UNITS - DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-room-symlink: room.json as symlink to canonical scenario unit + one-shot backfill

[task:uuid:755a2b09-9a50-4321-a3fe-5ff12c29034a]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement architect
  - [ ] creating test cases
  - [ ] implementing expert rule-pair a+b
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Every data/users/<u>/rooms/<r>/room.json becomes a symlink to scenario/index/<shard>/<r>.scenario.json. One-shot backfill script converts existing standalone room.json files. After backfill, Room.persist writes to the canonical unit; the symlink resolves transparently. Covers R19.22.A (filesystem invariant).

## Subtasks
