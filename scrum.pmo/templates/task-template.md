[Back to Sprint N Planning](./planning.md)

# T<N>: <Task Name>

[task:uuid:<generate-uuid-v4>]

<!--
  Web4Articles-aligned task template — adopted 2026-05-25 (Sprint 11 standard).
  Reference: /Users/Shared/Workspaces/2cuGitHub/Web4Articles/scrum.pmo/sprints/
  For FUTURE tasks. Closed/QA-approved tasks are remediated via Sprint 11, not inline.
-->

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only. Never checked by planner/sync — only
> after an explicit "Sprint N / T<N> QA approved by Tron" commit. Roles check
> their own refinement/test/impl/testing boxes as work genuinely completes.

## Traceability

`[task:uuid:<same-uuid-as-title>]`

- up
  - [Sprint N Planning](./planning.md)
  - <link to requirement / Tron directive that motivates this task>
- down
  - <subtask links, or "None (atomic task)">
- chain (req → usecase → puml → class/method) — the Web4Articles forward chain
  - **requirement:** [requirements.md#<anchor>](./requirements.md) (or Tron directive)
  - **use case:** UC-<id> in [requirements.md](./requirements.md)
  - **puml:** [diagrams/<name>.puml](./diagrams/<name>.puml) → `.svg`
  - **class/method:** `src/.../<File>.ts` → `Class.method()`
- changes / supersedes
  - <link to any task whose AC this task modifies, both directions; else omit>

## Task Description

What to implement, with file paths + line refs and before/after snippets for
non-obvious changes.

## Context

The originating Tron directive (quote literally) and surrounding situation.

## Intention

### Why this task exists
1. ...

### Problems this task solves
- ...

### How it solves them
- ...

## Acceptance Criteria
- [ ] AC1 — testable, specific
- [ ] AC2
- [ ] `npm run build` succeeds
- [ ] All tests pass (no regression)
- [ ] Version bumped + sw.js cache (if user-facing — PWA update detection)

## Test Scenarios

File: `test/vitest/<module>.test.ts` and/or `test/e2e/<name>.spec.ts`

| Test | Action | Expected |
|------|--------|----------|
| TS1 | ... | ... |

## Dependencies
- **Requires:** T<N> (<why it blocks>) | None
- **Enables:** T<N> (<what it unblocks>) | None

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Traceability chain (req→usecase→puml→class/method) complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## Commits
- `<short-hash>` <one-line description>

## QA Audit & User Feedback
- <date>: <Tron feedback / QA notes>

## Subtasks
None (atomic task). | <subtask list>

---

*Sprint N — <Sprint Name>*
*Owner: <role> (implement), <role> (verify)*
*Priority: <N> (<LEVEL — reason>)*
