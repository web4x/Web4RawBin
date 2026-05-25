[Back to README](../../README.md)

# Sprint 11 Planning — Traceability Standardization

## Sprint Goal
Bring RawBin's scrum.pmo up to the Web4Articles planning standard: every task
file carries the full forward-traceability chain **requirement → use case →
PUML → class/method**, anchored by its existing `task:uuid`. Done in deliberate,
QA-gated batches — NOT ad-hoc inline edits to signed-off sprints.

## Why This Sprint (Tron directive 2026-05-25)
Adopt the Web4Articles planning standard
(`/Users/Shared/Workspaces/2cuGitHub/Web4Articles/scrum.pmo/sprints/`). Future
tasks use the upgraded template immediately; existing tasks are remediated here
as tracked, reviewed work so closed/QA-approved sprints are touched deliberately
(auditable, Tron-gated), never by silent inline churn.

## Baseline Gap Analysis (planner, 2026-05-25)
89 task files across 10 sprints. Current coverage:

| Chain link | Coverage | Note |
|------------|----------|------|
| `task:uuid` tag | 89/89 ✅ | already complete — not the gap |
| → requirements.md link | 20/89 | only Sprints 8,9 have requirements.md |
| → use case (UC-) | 19/89 | |
| → PUML / diagrams | 6/89 | only 4 sprints have diagrams/ |
| → class/method (src .ts) | 15/89 | |

The gap is the **forward chain depth**, not UUIDs. Sprints 1,3,4,5,6,10 lack a
requirements.md entirely.

## Web4Articles Standard (reference)
- `[task:uuid:...]` immediately under the title (RawBin: ✅ present)
- Hierarchical Status checklist (RawBin: ✅ in use)
- Traceability: up / down + **forward chain** req→usecase→puml→class/method with UUIDs
- Intention (Why / Problems / How), Dependencies (Requires / Enables), Definition of Done
- Template adopted at `scrum.pmo/templates/task-template.md` (upgraded 2026-05-25)

## Task List

- [ ] [T84: Adopt Web4Articles task template + traceability conventions doc](./task-84-adopt-template.md)
  **Status:** PLANNED · **Owner:** planner + req-eng
  - Upgraded `task-template.md` (done — Web4Articles-aligned, hierarchical Status, forward chain)
  - Write `scrum.pmo/traceability-standard.md` defining the req→usecase→puml→class/method convention + UUID anchoring
  - Future tasks use this template; this task is the foundation for T85-T89

- [ ] [T85: Traceability index — map all 89 tasks to chain coverage](./task-85-traceability-index.md)
  **Status:** PLANNED · **Owner:** planner + req-eng
  - Produce `scrum.pmo/traceability-matrix.md`: per-task req/usecase/puml/class-method presence
  - Identify which sprints need requirements.md / use-case / PUML backfill
  - Output drives the batch order of T86-T88

- [ ] [T86: Batch 1 — active sprints (8, 9, 10) full chain](./task-86-batch-active.md)
  **Status:** PLANNED · **Owner:** req-eng (chain), planner (links)
  - Sprints 8,9 already have requirements.md + diagrams — wire each task's forward chain
  - Sprint 10: author requirements.md + use cases, link T81-T83 to PUML + class/method
  - QA-gated: Tron reviews before Done

- [ ] [T87: Batch 2 — Sprints 5-7 chain backfill](./task-87-batch-mid.md)
  **Status:** PLANNED · **Owner:** req-eng (chain), planner (links)
  - Sprints 5,6,7 — backfill requirements.md/use cases where missing, link PUML + code
  - DELIBERATE: these are closed/QA'd — changes tracked here, reviewed, not inline churn

- [ ] [T88: Batch 3 — Sprints 1-4 chain backfill](./task-88-batch-foundation.md)
  **Status:** PLANNED · **Owner:** req-eng (chain), planner (links)
  - Oldest sprints — retroactively author requirements.md + use-case stubs as tracked work
  - Reconcile the deferred Sprint 1 duplicate task-2 files as part of this batch
  - Highest risk (signed-off) — smallest sub-batches, Tron-gated per sprint

- [ ] [T89: Traceability verification + audit gate](./task-89-traceability-verify.md)
  **Status:** PLANNED · **Owner:** tester + planner
  - Add a chain-resolution check: every task's req→usecase→puml→class/method links resolve
  - Extend (or wrap) the `sprint audit` to flag broken/missing chain links
  - Target: 89/89 tasks chain-complete

## Dependency Graph
```
T84 (template + standard doc) ─→ T85 (index/matrix) ─┬─→ T86 (batch active 8-10)
                                                      ├─→ T87 (batch mid 5-7)
                                                      └─→ T88 (batch foundation 1-4)
                                                              │
                                          T89 (verify) ←──────┘
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6 (T84-T89) |
| Tron QA-approved (Done) | 0/6 |
| Planned | 6 |
| Scope | 89 existing task files, 10 sprints |

## Definition of Done
- [ ] Web4Articles-aligned task-template.md adopted for future tasks (T84)
- [ ] traceability-standard.md + traceability-matrix.md published (T84, T85)
- [ ] All 89 tasks carry req→usecase→puml→class/method chain (T86-T88)
- [ ] Chain-resolution audit passes 89/89 (T89)
- [ ] No closed/QA sprint rewritten inline — all via tracked, Tron-gated batches
- [ ] Sprint 1 duplicate task-2 reconciled (in T88)

## Guardrails (Tron directive)
- FUTURE tasks: use upgraded template immediately
- CLOSED/QA tasks: remediate ONLY through T86-T88 batches, reviewed + Tron-gated
- Never silent inline edits to signed-off sprints
- QA Review + Done remain Tron's gate

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Req-eng:** robbin-req (robbinTeam:1.1)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-25
**Sprint:** Sprint 11 — Traceability Standardization
