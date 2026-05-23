# Sprint 4 Planning — Traceability & Planning Tooling

## Sprint Goal
Restore full traceability across all sprint task files. Every task must have correct status, acceptance criteria with checkboxes, completion dates, and consistent formatting. Build a CLI tool (MCP server or OOSH skill) to keep planning in sync automatically.

## Sprint Overview
**Duration:** TBD
**Focus:** Task file audit, template compliance, planning automation
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directive — traceability diverged, must be fixed

## Problem Statement

During Sprints 2-3, the pace of implementation caused planning files to fall behind:
- Task statuses not updated immediately when work completed
- Acceptance criteria checkboxes not checked off
- Completion dates missing
- Sprint totals/metrics stale
- New fixes (T22) created retroactively instead of upfront
- PO implemented code directly (CMM4 violation, learning #35)

## Task List

### Audit & Fix

- [ ] [T23: Task File Audit — Sprint 1](./task-23-audit-sprint-1.md)
  **Status:** PLANNED
  **Effort:** 1h PO (audit only, no code)
  - Verify all 6 task files have correct Status: DONE
  - Check all acceptance criteria checkboxes
  - Add completion dates
  - Verify task file cross-references are valid

- [ ] [T24: Task File Audit — Sprint 2](./task-24-audit-sprint-2.md)
  **Status:** PLANNED
  **Effort:** 1h PO
  - Verify all 7 task files (T7-T12 + T7.0) have correct status
  - Check acceptance criteria, add completion dates
  - Verify PUML diagram references work

- [ ] [T25: Task File Audit — Sprint 3](./task-25-audit-sprint-3.md)
  **Status:** PLANNED
  **Effort:** 1h PO
  - Verify all 10 task files (T13-T22) have correct status
  - T22 was created retroactively — verify it covers all ad-hoc fixes
  - Check T13 E2E results and T17 bug entries

- [ ] [T26: Task Template Standardization](./task-26-templates.md)
  **Status:** PLANNED
  **Effort:** 1h architect
  - Define the canonical task file template with required fields:
    - Status (PLANNED/IN PROGRESS/DONE)
    - Assigned (role)
    - Effort (estimated + actual)
    - Created/Completed dates
    - Dependencies (with links)
    - Acceptance criteria (checkboxes)
    - Commit references
  - Create `scrum.pmo/templates/task-template.md`
  - Create `scrum.pmo/templates/planning-template.md`

### Planning Automation

- [ ] [T27: Sprint CLI Tool](./task-27-sprint-cli.md)
  **Status:** PLANNED
  **Effort:** 4h expert + 1h tester
  - CLI tool or MCP server that PO can invoke to:
    - `sprint status` — scan all task files, report status summary
    - `sprint audit` — find inconsistencies (status mismatches, unchecked criteria, missing dates)
    - `sprint sync` — update planning.md from task file statuses
    - `sprint create <task-name>` — create task from template with next number
    - `sprint done <task-number>` — mark task done, add completion date, update planning
  - Implementation options:
    - **Option A:** OOSH skill (bash script, uses OOSH patterns)
    - **Option B:** Node.js CLI (TypeScript, part of RawBin repo)
    - **Option C:** MCP server (Claude Code tool integration)
  - PO preference: Option C (MCP server) — lets PO invoke from Claude Code session directly
  - Output: JSON for machine consumption, markdown table for human display

## Dependency Graph
```
T23-T25 (Audit) ──→ T26 (Templates) ──→ T27 (CLI Tool)
```

Audit first (understand the mess), then standardize templates, then automate.

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 5 (T23-T27) |
| PO effort | ~3h (audit) |
| Architect effort | ~1h (templates) |
| Expert effort | ~4h (CLI tool) |
| Tester effort | ~1h (CLI tests) |

## Definition of Done
- All task files across Sprints 1-3 have correct status + dates
- Task template exists and is documented
- Sprint CLI tool operational (at least `status` and `audit` commands)
- PO can invoke sprint tool from Claude Code session

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 4 — Traceability & Planning Tooling
