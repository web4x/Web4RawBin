[Back to Sprint 15 Planning](./planning.md)

# T105: defaultItemView Web Component (draggable, native-OS)

[task:uuid:105e4f50-6172-4384-895b-e05050505105]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run rb-object-item.test.ts, jsdom)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.15)
`src/public/ts/trace/rb-object-item.ts` → `<rb-object-item>` (+ `nav.ts` navigation hook, `.object-item` CSS in app.css).
- AC1: one component renders all 7 types; attribute-driven (ref/type/title/status); per-type accent emoji. Parses type+uuid from `ref` (type:uuid).
- AC2: `.object-item` mirrors the `.room-card` idiom (rounded translucent flex row; `.item-title` + muted `.item-id` sub-line + trailing `.item-status` chip).
- AC3/AC4: `draggable=true`; dragstart sets text/plain=`#<type>.show?uuid=…`, text/uri-list=`${origin}/app#…` (OS-recognizable), application/rb-object-ref=`type:uuid`; effectAllowed=copyLink.
- AC5: ViewBus.subscribe(ref) on connect / unsubscribe on disconnect; notify(ref)→re-render region (no reload).
- AC6: click → `navigate(type,'show',{uuid})` via the module-level active router (nav.ts; TraceRouter.start registers itself). View stays pure — routing in the controller.
- Tests: `test/vitest/rb-object-item.test.ts` (jsdom) — all-7-types render, draggable + 3 payloads, ViewBus live re-render + unsubscribe, click→navigate spy. Tester runs.
- esbuild bundles the layer; build clean. v0.5.15, sw.js rawbin-v0.5.15. Not yet mounted in a page (T108). No deploy needed.

## Design (robbin-architect, 2026-05-26) — consumes the T103 seam

**New component:** `src/public/ts/trace/rb-object-item.ts` → `<rb-object-item>`. The default list-item View for any TraceModel object. One component renders ALL 7 types (type drives icon/accent, not structure).

**Attributes (T103 contract):** `ref` (`type:uuid` identity), `type`, `title`, `status` (optional). View reads these; controller sets them from `obj` on render; observed-attribute change → re-render.

**Visual parity with lobby room entry (AC2):** mirror `RoomBrowser.renderRoomList()`'s `.room-card` — card with `.item-info` (title + muted `type:uuid` sub-line, like `.room-name`/`.room-id`) + trailing `.item-status` chip. Reuse the rounded/translucent/flex-row card idiom; add `.object-item-*` classes mirroring `.room-card`/`.room-info`/`.room-id`. Per-type accent dot/emoji.

**Native-OS drag (AC3/AC4):** `draggable="true"`; on `dragstart` populate `dataTransfer`:
- `text/plain` = `#<type>.show?uuid=<uuid>` (paste → navigable link)
- `text/uri-list` = `${location.origin}/app#<type>.show?uuid=<uuid>` (OS-recognizable — Finder/desktop accept uri-list)
- `application/rb-object-ref` = raw `type:uuid` (internal drops for T107/T108 linking)
`effectAllowed='copyLink'`.

**MVC live-update (AC5):** `connectedCallback` → `ViewBus.subscribe(ref, () => this.render())`; `disconnectedCallback` → `unsubscribe`. A `ViewBus.notify(ref)` from any mutation verb re-renders the item region — no reload (same pattern as `rb-avatar`'s `rb-avatar-updated`).

**Click → navigate:** clicking calls `TraceRouter.navigate(type,'show',{uuid})` (opens DetailView, T107). Routing stays in the controller; the item is a pure View.

**Decoupling:** imports shared TraceModel TYPES only + client `ViewBus`/`TraceRouter`; renders from attributes, resolves on demand — serialization-friendly, no long-held object reference.

## Acceptance Criteria
- [ ] AC1: `<rb-object-item>` renders a typed object's default summary (title + `type:uuid` + optional status) for ALL 7 T101 types, attribute-driven (`ref`/`type`/`title`/`status`)
- [ ] AC2: Visually consistent with the lobby room entry — reuses the `.room-card` idiom (rounded translucent flex row; title + muted id sub-line + trailing status chip)
- [ ] AC3: `draggable="true"`; `dragstart` sets `text/plain`=`#<type>.show?uuid=…` and `application/rb-object-ref`=`type:uuid`
- [ ] AC4: `dataTransfer` also sets `text/uri-list`=absolute `${origin}/app#<type>.show?uuid=…` (OS-recognizable native drag)
- [ ] AC5: ViewBus subscribe-on-connect / unsubscribe-on-disconnect; `ViewBus.notify(ref)` re-renders (no reload) — T103 MVC path
- [ ] AC6: Click calls `TraceRouter.navigate(type,'show',{uuid})`
- [ ] AC7: Tests cover render-per-type, draggable + all three dataTransfer payloads, ViewBus live re-render, click→navigate
- [ ] `npm run build` + version bump

## Test Scenario (tester)
`test/vitest/rb-object-item.test.ts` (jsdom):
1. `<rb-object-item ref="task:<uuid>" type="task" title="T" status="DONE">` → renders title + `task:<uuid>` sub-line + status chip; repeat all 7 types.
2. `draggable===true`. Synthetic `dragstart` w/ stub DataTransfer → `text/plain`===`#task.show?uuid=<uuid>`, `text/uri-list` ends `/app#task.show?uuid=<uuid>`, `application/rb-object-ref`===`task:<uuid>`.
3. `ViewBus.notify('task:<uuid>')` → item re-rendered.
4. Click card → `TraceRouter.navigate` called with `('task','show',{uuid})` (spy).

## Traceability
- up
  - [requirement:uuid:45d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04](./requirements.md) — R15.4 defaultItemView
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.4 in [requirements.md](./requirements.md)
  - **use case:** object.itemView — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** rb-object-item web component (defaultItemView)

## Task Description
Build a per-object default list item view (`rb-object-item`), visually like the lobby
room entry, with native-OS draggable support (HTML5 drag plus file/dnd integration). It
renders any typed object's summary and serves as the building block for ListOverview.

## Acceptance Criteria
- [ ] AC1: `rb-object-item` web component renders a typed object's default summary (label/title/status) for any object type from T101
- [ ] AC2: The item view is visually consistent with the existing lobby room entry
- [ ] AC3: HTML5 `draggable` is enabled and the item exposes its object reference via drag dataTransfer (native-OS drag)
- [ ] AC4: File/dnd integration works — dragging produces an OS-recognizable payload (e.g. text/uri-list or file) per native-OS drag
- [ ] AC5: Component is driven by the T103 MVC live-update path (object change re-renders the item)
- [ ] AC6: Tests cover render, draggable attribute, drag dataTransfer payload, and live re-render
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T103
- **Enables:** T106, T108

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## Test Results (robbin-tester, 2026-05-26, v0.5.15) — **PASS**
- rb-object-item.test.ts **5/5 PASS**: AC1 render all 7 types, AC2 .object-item idiom, AC3/4 draggable + 3 dataTransfer payloads, AC5 ViewBus live re-render + unsubscribe, AC6 click→navigate.
- TEST-INFRA FIX (not a product bug): component self-register guard (`typeof customElements !== 'undefined'`) doesn't fire under vitest-jsdom (module eval before jsdom attaches customElements). Component is correct (registers in a real browser). Added a test-side ensure-define mirroring browser reality (commit b5c7001).

## QA Audit & User Feedback
- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks
None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
