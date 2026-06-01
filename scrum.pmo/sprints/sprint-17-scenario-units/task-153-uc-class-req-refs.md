[Back to Sprint 17 Planning](./planning.md)

# T153: UC data-quality extension — class refs + requirement refs from PUML

[task:uuid:placeholder — planner to assign]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect pre-design)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Design (robbin-architect, 2026-06-01)

Extends T152's `fixUcDataQuality()` with two additional parsers for `model.classes[]` and `model.requirement`.

### Source data in PUML

**S17 class refs** — arrow lines after the UC blocks:
```
"unit.load" --> SU : implements
"unit.load" --> IR : uses
"ior.resolveClass" --> CR : uses
```

Class alias map (from `class "Name" as ALIAS` declarations):
| Alias | Class |
|-------|-------|
| SU | ScenarioUnit |
| IR | IORResolver |
| CR | ClassRegistry |
| SI | ScenarioIndex |
| ST | SpeakingTree |
| VT | ViewTemplateRegistry |

**S16 class refs** — `object:` field inside UC blocks:
```
object: RbDetailDrawer
object: RbTaskDetail
object: RbRequirementDetail
```

**S17 requirement refs** — free-form in UC blocks:
```
R17.1 + R17.2     → two requirement refs
R17.4             → one requirement ref
R17.7 + R17.8     → two
```

**S16 requirement refs** — structured field:
```
requirement: R16.1
requirement: R16.2
```

### Parsing implementation

#### Class refs parser

```typescript
function parseClassRefs(pumlText: string, ucName: string, aliasMap: Map<string, string>): string[] {
  // S17: parse arrow lines "ucName" --> ALIAS : relation
  const arrows = pumlText.matchAll(
    new RegExp(`"${ucName.replace('.', '\\.')}"\\s*-->\\s*(\\w+)\\s*:`, 'g')
  );
  const classes: string[] = [];
  for (const m of arrows) {
    const className = aliasMap.get(m[1]) || m[1];
    classes.push(className);
  }
  return classes;
}

function parseAliasMap(pumlText: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of pumlText.matchAll(/class\s+"([^"]+)"\s+as\s+(\w+)/g)) {
    if (!m[0].includes('<<UseCase>>')) {  // skip UC classes
      map.set(m[2], m[1]);  // alias → full name
    }
  }
  return map;
}

// S16: object: field IS the class name
function parseS16ObjectAsClass(ucBlock: string): string | null {
  const m = ucBlock.match(/object:\s*(\S+)/);
  return m ? m[1] : null;
}
```

**Result for S17 UCs:**

| UC | → model.classes[] |
|----|-------------------|
| unit.load | [ScenarioUnit, IORResolver] |
| ior.resolveClass | [IORResolver, ClassRegistry] |
| ior.resolveInstance | [IORResolver, ScenarioIndex] |
| index.put | [ScenarioIndex] |
| index.get | [ScenarioIndex] |
| tree.symlinkJson | [SpeakingTree] |
| tree.generateMd | [SpeakingTree, ViewTemplateRegistry] |
| tree.navigate | — (no arrows found) |
| view.renderHtml | [ViewTemplateRegistry] |
| view.renderMd | [ViewTemplateRegistry] |
| view.liveUpdate | — (no arrows) |
| planning.generate | [ViewTemplateRegistry] |
| migrate.sprintToScenario | [ScenarioUnit, ScenarioIndex] |
| migrate.preserveHierarchy | [SpeakingTree] |
| chain.traceMethodToReq | — (no arrows) |

**Result for S16 UCs (from object: field):**

| UC | → model.classes[] |
|----|-------------------|
| detailDrawer.open | [RbDetailDrawer] |
| detailDrawer.close | [RbDetailDrawer] |
| taskDetail.render | [RbTaskDetail] |
| requirementDetail.render | [RbRequirementDetail] |
| ... | ... |

#### Requirement refs parser

```typescript
function parseReqRefs(ucBlock: string, reqIndex: Map<string, string>): string | string[] {
  // S16 structured: "requirement: R16.1"
  const structured = ucBlock.match(/requirement:\s*(R\d+\.\d+)/);
  if (structured) {
    return resolveReqRef(structured[1], reqIndex);
  }
  
  // S17 free-form: "R17.1 + R17.2" on a line by itself
  const freeform = ucBlock.match(/^\s*(R\d+\.\d+(?:\s*[+\/,]\s*R\d+\.\d+)*)\s*$/m);
  if (freeform) {
    const refs = freeform[1].split(/\s*[+\/,]\s*/).map(r => r.trim());
    return refs.map(r => resolveReqRef(r, reqIndex)).filter(Boolean);
  }
  return [];
}

function resolveReqRef(rNum: string, reqIndex: Map<string, string>): string {
  // R17.4 → search requirement index for name containing "R17.4"
  // Return ior:instance:<uuid> if found, else keep as "R17.4" string
  for (const [uuid, unit] of reqIndex) {
    if (String(unit.model.name).includes(rNum)) return `ior:instance:${uuid}`;
  }
  return rNum;  // unresolved — keep as label
}
```

