[Back to Sprint N Planning](../sprints/sprint-N-name/planning.md)

# T<N>: <Task Name>

**Status:** PLANNED | IN PROGRESS | DONE
**Assigned:** <role> (implement), <role> (verify)
**Effort:** <estimated>h expert + <estimated>h tester
**Dependencies:** <T-number> (<reason>) | None
**Created:** <YYYY-MM-DD>
**Completed:** <YYYY-MM-DD or empty>

## Goal

One paragraph: what this task achieves and why it matters. Not a requirement list — the motivation.

## Diagrams

_Optional. Include when architecture diagrams exist for this task._

- [Diagram Name](./diagrams/diagram-name.svg) — one-line description

## Requirements

### N.1 <Component>: <Change summary>

Describe what to implement. Include:
- File path and line references where relevant
- Code snippets for non-obvious implementations
- Interface changes with before/after

### N.2 <Component>: <Change summary>

Each requirement numbered as `<task-number>.<sequence>`.

### N.M Tester: Tests

_Required for every task with testable output._

File: `test/vitest/<module>.test.ts`

| Test | Action | Expected |
|------|--------|----------|
| T1 | ... | ... |
| T2 | ... | ... |

## Acceptance Criteria

- [ ] Criterion 1 — testable, specific
- [ ] Criterion 2
- [ ] All tests pass
- [ ] `npm run build` succeeds

## Commits

_Filled during/after implementation. One line per commit._

- `<short-hash>` <one-line description>

---

## Template Field Reference

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| Status | Yes | PLANNED, IN PROGRESS, DONE | Updated by assigned role |
| Assigned | Yes | role (action) | e.g. `robbin-expert (implement), robbin-tester (verify)` |
| Effort | Yes | `Nh role + Nh role` | Estimated at creation. Add actual in parentheses when done: `2h expert (actual: 1.5h)` |
| Dependencies | Yes | `T<N> (<reason>)` or `None` | Link to blocking task with why it blocks |
| Created | Yes | ISO date | Set at task creation |
| Completed | No | ISO date | Set when Status → DONE |
| Diagrams | No | Links to .svg | Only if architect produced diagrams for this task |
| Commits | No | Short hash + description | Filled during implementation |

## Naming Convention

File: `task-<N>-<slug>.md` where:
- `<N>` is the global task number (sequential across all sprints)
- `<slug>` is a kebab-case summary (2-4 words)
- Subtasks: `task-<N>.<sub>-<slug>.md` (e.g. `task-3.4-test-alignment.md`)

Title: `# T<N>: <Human-readable name>` — use `T<N>` prefix, not `Task <N>`.
