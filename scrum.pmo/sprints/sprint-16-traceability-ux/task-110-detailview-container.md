[Back to Sprint 16 Planning](./planning.md)

# T110: DetailViewContainer — Google-Maps-style detail drawer

[task:uuid:a1102f6c-7d04-4e91-b2a8-1f0e6c3d9b50]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req + architect)
  - [x] creating test cases
  - [x] implementing
  - [ ] testing (tester — independent verification pending)
- [ ] QA Review
- [ ] Done

> Sync per PO 2026-05-28: T110 shipped by expert (rb-detail-drawer + drawer
> integration, build clean, 791 tests pass). Testing handed to robbin-tester.
> QA Review + Done remain TRON's gate.

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:a1102f6c-7d04-4e91-b2a8-1f0e6c3d9b50]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.1** (DetailViewContainer)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.1
  - **use case:** detailDrawer.open [uc:uuid:16a01001-d001-4a01-b001-000000110001], detailDrawer.close [uc:uuid:16a01002-d002-4a02-b002-000000110002], detailDrawer.swipeDismiss [uc:uuid:16a01003-d003-4a03-b003-000000110003]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 1 package)
  - **class/method:** `src/public/ts/trace/rb-detail-drawer.ts` → `RbDetailDrawer.open()`, `close()`, `swipeDismiss()`

## Task Description
Create a dedicated **DetailViewContainer** — a drawer-like detail area (like the
room chat's drawer / Google-Maps detail drawer) on /trace. It holds specialized
DetailViews (see T111). Clicking a tree item shows that item's details inside the
container. (Exact files/lines pending architect design.)

## Context
Tron 2026-05-27 (verbatim in compound-requirement-source.md): "the chat in the room
has a drawer like detail area like in google maps. create a dedicated
DetailViewContainer that can contain specialized DetailViews … show the details
there when i click on the items on the traceability tree."

## Acceptance Criteria
- [ ] AC1 — A drawer-style container exists on /trace, modeled on the room chat drawer
- [ ] AC2 — Clicking a traceability tree item shows its details in the container
- [ ] AC3 — Container hosts pluggable DetailViews (integration point for T111)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Architect Design — robbin-architect

### Pattern: Google-Maps bottom drawer (reuse profile-sheet slideUp)

The app already has a `.profile-sheet` with `@keyframes slideUp` (app.css:196-198). The DetailViewContainer follows the same pattern: a bottom-anchored panel that slides up when an item is selected, covering ~40% of the viewport. The tree stays visible above.

### Component: `rb-detail-drawer` (new Web Component)

**File:** `src/public/ts/trace/rb-detail-drawer.ts`

```
Attributes:
  ref       — the object ref (type:uuid) to display
  open      — boolean attribute, presence = drawer visible

Slot:
  default   — holds the current DetailView (T111 places typed views here)

Behavior:
  - When `ref` is set: drawer opens (adds `open` attr, slideUp animation)
  - When `ref` is removed or empty: drawer closes (slideDown, removes `open`)
  - Swipe-down gesture on drawer handle → close (same as profile-sheet)
  - Click outside drawer (on the tree area) → close
  - ESC key → close
```

### DOM structure on /trace (rb-trace-view.ts modification)

```html
<!-- Existing tree panel -->
<rb-trace-tree></rb-trace-tree>

<!-- NEW: detail drawer (initially hidden, no ref) -->
<rb-detail-drawer>
  <!-- T111 places typed DetailView here dynamically -->
</rb-detail-drawer>
```

### Integration with rb-object-item click (T103 seam)

Currently `rb-object-item.onClick` calls `navigate(type, 'show', {uuid})`. The TraceRouter handles `show` by rendering `rb-detail-view` somewhere. T110 changes this:

- `navigate(type, 'show', {uuid})` → TraceRouter sets `rb-detail-drawer.ref = type:uuid`
- The drawer opens, and its `ref` change triggers the hosted DetailView to render
- The TraceRouter no longer needs to replace the whole view — it just updates the drawer's ref

### CSS (add to app.css)

```css
rb-detail-drawer {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-height: 50vh; background: white; border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  transform: translateY(100%); transition: transform 0.25s ease-out;
  z-index: 100; overflow-y: auto; padding: 16px;
}
rb-detail-drawer[open] { transform: translateY(0); }
rb-detail-drawer .drawer-handle {
  width: 40px; height: 4px; background: #ccc; border-radius: 2px;
  margin: 0 auto 12px; cursor: grab;
}
```

### Expert implementation (~60 lines)
1. Create `rb-detail-drawer.ts` — Web Component with open/ref attrs, slideUp/Down, swipe dismiss
2. Modify `rb-trace-view.ts` — add `<rb-detail-drawer>` to the layout
3. Modify TraceRouter `show` verb — set drawer ref instead of full view swap
4. CSS additions to app.css

## Dependencies
- **Requires:** None (Phase 1 foundation)
- **Enables:** T111 (typed views render inside this container)

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.1. Awaiting req split + architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (Phase 1 — drawer foundation)*
