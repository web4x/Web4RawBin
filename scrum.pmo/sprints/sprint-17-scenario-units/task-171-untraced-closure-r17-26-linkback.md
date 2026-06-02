[Back to Sprint 17 Planning](./planning.md)

# T171: Untraced-closure — link 50 untraced + R17.26 link-back to T165/T166 + traceability-matrix refresh (T143-T171)

[task:uuid:75628241-9157-4385-a7f0-f4f7a3142737]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
>
> **T169 follow-on / closure** — PO 2026-06-02: T169 audit found 50/296
> scenarios untraced (17%) + R17.26 "Traceability TREE" has links=0 despite
> T165/T166 implementing it. **Tron R-F demands ZERO untraced.** T171 closes
> the gap so T169 testing can complete + audit re-run hits 0 untraced.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim PO finding from `7ddf64f` audit output (50/296 untraced + R17.26 unlinked); confirm scope (close ALL 50; explicit orphan-by-design exceptions documented per category, not per-unit)
2. **robbin-architect** — categorize the 50 untraced (likely test fixtures, scaffolding, exemplars, etc.); for each category decide: (i) **LINK** to an existing or new req, or (ii) **DOCUMENT as orphan-by-design** (with category-level requirement that "the existence of this category is itself the scenario") + accepted-orphan registry; design the R17.26 → T165/T166 link-back; ensure T169's audit accepts the documented orphan-by-design category exemptions (i.e. the audit knows the difference between unintended orphan and intentional design)
3. **robbin-expert** — implement per architect's design (links/migrations + audit-allowlist code if needed); rule-pair (a)+(b)
4. **robbin-tester** — re-run T169 audit: **ZERO untraced** (all 50 either linked or in documented allowlist); R17.26 walkDown reaches T165 + T166

**This file is the single source of truth.** No chat clarification.

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

## Acceptance Criteria
- [ ] AC1 — R17.26 scenario unit has forward IOR links to **T165 + T166** (both); architect may include other implementing tasks if applicable
- [ ] AC2 — All 50 currently-untraced units are resolved: each is **either** (a) linked to a requirement via the canonical chain, **or** (b) in a documented orphan-by-design registry referencing a category-level requirement that justifies it
- [ ] AC3 — Architect produces a categorization document (`scrum.pmo/sprints/sprint-17-scenario-units/t171-orphan-categories.md` or similar) listing each of the 50 by category + resolution
- [ ] AC4 — T169 audit re-run reports **ZERO untraced** (audit recognizes the documented orphan-by-design exemptions per category)
- [ ] AC5 — Audit honors the allowlist mechanically — orphans NOT in the allowlist still fail the audit (gate integrity preserved)
- [ ] AC6 — R17.26 walkDown via T169 audit reaches T165 + T166 (chain link-back works)
- [ ] AC7 — No regression on T134/T143/T158/T159/T160/T161/T163/T165/T166/T169
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in the SAME commit-set; (c) STATIC_SHELL exempt (no new route)
- [ ] AC10 — **traceability-matrix refresh (folded per PO 2026-06-02):** `scrum.pmo/traceability-matrix.md` updated in the SAME commit-set as the data closure. Coverage: T143 through T171 (last touched 2026-05-31; stale relative to T143/T144/T145/T146/T147/T148/T149/T150/T151/T152/T153/T154/T155/T158/T159/T160/T161/T163/T164/T165/T166/T167/T168/T169/T170/T171). Matrix reflects the locked 7-step chain + 1:N at plural hops + the orphan-by-design categories from this task.

## Test Scenarios
File: extend `test/vitest/trace-data-audit.test.ts` (T169 surface) + chain-walk e2e.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Pre-T171 baseline: run audit | 50 untraced, R17.26 links=0 (matches PO finding) |
| TS2 | Post-T171 run: audit | 0 untraced; R17.26 links ≥2 (T165 + T166) |
| TS3 | Walk down from R17.26 | Reaches T165 + T166 nodes |
| TS4 | Inspect orphan-by-design registry | Architect's categorization document exists; each category has a category-level requirement reference |
| TS5 | Add an unintentional orphan (negative test) | Audit still fails (allowlist doesn't allow unregistered orphans) |
| TS6 | Walk all formerly-untraced units up | Each either reaches a req root or is recorded in the allowlist with category req |
| TS7 (regression) | Shipped tasks behavior | Unchanged |
| TS8 | Rule-pair post-bump | New CACHE_NAME activates |

## Dependencies
- **Requires:** T169 (audit + remigration tooling — shipped `7ddf64f`); T168 (canonical chain rule); T165/T166 (R17.26 implementing tasks)
- **Coordinate-with:** T170 (no-stop sustain — once T171 closes, T169 testing completes + T170 gates land on a clean baseline); T128.2/T128.1 (migration baseline some orphans may trace back to)
- **Enables:** T169 testing closure (audit clean → tester completes the test box); Tron R-F achievement (ZERO untraced); T170 CI gates land on a clean state

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors the verbatim PO finding from `7ddf64f` audit output here.
2. **robbin-architect** categorizes the 50 untraced; designs R17.26 link-back; specifies orphan-by-design registry + audit exemption logic; writes Design section + `t171-orphan-categories.md`.
3. **robbin-expert** implements per design (scenario-index updates + allowlist code); carries rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS8 + T169 audit re-run; commits verification (0 untraced + R17.26 link-back works) to QA Audit section.

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
None at parent level (architect may split T171.x per category: e.g. T171.a R17.26 link-back; T171.b test-fixture allowlist; T171.c real-orphan links).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 close-out (T169 audit findings)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (gates T169 testing closure + Tron R-F achievement; T170 CI gates land cleanly only after T171)*
