[Back to README](../../README.md)

# RawBin — Sprints Overview

Durable index of ALL sprints. Maintained by robbin-planner: every new sprint MUST
be added here AND to the README sprint list in the same commit it is created.

Status legend: **Done** = all tasks Tron QA-approved · **active** = in flight
(impl/test/QA) · **planned** = not yet started.

| # | Sprint | Status | Tasks | Planning |
|---|--------|--------|-------|----------|
| 1 | Foundation | Done | 11 | [planning](./sprint-1-rawbin-foundation/planning.md) |
| 2 | Identity & SSH | Done | 7 | [planning](./sprint-2-identity-ssh/planning.md) |
| 3 | E2E & Hardening | Done | 10 | [planning](./sprint-3-e2e-hardening/planning.md) |
| 4 | Traceability | Done | 8 | [planning](./sprint-4-traceability/planning.md) |
| 5 | PWA & Offline | Done | 8 | [planning](./sprint-5-pwa-offline/planning.md) |
| 6 | Web Components | Done | 8 | [planning](./sprint-6-web-components/planning.md) |
| 7 | Encrypted Storage | Done | 13 | [planning](./sprint-7-encrypted-storage/planning.md) |
| 8 | Monaco Editor | Done (Tron QA) | 14 | [planning](./sprint-8-monaco-editor/planning.md) |
| 9 | Room Identity | T74-77,79,80 Tron QA Done; T78 tested→awaiting Tron QA | 7 | [planning](./sprint-9-room-identity/planning.md) |
| 10 | Contacts UI | active — T81/82/83 tested, awaiting Tron QA | 3 | [planning](./sprint-10-contacts-ui/planning.md) |
| 11 | Traceability Standardization | active — T85/86 impl-done; T87-90 planned (S1-9 remediation); T119 planned (test-traceability retrofit, Tron 2026-05-29) | 7 | [planning](./sprint-11-traceability/planning.md) |
| 12 | Editor Fixes | active — T84 tested, awaiting Tron QA | 1 | [planning](./sprint-12-editor-fixes/planning.md) |
| 13 | Stability | active — 7 (T91-95,T100,T109) 🧪 awaiting Tron QA; T118 ✅ 317f41a (E2E cleanup); T130 ✅ 8539d57 v0.5.27 (md-preview MD_CSS nested-list rules) | 9 | [planning](./sprint-13-stability/planning.md) |
| 14 | Legacy Data Migration | ✅ migration complete — T96/97 migrated, T98 verify PASS, T99 gate-cleared + EXECUTED (legacy removed v0.5.19); regression+Tron QA pending | 4 | [planning](./sprint-14-legacy-migration/planning.md) |
| 15 | Traceability Browser & Object Model | active — all 8 impl-complete (v0.5.18); T101/102/103/105/106 tested→Tron QA; T104/107/108 testing | 8 | [planning](./sprint-15-traceability-browser/planning.md) |
| 16 | Traceability UX & DetailViews | active — Phase 1-3 all 8 ✅ (T110-117, v0.5.23+bdb74ec); Phase 4: T120/T122 ✅ (50d20be v0.5.25), T123 ✅ (2a28dd3 v0.5.26 pageNav sticky), T121 🔧 (Phase 2 C2a/C2b done, C1/C3/C5/C6/C7 pending) | 12 | [planning](./sprint-16-traceability-ux/planning.md) |
| 17 | Scenario Units / IOR Data Model & Class Views | active — 29 🧪 tester-verified (Tron QA batch ready, see scrum.pmo/tron-qa-batch-2026-06-05.md); T180 Track 1 awaits Tron DNS; T184/T185/T186 closed in-scope | 60+ | [planning](./sprint-17-scenario-units/planning.md) |
| 18 | Chain method-scope & role skills | planned — DOGFOOD: Sprint+Task units born as scenario.json FIRST (T188); chain-narrowing at Class→Method via UC.method singular IOR (T187); role SKILL.md co-spec from precedence Rules 1-11 (T189). JOINT architect+req+planner per Tron 2026-06-05. | 3 + sub | [planning](./sprint-18-chain-method-scope/planning.md) |

**Task numbering:** global sequential. T1-T80 (S1-9), T81-83 (S10), T84 (S12),
T85-90 (S11), T91-95 (S13), T96-99 (S14), T100 (S13), T101-108 (S15), T109 (S13), T110-117 (S16), T118 (S13), T119 (S11), T120-123 (S16), T124-129 (S17 parents — sub-tasks T124.1+ allocated at refinement time), T130 (S13), T131-T186 (S17 follow-ons + extensions), T187-T189 (S18). Next new task = **T190**.

**Traceability & Standards:** [traceability matrix](../traceability-matrix.md)
(req→uc→puml→method→test index) · [standard](../standards/traceability-standard.md) ·
audits [S1](../standards/sprint-1-traceability-audit.md) /
[S2-9](../standards/sprints-2-9-traceability-audit.md) ·
[task template](../templates/task-template.md) · [backlog](../backlog.md)

---
**Maintained by:** robbin-planner (robbinTeam:1.0)
**Updated:** 2026-05-26
