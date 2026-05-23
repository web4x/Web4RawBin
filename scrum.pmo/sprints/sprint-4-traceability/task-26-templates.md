[Back to Sprint 4 Planning](./planning.md)

# T26: Task Template Standardization

[task:uuid:a8cfeb7d-15a0-461e-bc55-c611d967364b]

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
  - [sprint-4-traceability Planning](./planning.md)
- down
  - None
## Goal

Define canonical templates for task files and sprint planning files, based on patterns extracted from 33 task files across 4 sprints.

## Audit Findings

Reviewed all task files in sprints 1-4. Inconsistencies found:

| Issue | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|-------|----------|----------|----------|----------|
| Effort field name | `Estimated effort` | `Effort` | `Effort` | `Effort` |
| Dependency field | `Depends on` | `Dependencies` | `Dependencies` | `Dependencies` |
| Priority field | Yes | No | No | No |
| Created date | Sometimes | No | No | No |
| Completed date | No | No | No | No |
| Commit references | No | No | No | No |
| Title prefix | `Task N:` | `T<N>:` | `T<N>:` | `T<N>:` |
| Header fields in early tasks | Missing entirely (T1-1.3) | Complete | Complete | Stub only |
| Diagrams section | No | T9/T10/T12 | No | No |

**Decision: Sprint 2 format is canonical.** Most consistent and complete.

## Standardized Fields

### Task File Header (required)

```
```

### Dropped from template

- **Priority:** — removed. Task order in planning.md is the priority.
- **Estimated effort** — renamed to **Effort** (Sprint 2 convention).
- **Depends on** — renamed to **Dependencies** (Sprint 2 convention).

### Added to template

- **Created/Completed dates** — now required.
- **Commits section** — links implementation to task for traceability.
- **Diagrams section** — optional, standardized from Sprint 2 architect pattern.

## Deliverables

| File | Lines | Content |
|------|-------|---------|
| `scrum.pmo/templates/task-template.md` | 72 | Canonical task file with all fields, section reference, naming convention |
| `scrum.pmo/templates/planning-template.md` | 69 | Sprint planning file with all sections, section reference |


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria

- [x] `task-template.md` has all required fields (Status, Assigned, Effort, Dependencies, Created, Completed)
- [x] `task-template.md` has acceptance criteria section with checkboxes
- [x] `task-template.md` has commits section for traceability
- [x] `task-template.md` documents naming convention (file + title)
- [x] `planning-template.md` has sprint overview, task list, dependency graph, totals, DoD
- [x] Both templates include field/section reference tables
- [x] Templates based on audited patterns from 33 existing task files
