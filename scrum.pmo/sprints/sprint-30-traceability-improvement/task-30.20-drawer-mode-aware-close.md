<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.20: Detail-drawer mode-aware close (in-room X->chat, trace X->minimize)

[task:uuid:f487b7b9-90ae-4775-93f4-8c30eb3db7e5]

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
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:ecb4e62a-3367-4c4e-9e51-4d4fe358735a]`
  - down
    - [UC](./planning.md) `[uc:uuid:856a8929-05bf-4070-93f1-132cd745b2b6]`

## Task Description

Detail-drawer mode-aware close (in-room X->chat, trace X->minimize) (retroactive #126 backfill).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill. Gate v0.7.29 GREEN DET-3x (fc22f6759 drawer mode-aware close), chain-to-Test CLOSED (bb252c37d Test ea1e97b8; 119c23782 chain CLOSED). R30.21 later split from this (2b2b29c39). Class RbDetailDrawer d86af73d. served==gated.

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit).

## Acceptance Criteria

- [ ] **(case1)** CASE 1 - trace-view (this.chatPanel===null) + detail mode: .drawer-close MINIMIZES the drawer (R27.8 behavior kept, both mobile AND desktop).
- [ ] **(case2)** CASE 2 (REGRESSION FIXED) - in-room (this.chatPanel!==null) + detail mode: .drawer-close calls setMode('chat') -> the X RETURNS to the chat view instead of minimizing.
- [ ] **(case3)** CASE 3 - in-room + chat mode: .drawer-close MINIMIZES (already in chat, so X minimizes).
- [ ] **(case4)** CASE 4 - ESC closes the drawer (unchanged).
- [ ] **(detection)** The in-room-vs-trace signal is this.chatPanel!==null (ChatPanel is created ONLY via RoomView drawer.chat; the trace-view never creates it - the existing signal @ rb-detail-drawer.ts:86). No new state flag.
- [ ] **(verify)** Tron visual + DET-3x all cases: in-room detail X -> chat; trace-view X -> minimize (mobile+desktop); in-room chat X -> minimize; ESC -> close. Built WITH a version-bump.

## Implementation

DONE #126 backfill. Gate v0.7.29 GREEN DET-3x (fc22f6759 drawer mode-aware close), chain-to-Test CLOSED (bb252c37d Test ea1e97b8; 119c23782 chain CLOSED). R30.21 later split from this (2b2b29c39). Class RbDetailDrawer d86af73d. served==gated.

## Subtasks

None (atomic task).
