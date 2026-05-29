[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.1: Agent-Trainer - Clone ud-team as robbinTeam
[task:uuid:2fa531f7-871a-4f4d-9c0a-8f7bae3492e1]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done


## Remaining Issues
1. **Working directory wrong**: agents must start in `/Users/Shared/Workspaces/AI/Claude/` (the main Claude workspace), NOT in Web4RawBin directly. The Web4RawBin repo is accessible via `workspaces/Web4RawBin` symlink.
2. **Naming convention wrong**: pane titles show `role@opus` — must be `role@MacStudio` (convention: `agentName@hostname` not `agentName@model`)
3. **Symlink created**: `workspaces/Web4RawBin -> /Users/Shared/Workspaces/2cuGitHub/Web4RawBin` ✅

## Traceability
  - up
    - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)

## Description
Use hiveMind team.setup to create a new robbinTeam session with 4 agents cloned from the ud-team structure:

```
robbinTeam
├── 0.0  robbin-po@MacStudio
├── 0.1  robbin-architect@MacStudio
├── 0.2  robbin-expert@MacStudio
└── 0.3  robbin-tester@MacStudio
```

Requirements:
1. `hiveMind team.setup robbin-po,robbin-architect,robbin-expert,robbin-tester robbinTeam`
2. All agents start in `/Users/Shared/Workspaces/AI/Claude/` (main workspace)
3. Pane titles: `role@MacStudio` not `role@opus`
4. `/rename role@MacStudio` for each agent
5. Register team: `hiveMind team.register robbinTeam "RawBin AI server management — Robbin"`
6. Symlink: `workspaces/Web4RawBin -> /Users/Shared/Workspaces/2cuGitHub/Web4RawBin`

## Role
oosh-expert (executed initial setup), oosh-po to verify naming convention.

## QA Audit & User Feedback

## Subtasks
None (atomic task).
