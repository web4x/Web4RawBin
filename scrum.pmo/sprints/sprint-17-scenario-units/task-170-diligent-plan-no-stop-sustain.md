[Back to Sprint 17 Planning](./planning.md)

# T170: Diligent plan + no-stop sustain (cadence + quality gates)

[task:uuid:6cf46cd1-5f65-4474-a023-1b54b56adb06]

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

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim Tron R-G quote from `compound-requirement-source-2.md` (completion via `bfae071` + `2be6e96` + `7e01491`); confirm what "no-stop sustain" operationally means (continuous CMM4 cadence; rule-pair always applied; audit gate always green)
2. **robbin-architect** — design the sustain mechanism: cadence rules; the data-quality gate (T169) integrated into CI; the rule-pair gate (#15+#16) integrated into CI; the chain-order gate (T168) integrated into CI; how planner cadence keeps the board honest without stopping the work
3. **robbin-expert** — implement the CI gates + any tooling per architect's design; rule-pair (a)+(b)
4. **robbin-tester** — verify the gates fire on violations (negative tests) and pass on clean state (positive tests); regression on shipped work

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:6cf46cd1-5f65-4474-a023-1b54b56adb06]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) → **R-G** (Tron completion 2026-06-02 via `bfae071` + `2be6e96` + `7e01491`)
  - **R-G Diligent plan + no-stop sustain**
    `[requirement:uuid:1267ef56-9d21-4def-a639-5484b1693220]`
    > TRON DIRECTIVE: "plan it diligently and do not stop until reached with the team. activate the sm again"
- down
  - None (atomic at parent level; architect may split T170.x if scope warrants)
- follows
  - [T169: Data-quality audit + remigrate (KEYSTONE)](./task-169-data-quality-audit-remigrate-complete-tree.md) — supplies the clean data baseline T170 sustains
  - [T168: Chain order 7-step + atomic requirements as tree ROOTS](./task-168-chain-order-7-step-requirements-as-roots.md) — supplies the canonical chain rule T170 sustains
