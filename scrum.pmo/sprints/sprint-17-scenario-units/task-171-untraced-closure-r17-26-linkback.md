<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T171: Untraced-closure — link 50 untraced + R17.26 link-back to T165/T166 + traceability-matrix refresh (T143-T171)

[task:uuid:75628241-9157-4385-a7f0-f4f7a3142737]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

`[task:uuid:75628241-9157-4385-a7f0-f4f7a3142737]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **PO finding from T169 audit (2026-06-02 via `7ddf64f` v0.5.66):**
    `[requirement:uuid:0dcaa94e-fce8-4312-ba82-05b966fc9b23]`
    > PO DIRECTIVE: T169 metrics pass but 50/296 untraced (17%) + R17.26 'Traceability TREE' has links=0 (T165/T166 implemented it but not linked back). Tron R-F = ZERO untraced. (a) link R17.26 → T165/T166, (b) audit the 50 unreachable + either link them to a req or document why they're orphan-by-design (test fixtures, etc.)
- down
  - None at parent level; architect may split T171.x sub-tasks per category (e.g. T171.a R17.26 link-back; T171.b test-fixture allowlist; T171.c real-orphan links)
- follows
  - [T169: data-quality audit + remigrate (KEYSTONE)](./task-169-data-quality-audit-remigrate-complete-tree.md) — supplies the audit that surfaced these gaps; T171 closes them so T169 testing completes with 0 untraced
  - [T168: chain order 7-step + atomic requirements as tree ROOTS](./task-168-chain-order-7-step-requirements-as-roots.md) — canonical chain that T171 must satisfy for every closed unit
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — implements R17.26 (downstream); T171 wires R17.26 ← T165
  - [T166: /api/trace populate Class + Method from scenario index](./task-166-api-trace-populate-class-method-from-scenario-index.md) — implements R17.26 (downstream); T171 wires R17.26 ← T166
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168) — architect fills on refinement
  - **requirement:** PO finding from T169 audit (above)
  - **use case:** UC-TBD (architect — likely `audit.linkback` / `audit.allowlist` / `migration.orphanClose`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** scenario-index updates (link IORs to req); allowlist registry (if introduced); audit-aware exemption logic — TBD
  - **implementation:** TBD
  - **test:** T169 audit re-run + R17.26 walkDown reach T165/T166 — TBD

## Task Description

Close the untraced gap: link the ~50 untraced units, wire R17.26 back to T165/T166, and refresh the traceability matrix for T143-T171.

## Context

T169 KEYSTONE shipped `7ddf64f` v0.5.66 — audit tooling + remigration. PO ran
the audit; **mechanics pass** but the data has two distinct gaps:

1. **50/296 scenarios untraced (17%).** Some are likely intentional (test
   fixtures, exemplars, scaffolding); some are real orphans the migration
   missed. Tron R-F demands **ZERO untraced**, so both categories must be
   resolved: real orphans → linked; intentional orphans → documented as
   orphan-by-design (with a category-level requirement justifying their
   existence + an accepted-orphan registry the audit honors).

2. **R17.26 "Traceability TREE" has links=0.** T165 (tree renders all 7
   classes) and T166 (Class+Method overlay) implement R17.26 in code, but
   no scenario unit links back from R17.26 → T165 / T166. The forward-only
   rule applies (R17.26 declares the task IORs forward; T165/T166 don't
   need back-refs).

T171 closes both.

## Intention

### Why this task exists
PO 2026-06-02: "Tron R-F = ZERO untraced." T169 found the gap; T171 closes it.

### Problems this task solves
- 50 scenarios that don't reach a requirement root via the canonical chain
- R17.26 has no forward task links despite being implemented by T165/T166
- T169 testing can't close until audit re-runs with 0 untraced

### How it solves them
- Architect categorizes the 50 (real orphan vs intentional)
- Real orphans: add forward IOR from an existing req (or create new req)
- Intentional orphans: documented allowlist + category-level requirement; audit recognizes them
- R17.26 link-back: add `tasks: [T165, T166]` (and any other) forward IORs to R17.26's scenario unit

## Dependencies

- **Requires:** T169 (audit + remigration tooling — shipped `7ddf64f`); T168 (canonical chain rule); T165/T166 (R17.26 implementing tasks)
- **Coordinate-with:** T170 (no-stop sustain — once T171 closes, T169 testing completes + T170 gates land on a clean baseline); T128.2/T128.1 (migration baseline some orphans may trace back to)
- **Enables:** T169 testing closure (audit clean → tester completes the test box); Tron R-F achievement (ZERO untraced); T170 CI gates land on a clean state

## Definition of Done

- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] T169 audit re-run: ZERO untraced
- [ ] R17.26 → T165 + T166 link-back present + reachable
- [ ] **traceability-matrix.md refreshed (T143-T171 covered) in the same commit-set** (PO 2026-06-02 fold)
- [ ] No regression on shipped tasks
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-06-02: PO directed planner-first stand-up of T171 — closure of T169 audit findings. PO finding (via `7ddf64f` audit run): 50/296 untraced + R17.26 unlinked. Tron R-F = ZERO untraced. CMM4 4-role; real v4 uuids (learning #17); rule-pair (a)+(b) in AC9+DoD (learnings #15+#16). Awaiting req-eng anchor → architect categorization + design → expert impl → tester verify (audit re-run) → Tron QA.
- 2026-06-02 (PO amendment): **traceability-matrix refresh FOLDED into T171** — single commit covers T143-T171 data closures + matrix refresh. AC10 added; DoD updated. Architect must include the matrix in their design + expert commits it alongside the data closure.

## Subtasks

None at parent level (architect may split T171.x per category: e.g. T171.a R17.26 link-back; T171.b allowlist; T171.c real-orphan links).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 close-out (T169 audit findings)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (gates T169 testing closure + Tron R-F achievement; T170 CI gates land cleanly only after T171)*
