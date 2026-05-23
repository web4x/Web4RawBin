[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.2: Expert - Fork ud-team Agents into robbinTeam
[task:uuid:c9f5e3d4-0a6b-4b1c-d8e7-5f4a3b2c1d0e]

## Status
- [x] Planned
- [x] In Progress
- [x] Done — all 4 forked from ud-team UUIDs, renamed+locked role@MacStudio

## Traceability
  - up
    - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)

## Assigned
oosh-expert (ooshTeam:0.1) — delegated via SM (TRONinterface:0.1)

## Description
Replace empty claudeCode sessions on robbinTeam with forks of upDownTeam agents.

### Steps
For each pane in robbinTeam:

1. Get source UUID: `hiveMind resolve <ud-role>` → get pane → `claudeCode session.current <pane>`
2. Exit current empty session: send `/exit` to robbinTeam pane
3. Ensure cwd: `cd /Users/Shared/Workspaces/AI/Claude`
4. Fork: `claudeCode fork <uuid>`
5. Rename: `/rename role@MacStudio`
6. Lock title: `otmux pane.lock robbinTeam:0.X role@MacStudio`

### Agent Mapping

| robbinTeam Pane | Source (upDownTeam) | Target Name |
|-----------------|---------------------|-------------|
| 0.0 | ud-po | robbin-po@MacStudio |
| 0.1 | ud-architect | robbin-architect@MacStudio |
| 0.2 | ud-expert | robbin-expert@MacStudio |
| 0.3 | ud-tester | robbin-tester@MacStudio |


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] All 4 agents are forks (not fresh sessions)
- [x] Each agent has inherited knowledge from its ud-team source
- [x] cwd is /Users/Shared/Workspaces/AI/Claude/
- [x] Pane titles: role@MacStudio (locked)
- [x] Registry updated
