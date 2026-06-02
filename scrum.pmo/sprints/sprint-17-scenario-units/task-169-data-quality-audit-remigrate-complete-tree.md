[Back to Sprint 17 Planning](./planning.md)

# T169: Data-quality audit + remigrate — complete tree, NO back-chaos, NO untraced scenarios (KEYSTONE)

[task:uuid:e43c24fe-a1d1-4d14-8e7a-55ea7edd616f]

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
> **KEYSTONE TASK** — PO 2026-06-02: "R-F is the keystone — others build on it."
> T167 (mobile layout) and T170 (no-stop sustain) depend on T169's data being
> clean; T168 (chain order spec) is the rule T169 audits against.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim Tron R-F quote from `compound-requirement-source-2.md` (Tron completion via `bfae071` + `2be6e96` + `7e01491`)
2. **robbin-architect** — design the data-quality audit + remigration: define what "complete tree" means (every scenario unit reachable from a requirement root via the canonical T168 chain); define "no back-chaos" (no back-refs reintroduced; forward-only per T159/T160); define "no untraced scenarios" (zero orphan units); specify the audit tool / script + remigration strategy (in-place fix vs re-migration); cardinality enforcement (Implementation:Test 1:N, usecase(s) 1:N per T168)
3. **robbin-expert** — implement audit + remigration tooling; run remigration as needed; rule-pair (a)+(b)
4. **robbin-tester** — verify: every scenario instance reachable from a req root via the 7-step chain; zero back-refs; zero orphan units; cardinality enforced

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:e43c24fe-a1d1-4d14-8e7a-55ea7edd616f]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) → **R-F** (Tron completion 2026-06-02 via `bfae071` + `2be6e96` + `7e01491`)
  - **R-F Data-quality audit + remigrate — complete tree, no back-chaos, no untraced scenarios**
    `[requirement:uuid:c182f6f1-68c0-4fb4-acd6-36a48d748480]`
    Verbatim Tron quote: req-eng to anchor here from the completed source.
    **PO 2026-06-02:** "R-F is the keystone — others build on it." T169 owns
    the data audit; T168 owns the chain rule it audits against; T167 + T170
    depend on clean data.
- down
  - None at parent level; architect may split T169.x sub-tasks per remigration batches
- follows
  - [T168: Chain order 7-step + atomic requirements as tree ROOTS](./task-168-chain-order-7-step-requirements-as-roots.md) — supplies the canonical chain rule T169 audits against
  - [T159: forward-only chain refactor](./task-159-forward-only-traceability-chain-refactor.md) — established no-back-refs (T169 enforces it ongoing)
  - [T160: forward-ref REPOPULATION (incl. AC3 task.useCases[])](./task-160-trace-browser-stale-requirement-items.md) — established forward arrays
  - [T128.1: Sprint 1 exemplar migration](./task-128-migration.md) and [T128.2: S10-S16 migration](./task-128.2-migrate-s10-s16-requirements.md) — migration baseline T169 audits
  - [T164: re-migrate dirty model.name + firstLine() harden](./task-164-dirty-model-name-remigration.md) — narrow data-quality fix T169 generalizes
