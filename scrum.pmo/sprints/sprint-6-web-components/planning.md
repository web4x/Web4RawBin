# Sprint 6 Planning — Web Component Migration

## Sprint Goal
Modularize the UI into reusable vanilla Web Components. Extract duplicated patterns into custom elements. Make cross-page features (update banner, header) work on all routes — not just /app.

## Sprint Overview
**Duration:** 2026-05-24 – ongoing
**Focus:** Web Components, OOP modularization, cross-page reuse
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directive: "modularize UI, more OOP"

## Architecture Audit

### Current State (1,239 lines client TS + 192 lines CSS + ~400 lines inline HTML in server.ts)

#### Client TypeScript Classes (src/public/ts/)

| File | Lines | DOM calls | Pattern | Issues |
|------|-------|-----------|---------|--------|
| RoomView.ts | 372 | 42 | God class — room header, member list, chat sheet, QR popup, offline banner, WS status, profile click | Too many concerns. Header/fullscreen/reload duplicated with RoomBrowser. Chat sheet is 120+ lines embedded. QR popup is self-contained but not reusable. |
| RoomBrowser.ts | 171 | 21 | Lobby view — header, room list, create form, join form | Header buttons (home, reload, fullscreen) duplicated from RoomView. |
| app.ts | 140 | 6 | App entry — SW registration, update banner, version check, gate flow | Update banner is inline here — only works on /app. Bug-report and profile pages (server.ts inline HTML) can't show it. |
| ProfileEditor.ts | 131 | 16 | Modal overlay — gate + normal mode | Clean self-contained pattern. Good candidate for Web Component. |
| ProfileSheet.ts | 98 | 6 | Modal overlay — other-user view + vCard | Clean. Similar overlay pattern to ProfileEditor. |
| DeviceEnrollDialog.ts | 69 | 7 | Modal overlay — secret code input | Clean. Same overlay pattern. |
| RawBinClient.ts | 258 | 0 | WS client — no DOM. Pure data. | Already OOP. Not a component candidate. |

#### Inline HTML in server.ts (6 pages)

| Route | Lines (est.) | Has update banner? | Has header? | Shares CSS? |
|-------|-------------|-------------------|-------------|-------------|
| `/docs` | ~5 | No | No | Inline MD_CSS |
| `/docs/*.md` | ~5 | No | No | Inline MD_CSS |
| `/md/*` (directory) | ~10 | No | No | Inline MD_CSS |
| `/md/*.md` | ~5 | No | No | Inline MD_CSS |
| `/bug-report` | ~60 | No | No | Inline styles |
| `/profile` | ~70 | No | No | Inline styles |

**Key problem:** These 6 pages are server-rendered HTML strings. They can't use the app.ts update banner, header buttons, or SW update flow. If the user is on `/profile` when a version update happens, they see nothing.

#### Duplicated Patterns

| Pattern | Where | Duplication |
|---------|-------|-------------|
| Header bar (home, reload, fullscreen) | RoomBrowser.render(), RoomView.render() | Same 4 buttons, same event handlers, same CSS class `.btn-header` |
| Fullscreen toggle | RoomBrowser.setupEvents(), RoomView.setupEvents() | Identical 6-line block |
| Overlay pattern | ProfileEditor, ProfileSheet, DeviceEnrollDialog | Same: create div, class `profile-overlay`, append to body, close on backdrop click, touchmove dismiss |
| QR popup | RoomView.showQrPopup() | Self-contained but could serve RoomBrowser too |
| Update banner | app.ts showUpdateBanner() | Only on /app — needs to be on ALL pages |
| WS status dot | RoomView chat sheet | Only visible in room — not in lobby |

### Proposed Web Components

| Custom Element | Replaces | Scope | Shadow DOM? |
|---------------|----------|-------|-------------|
| `<rb-update-banner>` | app.ts showUpdateBanner() | Global — every page | No (needs to be styled by page context) |
| `<rb-header>` | Header bars in RoomBrowser + RoomView | /app pages | No (inherits .btn-header styles) |
| `<rb-chat-sheet>` | Chat sheet in RoomView (~120 lines) | Room view | Yes (self-contained sliding panel) |
| `<rb-member-badge>` | mb-badge HTML in RoomView.renderMemberList() | Room view | No (small, inherits mb-* styles) |
| `<rb-qr-popup>` | RoomView.showQrPopup() | Anywhere share is needed | Yes (self-contained overlay) |
| `<rb-overlay>` | Shared base for ProfileEditor, ProfileSheet, DeviceEnrollDialog | Global | No (content varies, styles shared) |
| `<rb-ws-status>` | WS status dot in chat sheet | Anywhere WS state shown | No (tiny, inherits ws-* styles) |

### Shadow DOM vs Light DOM Decision

