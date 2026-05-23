[Back to Task 1](./task-1-team-bootstrap.md)

# Task 1.3: Agent-Trainer - Verify Inherited Knowledge
[task:uuid:d0a6f4e5-1b7c-4c2d-e9f8-6a5b4c3d2e1f]

**Status:** DONE
**Assigned:** agent-trainer
**Dependencies:** T1.2
**Created:** 2026-05-22
**Completed:** 2026-05-22

## Traceability
- up
  - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)
- down
  - None

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

## Subtasks
None (atomic task).
