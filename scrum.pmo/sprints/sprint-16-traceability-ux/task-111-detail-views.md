[Back to Sprint 16 Planning](./planning.md)

# T111: Specialized DetailViews (TaskDetailView, RequirementDetailView)

[task:uuid:b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (req + architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.2** (specialized DetailViews)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.2
  - **use case:** taskDetail.render [uc:uuid:16a01101-d101-4a01-b101-000000111001], requirementDetail.render [uc:uuid:16a01102-d102-4a02-b102-000000111002], usecaseDetail.render [uc:uuid:16a01103-d103-4a03-b103-000000111003]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 1 package)
  - **class/method:** `rb-task-detail.ts` → `RbTaskDetail.render()`, `rb-requirement-detail.ts` → `RbRequirementDetail.render()`, `rb-usecase-detail.ts` → `RbUseCaseDetail.render()`

## Task Description
Implement typed DetailViews rendered inside the DetailViewContainer (T110):
**TaskDetailView** and **RequirementDetailView**, extensible per object type. Each
renders the details of the selected tree item by type.

## Context
Tron 2026-05-27: "specialized DetailViews like eg TaskDetailView or
RequirementDetailView inside it and then show the details there when i click on the
items on the traceability tree."

## Acceptance Criteria
- [ ] AC1 — TaskDetailView renders a task's details inside the container
- [ ] AC2 — RequirementDetailView renders a requirement's details
- [ ] AC3 — View selection is by object type; adding a new type is a small, documented extension
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Architect Design — robbin-architect (REFINED per PO feedback)

### Pattern: One Web Component per Object type — faithful to Tron's S15 model

Tron asked for "specialized DetailViews like TaskDetailView or RequirementDetailView". S15's Object.verb model says "Web Components are views for the Object classes" — one View per Object type. The VerbRegistry (T103) already maps `type.show` → handler; each specialized view registers its own handler.

**NOT a polymorphic switch.** Each type gets its OWN Web Component. Extensibility = create a new file + register it.

### New files (one per type)

```
src/public/ts/trace/
  rb-task-detail.ts              — <rb-task-detail ref="task:uuid">
  rb-requirement-detail.ts       — <rb-requirement-detail ref="requirement:uuid">
  rb-usecase-detail.ts           — <rb-usecase-detail ref="usecase:uuid">
  rb-detail-view.ts              — KEEP as generic fallback for class/method/impl/test
```

### Base interface: all DetailViews share

Each specialized view follows the same contract (set by T110 drawer):

```typescript
interface DetailViewElement extends HTMLElement {
  graph: TraceGraph | null;          // set by the drawer before rendering
  setAttribute('ref', objectRef);    // triggers render
}
```

### rb-task-detail.ts (~50 lines)

```typescript
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';

export class RbTaskDetail extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { this.unsubs.forEach(u => u()); this.unsubs = []; }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  render(): void {
    this.unsubs.forEach(u => u()); this.unsubs = [];
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    if (!obj) { this.innerHTML = '<div class="dv-empty">Task not found</div>'; return; }

    const links = obj.toJSON().links;
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-task">📋 Task</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        <div class="dv-field"><label>Status</label>
          <span class="dv-status-badge">${esc(obj.status || 'PLANNED')}</span></div>
        ${obj.owner ? `<div class="dv-field"><label>Owner</label><span>${esc(obj.owner)}</span></div>` : ''}
        ${obj.effort ? `<div class="dv-field"><label>Effort</label><span>${obj.effort}</span></div>` : ''}
      </div>
      <div class="dv-links">
        <h4>Traceability Chain</h4>
        ${this.renderLinks(links)}
      </div>`;

    // MVC subscribe
    this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
    // Click link rows → navigate
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        navigate(lref.split(':')[0], 'show', { uuid: refUuid(lref) });
      });
    });
  }

  private renderLinks(links: Record<string, string[]>): string {
    const rows: string[] = [];
    for (const [relation, refs] of Object.entries(links)) {
      for (const lref of refs) {
        const lobj = this.graph?.get(refUuid(lref));
        rows.push(`<div class="dv-link" data-ref="${lref}">
          <span class="dv-rel">${relation}</span>
          <span class="dv-link-title">${esc(lobj?.title || lref)}</span>
        </div>`);
      }
    }
    return rows.join('') || '<div class="dv-empty">no links</div>';
  }
}
// esc() omitted — same helper as rb-detail-view.ts
```

### rb-requirement-detail.ts (~50 lines, same structure)

Same skeleton. Type-specific section shows:
- Full requirement text (word-wrap)
- Priority badge
- Source reference (compound-requirement-source link if available)
- Chain links (tasks, use cases)

### rb-usecase-detail.ts (~40 lines)

Shows:
- Object.verb name prominently (`<code>detailDrawer.open</code>`)
- Originating requirement link
- Implementing class + method links

### Registration: VerbRegistry wiring

In `rb-trace-view.ts` (or `index.ts` where the registry is built):

```typescript
import { RbTaskDetail } from './rb-task-detail.js';
import { RbRequirementDetail } from './rb-requirement-detail.js';
import { RbUseCaseDetail } from './rb-usecase-detail.js';
import { RbDetailView } from './rb-detail-view.js';  // generic fallback

