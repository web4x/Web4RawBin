<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T140: Source-Location IOR for UC/Class/Method Scenario Units

[task:uuid:5d028db6-c18f-410b-b83a-1d0136531f55]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only.

## Traceability

`[task:uuid:5d028db6-c18f-410b-b83a-1d0136531f55]`

- up
  - [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921](./requirements.md) — R17.24: UC/Class/Method carries exact source location + git anchor
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) — 3rd extension, verbatim
- down
  - None (atomic task)
- chain
  - **requirement:** R17.24 in [requirements.md](./requirements.md)
  - **use case:** scenario.trackSourceLocation (architect to add to use case diagram)
  - **class/method:** scenario.json `model.source` field — new IOR structure

## Task Description

**R17.24** mandates that every UseCase, Class, and Method scenario unit's `model` MUST track the exact source location with git-commit anchoring. This enables point-in-time-precise traceability that survives refactors.

### Source-Location IOR Structure

Each UC/Class/Method unit's `model` gains a `source` field:

```json
{
  "ior": "ior:scenario:uuid:<uuid>",
  "model": {
    "name": "room.create",
    "type": "UseCase",
    "source": {
      "file": "scrum.pmo/sprints/sprint-9-room-identity/diagrams/use-cases.puml",
      "lines": [42, 55],
      "commit": "9bf3363",
      "repo": "web4x/Web4RawBin",
      "ior": "ior:file:scrum.pmo/sprints/sprint-9-room-identity/diagrams/use-cases.puml?commit=9bf3363&lines=42-55"
    }
  },
  "ownerIor": "ior:scenario:uuid:<sprint-uuid>"
}
```

### Source Types by Scenario Class

| Class | Source file type | Location method |
|-------|-----------------|-----------------|
| UseCase | `.puml` (use case diagram) | Line range of `usecase "..." as UC_X` block |
| Class | `.puml` (class diagram) or `.ts` (source) | Line range of `class "..." { }` block or TypeScript class declaration |
| Method | `.ts` (source code) | Line range of function/method declaration |
| Requirement | `.md` (requirements.md) | Line of `[requirement:uuid:]` tag |
| Task | `.md` (task file) | Whole file (line 1 to EOF) |

### Git Anchor

The `commit` field is the short SHA of the git commit at which the source location was recorded. This pins the file content — even if the file is later refactored, the commit resolves to the exact version where the UC/class/method was at lines X-Y.

**Capture method:** `git log --format=%h -1 -- <file>` gives the latest commit that touched the file.

### IOR Format

`ior:file:<path>?commit=<sha>&lines=<start>-<end>`

- `path`: relative to repo root
- `commit`: short SHA (7+ chars)
- `lines`: 1-indexed, inclusive range

## Acceptance Criteria

- [ ] AC1: UseCase scenario units have `model.source` with file path, line range, and git commit
- [ ] AC2: Class scenario units have `model.source` pointing to .ts source or .puml class diagram
- [ ] AC3: Method scenario units have `model.source` pointing to .ts method declaration with line range
- [ ] AC4: `model.source.ior` follows `ior:file:<path>?commit=<sha>&lines=<start>-<end>` format
- [ ] AC5: Commit SHA resolves to the correct file version (`git show <sha>:<path>` returns the expected content)
- [ ] AC6: Source locations are populated during scenario migration (T128 extension or new pass)

## Dependencies

- **Requires:** T128 scenario migration (baseline scenario units must exist), T124.3 storage layout
- **Enables:** Full chain resolution with point-in-time precision; git-anchored traceability browser

## QA Audit & User Feedback

- 2026-05-31: Tron 3rd extension directive — "use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file." Verbatim captured from compound-requirement-source.md.

## Subtasks

None (atomic task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views*
*Owner: robbin-architect (refine), robbin-expert (implement), robbin-tester (verify)*
