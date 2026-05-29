[Back to Sprint 16 Planning](./planning.md)

# T114: Tree-item — OS drag-and-drop

[task:uuid:a9341bae-656e-4e87-ab50-c9a17a7c9222]

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

`[task:uuid:a9341bae-656e-4e87-ab50-c9a17a7c9222]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.6** (OS drag-and-drop)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.6
  - **use case:** objectItem.drag [uc:uuid:16a01141-d141-4a01-b141-000000114001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 2 package)
  - **class/method:** `rb-object-item.ts` → `RbObjectItem.onDragStart()` (existing T105, verify after redesign)

## Task Description
Make the tree-item **draggable** so the user can perform **OS-specific** drag-and-drop
of the item (native HTML5 drag with appropriate dataTransfer payload; architect defines
the drop semantics/targets).

## Context
Tron 2026-05-27: "draggable so i could os specificly drag and drop the item."

## Acceptance Criteria
- [ ] AC1 — A tree-item can be dragged (native OS drag initiates)
- [ ] AC2 — Drag carries a meaningful payload (item identity / type) for OS drop targets
- [ ] AC3 — Drag does not break tap-collapse (T115) or children-expand (T115) interactions
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Architect Design — robbin-architect

### Already implemented (T105)

**This is already done.** The current `rb-object-item.ts` lines 22-61 have full OS drag support:
- `setAttribute('draggable', 'true')` (line 22)
- `dragstart` handler with 3 dataTransfer payloads (lines 51-61):
  - `text/plain` → `#type.show?uuid=...` (paste → navigable hash link)
  - `text/uri-list` → `origin/app#type.show?uuid=...` (OS native drag)
  - `application/rb-object-ref` → `type:uuid` (internal drop for T107/T108 linking)

### T114 delta: Just verify drag still works after T112/T113 redesign

The T112+T113 changes restructure `render()` HTML. Ensure:
1. `draggable="true"` still on the root element (connectedCallback)
2. `dragstart` handler still fires (it's on `this`, not on child elements — should be fine)
3. Drag icon shows the new icon (not the old emoji) as drag image

### Optional enhancement: custom drag image

```typescript
// In onDragStart, set custom drag image to the icon element:
const icon = this.querySelector('.oi-icon') as HTMLElement;
if (icon && e.dataTransfer) {
  e.dataTransfer.setDragImage(icon, 16, 16);
}
```

This shows just the square icon as the drag ghost — cleaner than dragging the full item.

### Effort: ~5 lines (verify + optional drag image)

## Dependencies
- **Requires:** tree-item redesign (T112/T113 establish the item)
- **Enables:** None

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.6. Awaiting architect design, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 5 (Phase 2 — tree-item drag)*