**Light DOM for most components.** Rationale:
- RawBin uses a single `app.css` — shadow DOM would require duplicating or importing styles into each component
- The existing CSS is well-namespaced with prefixes (mb-, ws-, chat-, etc.) — no collision risk
- Shadow DOM adds complexity for theming (CSS custom properties pass through, but class-based styles don't)

**Shadow DOM only for:** `<rb-chat-sheet>` (self-contained, position:fixed, has its own full style block) and `<rb-qr-popup>` (overlay, self-contained).

### Shared Styles Strategy

1. CSS custom properties `:root { --rb-primary, --rb-secondary }` — already in place, pass through shadow DOM
2. Shared utility classes (.btn, .btn-primary, .btn-small, etc.) stay in app.css light DOM
3. Component-specific styles: inline in the component class (for Shadow DOM components) or namespaced in app.css (for light DOM components)
4. Server-rendered pages (bug-report, profile): include a `<script type="module">` that imports just `<rb-update-banner>` — minimal bundle, no full app.js needed

## Task List

### Phase 1: Foundation (no behavior change — extract, don't rewrite)

- [ ] [T39: `<rb-update-banner>` Web Component](./task-39-update-banner.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 0.5h tester
  **Dependencies:** None
  Extract showUpdateBanner() + checkForUpdate() + SW registration from app.ts into a self-registering custom element. Include in app.html AND server-rendered pages. Solves "update banner only on /app."

- [ ] [T40: `<rb-header>` Web Component](./task-40-header.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 0.5h tester
  **Dependencies:** None (parallel with T39)
  Extract duplicated header bar from RoomBrowser + RoomView. Attributes: title, show-home, show-delete, show-leave. Events: rb-leave, rb-delete, rb-home.

- [ ] [T41: `<rb-overlay>` base class](./task-41-overlay.md)
  **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Dependencies:** None (parallel)
  Extract shared overlay pattern (backdrop, close, touchmove dismiss). ProfileEditor, ProfileSheet, DeviceEnrollDialog extend it.

### Phase 2: Chat & Room extraction

- [ ] [T42: `<rb-chat-sheet>` Web Component (Shadow DOM)](./task-42-chat-sheet.md)
  **Status:** PLANNED
  **Effort:** 3h expert + 1h tester
  **Dependencies:** T39 (shared patterns established)
  Extract chat bottom-sheet (~120 lines) from RoomView into Shadow DOM custom element.

- [ ] [T43: `<rb-member-badge>` + `<rb-member-list>`](./task-43-member-list.md)
  **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Dependencies:** T42 (RoomView simplified first)
  Extract renderMemberList() into components. RoomView just sets members array.

### Phase 3: Cross-page consistency

- [ ] [T44: Server-rendered pages get shared shell](./task-44-server-pages.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  **Dependencies:** T39, T40
  Refactor server.ts inline HTML (bug-report, profile, docs) to include `<rb-update-banner>`, consistent header, shared CSS.

- [ ] [T45: `<rb-qr-popup>` Web Component (Shadow DOM)](./task-45-qr-popup.md)
  **Status:** PLANNED
  **Effort:** 1h expert + 0.5h tester
  **Dependencies:** T41 (overlay base)
  Extract showQrPopup() from RoomView into Shadow DOM. Reusable from RoomBrowser.

### Phase 4: Cleanup

- [ ] [T46: Remove dead code + verify bundle size](./task-46-cleanup.md)
  **Status:** PLANNED
  **Effort:** 1h expert + 0.5h tester
  **Dependencies:** T39-T45 all done
  Remove duplicated code. Verify bundle size. Run full E2E. Verify all pages have update banner.

## Dependency Graph
```
Phase 1 (parallel):
  T39 (update-banner) ──┐
  T40 (header)       ───┤──→ Phase 3: T44 (server pages)
  T41 (overlay base) ───┤──→ T45 (qr-popup)
                        │
Phase 2 (sequential):   │
  T42 (chat-sheet) ─────┤
  T43 (member-list) ────┘
                        │
Phase 4:                │
  T46 (cleanup) ←───────┘ all done
```

## Migration Rules

1. **Each task keeps the app working.** No task breaks existing behavior. Every task is independently deployable.
2. **Extract, don't rewrite.** Move code into components. Don't redesign the UI. Same HTML, same CSS, same behavior — just in a component boundary.
3. **Test before and after.** Run `npm run build` + E2E after each task. Bundle size delta tracked per task.
4. **No new dependencies.** Vanilla Web Components only. No Lit, no Stencil, no framework.

## Sprint Totals

| Metric | Value |
|--------|-------|
| Tasks | 8 (T39-T46) |
| Expert effort | ~14h |
| Tester effort | ~5h |
| Phases | 4 (foundation → extraction → cross-page → cleanup) |
| Expected outcome | RoomView: 372→~200 lines, app.ts: 140→~50 lines, all pages get update banner |

## Definition of Done
- [ ] All task acceptance criteria met
- [ ] `npm run build` succeeds
- [ ] All vitest + Playwright tests pass
- [ ] All 6 server-rendered pages have `<rb-update-banner>`
- [ ] No header/fullscreen/reload code duplicated between views
- [ ] Bundle size documented (before vs after)
- [ ] No regression in Sprint 1-5 functionality

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-24
**Sprint:** Sprint 6 — Web Component Migration
