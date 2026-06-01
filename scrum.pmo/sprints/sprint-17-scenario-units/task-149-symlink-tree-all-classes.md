[Back to Sprint 17 Planning](./planning.md)

# T149: Extend sprints.json symlink tree to ALL 9 scenario classes

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

### Current state

`scripts/migrate-to-scenario.ts` lines 263-271 creates symlinks ONLY for tasks + sprint:
```
scenario/sprints.json/<sprint>/
├── sprint.json          → ../../index/<prefix>/<uuid>.scenario.json
├── task-124-architecture.json → ../../index/...
├── task-125-foundation.json   → ../../index/...
└── (tasks only — flat, no subdirs)
```

Requirements and UseCases ARE indexed in `scenario/index/` but have NO symlinks in `sprints.json/`. TraceLinks, Classes, Methods, Tests, Users — same gap.

The `.md` side (`scenario/sprints.md/`) IS organized by class:
```
scenario/sprints.md/
├── task/          ← generated .md views
├── requirement/
├── usecase/
├── sprint/
└── tracelink/
```

### Target layout

```
scenario/sprints.json/<sprint>/
├── sprint.json                          → ../../index/<prefix>/<uuid>.scenario.json
├── task/
│   ├── task-124-architecture.json       → ../../../index/<prefix>/<uuid>.scenario.json
│   ├── task-124.1-architect-data-model.json → ...
│   └── ...
├── requirement/
│   ├── avatar-session-persistence.json  → ../../../index/<prefix>/<uuid>.scenario.json
│   └── ...
├── usecase/
│   ├── chain-tracemethodtoreq.json      → ../../../index/<prefix>/<uuid>.scenario.json
│   └── ...
├── tracelink/
│   ├── r17-16-implements-t134.json      → ../../../index/<prefix>/<uuid>.scenario.json
│   └── ...
├── class/         (when Class units exist)
├── method/        (when Method units exist)
├── test/          (when Test units exist)
└── user/          (when User units exist — T145)
```

**Slug = speaking name** from `model.slug || model.name` slugified (same as `generator.ts:speakingName()`).

### Changes to migrate-to-scenario.ts

#### 1. Replace flat task symlinks (lines 267-270) with per-class subdirs

```typescript
// BEFORE (flat):
for (const t of tasks) {
  const taskRelPath = path.relative(sprintJsonDir, idx.filePath(t.uuid));
  fs.symlinkSync(taskRelPath, path.join(sprintJsonDir, `${t.slug}.json`));
}

// AFTER (per-class subdir):
function emitClassSymlinks(
  idx: ScenarioIndex,
  sprintJsonDir: string,
  className: string,
  units: { uuid: string; slug: string }[]
): void {
  if (!units.length) return;
  const classDir = path.join(sprintJsonDir, className);
  fs.mkdirSync(classDir, { recursive: true });
  for (const u of units) {
    const relPath = path.relative(classDir, idx.filePath(u.uuid));
    const linkPath = path.join(classDir, `${u.slug}.json`);
    if (!fs.existsSync(linkPath)) fs.symlinkSync(relPath, linkPath);
  }
  console.log(`    ${className}/: ${units.length} symlinks`);
}

// Emit per class:
emitClassSymlinks(idx, sprintJsonDir, 'task', tasks.map(t => ({ uuid: t.uuid, slug: t.slug })));
emitClassSymlinks(idx, sprintJsonDir, 'requirement', reqUuids.map(u => {
  const unit = idx.get(u);
  return { uuid: u, slug: speakSlug(unit?.model.name as string || u.slice(0, 8)) };
}));
emitClassSymlinks(idx, sprintJsonDir, 'usecase', ucUuids.map(u => {
  const unit = idx.get(u);
  return { uuid: u, slug: speakSlug(unit?.model.name as string || u.slice(0, 8)) };
}));
```

#### 2. Add speakSlug helper (reuse from generator.ts)

```typescript
function speakSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
```

Or import from `generator.ts` if exported.

#### 3. Collect TraceLink UUIDs for symlink emission

TraceLinks are created inline (lines 212-218). Collect their UUIDs:
```typescript
const linkUuids: string[] = [];
// ... in the TraceLink creation loop:
linkUuids.push(linkId);
// ... after all migrations:
emitClassSymlinks(idx, sprintJsonDir, 'tracelink', linkUuids.map(u => {
  const unit = idx.get(u);
  return { uuid: u, slug: speakSlug(unit?.model.label as string || u.slice(0, 8)) };
}));
```

#### 4. Sprint symlink stays at root level

`sprint.json` stays at `sprints.json/<sprint>/sprint.json` (not in a subdir — it's the parent).

#### 5. T147 scenarioLink helper update

Current T147 `scenarioLink` scans `sprints.json/<sprint>/` for flat `<slug>.json`. With class subdirs, it needs to scan one level deeper:

```typescript
// BEFORE (flat scan):
for (const sprint of fsSync.readdirSync(sprintsJsonDir)) {
  const jsonPath = path.join(sprintsJsonDir, sprint, `${slug}.json`);

// AFTER (class subdir scan):
for (const sprint of fsSync.readdirSync(sprintsJsonDir)) {
  const sprintDir = path.join(sprintsJsonDir, sprint);
  // Check flat (backward compat) then class subdirs
  let jsonPath = path.join(sprintDir, `${slug}.json`);
  if (!fsSync.existsSync(jsonPath)) {
    for (const classDir of fsSync.readdirSync(sprintDir).filter(d =>
      fsSync.statSync(path.join(sprintDir, d)).isDirectory())) {
      jsonPath = path.join(sprintDir, classDir, `${slug}.json`);
      if (fsSync.existsSync(jsonPath)) break;
    }
  }
```

### Migration execution

After code change:
```bash
# Wipe existing sprints.json tree (symlinks only, index untouched)
rm -rf scenario/sprints.json/*

# Re-run for all migrated sprints
for s in sprint-1-rawbin-foundation sprint-2-identity-ssh ...; do
  npx tsx scripts/migrate-to-scenario.ts --sprint "$s" --apply
done
```

### Touchpoints

| File | Change |
|------|--------|
| `scripts/migrate-to-scenario.ts` | Replace flat symlinks with `emitClassSymlinks()` per class |
| `scripts/migrate-to-scenario.ts` | Add `speakSlug` helper |
| `scripts/migrate-to-scenario.ts` | Collect linkUuids for TraceLink symlinks |
| `server.ts` T147 `scenarioLink` | Scan class subdirs (backward compat + new layout) |

### No new routes, no STATIC_SHELL change.

## Subtasks
None (one script change + re-run migrations).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views*
*Pre-design by robbin-architect — awaiting planner task file stand-up*
