# Task 1.3: Agent-Trainer - Verify Inherited Knowledge
[task:uuid:771a4a9a-e44f-44ef-9200-960ad64fdc55]

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

- up
  - [Task 1: Bootstrap robbinTeam](./task-1-team-bootstrap.md)
- down
  - None

## Task Description

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

## QA Audit & User Feedback

## Subtasks
None (atomic task).

## Subtasks

None (atomic task).
