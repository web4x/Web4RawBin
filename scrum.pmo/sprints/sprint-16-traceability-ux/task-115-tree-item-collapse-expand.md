<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T115: Tree-item — tap-icon collapse/expand + ">" children expander

[task:uuid:f1157eb1-c259-4d46-a7f3-6e5db1824a05]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:f1157eb1-c259-4d46-a7f3-6e5db1824a05]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.7** (tap-icon collapse/expand) + **R16.8** (children expander)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.7 + R16.8
  - **use case:** objectItem.collapse [uc:uuid:16a01151-d151-4a01-b151-000000115001], objectItem.expand [uc:uuid:16a01152-d152-4a02-b152-000000115002], treeItem.expandChildren [uc:uuid:16a01153-d153-4a03-b153-000000115003]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 2 package)
  - **class/method:** `rb-object-item.ts` → `RbObjectItem.collapse()`, `expand()`, `expandChildren()` + `toggle-children` event dispatch

## Task Description

Two distinct interactions on the tree-item:
- **Tap the icon** (R16.7): first tap **collapses** the item to just the quadratic icon
  (T113); tap again **expands** to show name + description (T112).
- **">" children expander** (R16.8): on the **right side**, show a ">"-like icon when
  the item has children; clicking it **expands the subtree** in the tree.

These are separate from OS drag (T114) — distinguish tap vs drag.

## Context

Tron 2026-05-27: "taping the icon once will collapse the item view just into the
quadratic item, taping again will make the item expand to show name and description.
on rhe right side the icon will have a ">" like icon if the item has children and
clicking on it will expand the tree."

## Acceptance Criteria

- [ ] AC1 — Tapping the left icon collapses the item to icon-only
- [ ] AC2 — Tapping again expands to name + description
- [ ] AC3 — A ">" expander shows on the right ONLY when the item has children
- [ ] AC4 — Clicking ">" expands the child subtree (and toggles closed)
- [ ] AC5 — Icon-tap (collapse) is distinguishable from drag (T114) and from ">" (children)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Implementation

**Icon tap vs drag distinction:** Use a 200ms timer. On `pointerdown` on `.oi-icon`, start timer. If `pointerup` within 200ms AND no movement (< 5px) → it's a tap → toggle collapsed. If drag starts (T114 `dragstart` fires) → cancel timer, it's a drag.

```typescript
// In rb-object-item.ts:
private collapsed = false;

// Icon click handler (separate from item click)
this.querySelector('.oi-icon')?.addEventListener('click', (e) => {
  e.stopPropagation(); // Don't trigger item click → navigate
  this.collapsed = !this.collapsed;
  this.toggleAttribute('collapsed', this.collapsed);
  this.render();
});

// Expander click handler
this.querySelector('.oi-expand')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = this.toggleAttribute('children-open');
  // rb-trace-tree listens for this event to show/hide children
  this.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open } }));
});
```

### CSS for collapsed state

```css
rb-object-item[collapsed] .oi-content { display: none; }
rb-object-item[collapsed] .oi-expand { display: none; }
rb-object-item[collapsed] { padding: 4px; width: 40px; height: 40px; }

/* Expander icon */
.oi-expand {
  width: 24px; height: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #999; font-size: 1.2rem; flex-shrink: 0;
  transition: transform 0.2s;
}
rb-object-item[children-open] .oi-expand { transform: rotate(90deg); }
```

### Tree integration

`rb-trace-tree.ts` listens for `toggle-children` events and shows/hides the child `<div>` that contains nested `rb-object-item` elements. The `has-children` attribute on `rb-object-item` is set by the tree builder when the TraceModel object has outgoing links.

## Dependencies

- **Requires:** T112 (name+desc to show on expand), T113 (square icon for collapsed state)
- **Enables:** None

## Definition of Done

- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-27: Planned from compound source R16.7+R16.8. Awaiting architect design, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 6 (Phase 2 — tree-item interactions)*
