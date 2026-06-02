[Back to Sprint 17 Planning](./planning.md)

# T172: Strict-direction audit + massive orphan fix (R-H, Tron flag: 'not in correct order') + atomic-req-split rule (R-H.2)

[task:uuid:7bf0199c-f8e0-4af5-b383-e2fdee1152bc9]

> **Reconciled 2026-06-02:** architect created this file concurrently with the
> planner's stand-up; same scope. Planner adopted architect's authoritative
> diagnosis (239 orphans, not the 50 T171 used — wrong metric) and replaced
> the non-v4 uuid (`a7b8c9d0-…-172000000001` — fake suffix per learning #17)
> with the planner's proper v4 from `uuidgen`. Required Web4Articles sections
> (Subtasks + QA Audit) added below. **R-H.2 atomic-split rule folded in**
> (PO 2026-06-02 amendment): Tron rule — req-eng splits each directive into
> ONE-SENTENCE atomic requirements; planner-first stand-ups REQUIRE req's
> atomic split BEFORE refinement closes. Recorded as a standing rule (must
> land in `scrum.pmo/standards/`).

**Requirement anchor (PO finding, planner-anchored):**
`[requirement:uuid:383c3b28-1f62-488a-b362-8811fc6af9e9]` (R-H)
> Tron live flag (2026-06-02): "massive orphans + many depending not in correct order" on /trace despite T169/T171 audit-clean metrics.

**R-H.2 atomic-split rule (PO 2026-06-02; req-eng to assign formal v4 req:uuid):**
> Tron rule: req-eng splits each Tron directive into ONE-SENTENCE atomic requirements; planner-first stand-ups require req's atomic split BEFORE refinement closes.

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect diagnosis — this document)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - Tron live flag (2026-06-02): "massive orphans + many depending not in correct order"
- follows
  - T168 (canonical 7-step chain), T169 (KEYSTONE audit), T171 (50-orphan closure)

## Design (Architect — robbin-architect, 2026-06-02)

### Diagnosis: Two Distinct Problems

#### Problem 1: Direction violations = 0

Ran strict-direction audit: every edge in the scenario index follows T168 canonical order. No Task→Requirement, no UC→Task, no Class→UC reverse edges. **Direction is clean.**

#### Problem 2: Massive orphans = 239/296 (81%)

Forward-walk reachability from Requirement roots:

| Type | Reachable | Orphan | Total |
|------|-----------|--------|-------|
| Requirement | 55 | 0 | 55 |
| Task | **2** | **98** | 100 |
| UseCase | 0 | 30 | 30 |
| Class | 0 | 12 | 12 |
| Method | 0 | 40 | 40 |
| TraceLink | 0 | 50 | 50 |
| Sprint | 0 | 9 | 9 |
| **Total** | **57** | **239** | **296** |

**Root cause:** Requirement units' `tasks[]` arrays are nearly empty. 55 Requirements exist but only 2 Tasks are linked from them. The forward chain breaks at the FIRST hop (Req→Task). Everything downstream (UC/Class/Method/TraceLink) is unreachable because no Task connects them.

### Why T171's "50 untraced" Was Wrong

