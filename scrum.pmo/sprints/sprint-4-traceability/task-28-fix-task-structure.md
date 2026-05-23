[Back to Sprint 4 Planning](./planning.md)

# T28: Fix All Task Files — Web4Articles Template Compliance

[task:uuid:a28f0e01-4c5d-4a3b-8e7f-001122334455]

## Status
**Status:** PLANNED
**Assigned:** robbin-expert
**Effort:** 3h expert
**Created:** 2026-05-23

## Traceability
- up
  - [Sprint 4 Planning](./planning.md)
- down
  - None (atomic task)

## Goal

Bring all 33 task files across Sprints 1-4 into compliance with the Web4Articles template pattern. The audit (T23-T25) found the structural debt; this task fixes it.

## What Web4Articles Requires (learned from reference implementation)

Every task file must have these sections in order:

```markdown
[Back to Sprint X Planning](./planning.md)

# Task N: Title

[task:uuid:XXXXXXXX-XXXX-4XXX-8XXX-XXXXXXXXXXXX]

## Status
- [x] Planned
- [x] In Progress
- [x] Done

**Assigned:** role
**Effort:** Xh estimated, Yh actual
**Created:** YYYY-MM-DD
**Completed:** YYYY-MM-DD
**Dependencies:** [Task M](./task-M-name.md)

## Traceability
- up
  - [Sprint X Planning](./planning.md)
- down
  - [Task N.1: Name](./task-N.1-name.md)

## Goal
[Single paragraph]

## Requirements
[Numbered subtasks]

## Acceptance Criteria
- [x] Criterion (checked for DONE tasks)

## Subtasks
None (atomic task for this sprint).
```

## Changes Required Per Task File

For each of the 33 DONE task files:

1. **Add UUID** — generate `[task:uuid:...]` line below the title. Use `uuidgen` or `crypto.randomUUID()`.

2. **Convert Status field** — change `**Status:** DONE` to:
   ```
   ## Status
   - [x] Planned
   - [x] In Progress
   - [x] Done
   ```

3. **Add Created/Completed dates** — use git log to find first commit mentioning the task for Created, last commit for Completed.

4. **Add Traceability section** — `up` links to planning.md, `down` links to subtasks or "None".

5. **Add Subtasks section** — list subtask files if they exist, otherwise "None (atomic task)".

6. **Ensure AC boxes checked** — already done in batch (T27 sprint sync).

## Files to Fix

All files matching `scrum.pmo/sprints/sprint-*/task-*.md` (33 files).

Sprint 1: task-1 through task-6 + task-2-definition + task-3.4
Sprint 2: task-7 through task-12 + task-7.0
Sprint 3: task-13 through task-22
Sprint 4: task-23 through task-27

## Acceptance Criteria
- [ ] Every task file has a UUID tag
- [ ] Every task file has hierarchical Status checklist (not flat field)
- [ ] Every task file has Created + Completed dates
- [ ] Every task file has Traceability up/down section
- [ ] Every task file has Subtasks section (even if "None")
- [ ] Zero structural differences between any two task files

## Subtasks
None (atomic task for this sprint).
