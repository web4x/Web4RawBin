# Chain Correction Plan: 7-Step → 6-Step (Task removed from chain)

**Author:** robbin-architect (2026-06-08)
**Status:** PLAN — awaiting PO review before any execution
**Root cause:** Architect's SKILL.md encoded Req→Task as chain step 1. This propagated to all standards, code, and data.

---

## The Correction

**Before (WRONG — 7-step, Task in chain):**
```
Requirement → Task → UseCase → Class → Method → Implementation → Test
```

**After (CORRECT — 6-step, Task is navigation):**
```
Requirement → UseCase → Class → Method → Implementation → Test
```

**Task's role:** Navigation node. Sprint→Task→coveredRequirements→[chain starts at Requirement]. Task is the Requirement's NAV PARENT, not its chain child.

---

## Execution Order: Source-First (skill → standards → code → data → views)

### Layer 1: SKILL.md (where the error originated)

| File | Change |
|------|--------|
| `session/agents/robbin-architect/SKILL.md` | Rewrite Rules 1-5: 6-step chain, Task=navigation. Remove all `Req→Task` chain references. Already drafted (local, uncommitted). |

**Verification:** PO reads the corrected SKILL.md — confirms no mention of Task in chain.

**Team audit:** Req-eng audits its decomposition skill for the same error. Planner audits its skill for standards-consistency.

### Layer 2: Standards (3 files)

| File | Line(s) | Change |
|------|---------|--------|
| `traceability-standard.md` | 8, 10, 12, 15, 138 | "LOCKED 7-step" → "LOCKED 6-step". Remove Task from chain diagram. Req forward link = `useCases[]` not `tasks[]`. Already partially drafted (local). |
| `refinement-precedence-analysis.md` | 58, 126, 195, 252 | Chain definition: remove Task. Canonical precedence still lists Task in REFINEMENT order (Req→Task→UC is refinement/creation order) but distinguish from CHAIN order (Req→UC is traceability). |
| `intention-verification-model.md` | 30 | Chain definition: `Requirement → UseCase → Class → Method → Implementation → Test` |

**Verification:** Tester greps all 3 files for "Requirement → Task" in chain context — zero matches. The string "Requirement → Task" may appear in NAVIGATION context only.

### Layer 3: Code (FORWARD_KEYS + server maps + walker)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `TraceModel.ts` | 19 | `requirement: 'tasks'` | `requirement: 'useCases'` |
| `TraceModel.ts` | 133 | `requirement: 'tasks'` (inline FORWARD) | `requirement: 'useCases'` |
| `server.ts` | 548 | `Requirement: ['tasks']` (SCENARIO_FWD) | `Requirement: ['useCases']` |
| `server.ts` | 553 | `Requirement: ['tasks']` (TRACE_FWD) | `Requirement: ['useCases']` |
| `server.ts` | 464 | `requirement: ['tasks']` (full-graph overlay) | `requirement: ['useCases']` |
| `server.ts` | 529 | `/api/trace/roots` reads `tasks` for hasChildren | Read `useCases` for hasChildren |

**Verification:** Tester runs `npx tsx scripts/trace-audit.ts --strict` — structural reachability must hold. Expert runs `/api/trace` — Requirement detail shows UC children, not Task children.

### Layer 4: Data (Requirement.useCases[] population)

**Current state:** 0/82 Requirements have `useCases[]`. All chain paths break at Requirement → (nothing).

**Derivation method for Requirement.useCases[]:**

```
For each Requirement R:
  1. Find Tasks that cover R: T where R.uuid ∈ T.coveredRequirements[]
     (reverse of Task.coveredRequirements — navigation link)
  2. Collect UCs from those Tasks: for each T, get T.useCases[]
  3. Write R.useCases[] = union of all UCs from covering Tasks
```

This derives Requirement→UseCase from the EXISTING data:
- Task.coveredRequirements[] (populated by 23907dd4 backfill — 87/110 tasks have it)
- Task.useCases[] (populated by Phase A + backfills — 57/110 tasks have it)

