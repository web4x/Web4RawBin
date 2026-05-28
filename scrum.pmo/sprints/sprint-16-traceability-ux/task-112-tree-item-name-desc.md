[Back to Sprint 16 Planning](./planning.md)

# T112: Tree-item — speaky name (generate if absent) + word-wrap description

[task:uuid:c1124b8e-9f26-4a13-d4c0-3b2a8e5f1d72]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (req + architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:c1124b8e-9f26-4a13-d4c0-3b2a8e5f1d72]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.3** (speaky name) + **R16.4** (word-wrap description)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method) — to be completed by req + architect
  - **requirement:** R16.3 + R16.4 (req-eng to formalize)
  - **use case / puml / method:** TBD (architect)

## Task Description
Redesign the traceability tree-item to carry a **`name`** attribute = a human-readable
short name for the requirement/task; if none exists, **generate** a short name from
the requirement text. Below the name, render a **word-wrapping** smaller-text paragraph
with the current requirement text.

## Context
Tron 2026-05-27: "the tree items should have a name attribute that is a speaky name …
if it does not have a short one create a short name from the requirement text. the item
shall have below the name a word wrapping smaller text paragraph with the current
requirement text."

## Acceptance Criteria
- [ ] AC1 — Tree-item shows a speaky `name` when one exists
- [ ] AC2 — When absent, a short name is generated from the requirement text
- [ ] AC3 — A smaller-text description paragraph renders below the name and word-wraps (no overflow/clipping)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Architect Design — robbin-architect

### rb-object-item redesign: name + description layout

Current render (rb-object-item.ts:73-79) shows `accent | title | id | status`. Replace with a two-line layout:

```
┌──────┬──────────────────────────────────┐
│ ICON │  Name (bold, 1 line, truncate)   │
│ 32x32│  Description (smaller, word-wrap) │
└──────┴──────────────────────────────────┘
```

### New attributes on rb-object-item

```
Existing: ref, type, title, status
New:      name, description
```

- `name` — short human name (e.g., "Detail Drawer", "Speaky Names"). If absent, auto-generate from `title` (first 5 words + ellipsis).
- `description` — full requirement/task text, word-wrapping.

### Name generation (when absent)

In `render()`:
```typescript
const name = this.getAttribute('name')
  || this.getAttribute('title')?.split(/\s+/).slice(0, 5).join(' ') + '…'
  || '(untitled)';
```

### Updated render() HTML

```typescript
render(): void {
  const { type, ref } = this.parts();
  const name = this.getAttribute('name') || generateName(this.getAttribute('title'));
  const desc = this.getAttribute('description') || this.getAttribute('title') || '';
  const icon = TRACE_ICONS[type] || '•';
  this.innerHTML = `
    <span class="oi-icon" title="${type}">${icon}</span>
    <div class="oi-content">
      <span class="oi-name">${esc(name)}</span>
      ${desc ? `<p class="oi-desc">${esc(desc)}</p>` : ''}
    </div>
    ${this.hasAttribute('has-children') ? '<span class="oi-expand">›</span>' : ''}`;
}
```

### CSS

```css
.object-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; cursor: pointer; }
.oi-content { flex: 1; min-width: 0; }
.oi-name { font-weight: 600; font-size: 0.85rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oi-desc { font-size: 0.75rem; color: #666; margin-top: 2px; word-wrap: break-word; overflow-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
```

### Data source

`rb-trace-tree.ts` (or the TraceRouter) sets these attributes when creating `rb-object-item` elements from TraceModel objects. The TraceModel objects already have `title` — the tree builder needs to also set `name` (from a new TraceObject field or generated) and `description` (the full text).

## Dependencies
- **Requires:** None (tree-item redesign foundation for Phase 2)
- **Enables:** T115 (collapse/expand shows name+desc); T111 (DetailView consumes name/desc)

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.3+R16.4. Awaiting req split + architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (Phase 2 — tree-item content)*
