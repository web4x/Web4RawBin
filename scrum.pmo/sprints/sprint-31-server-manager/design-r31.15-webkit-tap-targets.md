# R31.15 — WebKit-reliable tap targets: SWEEP + by-construction fix + lint (architect, 2026-07-27)

**Origin:** 3rd iOS-WebKit-tap false-green in a row (h2-title, native-radio-implicit-label) = a recurring CLASS. Correct-by-construction: enumerate ALL fragile non-native tap targets → one by-construction fix path → a standing LINT so new ones can't ship. [[correct-by-construction]] [[tron-on-390px-mobile-gate-there]]

## SWEEP INVENTORY (Explore agent + architect VERIFICATION — I corrected 2 over/under-flags by measuring touch handling)
**Fragile = a USER tap target that is a non-native element with a CLICK-ONLY handler (no touch/pointer fallback).** Native `<button>`/`<a>`/`<input>` fire on iOS = SAFE. An element with existing touch handling = already covered.

### HIGH — genuinely fragile (click-only, NO touch fallback — verified 0 touch handlers)
| File:line | Element | Notes |
|-----------|---------|-------|
| `trace/rb-detail-view.ts:86,117` (+ 7 click sites) | `.dv-link` `<div>` | forward/backward/children nav rows — core traceability tap targets |
| `trace/detail-superseded.ts:28,69,90` | `.dv-sup-link`/`.dv-chain-link`/`.dv-child-link` `<div>` | superseded/refines/chain/children nav rows |
| `trace/rb-method-detail.ts:35`, `trace/rb-class-detail.ts:41` | `.dv-link` `<div>` | method/class ref nav rows |
| `components/rb-file-tree.ts:67,76` | `.ft-row`/`.ft-file` `<div style=cursor:pointer>` | file-tree expand/select rows |
| `components/rb-member-badge.ts:40` | `rb-member-badge` custom el | member roster tap (VERIFIED 0 touch handlers → fragile) |

### MEDIUM
| `trace/rb-feature-detail.ts:102` | `[data-hit]` `<div>` | uses `mousedown` (not click) — iOS touch/mouse model differs; verify on device |

### ★ CORRECTED (agent over-flagged — I measured touch handling)
- `trace/rb-object-item.ts:63` — the trace-tree node. Agent flagged HIGH, but it has **4 touch-handler lines** (onTouchTap/longpress) → ALREADY has a touch path → NOT fragile (corroborated: the trace-tree WORKS on Tron's device). Leave; converge on the helper opportunistically.

### ALREADY DONE RIGHT (the target pattern) / SAFE
- `rb-header.ts:56-60` title = `role=button`+tabindex+keydown (R31.12). `RoomView.ts:157-159` `.re-option` = explicit for= + click+pointerup belt (R31.12). ~70 native `<button>`, all `<a href>` `.dv-parent-link`, explicit `<label for>` — SAFE.

## BY-CONSTRUCTION FIX — ONE shared helper (DRY), retrofit the fragile cluster
Add `src/public/ts/tap.ts`:
```ts
// makeTappable — the ONE correct-by-construction tap target for a non-native element. iOS WebKit does NOT reliably
// synthesize 'click' on non-interactive elements; this binds a WebKit-reliable path + a11y.
export function makeTappable(el: HTMLElement, onActivate: (e: Event) => void): void {
  el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.style.cursor = 'pointer';
  el.addEventListener('click', onActivate);
  el.addEventListener('pointerup', onActivate);      // WebKit tap belt
  el.addEventListener('keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); onActivate(e); } });
}
```
(Guard double-fire if both click+pointerup land — de-dup by a short-lived flag, OR use pointerup-only + keydown; expert picks. Skip when the element is disabled.)
- Retrofit each HIGH row to `makeTappable(row, handler)` instead of `row.addEventListener('click', …)`. The `.dv-link` family is likely rendered by a SHARED helper across the detail files → fix the shared renderer ONCE covers rb-detail-view/method/class/superseded (DRY — expert confirms the shared render site). rb-header/.re-option converge on `makeTappable` too (retire their bespoke copies).
- Prefer converting to a native `<button>`/`<a>` where semantics allow (nav rows → `<a href="#…">`) = zero-JS safe. Use `makeTappable` only where a native element doesn't fit.

## LINT — the standing pin (pre-empts the NEXT device-QA cycle)
`scripts/lint-tap-targets.mjs` (CI + pre-commit), FAILS the build on:
1. `<label>` wrapping `<input` with NO `for=` in the same label (implicit label) — regex over template strings.
2. `addEventListener(['"]click` on a var assigned from `createElement('div'|'span'|'h1'|'h2'|'h3'|'p'|'li'|'img')` OR a `.querySelector('<non-interactive selector>')`, with NO `role="button"`/`makeTappable`/touch-handler on that element — AST rule (robust) or a grep heuristic (MVP).
3. `mousedown`/`onclick`-only tap handlers on non-native elements.
- ALLOW-LIST file for reviewed exceptions (e.g. rb-object-item which has a touch path). New violation → CI red → fix-before-merge = correct-by-construction; the frame that caught these (real @390) is now enforced statically.
- MVP = the grep script now; upgrade to a custom ESLint rule (precise AST) later.

## SCOPE / SEQUENCE (R31.15, NOT-NOW per PO — scheduled with a FRESH expert)
- Client-only (tap.ts + retrofits + the lint script + CI wire). No server. My deploy restart to serve.
- GATE: tester REAL WebKit @390 — every retrofitted row taps/selects on iOS; the lint fails on a planted fragile target (prove the pin). Tron device spot-check.
- Design self-contained on disk; hand to the fresh expert when SM/ARON confirm 0.1 rewound. DO NOT dispatch now.