- relates-to
  - [T167: /trace mobile layout](./task-167-trace-mobile-first-layout-width-cap.md) — visual surface that benefits from sustained data quality
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168) — architect fills on refinement
  - **requirement:** R-G (above)
  - **use case:** UC-TBD (architect — likely `sustain.dataGate` / `sustain.rulePairGate` / `sustain.chainGate`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** CI workflow updates + gate scripts — TBD
  - **implementation:** TBD
  - **test:** CI dry-runs on clean + violating states — TBD

## Context

Tron R-G (compound-requirement-source-2 completion 2026-06-02 across commits
`bfae071` + `2be6e96` + `7e01491`): the work must **sustain** — diligent
planning + no-stop cadence. The standing rules already exist (#15 rule-pair,
#17 v4 uuids, #18 4-role CMM4, etc.); this task makes them **enforced** via
CI gates rather than relying on planner discipline alone.

Three gates land together:
1. **Data-quality gate** (T169) — every scenario reachable from a req root, no
   back-refs, cardinality enforced
2. **Rule-pair gate** (#15+#16) — every impl commit on user-facing surface has
   the package.json bump + sw.js CACHE_NAME bump in the same commit-set; CI
   enforces this for the relevant change-types
3. **Chain-order gate** (T168) — `traceability-standard.md`'s 7-step chain is
   mechanically validated in CI

Together these make the sustain pattern self-enforcing — no manual planner
sweep needed to catch regressions.

## Intention

### Why this task exists
Tron's "no-stop" directive is a process requirement: the work continues
without stopping for cleanup cycles by making cleanup automatic. The standing
rules are good; making them enforced removes manual-discipline gaps.

### Problems this task solves
- Standing rules rely on planner-noticing for enforcement (manual sweep cost)
- Rule-pair (#15+#16) violations slip through (incidents: T136/T138 shipped
  without bump initially; caught later)
- Data quality requires periodic audit runs by hand (T169 provides the audit;
  T170 makes it automatic)
- Chain-order rule can drift silently

### How it solves them
- Architect designs CI gates wiring the three audits (T169 / rule-pair / T168
  chain-order)
- Expert wires the gates into CI (or pre-commit, per architect)
- Tester confirms gates fail on violations + pass on clean state
- Planner's role narrows to coordinating the gates (which is sustainable);
  the gates do the enforcement

## Acceptance Criteria
- [ ] AC1 — Data-quality gate runs in CI (or pre-commit) and fails the build on T169 audit violations
- [ ] AC2 — Rule-pair gate (#15+#16) runs in CI and fails when an impl commit on a user-facing surface lacks package.json + sw.js bumps in the same commit-set
- [ ] AC3 — Chain-order gate runs in CI and fails on T168 canonical-chain violations
- [ ] AC4 — Gates report violations clearly (file path + rule violated + remediation hint)
- [ ] AC5 — Gates pass on the current clean state post-T169 remigration (positive baseline)
- [ ] AC6 — Negative tests: deliberately violating each rule fails the gate (each gate has a corresponding negative test)
- [ ] AC7 — Sustain-cadence rule: planner's monitoring cadence (15-min / 30-min / 60-min back-off) is documented (planner SKILL.md or sprint doc) — no manual sweeps required to catch regressions
- [ ] AC8 — No regression on shipped tasks
- [ ] AC9 — `npm run build` succeeds; all existing tests pass
- [ ] AC10 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in the SAME commit-set; (c) STATIC_SHELL exempt

## Test Scenarios
File: `test/vitest/ci-gates.test.ts` (new) + CI workflow updates.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | CI run on current clean state | All 3 gates pass |
| TS2 | Add an orphan scenario unit, push | Data-quality gate fails (T169 audit) |
| TS3 | Push an impl commit on a user-facing surface without bumps | Rule-pair gate fails |
| TS4 | Push a back-ref into a scenario unit | Chain-order gate fails |
| TS5 | Fix the violation, re-push | Gate passes |
| TS6 | Gate output is actionable | Violation message + file + remediation hint present |
| TS7 (regression) | Shipped tasks pass all gates | Yes |
| TS8 | Sustain doc updated | Planner cadence rules documented |
| TS9 | Rule-pair post-bump | New CACHE_NAME activates |

## Dependencies
- **Requires:** T169 (data-quality audit — gate-1's underlying tool), T168 (chain-order rule — gate-3's underlying rule)
- **Coordinate-with:** T167 (visual surface only stable when sustain gates hold)
- **Enables:** ongoing sustained quality without manual planner sweeps

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors verbatim Tron R-G quote from compound-source-2.
2. **robbin-architect** designs the 3 CI gates + sustain doc; coordinates with T168/T169 architect; writes Design section.
3. **robbin-expert** implements per design (CI workflow + gate scripts); carries rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS9 + CI dry-runs; commits verification to QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] 3 CI gates wired (data-quality / rule-pair / chain-order)
- [ ] Sustain cadence documented (planner SKILL.md or sprint doc)
- [ ] No regression on shipped tasks
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T170 (R-G from compound-source-2 via `bfae071` + `2be6e96` + `7e01491`). T170 makes the standing rules self-enforcing via CI gates so the planner's monitoring loop becomes light. CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC10+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.
- 2026-06-02: robbin-req anchored verbatim Tron R-G quote in traceability section.

## Design (Architect — robbin-architect, 2026-06-02)

### Three CI Gates

#### Gate 1: Data-Quality (T169 audit)

Wires `scripts/trace-audit.ts --strict` into the build pipeline.

```json
// package.json scripts:
{
  "trace:audit": "tsx scripts/trace-audit.ts",
  "trace:audit:ci": "tsx scripts/trace-audit.ts --strict",
  "pretest": "npm run trace:audit:ci"
}
```

Runs as `pretest` hook — every `npm test` / `npm run build` triggers the audit. Fails on any orphan, back-ref, or cardinality violation. Output: audit report with file paths + remediation hints.

Alternative: GitHub Actions step:
```yaml
- name: Trace data-quality gate
  run: npm run trace:audit:ci
```

#### Gate 2: Rule-Pair (#15+#16)

Validates that commits touching user-facing files also bump `package.json` version + `src/public/sw.js` CACHE_NAME.

```typescript
// scripts/rule-pair-check.ts
function checkRulePair(): { pass: boolean; violations: string[] } {
  // 1. Get files changed in current commit (or commit range)
  const changed = execSync('git diff --name-only HEAD~1 HEAD').toString().split('\n');
  
  // 2. Identify user-facing changes
  const userFacing = changed.filter(f => 
    f.startsWith('src/public/') || 
    f.includes('/templates') || 
    f.includes('/trace/')
  );
  
  if (userFacing.length === 0) return { pass: true, violations: [] };
  
  // 3. Check bumps in same commit
  const hasPkgBump = changed.includes('package.json');
  const hasSwBump = changed.includes('src/public/sw.js');
  
  const violations: string[] = [];
  if (!hasPkgBump) violations.push('package.json version not bumped (rule-pair (a))');
  if (!hasSwBump) violations.push('src/public/sw.js CACHE_NAME not bumped (rule-pair (b))');
  
  return { pass: violations.length === 0, violations };
}
```

```json
// package.json scripts:
{
  "rule-pair:check": "tsx scripts/rule-pair-check.ts"
}
```

Wire as pre-push hook or GitHub Actions step.

#### Gate 3: Chain-Order (T168 canonical)

Validates the 7-step canonical chain is intact — no skipped hops, no wrong-order links.

```typescript
// Integrated into trace-audit.ts as pass 4:
function auditChainOrder(index: ScenarioIndex): AuditResult {
  const issues: string[] = [];
  
  for (const uuid of index.list()) {
    const unit = index.get(uuid);
    if (!unit) continue;
    const type = unit.model.chainType;
    const allowed = CANONICAL_WALK[type];
    if (!allowed) continue;
    
    // Check: unit only has forward links to allowed next-hop types
    const links = unit.model;
    for (const key of Object.keys(links)) {
      if (Array.isArray(links[key]) && links[key].length > 0) {
        // Verify each ref points to the correct next-hop type
        for (const ref of links[key]) {
          const target = index.get(ref);
          if (target) {
            const expectedTypes = CANONICAL_NEXT[type]; // e.g. requirement → ['task']
            if (!expectedTypes.includes(target.model.chainType)) {
              issues.push(`${uuid} (${type}) links to ${ref} (${target.model.chainType}) — expected ${expectedTypes.join('|')}`);
            }
          }
        }
      }
    }
  }
  
  return { pass: issues.length === 0, issues };
}
```

### Sustain Cadence Documentation

Add to planner SKILL.md or sprint doc:

```markdown
## Sustain Cadence (T170)
- CI gates run on every `npm test` / push
- Gates: data-quality (T169), rule-pair (#15+#16), chain-order (T168)
- Gate failure = build failure — must fix before merge
- Planner monitors: 15-min check → 30-min → 60-min back-off (only if no gate violations)
- No manual sweep needed — gates catch regressions automatically
- Gate violations surface in CI logs with file + rule + fix hint
```

### Gate Output Format (all 3 gates)

```
=== CI Quality Gates ===
Gate 1 (data-quality): PASS (119 units, 0 orphans, 0 back-refs)
Gate 2 (rule-pair): PASS (no user-facing changes without bumps)
Gate 3 (chain-order): PASS (0 chain violations)
=== ALL GATES PASSED ===
```

On failure:
```
Gate 1 (data-quality): FAIL
  - uuid-1 (class: GameRoom): orphan — no path to requirement root
  Fix: add GameRoom to a UseCase's classes[] array
Gate 2 (rule-pair): FAIL
  - package.json version not bumped (rule-pair (a))
  Fix: bump version in package.json
=== 2 GATE FAILURES — BUILD BLOCKED ===
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `scripts/rule-pair-check.ts` | CREATE — rule-pair gate |
| `scripts/trace-audit.ts` | MODIFY — add chain-order pass (pass 4) |
| `package.json` | Add `rule-pair:check` + `pretest` scripts; bump version |
| `src/public/sw.js` | Bump CACHE_NAME |
| `.github/workflows/ci.yml` (if exists) | Add gate steps |
| Planner SKILL.md or sprint doc | Document sustain cadence |

STATIC_SHELL (c): exempt.

## Subtasks
None at parent level (architect may split T170.x if scope warrants).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (sustain / CI gates)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (after KEYSTONE T169 + canonical T168; T170 wires the gates that sustain them)*
