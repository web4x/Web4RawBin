# T-persistent-dedup: Room.addMember match-by-playerToken reconnect vs reject vs insert
[task:uuid:ce98e242-bf6a-4460-aa03-3668874aa2da]

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

Room.addMember() matches by playerToken first: if match+disconnected then update entry (swap id/ws, flip disconnected=false, broadcast MEMBER_RECONNECTED); if match+connected then reject (duplicate); if no match then insert (current path). Covers R19.8.B (persistent rejoin flips existing member back to online, never adds a duplicate).

## Subtasks


