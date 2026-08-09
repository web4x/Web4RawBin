# HEADLESS-ONLY-AC AUDIT — where our gates are blind to what a real device shows
robbin-tester, 2026-08-09 (non-frozen: analysis only). Predicts the next screenshot-regression instead of reacting to it.
Structural cause behind S23-audio / R40.19 / R40.20: an AC gated HEADLESLY while the requirement is VISUAL, DEVICE, GESTURE, or KEYBOARD. Report is by FAMILY (not one instance); can't-fail gates flagged. NOT fixing here — the list IS the deliverable.

## ★★ META-FINDING — the backstop was NOT built; GATE-side now BUILT (8a7a5f421), SOURCE-side still frozen
**R31.15 (210a25ec)** already NAMES the whole iOS-WebKit tap-fire false-green class AND prescribes a **STANDING LINT** at commit/CI — but it was filed `next-backlog` and never built, so the class had ZERO CI guard while we kept shipping gates the class invalidates (worse than not knowing).
- ✅ **GATE-side backstop BUILT** (PO-authorized, freeze-compliant): `scripts/check-device-ac-lint.mjs` (ci:gates:raw + check:device-ac). FAILS any gate that asserts a real-device behaviour via a synthetic event in a chromium context without deferring to real-WebKit/Tron → the blind GATE is now impossible to ADD. Prove-the-prover (3 F1 known-bad flag / 3 known-good clear, else suite fails) + external BITE verified. Baseline CLEAN.
- ⛔ **SOURCE-side sweep still owed** (R31.15's own AC-standing-lint-sweep + native-control fix): a fragile tap-target in `src/public` (div/span/h2/label click handler) → native control. That lint + fix touch `src` = FROZEN, and are the substantial fresh-expert work. The gate-lint stops us GATING the blindness; the source-sweep stops us SHIPPING it.

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

## ★ VERIFIED (measure-first — the discipline is stronger than the inventory tags suggest)
The `chromium` / `DOM-only` capability tags do NOT mean blind. Read each candidate before flagging:
- **r3211-dnd-diagram** (looked like F5): NOT blind — gates the server drop-EFFECT (own-oracle POST) and explicitly hands the visual drag→drop→box to Tron device. Correct split.
- **r314-sw-tree-render** (looked like F3): NOT blind — gates the network-first + renderer LOGIC deployed; header states the owner-gated rendered-tree VISUAL + iOS-PWA repro = Tron's device. Correct split.
- **r408 / R40.3-A / R40.8**: own-oracle logic + non-owner-reject gated; visual/owner slivers → Tron.
- **r3195-tree-render / r332b-render-perf** (F3 render candidates): NOT blind — both state "@390 VISUAL render = Tron device" and gate the structure/perf MECHANISM the render depends on. Correct split.
- **r3018-requirements-view** (F3): gates a GENERATED MD *view* by byte-match — a document, not a pixel → headless-correct (not a visual-device req at all).
⇒ FINDING: the team's manual visual→Tron / logic-here split is GOOD and widespread — verified across F1 (lint baseline CLEAN), F3 (every render gate defers visual→Tron), F5 (r3211 defers gesture). We are **not lying to ourselves** — the exposure was STRUCTURAL: one forgotten split away with no CI catch. The gate-lint now closes that. Residual real risk = the SOURCE-side (fragile tap-targets already in `src/public`, frozen, fresh-expert) + the ONE unlabeled AC found (R22.2) + the device slivers now consolidated in `scrum.pmo/tron-device-verify-pass.md`.

## ✅ CONCLUSION (whole audit)
The disease is real but the practice is disciplined. Net across all 5 families: **exactly ONE genuine unlabeled headless-vacuous AC (R22.2)**; every other candidate proved correctly split (measure-first killed my own r3211/r314/r3195/r332b/R26.3 suspicions). The high-leverage output is STRUCTURAL, not a bug list: (1) the R31.15 **gate-lint is built** — the blind pattern can't be ADDED; (2) R22.2 handed to req for the R40.3-template relabel; (3) the device slivers are one phone pass for Tron. What remains is owned + frozen: R31.15's source-side fragile-tap-target sweep (fresh-expert, post-GO).

## ★ F4 GOOD-NEWS + the fix pattern (PO-requested)
R40.3 and R40.20 are the CORRECT TEMPLATE: a device-only AC is **explicitly labelled** device-only ("NEVER reportable GREEN from headless") and its automatable sibling is re-scoped to config/DOM/functional-input-reaches-PTY (not "keyboard absence"). ⇒ The fix for any UNLABELED vacuous AC is simply to **make it look like those two**: add the device-only label + split the automatable half. The lint enforces the gate side; requirement authors apply the R40.3 template on the AC side.

## ★ CONFIRMED UNLABELED INSTANCE (F4/F5) — R22.2 drawer pan/zoom, touch-first
**R22.2 (b7000fa1)** "Drawer pan/zoom: full mouse parity (touch-first)". AC-t = "1-finger drag pans, **pinch** zooms, double-tap resets"; **AC-v = "Verified live (HEADLESS) on both a touch surface and a mouse surface."**
- **WHAT the gate can prove headless:** synthetic touch/wheel events fire and the handler pans/zooms in Blink. The MOUSE-parity ACs (m1/m2/m3) are genuinely headless-gateable (real mouse events).
- **WHAT the req actually claims:** the TOUCH gestures work on the real iOS device — pinch-zoom / 1-finger pan / double-tap go through the iOS gesture recognizer (momentum, passive-listener/scroll conflict, `touch-action`). Headless synthesizes these; it does NOT exercise the recognizer. AC-v literally says "verified headless" for the TOUCH surface = the vacuous pattern.
- **Risk:** a real-iOS pan/zoom regression (e.g. a passive-listener or touch-action change) stays GREEN headless → reaches Tron by screenshot (same class as S23 audio). SHIPPED long ago = latent.
- **Fix class (R40.3 template):** split AC-v — mouse parity gated headless @390; **touch gestures → Tron real-iOS device, never headless-green**; relabel AC-t + AC-v with the device-only caveat. Hand to req for the relabel.
- (Cleared, not a finding: R26.3 / 05d21385 — "drag" is only in the tronQuote; all ACs are server endpoint/auth/audit = headless-correct. Measure-first before flagging.)

## DOCTRINE APPLIED
Family named not instance; every CAN'T-FAIL gate flagged (F1 chromium-tap, F4 keyboard-absence); ranked by what reaches Tron first; each candidate VERIFIED before flagging (disproved my own r3211/r314/F5 suspicion — measure-first). Highest-leverage fix (R31.15 gate-lint) BUILT this pass.

## STATUS
Gate-side backstop shipped. Remaining passes (analysis-only): (F4) enumerate any UNLABELED device/keyboard ACs to hand to req for the R40.3-template relabel; (F1/F5) the SOURCE fragile-tap-target inventory for the frozen R31.15 sweep (fresh-expert). Reported to PO as finds land.
