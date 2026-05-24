[Back to Sprint 4 Planning](./planning.md)

# T30: PO Process Documentation

[task:uuid:c30f0e03-6e7f-4c5d-a091-003344556677]

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
  - [Sprint 4 Planning](./planning.md)
- down
  - None (atomic task)

## Goal

Create `scrum.pmo/roles/PO/process.md` following the Web4Articles pattern. Document the PO's task creation standards, template compliance requirements, and sprint management process so the traceability debt never recurs.

## Requirements

### 30.1 Document the task creation protocol

Based on learnings from Web4Articles `scrum.pmo/roles/PO/process.md`:
- Task file must exist BEFORE any implementation
- Every task gets a UUID at creation time
- Acceptance criteria must be specific and testable
- Status uses hierarchical checklist format
- Traceability up/down is mandatory

### 30.2 Document the sprint management process

- Planning.md created before sprint starts
- Tasks linked in planning.md with checkboxes
- Task status updated same turn as completion (not retroactively)
- Sprint tool (`sprint status/audit/sync`) run before reporting to Tron
- Sprint tool (`sprint done N`) used to close tasks (not manual editing)

### 30.3 Document the CMM4 violations to avoid

From robbin-po learnings:
- #35: PO never implements — always delegates
- Task file first — never relay via chat
- Sprint tool for consistency — never manual status edits

## Acceptance Criteria
- [x] scrum.pmo/roles/PO/process.md exists
- [x] Covers task creation, sprint management, CMM4 rules
- [x] References Web4Articles as canonical source
- [x] References the OOSH sprint tool methods

## QA Audit & User Feedback

## Subtasks
None (atomic task for this sprint).
