<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.7: No live prompt/keystroke injection between agents

[task:uuid:56e3e609-27fb-44ce-93cf-a1bd6fdff54d]

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
    - Requirement `[requirement:uuid:1aeac13e-d073-46f2-8c29-2590a7f6d072]`
  - down
    - [UC](./planning.md) `[uc:uuid:2fbd9ff5-b54b-4d1c-b8ff-4e34f85ac249]`

## Task Description

Implement the by-construction guard that flags/forbids any tmux send-keys or stdin-write into a peer AGENT pane for messaging; route ALL agent-to-agent comms via AgentMessage units + async mailbox pull (recipient reads on its own turn, never a keystroke injected into a busy pane). Verify post-build that no keystroke-into-busy-pane path remains (the sent!=delivered / staging-not-submit failure mode). Ties R29.6 mailbox + R30-track no-live-injection.

## Context

Moved into S29 (Agent Intercom per Tron). crossRef the AgentMessaging track (R29.5-8). Chain-build awaits architect.

## Intention

S29 Agent Messaging — the STRUCTURAL fix for sent!=delivered (async mailbox, no live injection). Stood up scenario-first (Task layer was missing: reqs+UCs captured plan-now, tasks never built).

## Acceptance Criteria

- [ ] (guard) No agent writes to another agent's stdin / prompt / keystroke buffer to communicate; all agent-to-agent comms go via AgentMessage units + the mailbox pull.
- [ ] (guard) A by-construction guard (lint/audit) flags any tmux send-keys / stdin-write to a peer AGENT pane used for messaging - only the mailbox is the sanctioned path (agent panes, not the interactive server TUI which is R29.1).
- [ ] (verify) A message delivered while the recipient is mid-turn is NOT injected into its prompt; it waits for the pull. No keystroke-into-busy-pane path remains for agent messaging.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect UC-refine + expert impl. Reqs+UCs already exist (architect wired UCs).

## Subtasks

None (atomic task).
