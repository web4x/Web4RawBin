[Back to README](../../README.md)

# Sprint 13 Planning — Stability (Core Workflow Fixes)

## Sprint Goal
Fix confirmed bugs in core, already-shipped workflows (Avatar=S7, Rooms=S9,
PWA=S5) and document each as a complete-workflow use case diagram. Single-purpose
stability sprint for cross-feature workflow defects.

## Why This Sprint (Tron directives 2026-05-26)
Tron's real-world use surfaced workflow-level bugs spanning prior sprints. Rather
than reopening closed sprints, collect them here as tracked, standard-compliant
tasks with complete-workflow use case diagrams (architect). All tasks follow the
[traceability standard](../../standards/traceability-standard.md).

## Inputs
- **Requirements:** [requirements.md](./requirements.md) (req-eng — R-A1, R-A2, R-R1, R-V1 with Tron quotes)
- **Diagrams:** [diagrams/](./diagrams/) (architect — complete-workflow use case .puml/.svg)

## Task List

- [ ] [T91: Avatar persistence — must not revert to default](./task-91-avatar-persist.md)
  **Status:** PLANNED · R-A1 · **Owner:** architect (refine), expert (impl), tester (verify)
  - Uploaded avatar must persist across reload/restart/reconnect; default backfill only when no avatar.enc

- [ ] [T92: Avatar upload key-error UX](./task-92-avatar-upload-ux.md)
  **Status:** PLANNED · R-A2 · **Owner:** architect (refine), expert (impl), tester (verify)
  - Upload never surfaces "key not found"; auto-regenerate or friendly retry; log real error

- [ ] [T93: Multi-room lobby listing (load-from-disk)](./task-93-multi-room-lobby.md)
  **Status:** PLANNED · R-R1 · **Owner:** architect (refine), expert (impl), tester (verify)
  - All of a user's rooms load from disk on connect and appear in lobby

- [ ] [T94: PWA update banner fix](./task-94-pwa-update-banner.md)
  **Status:** PLANNED · R-V1 · **CRITICAL** · **Owner:** architect (SW path audit), expert (impl), tester (verify)
  - New version shows update bar → reload picks up new build; architect audits SW update path end-to-end first

## Dependency Graph
```
Independent bug fixes (no inter-task deps):
  T91 (avatar persist) ── R-A1
  T92 (avatar upload UX) ── R-A2
  T93 (multi-room load) ── R-R1
  T94 (PWA update bar) ── R-V1  [CRITICAL — may mask stale-SW root cause]
Each: architect use case diagram → expert impl → tester verify → Tron QA
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 4 (T91-T94) |
| Tron QA-approved (Done) | 0/4 |
| Planned | 4 |
| Use case diagrams | 4 (architect, in diagrams/) |
| Priority | T94 CRITICAL; T91-T93 HIGH |

## Definition of Done
- [ ] All 4 bug sets fixed (T91-T94 acceptance criteria)
- [ ] 4 complete-workflow use case diagrams authored + linked in task chains
- [ ] Version bumped + sw.js cache per task (PWA update reaches device)
- [ ] No regression in Sprints 5/7/9
- [ ] Tron QA approved

## Coordination
- **req-eng:** requirements.md (entries + Tron quotes) — DONE
- **architect:** complete-workflow use case .puml in diagrams/; T94 SW-path audit first
- **planner:** sprint structure, planning↔task consistency, chain links
- Parallel sprints consistent: S10 (contacts), S11 (traceability T85-T90), S12 (editor T84).
  Next new task after this sprint = T95.

---
**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Req-eng:** robbin-req (robbinTeam:1.1)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-26
**Sprint:** Sprint 13 — Stability (Core Workflow Fixes)
