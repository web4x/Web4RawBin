[Back to Sprint 17 Planning](./planning.md)

# T175: Tree base + Traceability layer + typed chain resolution (R-N1/N2/N3)
[task:uuid:20e89691-a5dc-4576-85dd-e1eec19b0f10]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - **R-N1** `[requirement:uuid:2681ad2a-c2ad-4429-9754-4e0db808ba5f]` — tree items never overflow panel width (item width overflow)
  - **R-N2** `[requirement:uuid:cf759d95-ae5e-41db-9caa-55f9648d15cf]` — /scenario tree expand/collapse state persists (per seed IOR)
  - **R-N3** `[requirement:uuid:b323f3b9-25ca-40eb-8cbb-eedb0f888f3c]` — Tree base class; **Traceability EXTENDS Tree** (PO correction captured by architect); typed classes extend Traceability with chainPosition; parent/children getters derive from LOCKED chain
- follows
  - T168 (7-step LOCKED chain — Traceability + canonical walk), T172 (forward-ref population — feeds the Tree children resolver), T174 (drawer UX + /scenario surface)
- down
  - None (atomic task)

## Design (Architect — robbin-architect, 2026-06-03)

### Class Hierarchy (PO correction: Traceability EXTENDS Tree)

```
Tree (abstract base)
  ├── parent: Tree | null          (getter/setter)
  ├── children: Tree[]             (getter/setter)
  └── abstract type: string

Traceability extends Tree
  ├── aboveType: ObjectType | null (chain position: what type is MY parent?)
  ├── belowType: ObjectType | null (chain position: what type are MY children?)
  ├── get parent(): Traceability   (resolves via aboveType)
  ├── get children(): Traceability[] (resolves via belowType)
  └── chainPosition: { above: ObjectType | null, below: ObjectType | null }

Requirement extends Traceability    { above: null (ROOT),       below: 'task' }
Task extends Traceability           { above: 'requirement',     below: 'usecase' }
UseCase extends Traceability        { above: 'task',            below: 'class' }
TraceClass extends Traceability     { above: 'usecase',         below: 'method' }
Method extends Traceability         { above: 'class',           below: 'implementation' }
Implementation extends Traceability { above: 'method',          below: 'test' }
Test extends Traceability           { above: 'implementation',  below: null (LEAF) }
```

### Tree Base Class

```typescript
// src/ts/shared/TraceModel.ts — NEW abstract base:

export abstract class Tree {
  abstract readonly type: string;
  abstract readonly uuid: string;
  
  /** Parent in the tree (null for roots) */
  get parent(): Tree | null { return this.resolveParent(); }
  
  /** Children in the tree (empty for leaves) */
  get children(): Tree[] { return this.resolveChildren(); }
  
  /** Does this node have children? */
  get hasChildren(): boolean { return this.children.length > 0; }
  
  /** Is this a root node? */
  get isRoot(): boolean { return this.parent === null; }
  
  /** Is this a leaf node? */
  get isLeaf(): boolean { return this.children.length === 0; }
  
  protected abstract resolveParent(): Tree | null;
  protected abstract resolveChildren(): Tree[];
}
```

### Traceability Layer

```typescript
export abstract class Traceability extends Tree {
  /** The LOCKED chain position for this type */
  abstract readonly chainPosition: {
    above: ObjectType | null;  // what type is my parent in the chain?
    below: ObjectType | null;  // what type are my children in the chain?
  };
  
  // Relation names from T168 CANONICAL_WALK
  private static readonly FORWARD_RELATIONS: Record<ObjectType, string> = {
    requirement: 'tasks',
    task: 'useCases',
    usecase: 'classes',
    class: 'methods',
    method: 'implementations',
    implementation: 'tests',
    test: '',  // LEAF
  };
  
  private static readonly INVERSE_RELATIONS: Record<ObjectType, string> = {
    requirement: '',  // ROOT
    task: 'requirements',
    usecase: 'tasks',
    class: 'useCases',
    method: 'classes',
    implementation: 'methods',
    test: 'implementations',
  };
  
  protected resolveParent(): Tree | null {
    if (!this.chainPosition.above) return null;  // ROOT
    const inverseRel = Traceability.INVERSE_RELATIONS[this.type as ObjectType];
    if (!inverseRel) return null;
    // Walk graph to find parent — forward-only: scan all objects of above-type
    // whose forward relation includes this uuid
    const aboveType = this.chainPosition.above;
    const forwardRel = Traceability.FORWARD_RELATIONS[aboveType];
    for (const candidate of this.graph.ofType(aboveType)) {
      if (candidate.refs(forwardRel).includes(this.uuid)) {
        return candidate as Traceability;
      }
    }
    return null;  // orphan
  }
  
  protected resolveChildren(): Tree[] {
    if (!this.chainPosition.below) return [];  // LEAF
    const forwardRel = Traceability.FORWARD_RELATIONS[this.type as ObjectType];
    if (!forwardRel) return [];
    return this.graph.resolve(this, forwardRel, this.chainPosition.below);
  }
}
```

