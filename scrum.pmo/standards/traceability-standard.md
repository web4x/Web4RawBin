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

## Source-Location IOR (Sprint 17 — R17.24)

Every UseCase, Class, and Method scenario unit tracks its exact source location with a git-commit anchor. This makes traceability point-in-time-precise and survives refactors.

### IOR Format

```
ior:file:<repo-relative-path>?commit=<short-sha>&lines=<start>-<end>
```

- `path`: relative to repo root (e.g. `scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml`)
- `commit`: short SHA (7+ chars) of the git commit when the location was recorded
- `lines`: 1-indexed, inclusive range (e.g. `42-55`)

### Examples

```
ior:file:scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml?commit=9bf3363&lines=42-55
ior:file:src/ts/server/Room.ts?commit=a7cb624&lines=71-300
ior:file:src/ts/server/server.ts?commit=0663495&lines=838-857
```

### Where Source IORs Live

In the scenario unit's `model.source` field:

```json
{
  "ior": "ior:scenario:uuid:<uuid>",
  "model": {
    "name": "room.create",
    "type": "UseCase",
    "source": {
      "file": "scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml",
      "lines": [42, 55],
      "commit": "9bf3363",
      "repo": "Web4RawBin",
      "ior": "ior:file:scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml?commit=9bf3363&lines=42-55"
    }
  }
}
```

### Source Type by Class

| Scenario Class | Source file type | Location method |
|---------------|-----------------|-----------------|
| UseCase | `.puml` (use case diagram) | Line range of `usecase "..." as UC_X` block |
| Class | `.puml` (class diagram) or `.ts` | Line range of class declaration |
| Method | `.ts` (source code) | Line range of function/method declaration |
| Requirement | `.md` (requirements.md) | Line of `[requirement:uuid:]` tag |
| Task | `.md` (task file) | Whole file (line 1 to EOF) |

### Git Anchor Resolution

To view the exact content at the recorded commit:
```bash
git show <commit>:<path>
```
To extract the specific lines:
```bash
git show <commit>:<path> | sed -n '<start>,<end>p'
```

### Capture at Migration Time

```bash
# Latest commit that touched the file
git log --format=%h -1 -- <path>

# Current HEAD (fallback)
git rev-parse --short HEAD
```

## Chain-Link Icon Convention (Sprint 17 — R17.25 / T141)

Generated MD and HTML views render navigation icons for traceability:

### Icon Placement

```
🔗 ✏️ <Title>
 │   │
 │   └── Edit link → /edit/<path> (Monaco editor)
 └────── Chain link → scenario/sprints.json/<sprint>/<speaking-name>.json
```

The 🔗 chain-link icon appears BEFORE the ✏️ edit icon on every generated view. It links to the symlink in the speaking-name JSON tree (`scenario/sprints.json/`), not the raw UUID index.

### Applies to All 7 Classes

Every generated MD/HTML view template renders the chain-link:
UseCase, Class, Method, Task, Requirement, Sprint, TraceLink.

### Link Target

The chain-link href resolves to:
```
/md/scenario/sprints.json/<sprint-name>/<speaking-name>.json
```
This serves the raw scenario JSON via the existing `/md/` file browser, letting the user inspect the underlying data that generated the view.

## Adoption Plan

- **New sprints (Sprint 10+):** Full compliance — requirements.md, task UUIDs, traceability sections, PlantUML annotations
- **Existing sprints (1-9):** Retrofit during remediation sprint — add requirements.md where missing, verify UUID presence, add missing traceability links
- **Source code:** Add `[impl:uuid:]` comments incrementally as code is touched
- **Tests:** Add `[test:uuid:]` comments incrementally as tests are written/modified
- **Source-location IOR:** Add `model.source` to scenario units during migration (T128) and incrementally as units are created
- **Chain-link icons:** Added to view templates by T141; applies automatically to all generated views thereafter