**Result for S17 UCs:**

| UC | R-refs in PUML | → model.requirement |
|----|---------------|-------------------|
| unit.load | R17.1 + R17.2 | [ior:instance:\<r17.1-uuid\>, ior:instance:\<r17.2-uuid\>] |
| ior.resolveClass | R17.2 | ior:instance:\<r17.2-uuid\> |
| index.put | R17.4 | ior:instance:\<r17.4-uuid\> |
| view.renderHtml | R17.7 + R17.8 | [ior:instance:\<r17.7-uuid\>, ior:instance:\<r17.8-uuid\>] |
| ... | ... | ... |

**Note on model.requirement type:** Currently `model.requirement: null` (singular). Multiple refs need an array. Decision: change to `model.requirements: []` (plural array) — consistent with `model.tasks[]`, `model.classes[]`. The existing `model.requirement: null` field stays for backward compat but is deprecated.

### Integration into fixUcDataQuality

```typescript
function fixUcDataQuality(idx: ScenarioIndex, pumlFiles: string[]): void {
  // Build alias maps + UC blocks from all PUML files
  const allPumlText = pumlFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
  const aliasMap = parseAliasMap(allPumlText);
  const reqIndex = buildReqIndex(idx);
  
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (unit?.ior !== 'ior:class:UseCase') continue;
    const m = unit.model as Record<string, unknown>;
    const name = String(m.name || '');
    
    // T152 Part 1: object + verb
    if (!m.object || !m.verb) { /* existing T152 logic */ }
    
    // T153: class refs
    if (!(m.classes as string[])?.length) {
      const classRefs = parseClassRefs(allPumlText, name, aliasMap);
      // Also check S16 object: field in the UC block
      const ucBlock = extractUcBlock(allPumlText, name);
      const s16Class = ucBlock ? parseS16ObjectAsClass(ucBlock) : null;
      if (s16Class && !classRefs.includes(s16Class)) classRefs.push(s16Class);
      if (classRefs.length) m.classes = classRefs;
    }
    
    // T153: requirement refs
    if (!m.requirement && !(m.requirements as string[])?.length) {
      const ucBlock = extractUcBlock(allPumlText, name);
      if (ucBlock) {
        const reqRefs = parseReqRefs(ucBlock, reqIndex);
        if (Array.isArray(reqRefs) && reqRefs.length) m.requirements = reqRefs;
        else if (typeof reqRefs === 'string') m.requirements = [reqRefs];
      }
    }
    
    idx.put(uuid, unit);
  }
}
```

### Per-UC audit gate

| UC | object | verb | classes | requirements | tasks |
|----|--------|------|---------|-------------|-------|
| unit.load | unit | load | ScenarioUnit, IORResolver | R17.1, R17.2 | T124.1, T125 |
| ior.resolveClass | ior | resolveClass | IORResolver, ClassRegistry | R17.2 | T124.1, T125 |
| ... | ... | ... | ... | ... | ... |

Before: 0/15 have classes, 0/15 have requirements. After: all populated from PUML. Count gate: every UC with R-refs or arrows in PUML must have corresponding non-empty arrays.

### UseCaseLoader defaults update

```typescript
// classes.ts — add requirements (plural) alongside existing requirement (singular):
export const UseCaseLoader = loader('UseCase', {
  object: '', verb: '',
  tasks: [], classes: [],
  requirement: null,      // deprecated — kept for backward compat
  requirements: [],       // NEW — plural array
});
```

### Touchpoints

| File | Change |
|------|--------|
| `scripts/migrate-to-scenario.ts` | Extend `fixUcDataQuality()` with class + req parsers |
| `src/ts/scenario/classes.ts` | UseCaseLoader: add `requirements: []` default |
| Pre-design file (this) | Per-UC audit table |

### No new routes, no STATIC_SHELL change.

## Subtasks
None (extension of T152 migration pass).

---

*Pre-design by robbin-architect — awaiting planner task file stand-up*
