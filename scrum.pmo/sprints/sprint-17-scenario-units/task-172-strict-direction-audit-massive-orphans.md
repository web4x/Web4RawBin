[Back to Sprint 17 Planning](./planning.md)

# T172: Strict-direction audit + massive orphan fix (Tron flag: 'not in correct order')
[task:uuid:a7b8c9d0-e1f2-4345-6789-172000000001]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect diagnosis — this document)
  - [ ] creating test cases
  - [ ] implementing
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

### Success Metric

**Before T172:** 57/296 reachable (19%)
**After T172:** 287/296 reachable (97%) — 9 Sprint orphans-by-design remain
**Target:** 0 unintended orphans

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Blocks:** T171 closure (T171's "50" was wrong metric; T172 fixes the real 239)
