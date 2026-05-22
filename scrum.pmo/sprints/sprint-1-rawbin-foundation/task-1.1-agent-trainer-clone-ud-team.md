[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.1: Agent-Trainer - Clone ud-team as robbinTeam
[task:uuid:b8f4d2e3-9c5f-4a0b-c7d6-4e3f2a1b0c9d]

## Status
- [x] Planned
- [x] In Progress
- [x] Done — All fixes applied. cwd correct, naming role@MacStudio, all verified by agent-trainer.

## Remaining Issues (must fix before Done)
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
