[Back to T124](./task-124-architecture.md) | [Back to Sprint 17 Planning](./planning.md)

# T124.3: Architect — Storage Layout (Index + Speaking-Name Trees)

[task:uuid:c93f69d5-a2e4-4b18-b956-4d7e2f03c8b1]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-architect (design lead)

## Traceability

`[task:uuid:c93f69d5-a2e4-4b18-b956-4d7e2f03c8b1]`

- up
  - [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R17.4** (index by UUID prefix), **R17.5** (speaking-name JSON tree), **R17.6** (speaking-name MD tree), **R17.11** (file-browser ↔ traceability-browser navigation), **R17.12** (all files are units)
- down
  - None (atomic sub-task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.4 + R17.5 + R17.6 + R17.11 + R17.12
  - **use case:** index.put [uc:uuid:17a00104-0004-4a04-a004-000017010004], index.get [uc:uuid:17a00105-0005-4a05-a005-000017010005], tree.symlinkJson [uc:uuid:17a00201-0001-4a01-a001-000017020001], tree.generateMd [uc:uuid:17a00202-0002-4a02-a002-000017020002], tree.navigate [uc:uuid:17a00203-0003-4a03-a003-000017020003]
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (Phase 1+2 packages)
  - **class/method:** ScenarioIndex, SpeakingTree (design — impl in T125/T126)

## Task Description
Design the 3-layer storage layout: canonical UUID index, speaking-name symlink tree (JSON), and generated MD view tree. Plus file-browser ↔ traceability-browser navigation.

## Context
Tron 2026-05-30 (verbatim): "uuid identified instances are units in a data directory in scenario/index in which has folders from the first 5 characters of the uuid and there stores the original uuid.scenario.json. under scenarios/sprints.json/ create a file tree of ln links to the json index with speaking names like in sprint 1 and task1 and task 1.1. in scenarios/sprints.md/ have the resulting structured md views from the templates with the same speaking names as in the sprints.json/ folder."

## Acceptance Criteria
- [x] AC1 — Canonical index layout: `scenario/index/<5-char>/<uuid>.scenario.json`
- [x] AC2 — Speaking-name JSON tree: `scenarios/sprints.json/<sprint>/<task>/` with ln symlinks
- [x] AC3 — Generated MD tree: `scenarios/sprints.md/<sprint>/<task>/` with rendered views
- [x] AC4 — File-browser ↔ traceability-browser navigation bridge documented
- [x] AC5 — Migration path from current scrum.pmo/ layout documented
- [ ] AC6 — PO + Tron reviewed

## Dependencies
- **Requires:** T124.1 (scenario JSON shape), T124.2 (view templates for MD generation)
- **Enables:** T125 (implementation), T128 (migration)

## Definition of Done
- [ ] All AC met; design reviewed by PO + Tron
- [ ] Committed with standard template sections
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-30: Design authored. Awaiting PO + Tron review.

## Subtasks
None (atomic sub-task).

---

## Architect Design — robbin-architect (2026-05-30)

### 3-Layer Storage Architecture

```
scenario/                              ← ROOT
├── index/                             ← LAYER 1: Canonical store (5-level UUID dirs)
│   ├── a/7/f/3/c/                     ← 5 single-char dirs from UUID (strip hyphens, first 5)
│   │   └── a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c.scenario.json
│   ├── b/7/2/e/5/
│   │   └── b72e58c4-91d3-4a07-b845-3c6f1d92e7a0.scenario.json
│   └── .../
│
├── sprints.json/                      ← LAYER 2: Speaking-name symlink tree
│   ├── sprint-1/
│   │   ├── sprint.json → ../../index/a/7/f/3/c/a7f3c....scenario.json
│   │   ├── task-1-bootstrap.json → ../../index/b/7/2/e/5/b72e5....scenario.json
│   │   ├── task-1.1-clone.json → ../../index/c/9/3/f/6/c93f6....scenario.json
│   │   └── task-1.2-rebrand.json → ../../index/d/8/3/e/4/d83e4....scenario.json
│   ├── sprint-2/
│   │   ├── sprint.json → ...
│   │   ├── task-7-user-editor.json → ...
│   │   └── .../
│   └── .../
│
└── sprints.md/                        ← LAYER 3: Generated MD views
    ├── sprint-1/
    │   ├── planning.md                 ← Generated sprint overview (R17.9)
    │   ├── task-1-bootstrap.md         ← Generated task view
    │   ├── task-1.1-clone.md           ← Generated subtask view
    │   └── task-1.2-rebrand.md
    ├── sprint-2/
    │   ├── planning.md
    │   └── .../
    ├── overview.md                     ← Generated sprint list (R17.10)
    └── .../
```

### Layer 1: Canonical Index (R17.4) — 5-Level Deep

**Path:** `scenario/index/<c1>/<c2>/<c3>/<c4>/<c5>/<uuid>.scenario.json`

Where `<c1>...<c5>` are the first 5 hex characters of the UUID (hyphens stripped).

**UpDown convention confirmed:** `UcpStorage.uuidFolderPathGenerate()` (Persistence/0.3.23.0 line 300-303):
```typescript
const cleanUuid = uuid.replace(/-/g, '');
const folderStructure = cleanUuid.substring(0, 5).split('');
return join(this.model.indexBaseDir, ...folderStructure);
```
Example: `44443290-015c-...` → `scenarios/index/4/4/4/4/3/44443290-015c-....scenario.json`

```typescript
class ScenarioIndex {
  private basePath: string;  // scenario/index

  /** 5 single-char dirs from UUID (strip hyphens, split first 5 chars) */
  folderPath(uuid: string): string {
    const clean = uuid.replace(/-/g, '');
    const chars = clean.substring(0, 5).split('');
    return path.join(this.basePath, ...chars);
  }

  /** Full path to a scenario file */
  path(uuid: string): string {
    return path.join(this.folderPath(uuid), `${uuid}.scenario.json`);
  }

  /** Store a scenario unit */
  put(uuid: string, scenario: ScenarioUnit): void {
    const dir = this.folderPath(uuid);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(scenario, null, 2));
  }

  /** Load a scenario unit */
  get(uuid: string): ScenarioUnit {
    const content = fs.readFileSync(this.path(uuid), 'utf-8');
    return JSON.parse(content);
  }

  /** List all scenario UUIDs (walk 5-level tree) */
  list(): string[] {
    const uuids: string[] = [];
    const walk = (dir: string, depth: number) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && depth < 5) {
          walk(path.join(dir, entry.name), depth + 1);
        } else if (entry.name.endsWith('.scenario.json')) {
          uuids.push(entry.name.replace('.scenario.json', ''));
        }
      }
    };
    walk(this.basePath, 0);
    return uuids;
  }
}
```

### Layer 2: Speaking-Name JSON Tree (R17.5)

**Path:** `scenarios/sprints.json/<sprint-name>/<task-name>.json` → symlink to index

Speaking names derived from `model.name`:
- Sprint: `sprint-{number}` (e.g., `sprint-1`)
- Task: `task-{number}-{slugified-name}` (e.g., `task-1-bootstrap`)
- Subtask: `task-{parent}.{sub}-{slugified-name}` (e.g., `task-1.1-clone`)
- Requirement: `req-{short-id}` (e.g., `req-r17-1`)

```typescript
class SpeakingTree {
  private basePath: string;  // scenarios/sprints.json

  /** Generate a slug from a name */
  private slug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);
  }

  /** Build the ln tree for a sprint and its children */
  symlinkSprint(sprint: ScenarioUnit): void {
    const sprintDir = `${this.basePath}/sprint-${sprint.model.number}`;
    fs.mkdirSync(sprintDir, { recursive: true });

    // Sprint itself
    const indexPath = scenarioIndex.path(sprint.model.uuid);
    const relPath = path.relative(sprintDir, indexPath);
    fs.symlinkSync(relPath, `${sprintDir}/sprint.json`);

    // Tasks (children IORs → resolve → symlink)
    for (const taskIor of sprint.model.tasks) {
      const task = iorResolver.resolveInstance(taskIor);
      const taskSlug = this.slug(task.model.name);
      const taskLink = `${sprintDir}/${taskSlug}.json`;
      const taskIndexPath = scenarioIndex.path(task.model.uuid);
      fs.symlinkSync(path.relative(sprintDir, taskIndexPath), taskLink);

      // Subtasks (children of tasks)
      if (task.model.children?.length) {
        for (const subIor of task.model.children) {
          const sub = iorResolver.resolveInstance(subIor);
          const subSlug = this.slug(sub.model.name);
          const subLink = `${sprintDir}/${subSlug}.json`;
          fs.symlinkSync(path.relative(sprintDir, scenarioIndex.path(sub.model.uuid)), subLink);
        }
      }
    }
  }
}
```

### Layer 3: Generated MD Tree (R17.6)

**Path:** `scenarios/sprints.md/<sprint-name>/<task-name>.md`

Same hierarchy as Layer 2, but files are **generated markdown** from view templates (T124.2):

```typescript
class MdTreeGenerator {
  /** Generate all MD views for a sprint */
  generateSprint(sprint: ScenarioUnit): void {
    const sprintDir = `${this.basePath}/sprint-${sprint.model.number}`;
    fs.mkdirSync(sprintDir, { recursive: true });

    // planning.md = sprint overview (R17.9)
    const sprintMd = viewRegistry.renderMd(sprint);
    fs.writeFileSync(`${sprintDir}/planning.md`, sprintMd);

    // Task views
    for (const taskIor of sprint.model.tasks) {
      const task = iorResolver.resolveInstance(taskIor);
      const taskSlug = this.slug(task.model.name);
      const taskMd = viewRegistry.renderMd(task);
      fs.writeFileSync(`${sprintDir}/${taskSlug}.md`, taskMd);

      // Subtask views
      for (const subIor of (task.model.children || [])) {
        const sub = iorResolver.resolveInstance(subIor);
        const subMd = viewRegistry.renderMd(sub);
        fs.writeFileSync(`${sprintDir}/${this.slug(sub.model.name)}.md`, subMd);
      }
    }
  }

  /** Generate overview.md = list of all sprints (R17.10) */
  generateOverview(allSprints: ScenarioUnit[]): void {
    const lines = ['# Sprints Overview\n'];
    for (const s of allSprints.sort((a, b) => a.model.number - b.model.number)) {
      lines.push(`## Sprint ${s.model.number} — ${s.model.name}`);
      lines.push(`**Status:** ${s.model.status} · **Tasks:** ${s.model.tasks.length}\n`);
    }
    fs.writeFileSync(`${this.basePath}/overview.md`, lines.join('\n'));
  }
}
```

### File-Browser ↔ Traceability-Browser Navigation (R17.11)

Two navigation bridges:

**1. /md/ → /trace (file-browser to traceability):**
The file browser at `/md/` serves files from the project. When browsing `scenarios/sprints.md/sprint-1/task-1-bootstrap.md`, the rendered page includes a link to the traceability view:
```html
<a href="/trace#task.show?uuid={uuid}">View in Traceability Browser →</a>
```
This link is injected by the MD view template (T124.2) — every generated MD file includes its instance UUID, enabling navigation to /trace.

**2. /trace → /md/ (traceability to file-browser):**
The traceability browser's DetailView (T111) renders scenario units. Each shows a link to the generated MD view:
```html
<a href="/md/scenarios/sprints.md/sprint-1/task-1-bootstrap.md">View as Document →</a>
```
The speaking-name path is derived from `model.name` using the same slug function.

**3. /trace → source file (ior:file):**
Method and Class scenarios have `ior:file:<path>` in their model. The DetailView renders this as a link to the editor:
```html
<a href="/edit/{path}">Open in Editor →</a>
```

### Migration Path from Current Layout (R17.14)

Current: `scrum.pmo/sprints/sprint-N/task-X.md` (hand-authored markdown)
Target: `scenario/index/<prefix>/<uuid>.scenario.json` + symlinks + generated MD

Migration steps (implemented in T128):

```
1. For each existing sprint directory:
   a. Parse planning.md → create Sprint scenario unit
   b. For each task-*.md:
      - Extract [task:uuid], name, status, description, chain links
      - Create Task scenario unit with model attrs
      - Store in scenario/index/<prefix>/
   c. For each requirements.md entry:
      - Extract [requirement:uuid], text, linked tasks
      - Create Requirement scenario unit
      - Store in scenario/index/<prefix>/
   d. Build IOR links: task.requirements[], sprint.tasks[], etc.

2. Generate Layer 2 (sprints.json/) symlink tree
3. Generate Layer 3 (sprints.md/) MD views
4. Verify: every existing task UUID resolvable via ior:instance:<uuid>
5. Verify: generated MD views match content of original task-*.md files
```

The original `scrum.pmo/sprints/` files are NOT deleted — they become the migration source. The scenario index is the new canonical store. The generated MD views in `scenarios/sprints.md/` are the new human-readable output.

### Relationship to Existing scrum.pmo/

```
scrum.pmo/sprints/           ← CURRENT (hand-authored, stays as migration source)
scenario/index/              ← NEW canonical store (scenario JSON units)
scenarios/sprints.json/      ← NEW speaking-name symlinks to index
scenarios/sprints.md/        ← NEW generated MD views from templates
```

Post-migration, the workflow changes:
- **Before:** edit task-*.md directly → commit
- **After:** edit scenario JSON (via /edit or CLI) → views auto-regenerate → commit both

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 1*
*Owner: robbin-architect @ robbinTeam:0.1*
