# R18.34 — SVG viewer with scoped pinch/pan (cross-browser)

**Author:** robbin-architect
**Status:** Design (corrected — cross-browser scope) — expert implements, Tron verifies on iPhone + Mac

## Context — Why earlier designs were wrong

| Attempt | Assumption | Reality |
|---------|-----------|---------|
| 1st simplified | iframe isolation scopes pinch to iframe content | False — page zoom falls through to outer page |
| 2nd corrected (iOS-only) | Problem is iOS Safari–specific; lock outer viewport works | False — Tron reproduced on Chrome/iPhone AND Chrome/desktop-Mac. Trackpad pinch zooms the page everywhere. |

**Tron on device (cross-browser):** "the zoom-hits-page defect reproduces on BOTH Chrome/iPhone AND Chrome/desktop-Mac — so it is NOT iOS-specific."

### Root cause (final, cross-browser)

Browser page-zoom gestures are **never** scoped to an iframe on **any** platform:

- **iOS / Android (touch):** Two-finger pinch is a UA-level Visual Viewport gesture on the topmost browsing context. The iframe's `<meta viewport>` is ignored for gesture scoping.
- **Desktop Chrome / Safari / Edge / Firefox (trackpad pinch):** The OS reports pinch as `wheel` event with `ctrlKey: true` and a deltaY. The browser interprets this as page zoom by default; the iframe boundary does not consume it.
- **Desktop (Ctrl + scroll-wheel):** Same `wheel + ctrlKey` synthesis path; same outcome.
- **Desktop (Cmd/Ctrl + `+`/`-`):** Keyboard zoom — not scoped to iframe either, but we accept this. Users invoking the OS shortcut likely want page zoom.

There is **no** HTML/CSS mechanism to trap any of these into a child iframe. The only fix is to **handle the gesture explicitly inside `/svg-viewer`** and `preventDefault()` to keep the browser from running its own page-zoom path:

- Touch: `touchstart/touchmove/touchend` with `touch-action: none` and `preventDefault()`
- Trackpad pinch / Ctrl+wheel: `wheel` event with `event.ctrlKey === true`, `preventDefault()`, apply scale
- Plain wheel (no ctrlKey): treat as pan (no zoom), `preventDefault()` to avoid outer-page scroll bleed
- Mouse drag (left button, no modifier): pan
- Double-tap / double-click: reset to fit

### What still helps on iOS (but isn't sufficient alone)

The outer-page viewport lock (`maximum-scale=1, user-scalable=no` on the `/md/*.svg` page) is **still useful on iOS** to prevent the page from zooming even if our gesture handler misses one. Belt-and-braces: lock the page AND own the gesture in the iframe. On desktop Chrome the meta is no-op (Chrome ignores `user-scalable=no`), but the in-iframe `wheel` handler covers it.

## Corrected Design

### Two parts

**Part A — Outer page (`/md/*.svg` route, server.ts:853):**
Lock the outer page viewport so it CANNOT zoom (no native pinch on the outer document). The iframe fills the viewport.

```html
<!-- in pageHead for the /md/*.svg route only — OVERRIDE the default viewport -->
<meta name="viewport"
      content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
```

```html
<iframe src="/svg-viewer?src=/md/raw/${relPath}"
        style="width:100vw;
               height:calc(100vh - 60px - env(safe-area-inset-top));
               border:none;display:block;background:white">
</iframe>
```

This eliminates Defect 2 at the source: the outer page cannot zoom, so the gesture has nowhere to go but into the iframe content (where our JS handles it).

**Part B — Inside the iframe (`/svg-viewer` endpoint, new):**
Implement pinch+pan via touch events on the SVG container, applied via `transform: matrix(scale,0,0,scale,tx,ty)`. Disable the browser's native pinch with `touch-action: none`.

