# R18.29-31: model.unitLinks[] + Atomic Symlink Lifecycle

**Source:** Tron S18 Follow-on D (via robbin-po 2026-06-08).
**Author:** robbin-architect

---

## Problem

Symlink generation (`regenerate-views.ts`) is a SEPARATE step from unit mutation. If it doesn't run (the S18 sprints.json gap), the on-disk symlink tree diverges from the scenario index. There is no mechanism that keeps symlinks consistent with unit data atomically.

## Design: model.unitLinks[] + Lifecycle Methods

### R18.29: model.unitLinks[] (IOR list)

Every scenario unit gains a `model.unitLinks[]` field — the list of symlink paths this unit should have in `scenario/sprints.json/`:

```json
{
  "ior": "ior:class:Task",
  "model": {
    "uuid": "471b9c4a-...",
    "name": "T111: Specialized DetailViews",
    "unitLinks": [
      "sprints.json/sprint-16-traceability-ux/task/task-111-specialized-detailviews.scenario.json"
    ]
  }
}
```

**What it stores:** Relative paths from `scenario/` root. Each entry is a symlink that SHOULD exist pointing to this unit's index file.

**Why:** The unit itself declares its symlinks. No external state needed to know what symlinks should exist. `syncLinks()` reads `unitLinks[]` and ensures the on-disk symlinks match.

### R18.30: ScenarioIndex lifecycle methods

Extend `ScenarioIndex` with three methods:

```typescript
class ScenarioIndex {
  // Existing: put, get, has, list, remove

  /** Add a symlink for this unit. Updates model.unitLinks[] AND creates on-disk symlink. */
  addLink(uuid: string, linkPath: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const links: string[] = unit.model.unitLinks || [];
    if (!links.includes(linkPath)) links.push(linkPath);
    unit.model.unitLinks = links;
    this.put(uuid, unit);        // persist updated model
    this.ensureSymlink(uuid, linkPath);  // create on-disk symlink
  }

  /** Remove a symlink. Updates model.unitLinks[] AND removes on-disk symlink. */
  removeLink(uuid: string, linkPath: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const links: string[] = (unit.model.unitLinks || []).filter(l => l !== linkPath);
    unit.model.unitLinks = links;
    this.put(uuid, unit);
    this.removeSymlink(linkPath);
  }

  /** Sync ALL symlinks for this unit: create missing, remove stale. */
  syncLinks(uuid: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const declared = new Set<string>(unit.model.unitLinks || []);
    // Create missing
    for (const linkPath of declared) {
      this.ensureSymlink(uuid, linkPath);
    }
    // Remove stale (symlinks pointing to this unit that aren't in unitLinks[])
    // Walk sprints.json tree, find symlinks → this uuid, remove if not in declared
  }

  private ensureSymlink(uuid: string, linkPath: string): void {
    const target = path.relative(
      path.dirname(path.join(this.scenarioRoot, linkPath)),
      this.filePath(uuid)
    );
    const fullPath = path.join(this.scenarioRoot, linkPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    try { fs.unlinkSync(fullPath); } catch {}
    fs.symlinkSync(target, fullPath);
  }

  private removeSymlink(linkPath: string): void {
    const fullPath = path.join(this.scenarioRoot, linkPath);
    try { fs.unlinkSync(fullPath); } catch {}
  }
}
```

### R18.31: Atomic consistency on every mutation

**The rule:** Every `put()` call that changes forward arrays ALSO calls `syncLinks()`.

```typescript
// BEFORE (current): put() writes JSON only, symlinks are a separate step
index.put(uuid, unit);
// ... later, maybe: regenerate-views.ts (missable)

// AFTER: put() + syncLinks() atomic
index.put(uuid, unit);
index.syncLinks(uuid);   // always runs, never missable
```

**Where mutations happen:**
1. `migrate-to-scenario.ts` — creates units → `put()` + `syncLinks()`
2. `populate-forward-refs.ts` — updates forward arrays → `put()` + `syncLinks()`
3. `fill-source-locations.ts` — updates sourceFile/Line → `put()` (no symlink change)
4. `strip-back-refs.ts` — removes fields → `put()` (no symlink change)
5. Architect/expert data fills (python scripts) → should call `syncLinks()` after

**Alternatively:** Override `put()` itself to auto-sync:

```typescript
put(uuid: string, scenario: ScenarioUnit): void {
  // ... write JSON (existing)
  // Auto-sync symlinks if unitLinks[] present
  if (scenario.model.unitLinks?.length) {
    this.syncLinks(uuid);
  }
}
```

This makes symlink consistency automatic on EVERY write. No separate step needed.

### unitLinks[] Population

On initial migration, `migrate-to-scenario.ts` computes the symlink paths:

```typescript
function computeLinks(unit: ScenarioUnit, sprintSlug: string): string[] {
  const type = unit.ior.replace('ior:class:', '').toLowerCase();
  const uuid = unit.model.uuid;
  return [
    `sprints.json/${sprintSlug}/${type}/${uuid}.scenario.json`
  ];
}
```

For units in multiple sprints (e.g., a Requirement referenced by tasks in S15 and S16), multiple links are added.

### regenerate-views.ts Becomes a Verification Tool

After R18.29-31, `regenerate-views.ts` shifts from GENERATOR to VERIFIER:
- Walk all units → check `unitLinks[]` matches on-disk symlinks
- Report mismatches (shouldn't happen if `put()` auto-syncs)
- Fix any mismatches found (self-healing)

## Per-File Changes

| File | Change |
|------|--------|
| `src/ts/scenario/index-store.ts` | Add `addLink()`, `removeLink()`, `syncLinks()`, `ensureSymlink()`, `removeSymlink()`. Add `scenarioRoot` to constructor. Auto-sync in `put()`. |
| `src/ts/scenario/types.ts` | Add `unitLinks?: string[]` to `ScenarioUnit.model` type |
| `scripts/migrate-to-scenario.ts` | Compute `unitLinks[]` on creation, call `syncLinks()` |
| `scripts/populate-forward-refs.ts` | After each `put()`, call `syncLinks()` |
| `scripts/regenerate-views.ts` | Shift to verification mode (check unitLinks[] vs disk) |

## Rule-pair: (a)+(b) EXEMPT (server/data only), (c) N/A

---

**Formulated by:** robbin-architect (2026-06-08)
