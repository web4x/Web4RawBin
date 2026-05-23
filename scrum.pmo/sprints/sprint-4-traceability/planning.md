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

- [x] [T23: Task File Audit — Sprint 1](./task-23-audit-sprint-1.md)
  **Status:** PLANNED
  **Effort:** 1h PO (audit only, no code)
  - Verify all 6 task files have correct Status: DONE
  - Check all acceptance criteria checkboxes
  - Add completion dates
  - Verify task file cross-references are valid

- [x] [T24: Task File Audit — Sprint 2](./task-24-audit-sprint-2.md)
  **Status:** PLANNED
  **Effort:** 1h PO
  - Verify all 7 task files (T7-T12 + T7.0) have correct status
  - Check acceptance criteria, add completion dates
  - Verify PUML diagram references work

- [x] [T25: Task File Audit — Sprint 3](./task-25-audit-sprint-3.md)
  **Status:** PLANNED
  **Effort:** 1h PO
  - Verify all 10 task files (T13-T22) have correct status
  - T22 was created retroactively — verify it covers all ad-hoc fixes
  - Check T13 E2E results and T17 bug entries

- [x] [T26: Task Template Standardization](./task-26-templates.md)
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

- [x] [T27: Sprint CLI Tool](./task-27-sprint-cli.md)
  **Status:** PLANNED
  **Effort:** 4h expert + 1h tester
  - OOSH script `sprint` with standard method dispatch:
    - `sprint status` — scan all task files, report status summary
    - `sprint audit` — find inconsistencies (status mismatches, unchecked criteria, missing dates)
    - `sprint sync` — update planning.md from task file statuses
    - `sprint create <task-name>` — create task from template with next number
    - `sprint done <task-number>` — mark task done, add completion date, update planning
  - OOSH pattern: script file in OOSH framework, uses OOSH method dispatch, logging, config
  - Tron directive: OOSH script, not MCP server — simple, consistent with framework

### Structure Fix & Tool Update (Web4Articles compliance)

- [ ] [T28: Fix All Task Files — Web4Articles Template Compliance](./task-28-fix-task-structure.md)
  **Status:** PLANNED
  **Effort:** 3h expert
  - Add UUID tags, hierarchical Status checklist, Traceability up/down, Subtasks section, Created/Completed dates to all 33 task files

- [ ] [T29: Update OOSH Sprint Tool — Template Enforcement](./task-29-update-sprint-tool.md)
  **Status:** PLANNED
  **Effort:** 2h expert
  - Fix sprint.status (find all tasks), sprint.audit (Web4Articles compliance checks), sprint.create (full template), new sprint.fix (batch structure fix), sprint.done (completion date)

- [ ] [T30: PO Process Documentation](./task-30-po-process-doc.md)
  **Status:** PLANNED
  **Effort:** 1h architect
  - Create scrum.pmo/roles/PO/process.md with task creation protocol, sprint management, CMM4 rules

## Dependency Graph
```
T23-T25 (Audit) ──→ T26 (Templates) ──→ T27 (CLI Tool)
                                          ↓
                    T28 (Fix Files) ←── T29 (Update Tool)
                    T30 (PO Process Doc — independent)
```

Phase 1 (done): audit + templates + initial tool.
Phase 2 (now): fix files + update tool + PO process doc.

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 8 (5 done, 3 planned) |
| PO effort | ~3h (audit — done) |
| Architect effort | ~2h (templates + PO doc) |
| Expert effort | ~9h (CLI tool + fix files + tool update) |
| Tester effort | ~1h (CLI tests — done) |

## Definition of Done
- [x] Audit complete — debt documented
- [x] Task template exists
- [x] Sprint CLI tool operational
- [x] AC boxes checked in all DONE tasks
- [ ] All 33 task files have UUID, Traceability, Subtasks, dates (Web4Articles compliant)
- [ ] Sprint tool enforces Web4Articles template on create/audit/fix
- [ ] PO process documented

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 4 — Traceability & Planning Tooling
