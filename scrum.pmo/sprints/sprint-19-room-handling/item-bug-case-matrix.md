# R19 In-Room Item Bug — Diligent Case Matrix

| # | Case | Symptom | Environment | Root Cause | Fix Commit | Status | Evidence/Gate |
|---|------|---------|-------------|------------|------------|--------|---------------|
| 1 | Sticky collapse (one-way setter) | Item collapses on tap, never un-collapses through data updates. Collapsed attr persists across re-renders. | All (desktop+iOS) | `.data` setter was one-way: set attrs from data but never CLEARED attrs not present in data. `collapsed` attr set by icon-tap persisted forever. | Expert two-way setter (DATA_ATTRS clear loop, v0.5.216) | fixed-gated | Tester confirmed in-harness: collapsed clears on data update. |
| 2 | 0x0 no-auto-expand | File items exist in DOM (display:block) but render 0x0 px. Room node not auto-expanded. | All | `buildSeedNode` sets `.tt-children { display: none }` on ALL nodes. renderSeed had no auto-expand for seed root. | v0.5.223 root auto-expand (line 302-304 of _doRenderSeed) | fixed-gated | Tester screenshot: Files now visible after fix. |
| 3 | iOS safe-area clip | Items clip to 0px height on iOS standalone PWA. | iOS standalone PWA only | **WRONG DIAGNOSIS** — initially attributed to `.room-body { overflow: hidden }` + `env(safe-area-inset-top)` relayout. Disproven: bug reproduces on desktop Chrome (no notch, no safe-area). | overflow-y:auto (v0.5.227) | fixed-unverified | Applied but did NOT fix the real bug. May have fixed a separate minor clip issue. Needs standalone-specific re-test. |
| 4 | 11x/3x over-render | renderSeed fires multiple times per room-join (connectedCallback + N FILE_ADDED events). Each nukes innerHTML + fetches + rebuilds. | All (measured 3x by tester, 11x possible with many files) | connectedCallback triggers renderSeed. Each FILE_ADDED also triggers renderSeed. Multiple concurrent async calls race — each does innerHTML='' + fetch + rebuild. | rAF debounce + AbortController (v0.5.226) | fixed-gated | Tester measured: 27→9 buildSeedNode calls (3 renders→1 render). |
| 5 | Desktop-Chrome first-N icon-only | First 7 file items icon-only (no name/desc text, just colored icon square). Last 2 items (Project_Sanctuary, WODA) render fully. All items render correctly AFTER any interaction (click, hover?). | Desktop Chrome (headed). Headless does NOT reproduce. | **OPEN — under investigation** | — | OPEN | Tester reproducing in headed Chrome. Pattern: LAST-added files work, EARLIER-added files broken. Interaction fixes all. |

## Case 5 Analysis — Desktop Chrome first-N icon-only

### Observed Facts
- 9 files total. First 7 = icon-only. Last 2 (Project_Sanctuary, WODA) = fully rendered.
- After any user interaction, all 9 render correctly.
- Headless WebKit does NOT reproduce (all 9 render correctly).
- This is NOT a timing/race/async issue — debounce+abort coalesces to single render.
- The single render builds all 9 items via buildSeedNode with `.data` setter.

### Sequence Trace (single debounced render)

```
1. connectedCallback → renderSeed(roomId) → rAF scheduled
2. FILE_ADDED x9 → each calls renderSeed → rAF re-scheduled (debounce)
3. rAF fires → _doRenderSeed(roomId)
4. fetch /api/trace/children/<roomId> → returns { children: [9 files] }
5. this.innerHTML = ''
6. buildSeedNode(roomUuid, 'Room', roomName, [9 children])
   → creates room .tt-node
   → loops 9 children:
     child[0]: buildSeedNode(file0uuid, 'FileUnit', file0name, [])
       → createElement('rb-object-item')
       → item.data = { ref, type, title, ... }  ← attrs set, not connected
       → row.appendChild(item)  ← connectedCallback fires → render() → innerHTML set
     child[1]: same...
     ...
     child[8]: same...
   → room .tt-children.style.display = 'none'
7. this.appendChild(rootNode)  ← room node enters DOM
   → room rb-object-item connectedCallback fires
   → children already connected (appended in step 6 loop)
8. rootItem.setAttribute('children-open', ''); rootKids.style.display = ''
   → children become visible
```

### SUSPECT: step 6 vs step 7 ordering

In step 6, each child's `row.appendChild(item)` fires connectedCallback for that item — BUT the item is connected to a DETACHED subtree (the room .tt-node is not yet in the document). `this.isConnected` may return TRUE (element is connected to its parent chain) but the root of the chain is NOT in the document.

**Wait — `isConnected` returns true ONLY if the element is in a connected document.** A detached subtree's elements have `isConnected = false`. So in step 6, `row.appendChild(item)` does NOT fire `connectedCallback` because the parent tree is detached.

connectedCallback fires for ALL items at once in step 7 when `this.appendChild(rootNode)` connects the entire subtree to the document. The browser processes connectedCallback for the room node + all children in DOM tree order.

**But render() reads from attributes** (which were set by `.data` setter in step 6). So all 9 items should render identically — they all have attributes set, and connectedCallback fires for all of them when the subtree connects.

### What could make first-7 different from last-2?

The only ORDER-dependent factor: **the browser's paint/layout scheduling**. Headed Chrome may schedule a paint DURING the connectedCallback cascade. If the browser paints after the first few connectedCallbacks but before the rest, the early items get an INTERMEDIATE paint frame where they're icon-only (before render() completes their innerHTML).

This would explain:
- **Headed Chrome**: browser has a real compositor, schedules paints aggressively → intermediate frame visible
- **Headless**: no compositor, no intermediate paints → all connectedCallbacks complete before first paint → looks correct
- **"Renders after interaction"**: interaction triggers a repaint → items that had stale intermediate paint get refreshed

### Proposed Root Cause (Case 5)

Browser paint scheduling in headed mode captures items in an intermediate render state. Not a logic bug — a **rendering artifact** from synchronous DOM mutation during connectedCallback cascade.

### Fix Design

**Batch the subtree build OFF-document, connect ONCE:**
Already happening (step 6 builds detached, step 7 connects). But if the browser fires connectedCallbacks synchronously on appendChild in step 7, and each connectedCallback's `render()` does `this.innerHTML = ...` (synchronous DOM mutation), the browser MAY interleave paint between callbacks.

**Fix: defer render() to microtask in connectedCallback:**
```js
connectedCallback(): void {
    this.upgradeProperty('data');
    this.classList.add('object-item');
    if (!this._initialized) {
        this._initialized = true;
        this.addEventListener('click', this.onClickDelegate);
    }
    // Defer render to microtask — batch all items' renders
    queueMicrotask(() => {
        if (this.isConnected) this.render();
    });
}
```

All 9 connectedCallbacks fire synchronously. Each queues a microtask. After all 9 are queued, the microtask queue drains — all 9 render() calls fire before the next paint. No intermediate frame.

**Alternative: requestAnimationFrame:**
Same idea but defers to next frame. Might flash "empty" for one frame. Microtask is better.