**Example:**
```
R17.4 (UUID index) ← covered by T124 (T124.coveredRequirements includes R17.4)
T124.useCases[] = [unit.load, ior.resolveClass, ..., index.put, index.get]
→ R17.4.useCases[] = [index.put, index.get] (the UCs that implement indexing)
```

**Problem:** This gives R ALL of T's UCs, not just the ones specific to R. A Task may cover multiple Requirements, and its UCs may serve different Requirements.

**Refined derivation:**
```
For each Requirement R:
  For each Task T where R ∈ T.coveredRequirements[]:
    For each UC in T.useCases[]:
      If UC.name verb matches R's domain (heuristic) OR
      UC was explicitly created for R (UC.ownerIor traces to a Task covering R):
        Add UC to R.useCases[]
```

**Conservative approach (for champagne preservation):** Add ALL of T's UCs to R.useCases[]. This over-links (fan-out) but preserves every existing chain path. The narrowing (R18.1/R18.2) filters at display time. Better to over-link and have champagne work than under-link and break chains.

**Verification:** After population, run champagne audit: every Test reachable from its Requirement root via the 6-step chain. Compare 16/35 (current) — must be >= 16/35 (no regression).

### Layer 5: Views (detail + tree)

| Component | Change |
|-----------|--------|
| Requirement DetailView | Shows "UseCases" as chain children (via Req.useCases[]), NOT "Tasks" |
| rb-trace-tree | Requirement node expands to show UCs, not Tasks |
| /api/trace/roots | Requirement hasChildren = Req.useCases[].length > 0 |

**Verification:** Tester loads /trace, expands a Requirement — sees UseCases as children, not Tasks. Sprint→Task→coveredReq→UC→...→Test navigation path works end-to-end.

---

## Champagne Preservation Proof

**Current champagne:** 16/35 (45%) on the 7-step chain (Req→Task→UC→...→Test).

**After correction:** The 6-step chain (Req→UC→...→Test) must preserve all 16 champagne requirements.

**Proof:** For each currently-champagne Requirement R:
1. R currently reaches Tests via: R.tasks[] → T.useCases[] → UC → ... → Test
2. After correction: R.useCases[] (populated from T's UCs) → UC → ... → Test
3. The UC→...→Test portion is IDENTICAL — only the entry point changes (R.tasks[] → R.useCases[])
4. If R.useCases[] = union(T.useCases[] for all T covering R), then every UC currently reachable via R→T→UC is also reachable via R→UC directly
5. Therefore: every Test reachable on the 7-step chain is also reachable on the 6-step chain. Champagne >= 16/35.

**Risk:** If a Task has useCases[] but its coveredRequirements[] doesn't include R, the derivation misses that UC. Mitigation: the conservative approach (all T's UCs for any T covering R) over-links rather than under-links.

---

## Team Coordination

| Role | Action |
|------|--------|
| **robbin-req** | Audit decomposition skill for Req→Task chain error. Confirm Req→UC is the chain forward. |
| **robbin-planner** | Audit skill for standards-consistency. Confirm Task=navigation in its planning protocol. |
| **robbin-expert** | Execute code changes (Layer 3) + data population (Layer 4) + view updates (Layer 5) — one layer at a time, tester verifies each. |
| **robbin-tester** | Strict-verify after each layer: grep for "Requirement → Task" in chain context, structural audit, champagne count, visual verification. |

---

## Execution Timeline

1. PO reviews this plan → APPROVED/REVISE
2. Layer 1: Architect commits SKILL.md correction
3. Layer 2: Architect commits 3 standards corrections — tester greps
4. Layer 3: Expert commits FORWARD_KEYS + server corrections — tester strict-audit
5. Layer 4: Expert populates Req.useCases[] — tester champagne count (must >= 16/35)
6. Layer 5: Expert commits detail/tree view changes — tester visual verify
7. Champagne re-measure on full 6-step chain

---

**Submitted for PO review.** No execution until approved.
