[Back to Sprint 17 Planning](./planning.md)

# T152: UseCase data-quality migration — auto-derive object.verb + populate ref arrays

[task:uuid:placeholder — planner to assign]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect pre-design)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Design (robbin-architect, 2026-06-01)

### Current gap

15 UseCase scenarios in the index. ALL have:
- `model.object: ''` (empty)
- `model.verb: ''` (empty)
- `model.tasks: []` (empty)
- `model.classes: []` (empty)
- `model.requirement: null`

Yet ALL names follow Object.verb pattern (`unit.load`, `ior.resolveClass`, `view.renderMd`, etc.) and ALL PUML source blocks contain requirement + task refs.

Additionally, S16 has 17 UCs in PUML (not yet migrated to scenario units at all).

### Two-part fix

#### Part 1: Auto-derive `model.object` + `model.verb` from `model.name`

```typescript
function deriveObjectVerb(name: string): { object: string; verb: string } {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return { object: name, verb: '' };
  return {
    object: name.slice(0, lastDot),   // 'ior' from 'ior.resolveClass'
    verb: name.slice(lastDot + 1),     // 'resolveClass' from 'ior.resolveClass'
  };
}
```

Applied to all 15 existing UCs + any future UCs where object/verb are empty.

**Audit evidence (15 UCs):**

| name | → object | → verb |
|------|----------|--------|
| unit.load | unit | load |
| ior.resolveClass | ior | resolveClass |
| ior.resolveInstance | ior | resolveInstance |
| index.put | index | put |
| index.get | index | get |
| view.renderHtml | view | renderHtml |
| view.renderMd | view | renderMd |
| view.liveUpdate | view | liveUpdate |
| tree.generateMd | tree | generateMd |
| tree.navigate | tree | navigate |
| tree.symlinkJson | tree | symlinkJson |
| migrate.sprintToScenario | migrate | sprintToScenario |
| migrate.preserveHierarchy | migrate | preserveHierarchy |
| planning.generate | planning | generate |
| chain.traceMethodToReq | chain | traceMethodToReq |

All 15 split cleanly. Zero ambiguity.

#### Part 2: Parse PUML blocks → populate model arrays

Two PUML formats to parse:

**S17 format (free-form):**
```
class "unit.load" <<UseCase>> {
    [uc:uuid:17a00101-...]
    R17.1 + R17.2              ← requirement refs
    T124.1 / T125              ← task refs
    Read scenario JSON...      ← description (ignore for ref parsing)
}
```

Parse rules:
- Lines matching `R\d+\.\d+` → requirement refs (split on `+` or `/` or `,`)
- Lines matching `T\d+(?:\.\d+)?` → task refs (split on `/` or `,`)

**S16 format (structured fields):**
```
class "detailDrawer.open" <<UseCase>> {
    [uc:uuid:16a01001-...]
    requirement: R16.1
    task: T110
    object: RbDetailDrawer
    verb: open
}
```

Parse rules:
- `requirement:` line → requirement ref
- `task:` line → task ref
- `object:` / `verb:` lines → direct field values (override auto-derived if present)

**Ref resolution:** `R17.1` → look up in requirements index by name pattern → `ior:instance:<req-uuid>`. `T124` → look up in task index by slug pattern `task-124-*` → `ior:instance:<task-uuid>`.

### Migration script: extend `scripts/migrate-to-scenario.ts`

Add a new pass after UC creation (or as a separate `--fix-uc-quality` mode):

```typescript
function fixUcDataQuality(idx: ScenarioIndex): void {
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (unit?.ior !== 'ior:class:UseCase') continue;
    const m = unit.model as Record<string, unknown>;

    // Part 1: derive object + verb if empty
    if (!m.object || !m.verb) {
      const { object, verb } = deriveObjectVerb(String(m.name || ''));
      m.object = object;
      m.verb = verb;
    }

    // Part 2: populate arrays from PUML source (if source field exists)
    // Source was written by T140 — contains ior:file:<puml-path>?lines=<range>
    // Read the PUML, extract the <<UseCase>> block for this UC, parse refs
    if (m.source) {
      const pumlRefs = parsePumlUcBlock(String(m.source), String(m.name));
      if (pumlRefs.requirements.length && !(m.tasks as string[])?.length) {
        m.requirements = pumlRefs.requirements;  // populated, not overwritten if already set
      }
      if (pumlRefs.tasks.length && !(m.tasks as string[])?.length) {
        m.tasks = pumlRefs.tasks;
      }
      if (pumlRefs.classes.length && !(m.classes as string[])?.length) {
        m.classes = pumlRefs.classes;
      }
    }

    idx.put(uuid, unit);
  }
}
```

### Per-UC audit (no-info-loss discipline, matching T151)

| UC name | object | verb | reqs | tasks | classes |
|---------|--------|------|------|-------|---------|
| unit.load | unit | load | R17.1,R17.2 | T124.1,T125 | ScenarioIndex |
| ior.resolveClass | ior | resolveClass | R17.2 | T124.1,T125 | ClassRegistry |
| ... | ... | ... | ... | ... | ... |

Before count (empty fields) → after count (populated) per UC. Every UC must have object+verb non-empty after migration.

### S16 UC migration (bonus scope)

S16 has 17 UCs in PUML but NOT in the scenario index. The existing `migrate-to-scenario.ts` already has UC PUML parsing (lines 224-260). Extend it to also run on S16:

```bash
npx tsx scripts/migrate-to-scenario.ts --sprint sprint-16-traceability-ux --apply
```

This creates 17 new UC scenario units from S16's PUML, with object/verb/task/requirement populated from the structured fields.

### Touchpoints

| File | Change |
|------|--------|
| `scripts/migrate-to-scenario.ts` | Add `fixUcDataQuality()` pass + `deriveObjectVerb()` |
| `scripts/migrate-to-scenario.ts` | Run S16 migration (17 new UC units) |
| `src/ts/scenario/classes.ts` | No change — UseCaseLoader already has object/verb/tasks/classes/requirement fields |

### No new routes, no STATIC_SHELL change.

### Acceptance criteria (architect-proposed)
- [ ] All 15 S17 UCs have non-empty `model.object` + `model.verb` (auto-derived from name)
- [ ] All 15 S17 UCs have populated `model.tasks[]` and/or `model.requirement` (from PUML parsing)
- [ ] 17 S16 UCs migrated to scenario index with object/verb/task/requirement from structured PUML fields
- [ ] Per-UC audit table: before-empty → after-populated count per field, per UC
- [ ] Zero info loss: every PUML ref appears in the corresponding JSON array

## Subtasks
None (single migration pass).

---

*Pre-design by robbin-architect — awaiting planner task file stand-up*