```html
<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;background:white;overflow:hidden;touch-action:none}
  #stage{width:100%;height:100%;overflow:hidden;touch-action:none;position:relative}
  #stage > *{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
  #stage img{display:block;max-width:none;max-height:none}
</style>
</head><body>
<div id="stage"></div>
<script>
(async () => {
  const src = new URLSearchParams(location.search).get('src');
  if (!src) return;
  const stage = document.getElementById('stage');
  const img = new Image();
  img.src = src;
  img.alt = 'diagram';
  stage.appendChild(img);

  await new Promise(r => img.complete ? r() : img.addEventListener('load', r, {once:true}));

  // Initial fit: contain the SVG inside the stage
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  let scale = Math.min(sw / iw, sh / ih);
  let tx = (sw - iw * scale) / 2;
  let ty = (sh - ih * scale) / 2;
  const apply = () => { img.style.transform = `matrix(${scale},0,0,${scale},${tx},${ty})`; };
  apply();

  // Gesture state
  let mode = 'idle'; // 'pan' | 'pinch'
  let startTx=0, startTy=0, startX=0, startY=0;
  let startScale=1, startDist=0, startMidX=0, startMidY=0;

  const dist = (a,b) => Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
  const mid  = (a,b) => ({x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2});

  stage.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      mode = 'pan';
      startTx = tx; startTy = ty;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    } else if (e.touches.length >= 2) {
      mode = 'pinch';
      startScale = scale; startTx = tx; startTy = ty;
      startDist = dist(e.touches[0], e.touches[1]);
      const m = mid(e.touches[0], e.touches[1]);
      startMidX = m.x; startMidY = m.y;
    }
  }, {passive:false});

  stage.addEventListener('touchmove', e => {
    e.preventDefault();
    if (mode === 'pan' && e.touches.length === 1) {
      tx = startTx + (e.touches[0].clientX - startX);
      ty = startTy + (e.touches[0].clientY - startY);
      apply();
    } else if (mode === 'pinch' && e.touches.length >= 2) {
      const d = dist(e.touches[0], e.touches[1]);
      const f = d / startDist;
      const newScale = Math.max(0.1, Math.min(20, startScale * f));
      // Zoom around the pinch midpoint (anchor in stage coords)
      tx = startMidX - (startMidX - startTx) * (newScale / startScale);
      ty = startMidY - (startMidY - startTy) * (newScale / startScale);
      scale = newScale;
      apply();
    }
  }, {passive:false});

  stage.addEventListener('touchend', () => { mode = 'idle'; }, {passive:false});
  stage.addEventListener('touchcancel', () => { mode = 'idle'; }, {passive:false});

  // --- Desktop: trackpad pinch (wheel + ctrlKey) and Ctrl+wheel ---
  stage.addEventListener('wheel', e => {
    if (e.ctrlKey) {
      // Pinch (trackpad) or Ctrl+wheel — zoom anchored at cursor
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      // Negative deltaY = pinch-out = zoom in
      const f = Math.exp(-e.deltaY * 0.01);
      const newScale = Math.max(0.1, Math.min(20, scale * f));
      tx = cx - (cx - tx) * (newScale / scale);
      ty = cy - (cy - ty) * (newScale / scale);
      scale = newScale;
      apply();
    } else {
      // Plain wheel — pan (and stop outer-page scroll bleed)
      e.preventDefault();
      tx -= e.deltaX;
      ty -= e.deltaY;
      apply();
    }
  }, {passive:false});

  // --- Desktop: mouse drag (left button, no modifier) — pan ---
  let dragging = false;
  stage.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    dragging = true;
    startTx = tx; startTy = ty;
    startX = e.clientX; startY = e.clientY;
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    tx = startTx + (e.clientX - startX);
    ty = startTy + (e.clientY - startY);
    apply();
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  // --- Reset helpers (double-tap + double-click) ---
  const reset = () => {
    scale = Math.min(sw / iw, sh / ih);
    tx = (sw - iw * scale) / 2;
    ty = (sh - ih * scale) / 2;
    apply();
  };
  let lastTap = 0;
  stage.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 300 && e.changedTouches.length === 1) reset();
    lastTap = now;
  });
  stage.addEventListener('dblclick', e => { e.preventDefault(); reset(); });
})();
</script>
</body></html>
```

### Why this works (cross-browser)

| Platform / input | How we capture | How we prevent page zoom |
|------------------|----------------|--------------------------|
| iOS Safari / Android Chrome — two-finger pinch | `touchstart/touchmove` measuring distance + midpoint | `touch-action:none` + `e.preventDefault()` on the stage. Belt-and-braces: outer page viewport `maximum-scale=1,user-scalable=no` |
| Desktop Chrome / Safari / Edge / Firefox — trackpad pinch | `wheel` event with `e.ctrlKey === true` (browsers synthesize this) + `e.deltaY` for magnitude | `e.preventDefault()` on the wheel listener inside the iframe |
| Desktop — Ctrl + scroll-wheel | Same `wheel + ctrlKey` path | Same `preventDefault()` |
| Desktop — trackpad two-finger drag / wheel scroll | `wheel` without `ctrlKey` → treat as pan | `preventDefault()` to stop outer-page scroll bleed |
| Desktop — mouse drag | `mousedown/mousemove/mouseup` → translate transform | `preventDefault()` on mousedown |
| iOS / Android — single-finger drag | `touchstart/touchmove` with one touch → translate | `touch-action:none` + `preventDefault()` |
| Recovery | Double-tap (touch) or double-click (mouse) → reset to fit | — |