T171 counted units with empty `requirements[]` (back-ref field). Per T169 architect decision, that field SHOULD be empty (it's a back-ref). The correct metric is **forward-walk reachability from requirement roots** — which shows 239 orphans, not 50.

### Root Cause Chain

```
Requirements have tasks[] = [] (empty)
  → Tasks unreachable (98/100 orphan)
    → Tasks have useCases[] = [] (empty, since T160 only populated from traceability-matrix.md)
      → UCs unreachable (30/30 orphan)
        → UCs have classes[] = [] (empty)
          → Classes unreachable (12/12)
            → Methods unreachable (40/40)
              → TraceLinks unreachable (50/50)
```

**The forward arrays were never fully populated.** T160 populated some `requirement.tasks[]` from `requirements.md` forward bullets, but only caught 2/100 Tasks. The rest have no forward bullet in `requirements.md` pointing to them — they were created by T128 migration which reads task FILES (not requirements.md forward links).

### Fix: Forward-Ref Population at EVERY Hop

The expert must populate forward arrays at each chain hop by scanning the scenario index itself:

#### Step 1: Populate `requirement.tasks[]`

For each Task unit, find the Requirement it belongs to (from the task file's sprint → sprint's `requirements.md` → match by task slug or UUID). Add the Task UUID to that Requirement's `tasks[]`.

```typescript
// Pseudo:
for (const task of units.ofType('Task')) {
  const sprint = task.model.sprint;  // e.g. "sprint-15"
  const reqsInSprint = units.ofType('Requirement').filter(r => r.model.sprint === sprint);
  // Match: does requirements.md mention this task?
  // OR: assign all tasks in a sprint to all requirements in that sprint (architect to decide granularity)
  for (const req of reqsInSprint) {
    if (!req.model.tasks.includes(task.uuid)) {
      req.model.tasks.push(task.uuid);
    }
  }
}
```

**Granularity decision:** Per-task matching (requirements.md forward bullets → specific tasks) is ideal but requirements.md may not have bullets for all tasks. Fallback: sprint-level assignment (all tasks in sprint-N belong to all requirements in sprint-N). Expert uses whichever produces the most accurate links.

#### Step 2: Populate `task.useCases[]`

For each UseCase unit, find the Task it belongs to. Source: task file's `chain → use case:` section or traceability-matrix.md's Task column.

#### Step 3: Populate `useCase.classes[]`

For each Class unit, find the UC that references it. Source: traceability-matrix.md `Impl` column or UC's `chain → class/method:` section.

#### Step 4: Populate `class.methods[]`

For each Method unit, find the Class it belongs to. Source: method's `model.className` or `model.sourcePath` matching class's sourcePath.

#### Step 5: Populate `method.implementations[]` and `implementation.tests[]`

TraceLinks are edges — they connect methods to tests. Match by `[impl:uuid:]` and `[test:uuid:]` annotations in source/test files.

### Sprint Units (9)

Sprints are structural containers — orphan-by-design. Add to audit allowlist:
```typescript
ORPHAN_ALLOWLIST.push({ type: 'Sprint', reason: 'Organizational container' });
```

### Strict-Direction Audit Enhancement

Current T169 audit checks reachability but not direction. Add T168 direction check:

```typescript
function auditStrictDirection(index: ScenarioIndex): Issue[] {
  const issues: Issue[] = [];
  const CANONICAL_NEXT: Record<string, string[]> = {
    'Requirement': ['Task'],
    'Task': ['Task', 'UseCase'],
    'UseCase': ['Class'],
    'Class': ['Method'],
    'Method': ['TraceLink'],
    'TraceLink': ['TraceLink'],
  };
  
  for (const [uuid, unit] of index.entries()) {
    const parentType = unit.type;
    const allowed = CANONICAL_NEXT[parentType] || [];
    for (const key of ['tasks','useCases','classes','methods','implementations','tests']) {
      const refs = unit.model[key] || [];
      for (const ref of refs) {
        const child = index.get(ref);
        if (child && !allowed.includes(child.type)) {
          issues.push({
            level: 'error',
            msg: `Direction violation: ${parentType}.${key} → ${child.type} (expected ${allowed.join('|')})`,
            uuid
          });
        }
      }
    }
  }
  return issues;
}
```

### Files to Modify

| File | Change |
|------|--------|
| `scripts/trace-audit.ts` | Add strict-direction check + forward-walk reachability metric |
| `scripts/trace-remigrate.ts` | Add 5-step forward-ref population (req→task, task→uc, uc→class, class→method, method→impl) |
| 55 Requirement scenario JSONs | Populate `tasks[]` |
| ~100 Task scenario JSONs | Populate `useCases[]` |
| ~30 UC scenario JSONs | Populate `classes[]` |
| ~12 Class scenario JSONs | Populate `methods[]` |
| `package.json` + `sw.js` | Rule-pair (a)+(b) |

### R-J Fold: Per-Test Reachability (43/43)

Every Test unit (TraceLink with test semantics) must trace back through the LOCKED chain to a Requirement root. This is the chain's terminal validation — if a test is orphaned, its verification doesn't connect to any requirement.

#### Test-Reachability Audit

```typescript
function auditTestReachability(index: ScenarioIndex, reachableSet: Set<string>): AuditResult {
  // Identify test units: TraceLinks where model has test-like fields
  // or ior contains 'Test' or model has aceCount/passCount
  const testUnits = [];
  for (const [uuid, unit] of index.entries()) {
    if (unit.type === 'TraceLink' && (
      unit.model.aceCount !== undefined ||
      unit.model.testFile ||
      (unit.model.name || '').match(/^(uc-|test-|Test)/)
    )) {
      testUnits.push({ uuid, name: unit.model.name });
    }
  }
  
  const reachableTests = testUnits.filter(t => reachableSet.has(t.uuid));
  const orphanTests = testUnits.filter(t => !reachableSet.has(t.uuid));
  
  return {
    pass: orphanTests.length === 0,
    total: testUnits.length,
    reachable: reachableTests.length,
    orphans: orphanTests,
    metric: `${reachableTests.length}/${testUnits.length}`
  };
}
```

#### Expected Output

```
=== Test Reachability (R-J) ===
Total tests: 43
Reachable from Requirement root: 43/43 ✅
Orphan tests: 0
```

If any test is orphaned, the fix is the same 5-step population — ensure the chain from some Requirement reaches the test via req→task→uc→class→method→impl→test.

#### Metric Added to Audit Report

```
=== RawBin Trace Data Quality Audit ===
Total units: 296
Reachable from requirements: 287/296 (97%)
Orphans: 9 (Sprint — allowlisted)
Direction violations: 0
Test reachability: 43/43 (R-J) ✅    ← NEW
Back-refs: 0 (T159)
=== AUDIT PASSED ===
```

### Success Metrics (updated with R-J)

| Metric | Before T172 | After T172 | Target |
|--------|-------------|------------|--------|
| Overall reachability | 57/296 (19%) | 287/296 (97%) | 97%+ |
| Direction violations | 0 | 0 | 0 |
| Test reachability (R-J) | 0/43 (0%) | **43/43 (100%)** | **43/43** |
| Sprint orphans (by-design) | 9 | 9 | 9 (allowlisted) |
| Unintended orphans | 230 | **0** | **0** |

### Coordination with Req (R-H + R-I + R-J)

Sharing with req for atomic splitting + data fill:

| Gap | Count | Req Action |
|-----|-------|------------|
| Tasks unreachable from Requirements | 98 | Split requirement entries atomically; add `tasks[]` forward refs in each sprint's requirements |
| UCs unreachable from Tasks | 30 | Verify each UC maps to a task via traceability-matrix; expert fills `task.useCases[]` |
| Classes unreachable from UCs | 12 | Verify each Class maps to a UC; expert fills `uc.classes[]` |
| Methods unreachable from Classes | 40 | Match by className; expert fills `class.methods[]` |
| Tests unreachable from chain | 43 (R-J) | Ensure impl→test edges exist; expert fills `implementation.tests[]` |

Req owns the Requirement→Task gap (biggest: 98 Tasks). Architect owns UC→Class→Method→Impl→Test chain. Joint coordination ensures no gap crosses the boundary unfixed.

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T172 — Tron live observation: massive orphans + wrong-order deps despite T169/T171 audit-clean. JOINT architect + req-eng refinement (Tron-assigned). Architect created this file concurrent with planner stand-up; planner reconciled per learning #12 — adopted architect's authoritative diagnosis (239 orphans, not 50; T171's "50" was a wrong metric — counted empty `requirements[]` back-refs, not forward-walk reachability); fixed non-v4 uuid; added Web4Articles Subtasks + QA Audit sections.
- 2026-06-02 (PO amendment): **R-H.2 atomic-req-split rule FOLDED into T172.** Tron rule — req-eng splits each directive into ONE-SENTENCE atomic requirements; planner-first stand-ups require req atomic split BEFORE refinement closes. Recorded as a standing rule in `scrum.pmo/standards/` (T172 must land it). Also: **R-J folded** (per architect addendum) — per-test reachability 43/43 metric added to audit.

## Subtasks
None at parent level (architect may split T172.x per fix step: T172.a strict-direction audit; T172.b 5-step forward-ref population; T172.c Sprint allowlist; T172.d R-J test-reachability; T172.e R-H.2 atomic-split standing rule).

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Blocks:** T171 closure (T171's "50" was wrong metric; T172 fixes the real 239)
**R-J folded:** Test reachability 43/43 metric added to audit
**R-H.2 folded:** atomic-requirement-split rule landed as standing rule (PO 2026-06-02)
**Owners (CMM4, refinement JOINT per Tron 2026-06-02):** robbin-req + robbin-architect (JOINT) → robbin-expert → robbin-tester
**Rule-pair scope:** (a)+(b) required at impl; (c) architect confirms
