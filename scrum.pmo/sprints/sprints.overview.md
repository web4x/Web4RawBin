[Back to README](../../README.md)

# RawBin — Sprints Overview

🏆 **[Team Achievements](../achievements.md)** — milestones recognized by Tron (v0.6.0 "best version ever").

Durable index of ALL sprints. Maintained by robbin-planner: every new sprint MUST
be added here AND to the README sprint list in the same commit it is created.

Status legend: **Done** = all tasks Tron QA-approved · **active** = in flight
(impl/test/QA) · **planned** = not yet started.

---

## 📌 CURRENT SPRINT — WIP=1 (Tron process directive 2026-06-14)

**Exactly ONE feature driven end-to-end (req→uc→class→method→impl→test→DELIVERED). REPLACED only when DELIVERED via version bump (patch + sw.js cache + git tag). No parallel batch — everything else is PAUSED.**

### ▶ CURRENT TASK: "Drawer/trace DETAIL works end-to-end" → target v0.6.23

The thing Tron keeps screenshotting broken. ONE focused feature, full chain to DELIVERED:
- **BUG8 + BUG10** — collection-renders-children (BOTH surfaces: /trace tree + in-room drawer)
- **BUG9** — leaf-renders-detail
- **BUG11** — URL-actions-work (HIGH regression)
- **ALSO completes the RbDetailDrawer champagne chains** (same methods: handleDragResize / renderFilePreview / openForRef / close — genuine impl+test). Task unit 3c7d1853.

**DELIVERY GATE:** works end-to-end (Tron screenshot OK) **AND** v0.6.23 shipped (patch bump + sw.js cache + git tag) → only THEN replace with the next CURRENT TASK.

**PAUSED until this delivers** (NOT driven): 6-item queue (Q1–Q5 / the rest of BUG set beyond 8-11), standalone champagne climb (folds into THIS), all other forward work. WIP=1 strict.

**Owner pipeline:** architect (UC/chain — done for champagne part) → expert (impl + bug fixes) → tester (E2E + screenshot) → planner (det-3x champagne closes + delivery-gate verify: version+sw.js+tag).

---

<!-- GENERATED-INDEX:BEGIN -->
## 📌 Sprint pointers (generated — R37.1 pin + R37.5 rollup)
- **current:** ⚠️ UNRESOLVED — pin ambiguous — R37.1/R40.17 FAIL-LOUD (INV-C1-4): 5 Active sprints [21, 20, 40, 19, 25] and NO owner designation — ambiguous current, never silent-pick. Designate the current sprint, or resolve checklists to one In-Progress. (pending sprint closure: Tron A1 sign-off + A2 dispositions)

| # | Sprint | Status |
|---|--------|--------|
| 1 | Rawbin Foundation | frozen-legacy (excluded from gate) |
| 2 | Identity & SSH | frozen-legacy (excluded from gate) |
| 3 | E2E Hardening | frozen-legacy (excluded from gate) |
| 4 | Traceability | frozen-legacy (excluded from gate) |
| 5 | PWA & Offline | frozen-legacy (excluded from gate) |
| 6 | Web Components | frozen-legacy (excluded from gate) |
| 7 | Encrypted Storage | frozen-legacy (excluded from gate) |
| 8 | Monaco Editor | frozen-legacy (excluded from gate) |
| 9 | Room Identity | frozen-legacy (excluded from gate) |
| 10 | Sprint 10 — Contacts Ui | frozen-legacy (excluded from gate) |
| 11 | Sprint 11 — Traceability | frozen-legacy (excluded from gate) |
| 12 | Sprint 12 — Editor Fixes | frozen-legacy (excluded from gate) |
| 13 | Sprint 13 — Stability | frozen-legacy (excluded from gate) |
| 14 | Sprint 14 — Legacy Migration | frozen-legacy (excluded from gate) |
| 15 | Sprint 15 — Traceability Browser | frozen-legacy (excluded from gate) |
| 16 | Sprint 16 — Traceability Ux | frozen-legacy (excluded from gate) |
| 17 | Sprint 17 — Scenario Units | frozen-legacy (excluded from gate) |
| 18 | Sprint 18 — Chain Method-Scope & Role Skills | frozen-legacy (excluded from gate) |
| 19 | Sprint 19 — Room Handling | Active |
| 20 | Sprint 20 — Radical Forward Planning (Traceability-First) | Active |
| 21 | Sprint 21 — Contact Identity | Active |
| 22 | Sprint 22 — Traceability View Fixes | Closed |
| 23 | Sprint 23 — Media Preview | Closed |
| 24 | Sprint 24 — Traceability Skills | Closed |
| 25 | Sprint 25 — Apple DnD | Active |
| 26 | Sprint 26 — RawBin Federation | QA-pending |
| 27 | Sprint 27 — Detail View Enhancements | Closed |
| 28 | Sprint 28 — Graph-Integrity Foundation | Planned |
| 29 | Sprint 29 — Server & Dev Lifecycle | Planned |
| 30 | Sprint 30 — Traceability Improvement | QA-pending |
| 31 | Sprint 31 - Server Manager | QA-pending |
| 32 | Sprint 32 — MDA Model-Driven Code Quality | QA-pending |
| 33 | Sprint 33 — MDA v4 MOF-layered tree | Closed |
| 34 | MDA-tree refine (retain-protect-tweak the S33 achievement) | Closed |
| 35 | Buttons->Actions + Universal On-Disk Scenarios | Closed |
| 36 | Unify Traceability Units with the M2 UML/TS Model | Closed |
| 37 | Sprint 37: Consistency by Construction | QA-pending |
| 40 | Server Manager — deployment-node model + mobile input control | Active |

**FROZEN-LEGACY** (excluded from the consistency gate — Tron-bounded scope, [[no silent caps]]):
- sprints S01–S18 (needs-backfill ancient set, FROZEN not backfilled): S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18
- design-doc planning.md (hand-authored): S01, S02, S03, S04, S05, S06, S07, S08, S09
<!-- GENERATED-INDEX:END -->

**Task numbering:** global sequential. T1-T80 (S1-9), T81-83 (S10), T84 (S12),
T85-90 (S11), T91-95 (S13), T96-99 (S14), T100 (S13), T101-108 (S15), T109 (S13), T110-117 (S16), T118 (S13), T119 (S11), T120-123 (S16), T124-129 (S17 parents — sub-tasks T124.1+ allocated at refinement time), T130 (S13), T131-T186 (S17 follow-ons + extensions), T187-T190 (S18). Next new task = **T191**.

**Traceability & Standards:** [traceability matrix](../traceability-matrix.md)
(req→uc→puml→method→test index) · [standard](../standards/traceability-standard.md) ·
audits [S1](../standards/sprint-01-traceability-audit.md) /
[S2-9](../standards/sprints-2-9-traceability-audit.md) ·
[task template](../templates/task-template.md) · [backlog](../backlog.md)

---
**Maintained by:** robbin-planner (robbinTeam:1.0)
**Updated:** 2026-05-26
