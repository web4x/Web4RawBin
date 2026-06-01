[Back to Sprint 17 Planning](./planning.md)

# T153: UC data-quality extension — class refs + requirement refs from PUML

[task:uuid:placeholder — planner to assign]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect pre-design + blocker fix)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Design (robbin-architect, 2026-06-01)

Extends T152's `fixUcDataQuality()` with class ref + requirement ref parsers.

### Blocker: R-number → UUID resolution (PO-flagged)

**Problem:** PUML has `R17.1`, but requirement scenario `model.name` is Tron quote text (e.g. `"> TRON: "each instance becomes..."`), not `R17.1`. No field in the scenario JSON maps R-numbers to UUIDs.

**Fix: `model.altId` field on Requirement units** (Option A — most resilient)

```typescript
// RequirementLoader defaults extension:
export const RequirementLoader = loader('Requirement', {
  description: '', priority: '', source: '',
  tasks: [], tests: [],
  altId: '',  // NEW — sprint-scoped R-number: "R17.1", "R16.3"
});
```

**Migration to populate `altId`:** Parse `requirements.md` lines matching `**R\d+\.\d+:` pattern, extract R-number, write to corresponding scenario JSON:

```typescript
function populateReqAltIds(idx: ScenarioIndex, reqFile: string): void {
  const text = fs.readFileSync(reqFile, 'utf-8');
  const re = /\*\*(R\d+\.\d+):[^*]*\*\*\s*\n\s*\[requirement:uuid:([0-9a-f-]{36})\]/gi;
  for (const m of text.matchAll(re)) {
    const altId = m[1];  // "R17.1"
    const uuid = m[2].toLowerCase();
    const unit = idx.get(uuid);
    if (unit?.ior === 'ior:class:Requirement') {
      (unit.model as Record<string, unknown>).altId = altId;
      idx.put(uuid, unit);
    }
  }
}
```

**Then R-number lookups become trivial:**

```typescript
function resolveReqRef(rNum: string, idx: ScenarioIndex): string {
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (unit?.ior === 'ior:class:Requirement' && unit.model.altId === rNum) {
      return `ior:instance:${uuid}`;
    }
  }
  return rNum;  // unresolved — keep as label
}
```

### Class refs parser

**S17:** Arrow lines after UC blocks:
```
"unit.load" --> SU : implements
```
Alias map from `class "ScenarioUnit" as SU` declarations (6 aliases in S17).

**S16:** `object:` field inside UC block IS the implementing class name.

```typescript
function parseClassRefs(pumlText: string, ucName: string, aliasMap: Map<string, string>): string[] {
  const escaped = ucName.replace('.', '\\.');
  const arrows = pumlText.matchAll(new RegExp(`"${escaped}"\\s*-->\\s*(\\w+)\\s*:`, 'g'));
  const classes: string[] = [];
  for (const m of arrows) {
    classes.push(aliasMap.get(m[1]) || m[1]);
  }
  // S16 fallback: object: field
  const block = extractUcBlock(pumlText, ucName);
  if (block) {
    const obj = block.match(/object:\s*(\S+)/);
    if (obj && !classes.includes(obj[1])) classes.push(obj[1]);
  }
  return classes;
}
```

**S17 audit (12/15 UCs get classes):**

| UC | classes from arrows |
|----|-------------------|
| unit.load | ScenarioUnit, IORResolver |
| ior.resolveClass | IORResolver, ClassRegistry |
| ior.resolveInstance | IORResolver, ScenarioIndex |
| index.put | ScenarioIndex |
| index.get | ScenarioIndex |
| tree.symlinkJson | SpeakingTree |
| tree.generateMd | SpeakingTree, ViewTemplateRegistry |
| tree.navigate | — |
| view.renderHtml | ViewTemplateRegistry |
| view.renderMd | ViewTemplateRegistry |
| view.liveUpdate | — |
| planning.generate | ViewTemplateRegistry |
| migrate.sprintToScenario | ScenarioUnit, ScenarioIndex |
| migrate.preserveHierarchy | SpeakingTree |
| chain.traceMethodToReq | — |

### Requirement refs parser

```typescript
function parseReqRefs(ucBlock: string): string[] {
  // S16: "requirement: R16.1"
  const structured = ucBlock.match(/requirement:\s*(R\d+\.\d+)/);
  if (structured) return [structured[1]];
  // S17: "R17.1 + R17.2" on its own line
  const freeform = ucBlock.match(/^\s*(R\d+\.\d+(?:\s*[+\/,]\s*R\d+\.\d+)*)\s*$/m);
  if (freeform) return freeform[1].split(/\s*[+\/,]\s*/);
  return [];
}
// Then resolve each via altId lookup
```

### Schema change: `model.requirements[]` (plural)

```typescript
export const UseCaseLoader = loader('UseCase', {
  object: '', verb: '',
  tasks: [], classes: [],
  requirement: null,     // deprecated
  requirements: [],      // NEW — plural array of ior:instance refs
});
```

### Execution order

1. Run `populateReqAltIds()` on ALL sprints' requirements.md → every Requirement scenario gets `model.altId`
2. Run `fixUcDataQuality()` with class + req parsers → UCs get `model.classes[]` + `model.requirements[]`
3. Per-UC audit: every UC with PUML refs → non-empty arrays

### Touchpoints

| File | Change |
|------|--------|
| `src/ts/scenario/classes.ts` | RequirementLoader: add `altId: ''`. UseCaseLoader: add `requirements: []` |
| `scripts/migrate-to-scenario.ts` | Add `populateReqAltIds()` + extend `fixUcDataQuality()` with class+req parsers |

### No new routes, no STATIC_SHELL change.

## Subtasks
None (extension of T152 migration pass + altId backfill).

---

*Pre-design by robbin-architect — awaiting planner task file stand-up*
