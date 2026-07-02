<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.5: First-class AgentMessage scenario unit

[task:uuid:57592bb6-23d8-4e01-b90a-dc6e1aaca214]

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
    - Requirement `[requirement:uuid:51b87013-45a2-417b-9d5f-6e8242559c03]`
  - down
    - [UC](./planning.md) `[uc:uuid:2a150baf-9a0c-4745-85c6-021053ad0d8b]`

## Task Description

First-class AgentMessage scenario unit (peer to Task/Req/UC)

## Context

Moved into S29 (Agent Intercom per Tron). crossRef the AgentMessaging track (R29.5-8). Chain-build awaits architect.

## Intention

S29 Agent Messaging — the STRUCTURAL fix for sent!=delivered (async mailbox, no live injection). Stood up scenario-first (Task layer was missing: reqs+UCs captured plan-now, tasks never built).

## Acceptance Criteria

- [ ] (type) A NEW first-class ior:class:AgentMessage scenario unit type exists, peer to Task/Requirement/UseCase.
- [ ] (type) An AgentMessage holds: from (sender agent + pane), to (recipient agent), subject/body, threadId, timestamp, status (unread/read), and an optional ref to a related Task/Requirement.
- [ ] (type) A message is a COMMITTED scenario unit on disk (durable + auditable) - not an ephemeral keystroke; wer schreibt der bleibt.
- [ ] (type) The AgentMessage type is registered in templates.ts (AgentMessageTemplate) + the tagMap so it renders + resolves (a new scenario type without its template + tagMap will not render/resolve - the R29.3 lesson).

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect UC-refine + expert impl. Reqs+UCs already exist (architect wired UCs).

## Subtasks

None (atomic task).
