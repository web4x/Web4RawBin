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

## Acceptance Criteria (cross-browser)

- AC1 — Open any `/md/*.svg`. The SVG fills the viewport (no thin strip) on iPhone Safari, Chrome/iPhone, Chrome/macOS, Chrome/Windows, Safari/macOS, Firefox.
- AC2 (touch) — Pinch with two fingers on the SVG → content zooms anchored at the pinch midpoint. The outer `← Back · App · Traceability` bar stays fixed size.
- AC3 (trackpad / Ctrl+wheel) — Pinch on Mac trackpad or Ctrl+scroll on any desktop → SVG content zooms anchored at the cursor. Outer page does NOT zoom.
- AC4 (touch / mouse pan) — One-finger drag (touch) or left-button drag (mouse) → SVG translates within the iframe. Outer page does NOT scroll.
- AC5 (wheel pan) — Plain scroll-wheel / two-finger swipe (no ctrl) → SVG translates. Outer page does NOT scroll.
- AC6 (reset) — Double-tap (touch) or double-click (mouse) → SVG resets to contain-fit at center.
- AC7 — Wide landscape PUML diagrams (e.g., `s17-architecture.svg`) and tall portrait diagrams both render legibly at initial load on portrait and landscape orientations.

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
1. iPhone Safari — confirms AC1, AC2, AC4 (touch), AC6 (double-tap), AC7
2. Chrome / macOS with trackpad — confirms AC1, AC3 (trackpad pinch), AC4 (mouse drag), AC5 (wheel pan), AC6 (double-click), AC7
3. Chrome / iPhone — confirms AC1, AC2, AC4, AC6, AC7 (regression vs Safari/iPhone)

Tron final check on iPhone + Mac.
