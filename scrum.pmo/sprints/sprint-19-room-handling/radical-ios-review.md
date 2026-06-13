# Radical iOS Safari Review — rb-object-item / rb-trace-tree

## Quirk 1: CLICK-ELIGIBILITY (PRIME SUSPECT)

**iOS Safari quirk:** `click` events only fire/bubble on elements that are "click-eligible" — elements with `cursor: pointer`, native interactive elements (`<a>`, `<button>`, `<input>`), or elements with an explicit `onclick` attribute. A `<span>` or `<div>` WITHOUT `cursor: pointer` silently swallows taps — no click fires, no bubble.

**Our code:**
- `rb-object-item` (custom element): gets `.object-item` class in connectedCallback → `cursor: pointer` ✓ (line 62 app.css)
- `.oi-expand` (the › expander): `cursor: pointer` ✓ (line 90 app.css)
- `.oi-icon`: `cursor: grab` ✓ (line 64 app.css) — grab IS click-eligible on iOS

**BUT:** rb-object-item's click handler uses DELEGATION — `this.addEventListener('click', onClickDelegate)` on the custom element. The click MUST bubble from the actual tap target (`.oi-expand` span, `.oi-icon` span) UP to the rb-object-item. On iOS, if the tap target isn't click-eligible, the click never fires.

**The `.oi-expand` span is created by `render()` via innerHTML.** After render(), it's a NEW element. It inherits CSS `cursor: pointer` from the stylesheet. This SHOULD make it click-eligible.

**RISK: if render() hasn't fired (item is icon-only / pre-render), the `.oi-expand` doesn't exist yet.** Tap on empty area → no target → no click → no toggle.

**⚠️ PRESENT — LIKELY CAUSE of "can close but not expand" if item is in a partial-render state where .oi-expand exists for close but is destroyed/missing on re-render.**

**FIX:** Add `onclick=""` (empty) on the rb-object-item element itself as a fallback click-eligibility marker:
```js
connectedCallback() { this.setAttribute('onclick', ''); ... }
```
Or use `touch-action: manipulation` on `.object-item` (eliminates 300ms delay AND ensures tap = click).

## Quirk 2: Touch vs Click Handler Asymmetry

**iOS quirk:** touchstart/touchend always fire. click only fires if the tap target is click-eligible (Quirk 1) AND the finger didn't move > 10px AND the touch duration < ~750ms.

**Our code:**
- COLLAPSE: uses `click` handler delegation → icon click → `toggleAttribute('collapsed')`. On iOS, if icon loses cursor (e.g., during re-render innerHTML swap), collapse tap fails.
- EXPAND: uses `click` handler delegation → expander click → `toggleAttribute('children-open')` → dispatch toggle-children. Same click-eligibility dependency.
- CLOSE drawer: touch-based swipe (touchstart/touchmove/touchend) — ALWAYS works on iOS because touch events don't require click-eligibility.

**⚠️ PRESENT — explains "close works, expand doesn't" if the close path uses touch (drawer swipe) while expand uses click (expander tap). Different event types, different iOS behavior.**

**FIX:** For critical interactions (expand/collapse), use `touchend` as primary with click as desktop fallback:
```js
this.addEventListener('touchend', this.onTapDelegate, { passive: true });
this.addEventListener('click', this.onClickDelegate);  // desktop fallback
```

## Quirk 3: -webkit CSS / touch-action / pointer-events / -webkit-tap-highlight

**Our code:**
- `.chat-handle` has `-webkit-tap-highlight-color: transparent` ✓ — but NO tree elements have it
- No `touch-action` on tree items (only on `.preview-zoom-container` for pinch)
- No `-webkit-tap-highlight-color` on `.object-item` → iOS shows default gray flash on tap (cosmetic, not functional)
- No `pointer-events: none` on any tree element (good — would block taps)

**⚠️ PARTIALLY PRESENT — missing `touch-action: manipulation` on `.object-item`**

`touch-action: manipulation` tells iOS: "this element handles taps — don't wait for double-tap-to-zoom, fire click immediately." Without it, iOS MAY apply the 300ms tap delay (see Quirk 7).

**FIX:**
```css
.object-item { touch-action: manipulation; -webkit-tap-highlight-color: rgba(255,255,255,0.1); }
```

## Quirk 4: Custom Element connectedCallback + Upgrade Timing on iOS WebKit

**iOS quirk:** iOS WebKit processes custom element upgrades in the SAME order as Chrome — `customElements.define()` synchronously upgrades all matching elements in DOM, future `createElement` returns upgraded instances. No iOS-specific difference documented.

**BUT:** iOS WebKit's JS engine (JavaScriptCore) may schedule microtasks differently than V8. If `connectedCallback` queues a microtask (our queueMicrotask(render) pattern), iOS may drain the microtask queue at a different point relative to the compositor.

