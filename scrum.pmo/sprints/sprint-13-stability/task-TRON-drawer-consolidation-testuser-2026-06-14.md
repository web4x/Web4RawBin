[Back to Sprint 13 Planning](./planning.md)

# TRON DIRECTIVE — drawer consolidation + test-user cleanup (2026-06-14 10:09 UTC)

## TRON REQUIREMENT (literal)
> "the last task from yesterday before night is not yet done. there are still 2 drawers, while the chat shall be refactored to be in the same drawer. do not break the message loading. also it looks like there are still inflationary test users. delete them. only one test user, that puts its testscreeshots into the test room"

## TWO REQUIREMENTS

### R-DRAWER: Consolidate 2 drawers → 1 (chat into the same drawer)
- Currently TWO drawers exist (detail/preview drawer + a separate chat drawer/sheet).
- REFACTOR: chat must live in the SAME drawer as the other content (one drawer, not two).
- ★ HARD CONSTRAINT: DO NOT break message loading (chat history load + live messages must still work).
- Owner: architect (design the single-drawer structure + where chat mounts), expert (implement, behavior-preserving), tester (verify message loading: history loads, live messages arrive, in the consolidated drawer).

### R-TESTUSER: Delete inflationary test users, keep ONE
- Inflationary test users still polluting data (like the earlier room flood).
- DELETE them — keep EXACTLY ONE test user (systemTester) that puts its test screenshots into the ONE persistent test room (per learning #4: one systemTester identity + one persistent test room, zero-pollution-by-construction).
- SAFE procedure (like the room purge): expert BACKUP data/users first → identify test users by pattern → report the keep/delete set to PO BEFORE deleting → preserve Tron's real users + the ONE systemTester → delete the rest.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect: drawer design; req: capture)
  - [ ] implementing (expert: drawer consolidation + test-user purge)
  - [ ] testing (tester: message-loading verify + purge verify)
- [ ] QA Review (Tron)
- [ ] Done

## PO FINDINGS (investigated read-only, for the workers)

### R-DRAWER structure
- TWO drawers: `src/public/ts/trace/rb-detail-drawer.ts` (detail/trace) + `src/public/ts/components/rb-chat-sheet.ts` (chat).
- MESSAGE-LOADING PATH (must NOT break): RoomView.ts:57 (ROOM_JOINED → `chatSheet.loadHistory(room.chatHistory)`), RoomView.ts:64 (CHAT_HISTORY → `chatSheet.loadHistory(msg.messages)`), rb-chat-sheet.ts:117 `loadHistory()`.
- DESIGN (architect): chat becomes a panel/tab WITHIN the single drawer (rb-detail-drawer); RoomView keeps calling loadHistory, now routed to the in-drawer chat panel. Behavior-preserving.

### R-TESTUSER classification (data/users = 230 total)
- KEEP (real humans): Krista Kim/Krista, Felix Wittke, Philip, Vladislav Tsyao, Tanya Kelen, James Woodward-Caradonna, Marcel Donges Surfac, Marcel Samsung (+ any other genuine human name).
- KEEP EXACTLY ONE SystemTester (there are 2 'SystemTester' → keep 1, delete the dup) — this is Tron's one test user (screenshots → test room).
- DELETE (test fixtures): V235-V238/R100-R203/TouchProbe/TouchGate/ScaleTest/RaceTest/UrlTest/Dedup1/test*/probe*/gate* etc. (clear test-fixture names).
- ⚠ 155 NO-PROFILE users: AMBIGUOUS — Tron's real device can be no-profile (e.g. earlier 3dca7f5e). Do NOT blanket-delete no-profile. Expert: cross-ref against real rooms/devices; report no-profile set to PO; keep any tied to a real room/device, delete only clearly-test-created ones.
- SAFE PROCEDURE (expert, like the room purge): BACKUP data/users first (tar) → classify → report keep/delete set to PO BEFORE deleting → preserve real humans + 1 SystemTester + ambiguous-real → delete clear test fixtures + dup SystemTester.

## Sequence (workers rewinding — re-task each on Rule-6 GREEN)
1. Architect → design single-drawer (chat into detail drawer), identify the message-loading path that must not break.
2. Expert → (a) implement drawer consolidation behavior-preserving; (b) test-user purge backup-first, report keep/delete set before deleting.
3. Tester → verify message loading (history + live) in consolidated drawer + verify test-user cleanup (one systemTester, screenshots → test room).
4. Version bump + sw.js + deploy + Tron QA.

---

## ARCHITECT DESIGN: Drawer Consolidation (robbin-architect, 2026-06-14)

### Current: TWO position:fixed bottom-0 overlays at z-index:50

rb-detail-drawer (trace/rb-detail-drawer.ts) — Light DOM, .drawer-header + .drawer-body. Opened by item selection.

rb-chat-sheet (components/rb-chat-sheet.ts) — Shadow DOM, .sheet with handle + messages + input. Created by RoomView, appended to document.body.

Both `position:fixed; bottom:0; z-index:50` — they OVERLAP = the two-drawer problem.

### Target: ONE drawer with switchable panels

rb-detail-drawer becomes the SINGLE drawer. Chat moves INTO it as a panel.

```
rb-detail-drawer (UNIFIED)
  .drawer-header: grab-bar + X close
  .drawer-body:
    .drawer-panel-chat    [display:block when mode=chat]
    .drawer-panel-detail  [display:none when mode!=detail]
    .drawer-panel-preview [display:none when mode!=preview]
```

Mode switch = toggle display on panels. Zero DOM destruction. Chat messages survive mode switches.

### ChatPanel class (extracted from rb-chat-sheet, NO Shadow DOM)

New file: `trace/ChatPanel.ts`. Extracted from rb-chat-sheet with identical API:

- `constructor(container: HTMLElement)` — renders chat UI into container (Light DOM)
- `set clientIdentity(id: string)` — same
- `roomId: string` — same
- `loadHistory(messages)` — same as rb-chat-sheet:117
- `addMessage(senderId, senderName, text)` — same as rb-chat-sheet:92
- `setWsStatus(status, detail?)` — same
- `setupLazyLoad()` — IntersectionObserver, same
- Events: `rb-chat-send`, `rb-invite`, `rb-reconnect` dispatched on container (bubble to drawer)

NO Shadow DOM. Uses existing app.css classes (`.chat-messages`, `.chat-input-bar`, etc.).

### rb-detail-drawer changes

```typescript
private chatPanel: ChatPanel | null = null;
private mode: 'chat' | 'detail' | 'preview' = 'chat';

setMode(m: 'chat' | 'detail' | 'preview'): void {
  this.mode = m;
  // Toggle panel visibility
  for (const [cls, active] of [['chat', m==='chat'], ['detail', m==='detail'], ['preview', m==='preview']]) {
    const el = this.body.querySelector(`.drawer-panel-${cls}`) as HTMLElement;
    if (el) el.style.display = active ? '' : 'none';
  }
  if (m === 'chat' && !this.chatPanel) {
    const panel = this.body.querySelector('.drawer-panel-chat') as HTMLElement;
    this.chatPanel = new ChatPanel(panel);
  }
}

get chat(): ChatPanel | null { return this.chatPanel; }
```

Default mode = `'chat'` (when no item selected).

### MESSAGE-LOADING WIRING (exact preservation)

```
CURRENT (RoomView → rb-chat-sheet):         NEW (RoomView → drawer.chat):
─────────────────────────────────────       ────────────────────────────────
this.chatSheet.loadHistory(history)    →    drawer.chat.loadHistory(history)
this.chatSheet.addMessage(id,name,txt) →    drawer.chat.addMessage(id,name,txt)
this.chatSheet.setWsStatus('disc')     →    drawer.chat.setWsStatus('disc')
this.chatSheet.clientIdentity = id     →    drawer.chat.clientIdentity = id
this.chatSheet.roomId = roomId         →    drawer.chat.roomId = roomId

EVENTS (same names, now on drawer):
chatSheet.on('rb-chat-send')           →    drawer.on('rb-chat-send')
chatSheet.on('rb-invite')              →    drawer.on('rb-invite')
chatSheet.on('rb-reconnect')           →    drawer.on('rb-reconnect')
```

**Exact 15 callsites in RoomView.ts** (lines 57, 64, 65, 70, 82, 84, 85, 86, 95, 96, 97, 188, 211, 212, 215-219):
- Replace `this.chatSheet` with `drawer.chat` (mechanical, same API)
- Remove `document.createElement('rb-chat-sheet')` + `document.body.appendChild`
- Add `drawer.setMode('chat')` after render

### SelectionModel integration (R20.6g)

```
selection-changed event:
  count === 0 → drawer.setMode('chat')     ← DEFAULT
  count === 1 → drawer.setMode('detail')   ← detail for selected item
  file click  → drawer.setMode('preview')  ← ContentPreviewer
```

### DELETE

- `components/rb-chat-sheet.ts` — entire file
- `import './components/rb-chat-sheet.js'` from RoomView.ts
- `.chat-sheet` CSS in app.css (lines 166-177)
- `document.body.appendChild(this.chatSheet)` from RoomView

### KEEP (unchanged)

- Chat lazy-load (IntersectionObserver) — moves to ChatPanel
- Chat message bubble creation — moves to ChatPanel
- Invite button + WS status dot — moves to ChatPanel
- All RoomView WS event handlers (ROOM_JOINED, CHAT_HISTORY, CHAT_MESSAGE, etc.)

### CRITICAL FIX: ref → detail-content render (THE LIVE BUG)

**Bug:** Selection sets `ref` attr → `attributeChangedCallback` sets `open` → drawer opens BUT .drawer-body is EMPTY. Zero detail-render code exists in rb-detail-drawer.ts.

**Root cause:** On /trace, the TraceRouter's `drawerShowHandler()` (index.ts:158-172) creates the typed detail element (`rb-task-detail`, `rb-requirement-detail`, etc.) and appends to `drawer.body`. In-room, there's NO TraceRouter — nothing creates the detail element.

**Fix: rb-detail-drawer OWNS detail rendering (self-contained, no external router needed):**

```typescript
// In rb-detail-drawer.ts attributeChangedCallback:
attributeChangedCallback(name: string): void {
  if (name === 'ref') {
    const ref = this.getAttribute('ref');
    if (ref) {
      this.setAttribute('open', '');
      this.renderDetailForRef(ref);  // ← NEW: render content
    } else {
      this.removeAttribute('open');
    }
  }
}

private async renderDetailForRef(ref: string): Promise<void> {
  this.setMode('detail');
  const panel = this.body.querySelector('.drawer-panel-detail') as HTMLElement;
  if (!panel) return;
  panel.innerHTML = '<div style="padding:16px;opacity:0.5">Loading...</div>';

  // Parse ref → type:uuid
  const [type, uuid] = ref.includes(':') ? [ref.split(':')[0], ref.split(':').slice(1).join(':')] : ['unknown', ref];

  // Fetch scenario data from /api/trace/children (same path that works for tree)
  try {
    const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}`);
    if (!res.ok) { panel.innerHTML = '<div style="padding:16px">Not found</div>'; return; }
    const data = await res.json();

    // Create typed detail element (same pattern as index.ts:166-170)
    const tagMap: Record<string, string> = {
      requirement: 'rb-requirement-detail', task: 'rb-task-detail',
      usecase: 'rb-usecase-detail', class: 'rb-class-detail',
      method: 'rb-method-detail', implementation: 'rb-implementation-detail',
      test: 'rb-test-detail', file: 'rb-file-detail',
      member: 'rb-member-detail', collection: 'rb-collection-detail',
      bug: 'rb-requirement-detail', changerequest: 'rb-requirement-detail',
    };
    const tag = tagMap[type.toLowerCase()] || 'rb-detail-view';

    panel.innerHTML = '';
    const el = document.createElement(tag) as HTMLElement & { graph?: any };
    el.setAttribute('ref', ref);
    el.setAttribute('uuid', uuid);
    // For in-room items without a TraceGraph: detail element fetches its own data
    // (detail elements already handle graph-less rendering via fetchDetailData)
    panel.appendChild(el);
  } catch {
    panel.innerHTML = '<div style="padding:16px">Failed to load</div>';
  }
}
```

**For file items (preview mode):** `renderDetailForRef` detects `type=file` → calls `setMode('preview')` + `renderContentPreview` into `.drawer-panel-preview` (existing path from openFilePreview).

**For member items:** `type=member` → renders a simple member card (name, status, role) — no scenario lookup needed (data from room members array).

**This makes rb-detail-drawer SELF-CONTAINED:** ref attr → fetch → render detail. No external router required. Works in /trace (TraceRouter still works as override) AND in-room (selection → ref → drawer renders).

### Gate

- Playwright: join room → assert chat messages load in the drawer (not a separate overlay)
- Playwright: send message → assert it appears in same drawer
- Playwright: select item → assert detail content renders in drawer (NOT empty)
- Playwright: tap file item → drawer switches to preview → tap back → chat messages still there
- Screenshot: one drawer visible, no second overlay, detail content populated on selection

### SINGLE-RENDER GUARANTEE (no double-render on /trace)

**Risk:** On /trace, TraceRouter's `drawerShowHandler` (index.ts:158) renders detail content into drawer.body AND sets `drawer.setAttribute('ref', ...)`. That ref change fires `attributeChangedCallback` → `renderDetailForRef()` would render AGAIN = double-render.

**Fix: drawer owns rendering, router delegates.**

Remove detail-rendering from `drawerShowHandler`. It becomes a thin delegate:

```typescript
// index.ts — drawerShowHandler SIMPLIFIED:
function drawerShowHandler(drawer: HTMLElement, tagName: string): VerbHandler {
  return (ctx: VerbContext) => {
    const { obj, params } = ctx;
    const uuid = params.uuid || '';
    const ref = obj ? obj.ref() : (uuid ? `unknown:${uuid}` : '');
    if (!ref) { drawer.removeAttribute('ref'); return; }
    // ONLY set ref — drawer's attributeChangedCallback does the rendering
    drawer.setAttribute('ref', ref);
    // If graph is available, pass it to the drawer for richer rendering
    (drawer as any)._graph = ctx.graph;
  };
}
```

The router sets `ref` + optionally passes graph. The drawer's `attributeChangedCallback` → `renderDetailForRef()` handles ALL rendering. ONE code path for both /trace and in-room.

**renderDetailForRef guards:**
```typescript
private async renderDetailForRef(ref: string): Promise<void> {
  // Guard: if panel already shows this ref, skip (idempotent)
  const panel = this.body.querySelector('.drawer-panel-detail') as HTMLElement;
  if (panel?.dataset.currentRef === ref) return;
  panel.dataset.currentRef = ref;
  // ... render ...
}
```

**Graph-aware rendering (bonus for /trace):**
If `this._graph` is set (TraceRouter passed it), the detail element gets `el.graph = this._graph` for richer in-memory rendering (no fetch needed). If no graph (in-room), falls back to `/api/trace/children` fetch. Same element, two data sources.

**Result:** EXACTLY ONCE render per ref change, regardless of whether TraceRouter or SelectionModel triggered it.