**Initial contain-fit:** Solves Defect 1 (thin-strip rendering). On load, measure stage vs natural image and pick `Math.min(sw/iw, sh/ih)` so wide PUML diagrams fill vertically (not horizontally) when the screen is portrait, and tall diagrams fit horizontally when in landscape.

**Pinch/wheel anchored at gesture position:** Industry-standard image-viewer behavior — the spot you pinch (or your cursor) stays under your fingers / cursor as you zoom. Implemented by adjusting `tx/ty` so the pre- and post-zoom screen-position of the anchor point coincides.

**Cmd/Ctrl + `+`/`-` (keyboard zoom):** Not intercepted. Users invoking the OS keyboard shortcut likely want full-page zoom (accessibility); leaving it alone is the right call.

### What we deliberately don't do

- **No svg-pan-zoom library** (~40KB). Hand-rolled handler is ~60 lines and matches behavior for image viewing. Library is justified only if we add momentum scrolling, rotation, or SVG-DOM viewBox manipulation — none of which Tron asked for.
- **No `<object>` or inline SVG injection.** `<img src=svg>` is sufficient — we transform the `<img>` element, not the SVG DOM. Simpler, no cross-origin concerns, browser renders natively.

## Per-file fix table

| File | Line | Change |
|------|------|--------|
| `src/ts/server/server.ts` | (new, before 853) | Add `/svg-viewer` GET handler — returns the HTML+JS above with `src` query param sanitized |
| `src/ts/server/server.ts` | 853–861 | Replace the existing `/md/*.svg` HTML wrapper: override `pageHead`'s viewport with `maximum-scale=1,user-scalable=no` for this route, swap `<object>` for `<iframe src='/svg-viewer?src=/md/raw/...'>` filling the viewport |

The existing `/md/raw/*.svg` raw-bytes route (line 842–851) is unchanged — the iframe `<img>` fetches the SVG through it.

## Defects 3 & 4 (Tron on device, Chrome iPhone + Mac, v0.5.116) — and the fix

### Defect 3 — Blur on zoom-in

> "it starts to get blurry as if it was a png and not an svg"

**Root cause.** The earlier design used `<img src=svg>` and zoomed with `transform: matrix(scale,...)`. When the browser scales an `<img>` element via CSS transform, it **upsamples the raster the image was decoded to at the layout size**. Even though the source is SVG, the browser rasterized it once at the `<img>`'s box size; CSS transform then stretches that bitmap. Result: classic raster blur on zoom-in.

SVGs stay crisp only when the **vector** is what's being scaled, not a snapshot. Two ways to achieve this:

| Approach | Crispness | Notes |
|----------|-----------|-------|
| **Inline `<svg>` in the DOM**, scale via CSS transform on the `<svg>` element | ✅ crisp | Browser re-rasterizes the vector on every paint at the current transform-induced scale. This is the standard SVG-zoom pattern. |
| Inline `<svg>`, scale via `viewBox` manipulation | ✅ crisp | Mathematically equivalent on screen; preferred when zoom is paired with vector hit-testing. We don't need hit-testing — CSS transform is simpler. |
| `<img>` with `transform: scale()` | ❌ blurs | Raster upsampling. |
| `<img>` with `width/height` set to the zoomed pixel size (no transform) | ✅ crisp | Triggers re-rasterization, but causes layout thrash and breaks our anchored-zoom math. Not preferred. |

**Decision: inline the SVG** into the page (fetch the raw bytes and `innerHTML` them into the stage) and scale via `transform: matrix(...)` on the root `<svg>` element. Vector stays crisp at any zoom.

### Defect 4 — iPhone snap-back after pan

> "immediately after pan it snaps back to 100% width and gets unreadable small"

**Root cause.** With `<img src=svg>` and no explicit `width/height` attributes on the `<img>`, the image's layout box is governed by the stage's flex/block layout. On iOS Safari, the touch sequence (touchstart → touchmove → touchend) ends with a layout/paint pass that re-applies the layout-time width. Because we only changed `transform` (visual) and never the layout box, anything that causes a relayout re-anchors the transform reference frame at the **current layout box** of the image — which is the stage width (we have `width:100%` on stage and no fixed width on the `<img>`). The transform we computed was relative to the natural intrinsic size; after relayout, the same transform matrix produces a different visual size, snapping the image back toward stage-width.