**⚠️ PRESENT — the queueMicrotask pattern is problematic on iOS.** The DocumentFragment+sync-render fix (revert to synchronous render in connectedCallback) eliminates this concern.

## Quirk 5: iOS Compositor Paint (Case-5)

**iOS quirk:** iOS WebKit's compositor is more aggressive about intermediate paints during DOM mutation than desktop Chrome. The "build detached, attach atomically" pattern is the correct mitigation.

**⚠️ PRESENT — addressed by DocumentFragment fix. But the two-way .data setter clearing children-open (bug-a from previous diagnosis) re-introduces a mutation after attach. Fix: include children-open in .data object.**

## Quirk 6: Standalone PWA Mode (navigator.standalone)

**iOS quirk:** `window.navigator.standalone === true` in PWA mode. No address bar. `100vh` = full screen height including notch area. `env(safe-area-inset-top)` nonzero.

**Our code:**
- `viewport-fit=cover` ✓ (line 6 app.html)
- `apple-mobile-web-app-capable: yes` ✓ (line 7)
- `env(safe-area-inset-top)` on header ✓
- `env(safe-area-inset-bottom)` on chat input ✓
- `.room-view { overflow-y: auto }` ✓ (fixed from earlier overflow:hidden)

**⚠️ PARTIALLY PRESENT — no functional issue remaining, but `.room-body min-height: 0` (line 150) is needed for flex children to scroll correctly in iOS standalone. Already present.**

## Quirk 7: 300ms Tap Delay

**iOS quirk:** iOS Safari historically delays click events by 300ms to detect double-tap-to-zoom. Modern iOS (Safari 10+) eliminates this IF the viewport meta has `width=device-width` (our line 6 has it). BUT: elements inside scrollable containers with `-webkit-overflow-scrolling: touch` may STILL experience the delay.

**Our code:**
- viewport `width=device-width` ✓ → 300ms delay should be eliminated globally
- `.room-body { -webkit-overflow-scrolling: touch }` ← tree items are INSIDE this scrollable container
- No `touch-action: manipulation` on `.object-item`

**⚠️ PRESENT — tree items inside -webkit-overflow-scrolling container may still get 300ms delay despite viewport meta.** `touch-action: manipulation` on `.object-item` is the fix:
```css
.object-item { touch-action: manipulation; }
```
This tells iOS: "no double-tap-to-zoom on this element, fire click immediately."

## Quirk 8: Flex/Overflow/Display Rendering on iOS

**iOS quirk:** `min-height: 0` required on flex children for `overflow: auto` to work. `flex: 1` children without `min-height: 0` expand instead of scroll.

**Our code:**
- `.room-body { min-height: 0 }` ✓ (line 150)
- `.room-view { overflow-y: auto }` ✓

**✓ ALREADY HANDLED**

---

## Summary: FIXES NEEDED

| # | Quirk | Status | Fix | Impact |
|---|-------|--------|-----|--------|
| 1 | Click-eligibility | ⚠️ PRIME SUSPECT | `touch-action: manipulation` on `.object-item` OR `onclick=""` on element | Expand-broken on iOS |
| 2 | Touch vs click asymmetry | ⚠️ PRESENT | Add `touchend` handler as primary for expand/collapse, click as fallback | Close-works expand-doesn't |
| 3 | Missing touch-action | ⚠️ PRESENT | `.object-item { touch-action: manipulation; -webkit-tap-highlight-color: rgba(255,255,255,0.1) }` | 300ms delay + tap highlight |
| 4 | CE upgrade + microtask | ⚠️ PRESENT | Revert to sync render (DocumentFragment fix) | Icon-only on iOS |
| 5 | Compositor paint | ⚠️ ADDRESSED | DocumentFragment + sync render + children-open in .data | Icon-only race |
| 6 | Standalone PWA | ✓ HANDLED | Already has safe-area + overflow-y:auto + min-height:0 | — |
| 7 | 300ms tap delay | ⚠️ PRESENT | `touch-action: manipulation` (same as Quirk 3) | Sluggish/missed taps |
| 8 | Flex/overflow | ✓ HANDLED | Already has min-height:0 | — |

## PRIORITY FIXES (3 changes)

### 1. CSS: touch-action: manipulation (fixes Quirk 1 + 3 + 7)
```css
.object-item {
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(255,255,255,0.1);
}
.oi-expand {
    touch-action: manipulation;
}
```
Eliminates 300ms delay. Makes taps fire click immediately. Ensures click-eligibility.

### 2. JS: children-open in .data object (fixes Quirk 5 — already diagnosed)
buildSeedNode passes `'children-open': ''` in .data when item should start expanded. Two-way setter preserves it.

### 3. JS: sync render + DocumentFragment (fixes Quirk 4 + 5 — already designed)
Revert connectedCallback to synchronous render(). Build tree in DocumentFragment. Attach atomically.
