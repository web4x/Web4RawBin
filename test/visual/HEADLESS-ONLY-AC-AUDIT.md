# HEADLESS-ONLY-AC AUDIT — where our gates are blind to what a real device shows
robbin-tester, 2026-08-09 (non-frozen: analysis only). Predicts the next screenshot-regression instead of reacting to it.
Structural cause behind S23-audio / R40.19 / R40.20: an AC gated HEADLESLY while the requirement is VISUAL, DEVICE, GESTURE, or KEYBOARD. Report is by FAMILY (not one instance); can't-fail gates flagged. NOT fixing here — the list IS the deliverable.

## ★★ META-FINDING (single highest leverage) — the correct-by-construction BACKSTOP is NOT BUILT
**R31.15 (210a25ec)** already NAMES the whole iOS-WebKit tap-fire false-green class AND prescribes a **STANDING LINT** that fails a fragile tap-target at commit/CI. It is `next-backlog` / NOT-NOW — **not built**. So today the entire class has **no CI guard**: every `chromium` gate that fires a synthetic click on a non-native element is blind, with nothing behind it. Building R31.15's lint + native-control sweep kills the family by construction — it outranks any single re-gate. (Same for a keyboard-suppress/render lint.) The families below are what leaks until that backstop exists.

## RANKED FAMILIES (highest user-facing risk first)

### F1 — iOS-WebKit tap-fire false-green  [CRITICAL · recognized as R31.15 but UNBUILT · CAN'T-FAIL]
- **Class:** Chromium (incl. Playwright device *emulation*) FIRES tap/click on a fragile non-native element (div / span / h2 / implicit-label / codicon); real iOS Safari WebKit does NOT. Gate goes GREEN, the real device does nothing.
- **Proven ≥3×:** R31.12 room-title h2, R31.12 config radios, R30.53 Monaco codicon chevrons.
- **What the gate proves:** "the click handler ran / DOM mutated in Blink." **What the req claims:** "Tron can TAP it on real iOS @390."
- **CAN'T-FAIL:** a chromium `page.click`/`dispatchEvent` gate on a non-native target *cannot* fail for the iOS reason — Blink always fires. Structurally blind, not merely weak.
- **Fix class:** BUILD R31.15 (standing lint: inject a fragile tap-target → FAIL; + native-control sweep) THEN re-gate every interactive AC at 390 **real-WebKit** with a real tap (`pointerup`/`touchend`+`change`, native control), not a bare click.
- **Blind gates (candidates — using `chromium` + synthetic click on interactive ACs):** the r30xx merge-action gates (r3016-accept-actions, r3035-*, r3037-*, r3050-merge-actions), r3211-dnd-diagram (also a GESTURE, see F5), plus any `chromium` gate whose AC says "tap/select/click".

### F2 — chromium emulation gating iOS-specific RENDER  [HIGH]
- **Class:** Blink rasterizes icon-fonts (codicons), `-webkit-*` CSS, and Monaco decorations DIFFERENTLY from iOS Safari. A chromium pixel/DOM gate is blind to an iOS-only render regression.
- **Instance:** R30.53 native-fold — chromium reported **0** fold-decorations (false-negative that caused the whole "native fold broken" detour); only `webkit.launch()` reproduced. Also memory: headless-playwright-no-codicon-icon-font.
- **What gate proves:** "the element/decoration exists in Blink's render tree." **What req claims:** "the chevron/glyph is VISIBLE on Tron's iOS screen."
- **Fix class:** re-gate at real-WebKit (`webkit.launch` + iPhone-12) with a pixel assertion; hand the pure-glyph-visual sliver to Tron. Note many r30xx gates are tagged `WEBKIT chromium` (both) — AUDIT each: confirm the VISUAL assertion runs under webkit, not just the logic.

### F3 — "in the DOM" gated as "user SEES it"  [HIGH]
- **Class:** a DOM/LOGIC-only gate asserts an element EXISTS / COUNTS where the req claims the user SEES it painted. In-DOM ≠ visible: it can be `display:none`, 0-height, occluded, off-screen, or behind the keyboard. (memory: visual-features-verify-by-screenshot-not-dom.)
- **What gate proves:** `querySelector` non-null / `.length > 0` / textContent present. **What req claims:** rendered + visible at the user's viewport.
- **Fix class:** add a PIXEL/screenshot OR `offsetHeight>0` + not-occluded assertion at the AC's real viewport (390).
- **Blind gates (DOM/LOGIC-only whose req is visual — VERIFY each):** r314-sw-tree-render (req "tree renders"), r3195-tree-render, r332b-render-perf, r3018-requirements-view, r329-featuremanager-surface, r331-mof-folders. (Pure server/data DOM-only gates — r307/r3067/r317/r408/r4010/r402* — are correctly headless; excluded.)

### F4 — device/gesture/keyboard AC that CANNOT FAIL headless (vacuous-pass)  [CRITICAL where UNLABELED]
- **Class:** an AC about a capability the CI env structurally lacks (iOS soft-keyboard open/close, physical longpress, real multi-touch) gated in that env → PASSES WITHOUT THE FEATURE.
- **GOOD (the template, correctly split — NOT findings):** R40.3-B "ios-keyboard-never-opens" (explicitly *"NEVER reportable GREEN from headless"*), R40.3-A-suppress (*"verifiable in config/DOM, not by observing keyboard absence — vacuously true on a headless host"*), R40.20 retention (device-only), R31.15 tap.
- **The DANGER = the UNLABELED sibling:** any AC of this shape *not* carrying the device-split caveat, tagged `[AUTOMATABLE]`. Drill in progress (F4 candidates: keyboard-controller shell keystroke ACs, longpress/context-menu ACs).
- **Fix class:** SPLIT the AC — automatable half (config/DOM/functional-input-reaches-PTL) gated at 390 real-WebKit; device half handed to Tron, NEVER headless-green.

### F5 — real GESTURE gated by synthetic event  [HIGH]
- **Class:** a drag / swipe / pinch / longpress AC gated with `dispatchEvent`/synthetic click instead of a real pointer sequence. Synthetic events bypass the gesture recognizer → GREEN without the gesture working on device. (Overlaps F1 for tap.)
- **Fix class:** real `mousedown→move→up` / touch pointer sequence at 390 real-WebKit; longpress/multitouch physical sliver → Tron.
- **Blind gates (candidates):** r3211-dnd-diagram (DOM/LOGIC-only for a DRAG-and-drop req = doubly blind), r333-movable-box, DnD file-chain gates.

## DOCTRINE APPLIED
Family named not instance; every CAN'T-FAIL gate flagged (F1 chromium-tap, F4 keyboard-absence); ranked by what reaches Tron first. The one structural fix that dwarfs the rest: **build R31.15's standing lint** so the class is caught at commit, not by a Tron device-QA cycle.

## STATUS: drilling continues
Next passes: (F3) confirm each render-gate's req is visual + read its assertion; (F4) find the UNLABELED keyboard/device ACs; (F1/F5) list exact (gate:line, AC) synthetic-click/gesture pairs. Reported to PO as finds land.
