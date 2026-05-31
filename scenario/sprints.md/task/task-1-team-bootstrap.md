# Task 1: Bootstrap robbinTeam from ud-team Clone
[task:uuid:a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c]

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

**Children:**
- [🔗 2fa531f7](../sprints.md/task/2fa531f7.md)
- [🔗 2dd5e06c](../sprints.md/task/2dd5e06c.md)
- [🔗 771a4a9a](../sprints.md/task/771a4a9a.md)


## Remaining Issues

Agents need robbin-specific SKILL.md + context files to fully transition (next task).

## Traceability

- up
    - [Sprint 1 Planning](./planning.md)

  - down
    - [Task 1.1: Agent-Trainer - Clone ud-team as robbinTeam](./task-1.1-agent-trainer-clone-ud-team.md)
    - [Task 1.2: Agent-Trainer - Rename and Rebrand Agents](./task-1.2-agent-trainer-rename-rebrand-agents.md)
    - [Task 1.3: PO - Verify Team Operational](./task-1.3-po-verify-team-operational.md)

## Task Description

Clone the existing ud-team (UpDown team) as a new robbinTeam for the Web4RawBin project. The ud-team has a proven 4-agent structure (PO, architect, expert, tester) that provides the right team composition for RawBin development.

## Context

RawBin needs a dedicated agent team. Rather than bootstrapping from scratch, cloning an existing working team is faster and preserves proven configurations. The ud-team has the right role structure. After cloning, agents need rebranding to RawBin/Robbin identity.

## Intention

Get a working robbinTeam running with 4 agents (robbin-po, robbin-architect, robbin-expert, robbin-tester) that can immediately start Sprint 1 work on the RawBin server management interface.

## Acceptance Criteria

- [x] robbinTeam tmux session exists with 4+ panes
- [x] All agents registered in hiveMind registry
- [x] Agents have RawBin-appropriate role names
- [x] hiveMind team.status robbinTeam shows all agents active
- [x] Team registered: hiveMind team.register robbinTeam

## QA Audit & User Feedback

## Subtasks
None (atomic task).

## Subtasks

None (atomic task).