- relates-to
  - [T167: /trace mobile layout + width-cap](./task-167-trace-mobile-first-layout-width-cap.md) — depends on T169-clean data
  - [T170: Diligent plan, no-stop sustain](./task-170-diligent-plan-no-stop-sustain.md) — depends on T169-clean data baseline
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168) — architect fills on refinement
  - **requirement:** R-F (above)
  - **use case:** UC-TBD (architect — likely `audit.completeTree` / `audit.noBackChaos` / `audit.noOrphan` / `migration.remediate`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** audit script + remigration script — TBD
  - **implementation:** TBD
  - **test:** audit-clean run + remigration regression — TBD

## Context

Tron R-F (compound-requirement-source-2 completion 2026-06-02 across `bfae071`
+ `2be6e96` + `7e01491`): the traceability data must be **complete**, with
**no back-chaos**, and **no untraced scenarios** — every instance reachable
from a requirement root via the canonical T168 7-step chain.

PO 2026-06-02: **R-F is the keystone** — T167 (mobile layout) and T170 (no-stop
sustain) build on T169's clean data baseline. T168 (chain order) supplies the
canonical rule T169 audits against.

Current state has known gaps T169 generalizes:
- T164 (in-flight) handles 9 dirty `model.name` units + firstLine() fallback
  hardening — narrow data-quality fix
- T128.2 (shipped `f4d21b3`) migrated S10-S16 reqs but tester verification
  pending — coverage gap
- T160 AC3 added `task.useCases[]` repopulation — forward-ref completeness
- Various scenarios may still be orphan (no path to a requirement root)
- Back-refs may have crept in via patches or pre-T159 artifacts

T169 closes the data-quality loop systematically.

## Intention

### Why this task exists
Per Tron R-F, the data is the foundation of everything else. R-D mobile layout
+ R-G no-stop sustain + the T143 tree experience all require a clean,
complete, canonical-chained data graph. T168 sets the rule; T169 enforces it
on the existing data + builds the ongoing audit.

### Problems this task solves
- Orphan scenario units (not reachable from any req root)
- Back-refs that crept in despite T159 forward-only rule
- Incomplete tree (missing forward refs at some hops)
- Cardinality not enforced (Implementation:Test, usecase(s))
- Migration baseline doesn't have a CI gate

### How it solves them
- Architect specifies the audit (reachability + no-back-refs + cardinality)
- Audit script enumerates all scenario units; for each: walk up to a req root
  via the canonical chain; flag orphans
- Remigration script (or in-place patches) fixes the flagged units
- Audit becomes a permanent CI gate (no future regression)

## Acceptance Criteria
- [ ] AC1 — Audit script enumerates every scenario unit (Requirement / Task / UseCase / Class / Method / Implementation / Test) in the index
- [ ] AC2 — For every non-Requirement unit, audit confirms a path UP to a requirement root via the canonical T168 chain (`requirement → task → usecase(s) → class → method → implementation → test(s)`); zero orphan units
- [ ] AC3 — Audit confirms zero back-refs across all units (forward-only rule T159 holds)
- [ ] AC4 — Audit confirms cardinality: Implementation has `tests[]` IOR array (1:N); task has `useCases[]` IOR array (1:N); plural hops enforced
- [ ] AC5 — Remigration completes any units flagged by AC2-AC4 (orphan fix; back-ref strip; cardinality fill)
- [ ] AC6 — Re-running the audit post-remigration: **all clean** (0 orphans, 0 back-refs, cardinality enforced)
- [ ] AC7 — Audit script wired as a CI gate (or runnable via `npm run trace:audit` or equivalent — architect specifies)
- [ ] AC8 — `traceability-standard.md` references T169's audit as the official data-quality gate
- [ ] AC9 — No regression on shipped tasks (T134/T143/T158/T160/T161/T163/T165/T166)
- [ ] AC10 — `npm run build` succeeds; all existing tests pass
- [ ] AC11 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in the SAME commit-set; (c) STATIC_SHELL — architect confirms (likely exempt)

## Test Scenarios
File: `test/vitest/trace-data-audit.test.ts` (new) + `scripts/trace-audit.ts` (new).

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run audit on current index | Report orphans / back-refs / cardinality violations (baseline) |
| TS2 | Run remigration | Flagged units fixed |
| TS3 | Re-run audit post-remigration | 0 orphans, 0 back-refs, cardinality clean |
| TS4 | Walk up from a random Method unit | Reaches a requirement root in ≤7 hops via canonical chain |
| TS5 | Walk up from a random Test unit | Reaches a requirement root via impl → method → class → uc → task → req |
| TS6 | Inspect a Task with multiple UseCases | `task.useCases[]` IOR array populated; 1:N walks correctly |
| TS7 | Inspect an Implementation with multiple Tests | `implementation.tests[]` IOR array populated; 1:N walks correctly |
| TS8 | Add an orphan unit, run audit | Fails (caught as expected) |
| TS9 | Add a back-ref by hand, run audit | Fails (caught as expected) |
| TS10 (regression) | Shipped tasks behavior | Unchanged |
| TS11 | Rule-pair post-bump | New CACHE_NAME activates |

## Dependencies
- **Requires:** T168 (canonical chain rule — must land first or in lockstep); T159/T160 (forward-only baseline); T128.1/T128.2 (migration baseline); T164 (in-flight — narrow data fix that T169 generalizes)
- **Enables:** T167 (mobile layout — visual surface only solid on clean data); T170 (no-stop sustain — requires data baseline to sustain); ongoing data-quality gate

## Drive Plan (planner-coordinated, CMM4 4-role; KEYSTONE)
1. **robbin-req** anchors verbatim Tron R-F quote from compound-source-2 (commits `bfae071` + `2be6e96` + `7e01491`).
2. **robbin-architect** designs audit + remigration + CI-gate wiring; coordinates with T168 architect work (same person likely); writes Design section.
3. **robbin-expert** implements per design (audit script + remigration tooling); carries rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS11 + audit baseline + post-remigration verify; commits verification to QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] Audit clean: 0 orphans, 0 back-refs, cardinality enforced
- [ ] Audit wired as CI gate (per architect spec)
- [ ] `traceability-standard.md` updated to reference T169 audit
- [ ] No regression on shipped tasks
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T169 (R-F KEYSTONE from compound-source-2 via `bfae071` + `2be6e96` + `7e01491`). Per PO: "R-F is the keystone — others build on it." T167 + T170 depend on T169-clean data; T168 supplies the rule. CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC11+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks
None at parent level (architect may split T169.x per remigration batches).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (KEYSTONE — data quality)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (KEYSTONE per PO 2026-06-02 — T167/T170 build on this; T168 supplies the rule)*
