<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T164: Re-migrate dirty model.name + firstLine() fallback hardening

[task:uuid:e8c788c8-e085-4960-bad6-9a991af37d14]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - Follow-on to T161 (speaky names) + T163 (title source switch)
- down
  - None (atomic)
- follows
  - [T161](./task-161-requirement-name-renders-tron-quote-not-speaky.md) — `737c841` v0.5.57
  - [T163](./task-163-api-trace-title-source-switch.md) — `f138aa0` v0.5.61

## Task Description

Re-migrate dirty model.name values and harden the firstLine() fallback.

## Context

T163 switched `/api/trace` to read `model.name` from scenario index. But 9 scenarios still have dirty `model.name` values — the migration parser (`scripts/migrate-to-scenario.ts`) stored raw MD heading text into `model.name`.

### Dirty Inventory (9 scenarios)

| UUID (short) | Current dirty model.name | Expected clean name |
|---|---|---|
| d4e5...0010 | `## Navigation & Traceability (original directive)` | `Navigation and traceability` |
| d4e5...0013 | `## Migration (original directive)` | `Migration` |
| d4e5...0014 | `## Process (original directive)` | `Process` |
| d4e5...0003 | `## Storage Layout (original directive)` | `Storage layout` |
| d4e5...0006 | `## Views & Templates (original directive)` | `Views and templates` |
| d4e5...0015 | `---` | `REQ-d4e5f6a7` (auto-name from uuid) |
| 9dedeb00 | `## Extension 3 (2026-05-31)` | `Extension 3` |
| 7e4f8a2b | `## Extension 4 (2026-05-31 — traceability is a TREE)` | `Extension 4` |
| dd8709c3 | `## Extension 2 (2026-05-31)` | `Extension 2` |

## Acceptance Criteria

- [ ] AC1 — All 9 dirty scenarios have clean `model.name` (no `##`, no `---`, no `> `)
- [ ] AC2 — `cleanModelName()` handles: `## Heading` → `Heading`, `---` → uuid fallback, `## X (date)` → `X`
- [ ] AC3 — `firstLine()` skips `##`, `---`, `**R` prefixed lines (defensive for any caller)
- [ ] AC4 — Re-migration is idempotent (running twice = same result)
- [ ] AC5 — `/trace` browser shows clean names for all 9 formerly-dirty requirements
- [ ] AC6 — No regression on T161/T163 (speaky names + title source switch)
- [ ] AC7 — Rule-pair (a)+(b): version + CACHE_NAME bump

## QA Audit & User Feedback

- 2026-06-02: PO directed planner stand-up; architect created this file concurrently with a more accurate 9-scenario inventory (vs PO's earlier 3-unit estimate). Planner reconciled per learning #12 — architect's content authoritative, planner fixed the uuid (was non-v4, violated learning #17) and added required Subtasks + QA Audit sections for Web4Articles compliance. Path (b) — 12 unmigrated S10-S16 reqs — remains separate as **T128.2**. Awaiting expert impl → tester verify (target: 9/9 clean + T163 41/41 minus the T128.2 batch) → Tron QA.

## Subtasks

None (atomic task; (a) re-migration script + (c) firstLine() harden land in one commit-set).

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
