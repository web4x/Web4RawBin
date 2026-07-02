<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.8: Task.messages[] link + agentMessage skill verbs

[task:uuid:84ac067d-b926-414d-b866-feb096f5bdeb]

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
    - Requirement `[requirement:uuid:8f65a0b4-0d22-453b-bf60-0490736d8e8f]`
  - down
    - [UC](./planning.md) `[uc:uuid:d90db09d-0b3f-4c89-951e-d467ceb36174]`

## Task Description

Task.messages[] link + agentMessage skill verbs (send/inbox/read/list/thread)

## Context

Moved into S29 (Agent Intercom per Tron). crossRef the AgentMessaging track (R29.5-8). Chain-build awaits architect.

## Intention

S29 Agent Messaging — the STRUCTURAL fix for sent!=delivered (async mailbox, no live injection). Stood up scenario-first (Task layer was missing: reqs+UCs captured plan-now, tasks never built).

## Acceptance Criteria

- [ ] (integration) Task units gain a messages[] field linking related AgentMessage units (thread the conversation on a task).
- [ ] (integration) An agentMessage skill exposes verbs: send / inbox / read / list / thread (Object.verb per OOSH), each an addressable use case.
- [ ] (integration) Messages thread by threadId; the thread verb shows the full conversation in order.
- [ ] (integration) The mailbox skill is the canonical agent-comms path - replaces otmux send-keys / keystroke messaging for agent-to-agent communication.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect UC-refine + expert impl. Reqs+UCs already exist (architect wired UCs).

## Subtasks

None (atomic task).
