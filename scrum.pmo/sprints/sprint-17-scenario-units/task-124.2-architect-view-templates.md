[Back to T124](./task-124-architecture.md) | [Back to Sprint 17 Planning](./planning.md)

# T124.2: Architect — View Template Architecture

[task:uuid:b72e58c4-91d3-4a07-b845-3c6f1d92e7a0]

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

`[task:uuid:b72e58c4-91d3-4a07-b845-3c6f1d92e7a0]`

- up
  - [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R17.7** (HTML view templates per class), **R17.8** (views generated + live-updated), **R17.9** (planning.md = generated task overview), **R17.10** (sprint overview = list of sprint items)
- down
  - None (atomic sub-task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.7 + R17.8 + R17.9 + R17.10
  - **use case:** view.renderHtml [uc:uuid:17a00301-0001-4a01-a001-000017030001], view.renderMd [uc:uuid:17a00302-0002-4a02-a002-000017030002], view.liveUpdate [uc:uuid:17a00303-0003-4a03-a003-000017030003], planning.generate [uc:uuid:17a00304-0004-4a04-a004-000017030004]
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (Phase 3 package)
  - **class/method:** ViewTemplateRegistry (design — impl in T126)

## Task Description
Design the view template architecture: per-class HTML + MD templates, registered against class IORs, pure-function rendering from scenario JSON, live-updated via ViewBus.

## Context
Tron 2026-05-30 (verbatim): "the templates should be like the html registered view for the classes Requirement, Task, UseCase … each Task and requirement shall have its own md, html view strictly from the view templates. views are purely generated and live updated from the flat json data."

## Acceptance Criteria
- [x] AC1 — Template registry design: class IOR → HTML template + MD template
- [x] AC2 — 7 class templates defined (Sprint, Task, Requirement, UseCase, Class, Method, Test)
- [x] AC3 — Pure-function rendering: template(scenario) → HTML string / MD string
- [x] AC4 — Live-update strategy via ViewBus documented
- [x] AC5 — planning.md + sprint overview as generated views documented
- [ ] AC6 — PO + Tron reviewed

## Dependencies
- **Requires:** T124.1 (scenario JSON shape — templates consume it)
- **Enables:** T126 (implementation of views)

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

### Core Principle: Views Are Pure Functions of Scenario JSON

Every view is a **stateless render function**: `template(scenario) → string`. No side effects, no DOM state. The ViewBus handles re-rendering when the underlying scenario JSON changes.

### ViewTemplateRegistry

```typescript
interface ViewTemplate {
  renderHtml(scenario: ScenarioUnit): string;
  renderMd(scenario: ScenarioUnit): string;
}

class ViewTemplateRegistry {
  private templates = new Map<string, ViewTemplate>();

  register(classIor: string, template: ViewTemplate): void {
    // classIor = "ior:class:Task", "ior:class:Requirement", etc.
    this.templates.set(classIor, template);
  }

  resolve(classIor: string): ViewTemplate | undefined {
    return this.templates.get(classIor);
  }

  renderHtml(scenario: ScenarioUnit): string {
    const tmpl = this.resolve(scenario.ior);
    if (!tmpl) return `<div class="unknown-type">No template for ${scenario.ior}</div>`;
    return tmpl.renderHtml(scenario);
  }

  renderMd(scenario: ScenarioUnit): string {
    const tmpl = this.resolve(scenario.ior);
    if (!tmpl) return `> No template for ${scenario.ior}`;
    return tmpl.renderMd(scenario);
  }
}
```

### Integration: Loading Protocol → View Rendering

```
1. Load scenario JSON (T124.1 protocol)
2. Resolve ior → class loader → instantiate
3. Resolve ior → ViewTemplateRegistry → get template
4. template.renderHtml(scenario) → HTML string for browser
5. template.renderMd(scenario) → MD string for scenarios/sprints.md/
```

### 7 Class Templates

#### TaskTemplate

**HTML view** (renders inside rb-detail-drawer or standalone page):
```html
<div class="sv-task">
  <div class="sv-header">
    <span class="sv-type-badge sv-task-badge">📋 Task</span>
    <h2>{model.name}</h2>
    <span class="sv-status sv-status-{model.status}">{model.status}</span>
  </div>
  <div class="sv-meta">
    <div class="sv-field"><label>Assigned</label><span>{model.assigned}</span></div>
    <div class="sv-field"><label>Effort</label><span>{model.effort}</span></div>
    <div class="sv-field"><label>UUID</label><code>{model.uuid}</code></div>
  </div>
  <div class="sv-description">{model.description}</div>
  <div class="sv-links">
    <h3>Requirements</h3>
    {model.requirements.map(ior → <a href="#{ior}">{resolve(ior).name}</a>)}
    <h3>Use Cases</h3>
    {model.useCases.map(ior → <a href="#{ior}">{resolve(ior).name}</a>)}
    <h3>Subtasks</h3>
    {model.children.map(ior → <rb-object-item ref="{ior}">)}
  </div>
</div>
```

**MD view** (generated file in scenarios/sprints.md/):
```markdown
# {model.name}

**Status:** {model.status} · **Assigned:** {model.assigned} · **Effort:** {model.effort}

{model.description}

## Requirements
{model.requirements.map(ior → - [{resolve(ior).name}](./{resolve(ior).uuid}.md))}

## Use Cases
{model.useCases.map(ior → - [{resolve(ior).name}](./{resolve(ior).uuid}.md))}

## Subtasks
{model.children.map(ior → - [{resolve(ior).name}](./{resolve(ior).uuid}.md))}
```

#### RequirementTemplate

**HTML:** Type badge 🎯, priority field, source quote, linked tasks + tests.
**MD:** Same structure, markdown links to related instances.

#### SprintTemplate

**HTML:** Sprint number + goal header, task list as `<rb-object-item>` entries, requirement count, status summary bar (done/in-progress/planned counts).
**MD:** Sprint overview with task checklist `- [x] T1: name` format.

#### UseCaseTemplate

**HTML:** Object.verb name prominently, requirement up-link, implementing class+method down-links.
**MD:** Object.verb as heading, linked classes + methods.

#### ClassTemplate (noun)

**HTML:** Class name, source file link (`ior:file:...`), method list, use case up-links.
**MD:** Class heading, method bullet list.

#### MethodTemplate (verb)

**HTML:** Class.verb name, implementation file link, test links, **full traceability chain** (method → class → useCase → task → requirement — rendered as breadcrumb).
**MD:** Same chain as markdown links.

#### TestTemplate

**HTML:** Test name, status badge (PASS/FAIL), file link, linked methods + requirements.
**MD:** Test entry with status.

### Generated Overview Views

#### planning.md (R17.9)

`planning.md` becomes a **generated file** — rendered from the Sprint scenario's task IOR array:

```markdown
# Sprint {sprint.model.number} Planning — {sprint.model.name}

## Sprint Goal
{sprint.model.goal}

## Tasks
{sprint.model.tasks.map(taskIor → {
  const task = resolve(taskIor);
  return `- [${task.model.status === 'Done' ? 'x' : ' '}] [${task.model.name}](./${task.model.uuid}.md)
  **Status:** ${task.model.status} · **Assigned:** ${task.model.assigned}
  ${task.model.children.map(subIor → `  - [${resolve(subIor).model.status === 'Done' ? 'x' : ' '}] [${resolve(subIor).model.name}](./${resolve(subIor).model.uuid}.md)`).join('\n')}`;
})}
```

#### Sprint Overview (R17.10)

A sprint-list view rendered from all Sprint scenarios:

```markdown
# Sprints Overview

{allSprints.map(s → `## Sprint ${s.model.number} — ${s.model.name}
**Status:** ${s.model.status} · **Tasks:** ${s.model.tasks.length}
`)}
```

### Live Update Strategy (R17.8)

Browser views use the existing ViewBus (T103):

```
1. Scenario JSON loaded → rendered into DOM via template.renderHtml()
2. ViewBus.subscribe(model.uuid, () => re-render)
3. On scenario mutation (edit via /edit, or server push):
   a. Scenario JSON updated on disk
   b. Server notifies client via WS: { type: 'SCENARIO_UPDATED', uuid }
   c. Client fetches updated scenario: GET /api/scenario/<uuid>
   d. ViewBus.notify(uuid) → all subscribed views re-render
4. MD views: regenerated on disk by a watcher or on-demand by trace-cli
```

### CSS Class Conventions

All scenario view styles use `sv-` prefix (scenario-view):

```css
.sv-task, .sv-requirement, .sv-sprint, .sv-usecase, .sv-class, .sv-method, .sv-test { ... }
.sv-header { display: flex; align-items: center; gap: 8px; }
.sv-type-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; }
.sv-task-badge { background: rgba(21,101,192,0.15); color: #42a5f5; }
.sv-requirement-badge { background: rgba(46,125,50,0.15); color: #66bb6a; }
/* ... per type, matching T113 Lucide icon colors */
.sv-field label { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
.sv-links a { color: #667eea; }
.sv-status-Done { color: #66bb6a; }
.sv-status-Planned { color: rgba(255,255,255,0.4); }
```

### File Structure for Templates

```
src/ts/shared/
  ScenarioUnit.ts          — {ior, model, ownerIor} type + load/save
  ViewTemplateRegistry.ts  — register + resolve + render

src/ts/templates/
  TaskTemplate.ts          — renderHtml + renderMd for Task
  RequirementTemplate.ts   — renderHtml + renderMd for Requirement
  SprintTemplate.ts        — renderHtml + renderMd for Sprint
  UseCaseTemplate.ts       — renderHtml + renderMd for UseCase
  ClassTemplate.ts         — renderHtml + renderMd for Class
  MethodTemplate.ts        — renderHtml + renderMd for Method
  TestTemplate.ts          — renderHtml + renderMd for Test
  index.ts                 — registers all 7 templates
```

Each template file is ~30-50 lines (pure string interpolation, no framework).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 1*
*Owner: robbin-architect @ robbinTeam:0.1*