### Typed Classes (extend Traceability)

```typescript
export class Requirement extends Traceability {
  readonly type = 'requirement' as const;
  readonly chainPosition = { above: null, below: 'task' as ObjectType };
}

export class Task extends Traceability {
  readonly type = 'task' as const;
  readonly chainPosition = { above: 'requirement' as ObjectType, below: 'usecase' as ObjectType };
}

export class UseCase extends Traceability {
  readonly type = 'usecase' as const;
  readonly chainPosition = { above: 'task' as ObjectType, below: 'class' as ObjectType };
}

export class TraceClass extends Traceability {
  readonly type = 'class' as const;
  readonly chainPosition = { above: 'usecase' as ObjectType, below: 'method' as ObjectType };
}

export class Method extends Traceability {
  readonly type = 'method' as const;
  readonly chainPosition = { above: 'class' as ObjectType, below: 'implementation' as ObjectType };
}

export class Implementation extends Traceability {
  readonly type = 'implementation' as const;
  readonly chainPosition = { above: 'method' as ObjectType, below: 'test' as ObjectType };
}

export class Test extends Traceability {
  readonly type = 'test' as const;
  readonly chainPosition = { above: 'implementation' as ObjectType, below: null };
}
```

### R-N1: Item Width Overflow

Tree items (`rb-object-item`) can overflow the tree panel width when titles are long. Fix:

```css
rb-object-item {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* On hover: show full title */
rb-object-item:hover {
  white-space: normal;
  word-break: break-word;
}

/* Tree panel must constrain */
.trace-tree-panel {
  overflow-x: hidden;
}
```

### R-N2: Expand/Collapse State Correctness on /scenario

Current `/scenario` tree (`renderSeed` + `buildLazyChild`) tracks expand state locally per DOM node via `kids.style.display`. But the main `/trace` tree persists expand state in `localStorage` (`LS_KEY = 'rawbin-trace-expanded'`).

For `/scenario`:
- Use a SEPARATE localStorage key: `rawbin-scenario-expanded-<ior>` (scoped per seed IOR)
- On expand: add uuid to set, save
- On collapse: remove uuid, save
- On page load: restore expand state from localStorage

```typescript
// rb-trace-tree.ts — renderSeed and buildLazyChild should use:
private scenarioExpandKey(): string {
  const seed = this.getAttribute('data-seed-ior') || '';
  return `rawbin-scenario-expanded-${seed}`;
}

private isExpanded(uuid: string): boolean {
  try {
    const set = new Set(JSON.parse(localStorage.getItem(this.scenarioExpandKey()) || '[]'));
    return set.has(uuid);
  } catch { return false; }
}

private toggleExpanded(uuid: string, open: boolean): void {
  try {
    const set = new Set(JSON.parse(localStorage.getItem(this.scenarioExpandKey()) || '[]'));
    if (open) set.add(uuid); else set.delete(uuid);
    localStorage.setItem(this.scenarioExpandKey(), JSON.stringify([...set]));
  } catch {}
}
```

### Migration Path (TraceObject → Tree → Traceability)

The change is backwards-compatible:
1. `Tree` is a NEW abstract base — nothing currently extends it
2. `Traceability` is NEW — sits between `Tree` and existing typed classes
3. Existing `TraceObject` becomes `Traceability` (rename + add chainPosition)
4. All existing typed classes gain `parent`/`children` getters automatically
5. `rb-trace-tree` can use `obj.children` instead of manually walking `links`

