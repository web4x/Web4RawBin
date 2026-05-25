# RawBin Traceability Standard

**Source:** Tron directive 2026-05-25. Derived from [Web4Articles planning standard](https://github.com/web4x/Web4Articles/tree/main/scrum.pmo/sprints/).
**Author:** robbin-req (requirements engineer)

## Purpose

Every artifact must be traceable from Tron directive → requirement → use case → PlantUML element → class/method → test case. UUID tags are the mechanism. This document defines where each UUID lives and how they cross-reference.

## The Traceability Chain

```
Tron directive (literal quote in task file)
  ↓
[requirement:uuid:<v4>] in requirements.md
  ↓
[task:uuid:<v4>] in task-N.md (or [subtask:uuid:<v4>] in task-N.M.md)
  ↓
PlantUML element (use case / class / sequence participant)
  annotated with [uc:uuid:<v4>] or [class:uuid:<v4>]
  ↓
Source code method / function
  annotated with // [impl:uuid:<v4>] comment
  ↓
Test case
  annotated with // [test:uuid:<v4>] comment
```

## UUID Tag Formats

| Tag | Where it lives | What it identifies |
|-----|---------------|-------------------|
| `[requirement:uuid:<v4>]` | `requirements.md` — inline after requirement text | A single requirement derived from Tron |
| `[task:uuid:<v4>]` | Task file — dedicated line near top, below title | A main task |
| `[subtask:uuid:<v4>]` | Subtask file — dedicated line near top, below title | A subtask of a main task |
| `[uc:uuid:<v4>]` | PlantUML `.puml` file — in use case label or note | A use case in a diagram |
| `[class:uuid:<v4>]` | PlantUML `.puml` file — in class label or note | A class/interface in a diagram |
| `[impl:uuid:<v4>]` | Source `.ts`/`.sh` file — comment on function/method | Implementation of a requirement |
| `[test:uuid:<v4>]` | Test file — comment on test case | Verification of a requirement |

## File Structure Requirements

### requirements.md (per sprint)

Every sprint MUST have a `requirements.md` file listing requirements with UUID tags:

```markdown
[Back to Planning](./planning.md)

# Sprint N — Requirements

- [ ] Requirement description
  [requirement:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]
  > Tron literal quote (if available)
  → [Task N](./task-N-slug.md)
```

Each requirement entry has:
1. Checkbox for completion tracking
2. One-line description
3. `[requirement:uuid:<v4>]` on its own line
4. Optional Tron quote in blockquote
5. Forward link to the implementing task

### Task files

Every task file MUST have:

```markdown
[Back to Sprint N Planning](./planning.md)

# T<N>: Task Name

[task:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [requirement:uuid:xxx](./requirements.md) — requirement text
  - [Sprint N Planning](./planning.md)
- down
  - [T<N>.1: Subtask](./task-N.1-slug.md) (or "None (atomic task)")
- changes
  - [T<M>](./task-M-slug.md) AC<X> — what it changes (if applicable)
```

### Subtask files

Same as task files but use `[subtask:uuid:<v4>]` and traceability `up` links to BOTH the requirement AND the parent task.

### PlantUML diagrams

Use case and class elements should carry UUID annotations:

```plantuml
usecase "room.create\n[uc:uuid:xxx]" as UC1
class "Room\n[class:uuid:xxx]" as Room
```

### Source code

Implementation functions carry a comment with the requirement/task UUID they satisfy:

```typescript
// [impl:uuid:xxx] UC-RM.1 room.create
function createRoom(name: string, creator: RoomMember): Room {
```

### Test files

Test cases carry a comment linking to what they verify:

```typescript
// [test:uuid:xxx] AC1: room creation creates folder
it('creates room directory', () => {
```

## Cross-Reference Rules

1. **Every requirement MUST link forward** to at least one task file
2. **Every task MUST link up** to a requirement (or to planning.md if no formal requirements exist)
3. **Every subtask MUST link up** to both a requirement AND its parent task
4. **PlantUML elements SHOULD carry UUIDs** for elements that map 1:1 to requirements or tasks
5. **Source code implementations SHOULD carry UUIDs** for key functions that implement specific requirements
6. **Test cases SHOULD carry UUIDs** linking to the acceptance criteria they verify

MUST = mandatory for new work. SHOULD = recommended, add during refactoring.

## Bidirectional Verification

To verify the chain is complete, check:

```bash
# All requirements have forward links to tasks
grep "requirement:uuid:" requirements.md | wc -l  # count requirements
grep "→ \[Task" requirements.md | wc -l            # count forward links (should match)

# All tasks have upward links to requirements
grep "requirement:uuid:" task-*.md | wc -l          # should match requirement count

# All PlantUML elements with UUIDs have corresponding tasks
grep "uc:uuid:" diagrams/*.puml | wc -l             # count annotated elements
```

## Naming Conventions (Web4Articles standard)

| Artifact | Convention |
|----------|-----------|
| Sprint directory | `sprint-<N>-<slug>/` |
| Planning file | `planning.md` |
| Requirements file | `requirements.md` |
| Main task file | `task-<N>-<slug>.md` |
| Subtask file | `task-<N>.<M>-<role>-<slug>.md` |
| Diagrams directory | `diagrams/` |
| PlantUML source | `diagrams/<name>.puml` |
| Rendered diagram | `diagrams/<name>.svg` |

## Adoption Plan

- **New sprints (Sprint 10+):** Full compliance — requirements.md, task UUIDs, traceability sections, PlantUML annotations
- **Existing sprints (1-9):** Retrofit during remediation sprint — add requirements.md where missing, verify UUID presence, add missing traceability links
- **Source code:** Add `[impl:uuid:]` comments incrementally as code is touched
- **Tests:** Add `[test:uuid:]` comments incrementally as tests are written/modified
