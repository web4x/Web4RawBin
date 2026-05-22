[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.3: Agent-Trainer - Verify Inherited Knowledge
[task:uuid:d0a6f4e5-1b7c-4c2d-e9f8-6a5b4c3d2e1f]

## Status
- [x] Planned
- [x] In Progress
- [x] Done — all 4 pass, inherited training confirmed. Trainer compacted after.

## Traceability
  - up
    - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)
  - blocked by
    - [Task 1.2: Fork ud-team agents](./task-1.2-expert-fork-ud-agents.md)

## Assigned
agent-trainer (baseTeam) — triggered by SM after task 1.2 completes

## Description
Verify each robbinTeam agent inherited knowledge from its ud-team source.

### Verification Questions (send to each agent)
1. "State your role, team, working directory, and what project you serve."
2. "What OOSH scripts do you know? Name 3 with their purpose."
3. "What is the WODA pattern?"

### Pass Criteria
- Agent knows its role and team (robbinTeam)
- Agent has OOSH framework knowledge (inherited from ud-team)
- Agent can reference WODA, MVC, or other team patterns
- If agent answers like a blank session → FAIL, report to SM

### Corrections
- If agent doesn't know team name: correct to robbinTeam
- If agent doesn't know project: correct to Web4RawBin (Robbin AI server management)
- If agent has no inherited knowledge: task 1.2 failed, escalate to SM
