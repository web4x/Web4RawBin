[Back to Sprint 4 Planning](./planning.md)

# T29: Update OOSH Sprint Tool — Template Enforcement

[task:uuid:b29f0e02-5d6e-4b4c-9f80-002233445566]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done


## Traceability
- up
  - [Sprint 4 Planning](./planning.md)
  - [T27: Sprint CLI Tool](./task-27-sprint-cli.md) (original tool)
- down
  - None (atomic task)

## Goal

Update the OOSH sprint tool (`components/OOSH/dev.claude/sprint`, 317 lines) with new methods and fix existing ones based on Web4Articles template compliance.

## Requirements

### 29.1 Fix sprint.status — detect all task files

Current issue: `sprint status sprint-4-traceability` returns 0 tasks. The grep pattern for Status doesn't match `**Status:**` markdown bold format. Fix the pattern to handle both:
- `**Status:** DONE` (RawBin flat format)
- `- [x] Done` (Web4Articles checklist format)

### 29.2 Fix sprint.audit — check Web4Articles compliance

Add checks for:
- Missing UUID tag (`[task:uuid:...]`)
- Missing Traceability section
- Missing Subtasks section
- Missing Created/Completed dates
- Status format (checklist vs flat — warn on flat)

### 29.3 New method: sprint.create — use Web4Articles template

Update `sprint.create` to generate task files with the full Web4Articles template:
- Auto-generate UUID
- Hierarchical Status checklist (unchecked)
- Traceability section with up link to planning.md
- Subtasks section ("None" by default)
- Created date (today)

### 29.4 New method: sprint.fix — batch structure fix

Add `sprint.fix [sprint-name]` that:
- Scans all task files in a sprint
- Adds missing UUID (generates one)
- Converts flat `**Status:** DONE` to checklist format
- Adds missing Traceability section
- Adds missing Subtasks section
- Adds Created/Completed dates from git log
- Reports what was fixed

This is the automated version of T28 — the tool should be able to do what T28 describes.

### 29.5 Fix sprint.done — add completion date

`sprint.done` should:
- Convert Status checklist to all-checked
- Add `**Completed:** YYYY-MM-DD` if missing
- Run sprint.sync

### 29.6 Update sprint.sync — Web4Articles planning format

Sync should handle both planning.md formats:
- `- [ ] [TN: Title](./task-N.md)` (checkbox)
- `- [ ] [TN: Title](./task-N.md) **Status:** DONE` (inline status)

## Acceptance Criteria
- [x] `sprint status` finds all tasks across all sprints (not 0)
- [x] `sprint audit` reports UUID, Traceability, Subtasks, dates compliance
- [x] `sprint create` generates Web4Articles-compliant template
- [x] `sprint fix` batch-fixes structural issues in task files
- [x] `sprint done` adds completion date
- [x] Tool works on RawBin scrum.pmo (SPRINT_PMO_DIR)

## QA Audit & User Feedback

## Subtasks
None (atomic task for this sprint).
