<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.6: Async mailbox — send writes+commits a unit; recipient pulls

[task:uuid:9b38cc39-d8c0-44cc-b626-094258b70732]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 29 Planning](./planning.md)
    - Requirement `[requirement:uuid:71f34bf9-46eb-44ef-82c8-84ed26a7b1e4]`
  - down
    - [UC](./planning.md) `[uc:uuid:3a74e3b2-6c60-4dea-be72-6a3850dcbec8]`

## Task Description

Async mailbox: send writes+commits a unit; recipient pulls at turn boundary (no keystroke injection)

## Context

Moved into S29 (Agent Intercom per Tron). crossRef the AgentMessaging track (R29.5-8). Chain-build awaits architect.

## Intention

S29 Agent Messaging — the STRUCTURAL fix for sent!=delivered (async mailbox, no live injection). Stood up scenario-first (Task layer was missing: reqs+UCs captured plan-now, tasks never built).

## Acceptance Criteria

- [ ] (mailbox) Sending a message = write + commit the AgentMessage unit ONLY; NO keystroke injection into the recipient's pane or input buffer.
- [ ] (mailbox) The recipient PULLS its inbox at a TURN BOUNDARY (reads unread AgentMessage units addressed to it), not mid-turn.
- [ ] (mailbox) The sender never interrupts the recipient's running turn; delivery is decoupled from the recipient's execution state (structural fix for keystroke-into-busy-pane = the sent-!=-delivered problem).
- [ ] (mailbox) Messages persist (committed) until pulled + read; no message is lost to a busy input buffer or an un-submitted Enter.
- [ ] (verify) Verified: a message sent while the recipient is mid-turn is NOT injected; it is committed and read on the recipient's next turn-boundary pull, intact.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect UC-refine + expert impl. Reqs+UCs already exist (architect wired UCs).

## Subtasks

None (atomic task).