Why doesn't desktop show this? Desktop browsers don't run the same Visual Viewport / orientation reflow path on `touchend`; pointer/mouse events don't trigger it. iOS specifically reflows opportunistically around touch ends.

**The fix.** Same as Defect 3 — switch to **inline SVG** with explicit `width` and `height` attributes set to the SVG's intrinsic viewBox dims on insert. The element's layout box becomes a stable rectangle in the natural coordinate system; `transform` then operates against that stable box, and iOS reflow won't change the transform reference. This eliminates the snap-back.

**Belt-and-braces.** Pin the SVG with `position:absolute; left:0; top:0; width:<iw>px; height:<ih>px;` so the layout box is explicit numeric pixels, not a percentage. Any reflow now resolves to the same box → transform stays correct.

### Combined fix code (replaces the `<img>` block in the earlier design)

Replace the load section (lines ~78–93 of the earlier code) with:

```javascript
const stage = document.getElementById('stage');
const src = new URLSearchParams(location.search).get('src');
if (!src) return;

// Fetch the raw SVG bytes
const res = await fetch(src);
if (!res.ok) { stage.textContent = 'Failed to load SVG'; return; }
let svgText = await res.text();

// Strip XML prolog if present (we're injecting into HTML)
svgText = svgText.replace(/^[\s\S]*?(?=<svg)/i, '');

// Inject into the stage
stage.innerHTML = svgText;
const svg = stage.querySelector('svg');
if (!svg) { stage.textContent = 'Not a valid SVG'; return; }

// Determine intrinsic dims (viewBox preferred — most PUML SVGs have it)
let iw, ih;
const vb = svg.getAttribute('viewBox');
if (vb) {
  const parts = vb.trim().split(/[\s,]+/).map(Number);
  iw = parts[2]; ih = parts[3];
} else {
  iw = parseFloat(svg.getAttribute('width')) || svg.getBBox().width || 800;
  ih = parseFloat(svg.getAttribute('height')) || svg.getBBox().height || 600;
}

// Pin the layout box to natural pixel dims and put it at the top-left of the stage.
// This stops iOS reflow from re-anchoring the transform.
svg.setAttribute('width',  String(iw));
svg.setAttribute('height', String(ih));
svg.style.cssText = 'position:absolute;left:0;top:0;width:' + iw + 'px;height:' + ih + 'px;' +
                    'transform-origin:0 0;will-change:transform;display:block;max-width:none;max-height:none';

// Replace every `apply = () => img.style.transform = ...`  with `svg.style.transform = ...`
// and every `iw/ih` reference (already named).
const sw = stage.clientWidth, sh = stage.clientHeight;
let scale = Math.min(sw / iw, sh / ih);
let tx = (sw - iw * scale) / 2;
let ty = (sh - ih * scale) / 2;
const apply = () => { svg.style.transform = 'matrix(' + scale + ',0,0,' + scale + ',' + tx + ',' + ty + ')'; };
apply();
```

The remainder of the script (touch, wheel, mouse, reset handlers) is unchanged — they all operate on `scale/tx/ty` and call `apply()`. They now scale the inline SVG (crisp) instead of the raster `<img>` (blurry).

### CSS adjustment

Remove the `img { ... }` rule. The stage CSS stays:

```css
html,body{margin:0;padding:0;width:100%;height:100%;background:white;overflow:hidden;touch-action:none}
#stage{width:100%;height:100%;overflow:hidden;touch-action:none;position:relative}
#stage svg{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;display:block;max-width:none;max-height:none}
```

### Why this fixes both defects

- **Crispness:** the browser re-rasterizes the inline `<svg>` on every paint at the transform-induced scale. There's no intermediate bitmap to upsample. AC3+AC7 still pass.
- **No snap-back:** the `<svg>`'s layout box is pinned to `<iw>px × <ih>px` via inline style. Any iOS reflow on `touchend` resolves to the same box. `transform` continues to map that stable box to the visual position we set. AC4 passes.

### Trade-offs

