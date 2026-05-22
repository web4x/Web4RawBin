[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.1: Agent-Trainer - Clone ud-team as robbinTeam
[task:uuid:b8f4d2e3-9c5f-4a0b-c7d6-4e3f2a1b0c9d]

## Status
- [x] Planned
- [x] In Progress
- [x] Done — oosh-expert executed via hiveMind team.setup. 4/4 agents active, all UUIDs captured.

## Traceability
  - up
    - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)

## Description
Use hiveMind team.setup to create a new robbinTeam session with 4 agents cloned from the ud-team structure:

```
robbinTeam
├── 0.0  robbin-po
├── 0.1  robbin-architect
├── 0.2  robbin-expert
└── 0.3  robbin-tester
```

Steps:
1. `hiveMind team.setup robbin-po,robbin-architect,robbin-expert,robbin-tester robbinTeam`
2. Wait for agents to initialize
3. Set project directory to `/Users/Shared/Workspaces/2cuGitHub/Web4RawBin`
4. Register team: `hiveMind team.register robbinTeam "RawBin AI server management — Robbin"`

## Role
Agent-trainer or whichever agent SM identifies as capable of team cloning.
