[Back to Sprint 17 Planning](./planning.md)

# T171: Untraced-closure — link 50 untraced + R17.26 link-back to T165/T166 + traceability-matrix refresh (T143-T171)

[task:uuid:75628241-9157-4385-a7f0-f4f7a3142737]

## Status — 📝 refinement done (architect 826d30b)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — **`826d30b` architect design committed: T169 decision (NO `requirements[]` on non-req — back-ref per T159/B18; 241 empty requirements[] are CORRECT, strip field) + T171 50-orphan categorization**)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> Sync per rule #11: `826d30b` lands architect design. Decision crystallized:
> the 50 unreachable units are the **real R-F gap** — fix via forward refs on
> parents (not back-refs on children). 241 empty `requirements[]` fields on
> non-req units are correct per forward-only rule (T159/B18) and will be
> stripped by the close-out commit. Expert next. QA Review + Done remain
> Tron's gate.
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

## Design (Architect — robbin-architect, 2026-06-02)

### T169 Decision Applied: requirements[] is NOT populated

Per architect decision on T169 (same session): non-req units do NOT need `requirements[]`. The 241 empty `requirements[]` are CORRECT (T159 forward-only). The 50 untraced units are the real gap — fix by adding forward refs on parents.

### IOR Type Discovery

Scenario units use `ior` field for type (not `chainType`):
- `"ior": "ior:class:Task"` → Task
- `"ior": "ior:class:Requirement"` → Requirement
- `"ior": "ior:class:UseCase"` → UseCase
- etc.

Parse: `unit.ior.split(':')[2]` → class name.

### Categorization Framework (expert fills during implementation)

The 50 untraced fall into expected categories:

| Category | Expected Count | Resolution |
|----------|---------------|------------|
| **Sprint** (structural root) | ~9 | Orphan-by-design — Sprints are organizational containers, not traced from requirements |
| **TraceLink** (edge metadata) | ~15-20 | Orphan-by-design — TraceLinks are edges connecting nodes, not nodes themselves |
| **Real orphan Task** (migration gap) | ~10-15 | LINK — add to a Requirement's `tasks[]` |
| **Real orphan UC/Class/Method** | ~5-10 | LINK — add to parent's forward array |
| **Test fixture / exemplar** | ~1-5 | Orphan-by-design — document as test data |

Expert runs audit, fills exact counts, produces `t171-orphan-categories.md`.

### Orphan-by-Design Registry

```json
// In trace-audit.ts or a config file:
const ORPHAN_ALLOWLIST_CATEGORIES = [
  { category: 'Sprint', iorPrefix: 'ior:class:Sprint', reason: 'Organizational container, not requirement-traced' },
  { category: 'TraceLink', iorPrefix: 'ior:class:TraceLink', reason: 'Edge metadata between chain nodes' },
  { category: 'TestFixture', uuids: ['uuid-1', 'uuid-2'], reason: 'Test data / exemplars' },
];
```

Audit checks: if orphan matches an allowlist category → documented (not a failure). If orphan does NOT match → hard fail.

### R17.26 Link-Back

R17.26 "Traceability TREE" requirement unit must have `tasks: [T165-uuid, T166-uuid]` in its forward array:

```json
{
  "ior": "ior:class:Requirement",
  "model": {
    "name": "Traceability TREE",
    "uuid": "<R17.26-uuid>",
    "tasks": ["35ed4168-f575-4df4-9a87-43f5ca4912ab", "086a35db-0de3-49f3-971a-c6be1863100e"]
  }
}
```

### Traceability-Matrix Refresh

Expert updates `scrum.pmo/traceability-matrix.md` in the SAME commit-set:
- Covers T143 through T171
- Reflects 7-step chain (T168)
- Reflects orphan-by-design categories
- Reflects forward-only rule (T159)

### Files to Create/Modify

| File | Action |
|------|--------|
| `scrum.pmo/sprints/sprint-17-scenario-units/t171-orphan-categories.md` | CREATE — categorization of 50 untraced |
| `scripts/trace-audit.ts` | MODIFY — add orphan allowlist category matching |
| Scenario index (R17.26 unit) | MODIFY — add tasks[] forward IORs to T165+T166 |
| Scenario index (real orphans) | MODIFY — add to parent's forward array |
| `scrum.pmo/traceability-matrix.md` | REFRESH — T143-T171 coverage |
| `package.json` + `sw.js` | Rule-pair (a)+(b) |

## Subtasks
None at parent level (architect may split T171.x per category: e.g. T171.a R17.26 link-back; T171.b allowlist; T171.c real-orphan links).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 close-out (T169 audit findings)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (gates T169 testing closure + Tron R-F achievement; T170 CI gates land cleanly only after T171)*
