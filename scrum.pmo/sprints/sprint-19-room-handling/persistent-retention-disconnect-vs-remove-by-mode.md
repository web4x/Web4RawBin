<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-persistent-retention: ws.close+LEAVE_ROOM branch on room.mode — markDisconnected vs removeMember

[task:uuid:fa8fffc8-d75a-43b3-abaa-edb97149da92]

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

server.ts ws.close(1307) + LEAVE_ROOM(1394) must branch on room.mode: persistent rooms call Room.markDisconnected (keep member listed as offline, persist(), broadcast MEMBER_DISCONNECTED not MEMBER_LEFT); live rooms call Room.removeMember (current behaviour). Room.markDisconnected must call persist() so offline status survives restart. Covers R19.8 (persistent rooms keep every member on the member list even when offline).

## Subtasks