- **Inline injection** of arbitrary repository SVGs into our page DOM. The SVGs in `scrum.pmo/sprints/*/diagrams/` are author-controlled (committed by team, reviewed in PRs). XSS risk is the same as any other content the team commits to the repo. We do not accept user-uploaded SVGs here.
- **Memory:** Each visit downloads and parses the SVG into DOM nodes. PUML-generated SVGs are 50–500 KB and a few thousand nodes — fine for desktop and modern phones.
- If a future SVG comes from untrusted source, sanitize with DOMPurify before injecting. Not needed for the current scope.

## Per-file fix table (updated)

| File | Line | Change |
|------|------|--------|
| `src/ts/server/server.ts` | (new, before 853) | `/svg-viewer` GET handler. Returns the HTML + JS in this doc (fetch-and-inject inline SVG variant, full gesture matrix). Validate the `src` param starts with `/md/raw/` and contains no `..` |
| `src/ts/server/server.ts` | 853–861 | Replace the `/md/*.svg` HTML wrapper: override viewport with `maximum-scale=1,user-scalable=no`, swap `<object>` for `<iframe src='/svg-viewer?src=/md/raw/...'>` filling the viewport |

`/md/raw/*.svg` (line 842–851) is unchanged — the iframe fetches through it.

## Acceptance Criteria (cross-browser)

- AC1 — Open any `/md/*.svg`. The SVG fills the viewport (no thin strip) on iPhone Safari, Chrome/iPhone, Chrome/macOS, Chrome/Windows, Safari/macOS, Firefox.
- AC2 (touch) — Pinch with two fingers on the SVG → content zooms anchored at the pinch midpoint. The outer `← Back · App · Traceability` bar stays fixed size.
- AC3 (trackpad / Ctrl+wheel) — Pinch on Mac trackpad or Ctrl+scroll on any desktop → SVG content zooms anchored at the cursor. Outer page does NOT zoom.
- AC4 (touch / mouse pan) — One-finger drag (touch) or left-button drag (mouse) → SVG translates within the iframe. Outer page does NOT scroll.
- AC5 (wheel pan) — Plain scroll-wheel / two-finger swipe (no ctrl) → SVG translates. Outer page does NOT scroll.
- AC6 (reset) — Double-tap (touch) or double-click (mouse) → SVG resets to contain-fit at center.
- AC7 — Wide landscape PUML diagrams (e.g., `s17-architecture.svg`) and tall portrait diagrams both render legibly at initial load on portrait and landscape orientations.
- AC8 (defect 3 — crispness) — At any zoom level, text and lines in the SVG render as crisp vector strokes (no raster blur). Compare against the source SVG opened in a desktop browser at the same scale — visual fidelity equivalent.
- AC9 (defect 4 — no snap-back, iPhone) — On iPhone Safari and Chrome/iPhone, after a pan gesture lifts off (touchend), the SVG stays where the user placed it. It does NOT snap back to a 100%-width fit. Pan + zoom state persists across consecutive touch sequences until double-tap reset.

## Sanitization (security)

The `src` query parameter is reflected into HTML. Must be:

1. Path-validated: must start with `/md/raw/` and not contain `..`
2. Reject if validation fails: `res.writeHead(400); res.end('Invalid src');`
3. JSON-encode when emitting into the JS literal (or use `data-src` attribute + `getAttribute`) to avoid breakout

The example above uses `URLSearchParams` client-side to read `location.search` — that's safe (browser parsing). The server must still validate the `src` param before serving the HTML, so a forged `?src=javascript:...` can't pass through.

## Rule-pair

- (a) `package.json` bump: required (server code change)
- (b) `sw.js` CACHE_NAME bump: required
- (c) STATIC_SHELL: exempt — `/svg-viewer` returns dynamic content; not added to the static cache list

## Verification

Tester loads `/md/scrum.pmo/sprints/sprint-17-scenario-units/diagrams/s17-architecture.svg` on:
1. iPhone Safari — confirms AC1, AC2 (pinch), AC4 (touch pan), AC6 (double-tap), AC7, AC8 (crisp at 5×), AC9 (no snap-back after pan-release)
2. Chrome / iPhone — same AC set as Safari/iPhone (regression check)
3. Chrome / macOS with trackpad — confirms AC1, AC3 (trackpad pinch), AC4 (mouse drag), AC5 (wheel pan), AC6 (double-click), AC7, AC8

Crispness check (AC8): zoom to 5× and inspect text in the diagram. It must remain sharp vector strokes, not blurry raster.
Snap-back check (AC9): pinch-zoom to 3×, pan with one finger, lift off, wait 2 seconds. SVG must remain where placed at 3×.

Tron final check on iPhone + Mac.
