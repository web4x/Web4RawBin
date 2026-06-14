# T185: PlantUML class diagrams for traceability-tree + scenario-instance architecture (R-X1 + R-X2)
[task:uuid:8dd36103-bbc0-48e6-ad07-f1c56fae923a]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — diagram captured in c11f723a)
  - [ ] creating test cases (tester — render-verify + UUID-resolve checks)
  - [x] implementing (architect — c11f723a; .puml + .svg shipped)
  - [ ] testing (tester — verify PUML renders + every `[class:uuid]` / `[method:uuid]` resolves)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-X1 + R-X2 (req-eng `15dd69c1`; planner fixed fake-suffix uuids → real v4s per learning #17)
  - **R-X1** `[requirement:uuid:7b062e87-7541-4be2-ab0f-dd1f7a7c225f]` — PlantUML class diagram documents the traceability-tree-extends architecture (Tree base + RbObjectItem + RbDetailDrawer; parent/children IOR refs; `[class:uuid]` / `[method:uuid]` annotations)
  - **R-X2** `[requirement:uuid:ec56b884-3aa5-400a-b3e2-1095ffdcbe4a]` — PlantUML class diagram documents scenario-instance classes (ScenarioUnit + IORResolver + ClassRegistry + ViewTemplateRegistry); authoritative PUML source for UC→Class→Method chain
- follows
  - T175 (Tree base / parent+children getters — diagrammed) · T124.6 (UseCase/Class/Method as first-class PUML instances) · T117 (PUML pattern)
- down
  - None (atomic task — single PUML deliverable + rendered SVG)
- related
  - T178 (KEYSTONE 44/44 — uses the [class:uuid] / [method:uuid] annotations from this PUML to feed UC→Class→Method chain)

## Acceptance Criteria

**R-X1 — traceability-tree PUML:**
- [x] AC1 — `.puml` exists at `diagrams/s17-architecture.puml` showing Tree base + RbObjectItem + RbDetailDrawer (architect-shipped c11f723a)
- [x] AC2 — Parent/children IOR references diagrammed (T175 getter pattern) (architect-shipped)
- [ ] AC3 — Tester verifies every `[class:uuid]` / `[method:uuid]` annotation on Tree/RbObjectItem/RbDetailDrawer resolves to a real scenario unit

**R-X2 — scenario-instance PUML:**
- [x] AC4 — Same `.puml` shows ScenarioUnit + IORResolver + ClassRegistry + ViewTemplateRegistry (architect-shipped c11f723a)
- [x] AC5 — Each class + method element carries `[class:uuid]` / `[method:uuid]` annotation (architect-shipped)
- [ ] AC6 — Tester verifies the annotated UUIDs match scenario-index entries (authoritative UC→Class→Method chain source)

**Render + ship rules:**
- [x] AC7 — Rendered SVG exists at `diagrams/s17-architecture.svg` (architect-shipped)
- [ ] AC8 — Tester confirms SVG opens cleanly in the project's markdown viewer
- [ ] AC9 — Rule-pair: **EXEMPT** per learning #24 — documentation-only deliverable, no `src/` change, no user-facing surface bump (architect's c11f723a touched only `diagrams/`); no version/sw.js bumps required.

## QA Audit & User Feedback

- 2026-06-05: req-eng `15dd69c1` captured R-X1 + R-X2 in compound-requirement-source-2.md (with fake-suffix uuids — planner-replaced with real v4 per learning #17; req-uuids R-X1 `7b062e87-…`, R-X2 `ec56b884-…`).
- 2026-06-05: Architect `c11f723a` shipped `s17-architecture.puml` (311 lines) + rendered `s17-architecture.svg` covering both R-X1 (tree-extends) and R-X2 (scenario-instance) in one diagram. Annotations feed the UC→Class→Method chain that T178 KEYSTONE consumed for 44/44 reachability.
- 2026-06-05: PO direction — stand up T185 retroactively; mark code-complete (✅); tester verifies PUML renders + UUIDs resolve.
- Pending: tester verification (AC3, AC6, AC8); then Tron QA. Rule-pair EXEMPT per learning #24 (documentation deliverable).

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 41 — R-X (traceability + scenario architecture PUML)
**Priority:** MEDIUM (already shipped; tester verification gates Tron QA)
**Companion:** T175 (Tree base) · T124.6 (PUML first-class) · T178 (KEYSTONE consumer of the annotations)
**Status symbol:** ✅ impl-shipped (architect c11f723a 2026-06-05)

## Subtasks

None (atomic task — one PUML file + rendered SVG).