// Register specialized show handlers per type
registry.register('task', 'show', (ctx) => {
  const el = document.createElement('rb-task-detail') as RbTaskDetail;
  el.graph = ctx.graph;
  el.setAttribute('ref', `task:${ctx.params.uuid}`);
  ctx.mount.replaceChildren(el);
});

registry.register('requirement', 'show', (ctx) => {
  const el = document.createElement('rb-requirement-detail') as RbRequirementDetail;
  el.graph = ctx.graph;
  el.setAttribute('ref', `requirement:${ctx.params.uuid}`);
  ctx.mount.replaceChildren(el);
});

registry.register('usecase', 'show', (ctx) => {
  const el = document.createElement('rb-usecase-detail') as RbUseCaseDetail;
  el.graph = ctx.graph;
  el.setAttribute('ref', `usecase:${ctx.params.uuid}`);
  ctx.mount.replaceChildren(el);
});

// Generic fallback for class/method/implementation/test
for (const t of ['class', 'method', 'implementation', 'test']) {
  registry.register(t, 'show', (ctx) => {
    const el = document.createElement('rb-detail-view') as RbDetailView;
    el.graph = ctx.graph;
    el.setAttribute('ref', `${t}:${ctx.params.uuid}`);
    ctx.mount.replaceChildren(el);
  });
}
```

### T110 drawer integration

The `rb-detail-drawer` (T110) IS the `ctx.mount`. When the router dispatches `type.show`, the handler creates the specialized view and places it inside the drawer via `ctx.mount.replaceChildren(el)`. The drawer opens because the router also sets `drawer.setAttribute('open', '')`.

### Extensibility

To add a new type (e.g., `ClassDetailView`):
1. Create `rb-class-detail.ts` — new Web Component
2. Register `registry.register('class', 'show', handler)` in index.ts
3. Done — no switch/case to modify, no existing file to touch

### CSS (shared across all DetailViews)

```css
.dv-head { padding: 12px 0; border-bottom: 1px solid #eee; }
.dv-type-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.dv-type-task { background: #e3f2fd; color: #1565c0; }
.dv-type-requirement { background: #e8f5e9; color: #2e7d32; }
.dv-type-usecase { background: #fff3e0; color: #e65100; }
.dv-fields { padding: 12px 0; }
.dv-field { margin-bottom: 8px; }
.dv-field label { font-size: 0.7rem; color: #999; display: block; margin-bottom: 2px; }
.dv-status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
.dv-links h4 { font-size: 0.8rem; color: #666; margin: 12px 0 8px; }
.dv-link { display: flex; gap: 8px; padding: 6px; cursor: pointer; border-radius: 6px; }
.dv-link:hover { background: #f5f5f5; }
.dv-rel { font-size: 0.65rem; color: #999; min-width: 60px; }
.dv-link-title { font-size: 0.8rem; }
```

### Summary

| File | Lines | Purpose |
|------|-------|---------|
| `rb-task-detail.ts` | ~50 | Task-specific DetailView |
| `rb-requirement-detail.ts` | ~50 | Requirement-specific DetailView |
| `rb-usecase-detail.ts` | ~40 | UseCase-specific DetailView |
| `rb-detail-view.ts` | existing | Generic fallback (class/method/impl/test) |
| VerbRegistry wiring in index.ts | ~20 | Register type→view mappings |
| CSS additions | ~25 | Shared DetailView styles |

## Dependencies
- **Requires:** T110 (container to render into)
- **Enables:** richer detail UX; consumes tree-item data from T112

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.2. Awaiting req split + architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 2 (Phase 1 — typed views)*
