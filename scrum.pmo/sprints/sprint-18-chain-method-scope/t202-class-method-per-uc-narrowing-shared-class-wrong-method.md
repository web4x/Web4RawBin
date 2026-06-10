[Back to Sprint 18 Planning](./planning.md)

# T202: Class.method-per-UC narrowing — shared Class picks wrong method
[task:uuid:8a303a65-d8c1-4aa3-885e-e10e5c3f00ca]

> **Stand-up:** PO direction 2026-06-09 — follow-on to T187 chain narrowing. Per
> learning #38 (placeholder-then-canonicalize), this task carries a planner
> placeholder Requirement unit; req-eng (CMM4 role 1) to canonicalize: capture
> verbatim Tron quote, assign canonical R18.x altId, replace placeholder uuid in
> coveredRequirements[].

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 18 Planning](./planning.md)
  - [Sprint 18](../../../scenario/sprints.json/sprint-18-chain-method-scope/sprint.json) `[ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962]`
  - **Placeholder Requirement** `[requirement:uuid:4d525a4d-5094-4288-9607-3d300efceeca]` — sibling of canonical R18.13; req-eng to canonicalize (verbatim Tron quote + real R18.x altId)
- follows
  - **T187** `[task:uuid:292d8931-efff-45ab-b66e-772fac16c6ea]` — Trace narrowing chain walker selects ONE method per UC, not Class.methods[] fan-out. T202 addresses the defect surfaced AFTER T187's narrowing landed: when ≥2 UCs share a Class, narrowing alone isn't enough — the resolver must use per-UC `chainMethod` context.
- down
  - None (atomic task)
- scenario units:
  - task: `scenario/index/8/a/3/0/3/8a303a65-d8c1-4aa3-885e-e10e5c3f00ca.scenario.json`
  - placeholder req: `scenario/index/4/d/5/2/5/4d525a4d-5094-4288-9607-3d300efceeca.scenario.json`

## Owners (CMM4 4-role per learning #18)

| Role | Owner | Phase |
|------|-------|-------|
| req-eng | robbin-req | canonicalize the placeholder requirement (verbatim Tron quote → real R18.x atomic unit; replace placeholder uuid in T202.coveredRequirements[]) |
| architect | robbin-architect | design — diagnose shared-Class case in `/api/trace/children`; specify UC.chainMethod context plumbing through the expander |
| expert | robbin-expert | implement per architect design; rule-pair (a) `package.json` + (b) `sw.js` if route/bundle surface |
| tester | robbin-tester | reproduce defect (≥2 UCs sharing a Class shows wrong method) + verify fix on real S18 chain data; check no regression on T187 baseline + `trace:audit:strict` per learning #27 |

## Problem Statement

**Symptom (Tron-observed):** A Class shared by two UseCases shows the *wrong* method when the chain expander resolves children for one of the UCs. Example shape: `UCa → Class X → method X.foo` (correct) but the tree shows `UCa → Class X → method X.bar` (which is actually `UCb`'s chainMethod, picked because the expander walks the global `Class.methods[]` fan-out instead of resolving via the active UC's `chainMethod`).

**Sibling of R18.13** (chain narrowing: every chain terminates in Test). T187 fixed the chain *narrowing* (one method per UC) but the *selection* is still wrong when a Class is shared — the wrong UC's method gets picked.

## Design - robbin-architect (2026-06-10)

### Root cause

The /api/trace/children API has no UC context when expanding a shared Class.

Class scenario units carry methods[] (plural) because Class can be reused across UCs. TRACE_FWD says Class:[method] singular (server.ts:554). Lookup finds no method field, scanRepo fallback returns ALL methods (line 580-587). EXPECTED_CHILD_TYPE only restricts type not identity.

Client-side narrowing via the chainMethod closure (rb-trace-tree.ts:217, 226-228) works only for one-hop UC -> Class -> Method within a single render pass. It is LOST whenever:

1. fetchAndRenderChildren (rb-trace-tree.ts:325) is invoked (deep walks, restored localStorage expanded state, or any node whose parent did not pass chainMethod down).
2. The Class is the data-seed-ior (no UC parent in scope).
3. External callers (trace-cli, trace:audit:strict, future SDK) hit the API directly with no client closure state.

S19 makes this real: Class Room (1165c293) is shared by three task-UCs - room.bootstrapAsUnit -> Room.init, room.enforceVisibility -> Room.visibilityCheck, room.maintainPersistentMembers -> Room.memberAdd. Expanding Room from any of those three chains is the exact defect surface.

### Fix - server contract

/api/trace/children/<uuid> accepts a new optional query parameter ?uc=<ucUuid>. When present AND mode=trace AND the resolved unit type is Class, the server narrows children using UC.method instead of Class.methods[] fan-out.

Patch site: src/ts/server/server.ts /api/trace/children handler (line 537+). Insert after const fwdKeys (line 558):

```typescript
const ucParam = urlParams.get("uc") || "";
let narrowedChildRefs: string[] | null = null;

if (queryMode === "trace" && type === "Class" && ucParam) {
  const ucUnit = idx.get(ucParam.replace(/^ior:instance:/, ""));
  if (ucUnit && (ucUnit.ior || "") === "ior:class:UseCase") {
    const ucMethodIor = String((ucUnit.model as Record<string, unknown>).method || "").replace(/^ior:instance:/, "");
    if (ucMethodIor) {
      const classMethods = (unit.model as Record<string, unknown>).methods;
      const arr = Array.isArray(classMethods) ? classMethods.map(m => String(m).replace(/^ior:instance:/, "")) : [];
      if (arr.includes(ucMethodIor)) narrowedChildRefs = [ucMethodIor];
    }
  }
}

let childRefs: string[] = narrowedChildRefs || [];
if (narrowedChildRefs === null) {
  // existing TRACE_FWD / SCENARIO_FWD lookup + scanRepo fallback runs unchanged
}
```