### Files to Modify

| File | Change | Atom |
|------|--------|------|
| `src/ts/shared/TraceModel.ts` | Add Tree base, Traceability layer, chainPosition on typed classes | R-N3 |
| `src/public/app.css` | Item overflow: ellipsis + hover expand | R-N1 |
| `src/public/ts/trace/rb-object-item.ts` | max-width constraint | R-N1 |
| `src/public/ts/trace/rb-trace-tree.ts` | Use obj.children for tree building; scenario expand state in localStorage | R-N2, R-N3 |
| `package.json` + `sw.js` | Rule-pair (a)+(b) | |

STATIC_SHELL (c): exempt — no new route.

### AC (architect-proposed)
- [ ] R-N3: Tree base class with parent/children getters; Traceability extends Tree with chainPosition; all 7 typed classes extend Traceability
- [ ] R-N3b: `obj.children` returns correctly-typed children per LOCKED chain position (Requirement.children = Tasks, Task.children = UseCases, etc.)
- [ ] R-N3c: `obj.parent` resolves to the correct above-type via forward-scan (no back-refs stored)
- [ ] R-N1: Tree items never overflow the panel width; long titles show ellipsis, hover reveals full text
- [ ] R-N2: /scenario tree expand/collapse state persists in localStorage (scoped per seed IOR)
- [ ] Backwards compatible: /trace tree still works with the new class hierarchy
- [ ] Rule-pair (a)+(b)

---

## Requirement UUIDs (planner — fresh v4 via uuidgen)

- **R-N1** `[requirement:uuid:2681ad2a-c2ad-4429-9754-4e0db808ba5f]` — tree item width overflow (ellipsis + hover-reveal)
- **R-N2** `[requirement:uuid:cf759d95-ae5e-41db-9caa-55f9648d15cf]` — /scenario tree expand/collapse state persists in localStorage scoped per seed IOR
- **R-N3** `[requirement:uuid:b323f3b9-25ca-40eb-8cbb-eedb0f888f3c]` — Tree base class; Traceability EXTENDS Tree; typed classes extend Traceability; parent/children derive from LOCKED chain position

(req-eng owns formal Requirement scenario units anchored to verbatim Tron quotes; planner pre-seeds these v4s so the chain is wireable.)

## Subtasks
None (atomic task — PO-directed single consolidated effort; architect designs Tree hierarchy + UX as one coherent piece).

## QA Audit & User Feedback
- 2026-06-03: PO directs T175 stand-up covering R-N1/R-N2/R-N3 — "single consolidated task; R-N3 architectural core; 4-role planner-first; architect designs Tree class hierarchy."
- 2026-06-03: Architect `fe6d2289` ships design ahead of planner scaffold — Tree base + Traceability layer + typed chain resolution; **PO correction captured: Traceability EXTENDS Tree** (not the reverse from PO's initial seed hint).
- 2026-06-03: Planner reconciled per learning #20 — my `task-175-scenario-tree-base-class.md` scaffold removed; architect's `task-175-tree-base-traceability-typed-classes.md` adopted as authoritative; fake-suffix uuid `e1f2a3b4-…-175000000001` replaced with planner v4 `20e89691-a5dc-4576-85dd-e1eec19b0f10` (learning #17); Subtasks + QA Audit + Requirement UUIDs sections added for audit compliance; R-N1/N2/N3 requirement uuid links wired into Traceability.
- Pending: expert impl (rule-pair (a)+(b); (c) STATIC_SHELL exempt per architect — no new route), tester verifies R-N1/N2/N3 ACs, then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.1
**Sprint:** Sprint 17 — Scenario Units
**Phase:** 31 — R-N (Tree base class + /scenario tree UX)
**Owners (CMM4):** robbin-req (verbatim capture R-N1/N2/N3) → robbin-architect `fe6d2289` (design — Traceability EXTENDS Tree; typed chain resolution) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (verify R-N1/N2/N3 ACs; /trace regression check)
**R-N1 + R-N2 + R-N3:** consolidated — Tree class hierarchy is the foundation that R-N1/N2 UX builds on; one PO-directed task
