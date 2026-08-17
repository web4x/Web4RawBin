<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.26: Sprint/task-name FORMATTER — item shows EXACTLY 'Sprint <n>: <title>' / 'Task <n>.<m>: <title>' everywhere @390 (R40.4-phase-2)

[task:uuid:c8e0b1d2-506e-4474-b649-22f1241f997b]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Build the ONE formatter family (R40.4-phase-2, UC sprintView.displayName a778793d): sprintDisplayName='Sprint <n>: <title>' + taskDisplayName='Task <parent.sprintNumber>.<taskIndex>: <title>' (colon), composed at render on EVERY surface (item name, detail header, generator, task rows), never stored. Make Sprint.number + Task.taskIndex the REQUIRED attributes. Fix the item-view DUP at rb-object-item.ts:188 (drop the ||title fallback that repeats the name). Extend sprint-label.ts + check-sprint-label.ts (no new module); architect wires Class/Method on build-go.

## Context

UC sprintView.displayName a778793d -> R40.4 9a8cbffe. Supersedes phase-1 renderLabel d6cb7ddd (em-dash). Design design-s37-sprint-name-single-source.md (5569f0509).

## Intention

Kill the inconsistent-separator + double-number display Tron screenshotted, by construction.

## Acceptance Criteria

**AC (37.24 shape — browser-visible, real-WebKit @390 PIXEL, never a DOM count):** The item view renders EXACTLY 'Sprint <n>: <title>' (sprints) and 'Task <n>.<m>: <title>' (tasks) via the ONE formatter — verified by SCREENSHOT+PIXEL on real WebKit @390 (NEVER a DOM count); the number appears exactly ONCE (no 'Sprint 33 — Sprint 33 —' doubling), no repeated subtitle (rb-object-item.ts:188 dup fixed). PLUS the 7 stub-must-fail gates: no Sprint.number RED / name /Sprint\d+/ RED / name /Task\d+\.\d+/ RED / persisted sprintName-on-non-Sprint RED / dir!=model.number RED / display-outside-formatter RED / oi-desc==oi-name RED. Attribute-required: Sprint.number + Task.taskIndex are the sole stored number homes.

## Subtasks