Behavior matrix:

| mode | type | ?uc= | result |
|------|------|------|--------|
| trace | Class | provided + UC.method in Class.methods[] | children=[UC.method] (narrowed) |
| trace | Class | provided but mismatch | falls through to current path |
| trace | Class | absent | current behavior - Class.methods[] fan-out (backward compat) |
| scenario | any | any | unchanged |
| trace | non-Class | any | unchanged |

### Fix - client propagation

rb-trace-tree.ts already plumbs chainMethod through buildSeedNode (line 196). Two changes:

1. Thread ucContext?: string alongside chainMethod. When the parent rendered by the server is a UseCase, capture its uuid and pass to every descendant through buildSeedNode and into the toggle handler fetchAndRenderChildren call.

2. Append \&uc=<ucContext> in fetchAndRenderChildren (line 325) when ucContext is set.

```typescript
private async fetchAndRenderChildren(
  uuid: string, container: HTMLElement,
  ancestors?: Set<string>, ucContext?: string,
): Promise<void> {
  const branchVisited = new Set(ancestors || []);
  branchVisited.add(uuid);
  const ucQuery = ucContext ? \`\&uc=\${encodeURIComponent(ucContext)}\` : "";
  try {
    const res = await fetch(
      \`/api/trace/children/\${encodeURIComponent(uuid)}\${this.modeParam}\${ucQuery}\`,
    );
    const data = await res.json();
    const children = data.children || [];
    for (const child of children) {
      container.appendChild(this.buildSeedNode(
        child.uuid, child.type, child.name, [],
        child.hasChildren, new Set(branchVisited),
        (child as any).chainMethod, ucContext,
      ));
    }
  } catch { /* silent */ }
}
```

When the rendered node IS a UseCase, set ucContext = uuid for its descendants. When it is a Method/Implementation/Test, ucContext is inherited from the parent so nested expand fetches (Impl -> Test) still know which chain they belong to.

### Backwards compatibility

- Requests without ?uc= see no change. trace-cli, trace:audit:strict, external SDK still get full Class.methods[] fan-out. AC4 + AC5 preserved.
- Response shape UNCHANGED - same children:[...] array, same per-child fields. Only filter behavior gated on new param.
- Client bundle hash CHANGES - rule-pair (a) package.json + (b) sw.js CACHE_NAME bump per AC6.


## Acceptance Criteria

- [ ] AC1: When the same Class is shared by ≥2 UseCases, expanding its node in /trace tree shows ONLY the method tied to the active UC's `chainMethod` (not all `Class.methods[]`).
- [ ] AC2: `/api/trace/children` accepts/uses a UC `chainMethod` context parameter (or equivalent) so the expander resolves per-UC, not per-Class.
- [ ] AC3: Tester reproduces the original defect (two UCs share a Class, current behaviour shows wrong method) and verifies the fix on real S18 chain data.
- [ ] AC4: No regression on single-UC Class cases (T187 chain narrowing baseline preserved).
- [ ] AC5: `trace:audit:strict` still passes per learning #27.
- [ ] AC6: Rule-pair (a) `package.json` + (b) `sw.js` bump if `/api/trace/children` is route/bundle surface (per learnings #15 + #16).

## Test Scenarios

File: `test/e2e/trace-class-method-per-uc.spec.ts` (proposed)

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Stage two UCs (`UCa`, `UCb`) that share a Class `X`; each UC has a distinct `chainMethod` (`X.foo` for `UCa`, `X.bar` for `UCb`). Expand `Class X` from `UCa`'s chain via `/api/trace/children`. | Tree shows ONLY `X.foo`. |
| TS2 | Same fixture; expand from `UCb`'s chain. | Tree shows ONLY `X.bar`. |
| TS3 | Single-UC Class (T187 baseline) — `UCc → ClassY` where `Y.methods[]=[Y.zoo]`. | Tree shows `Y.zoo` (no regression). |
| TS4 | Request `/api/trace/children/<Class X>` without UC context (e.g. trace-cli). | Returns `Class.methods[]` per current behaviour (backwards compat). |

## Dependencies

- **Requires:** T187 (chain walker narrowing) — landed and tester-executing.
- **Enables:** complete chain narrowing for shared-Class cases; closes the residual defect after T187.

## Definition of Done

- [ ] All AC met; per-UC chain selection wired through `/api/trace/children`.
- [ ] Test suite green (`npm run test:e2e` includes the new spec).
- [ ] `trace:audit:strict` clean (no chain-walk regressions, per learning #27).
- [ ] Tron QA approved.

## QA Audit & User Feedback

- 2026-06-09: Stand-up by robbin-planner (PO directive 2026-06-09). Sibling/follow-on of T187 R18.13. Placeholder Requirement created per learning #38; req-eng to canonicalize.
- Pending: req-eng verbatim Tron-quote capture, architect design, expert impl, tester verify.

## Subtasks
None (atomic task — single-fix scope per PO direction 2026-06-09).

---

*Sprint 18 — Chain Method-Scope & Role Skills*
*Owners: req-eng → architect → expert → tester (CMM4 4-role)*
*Priority: follows T187*
