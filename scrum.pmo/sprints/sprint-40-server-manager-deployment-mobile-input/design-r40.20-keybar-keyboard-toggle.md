# R40.20 — Keybar first-key toggles native keyboard, bar RETAINED + usable in both states (item 3)

**Author:** robbin-architect · 2026-08-08. PO-authorized. req `d6b33f6d1`. Device gate added to `gate:device:live` → runs post-deploy via item 1. DESIGN → expert builds → tester device-gates → I backstop.

## ★ THE FLAG THAT MATTERS — this is a SHAPE CHANGE to R40.3, not an addition
R40.3 suppresses the iOS soft-keyboard **BY CONSTRUCTION** (`rb-terminal-detail.ts:79`: `RbKeyboardBar.suppressSoftKeyboard(term.textarea)` — an unconditional, one-way call). A **toggle** requires suppression to become a **SETTABLE STATE owned by the bar** (re-enableable). Designing that state ownership IS the task.

## MEASURED (v0.8.74)
- **R40.3 suppression:** `rb-terminal-detail.ts:79` calls `RbKeyboardBar.suppressSoftKeyboard(textarea)` unconditionally; the `RbKeyboardBar` (from `rb-keyboard-bar.js`, keymap unit `c16abc17`) mounts as a **bottom compartment (flex:0, not a full-screen overlay)**, fail-closed (no bar if config absent).
- **PTY input — TWO paths, both to the SAME ws PTY:** native typed keystrokes `term.onData((d)=>ws.send(enc.encode(d)))` (:69); keybar synthetic keys `sendSeq(bytes)=ws.send(enc.encode(bytes))+term.focus()` (:80). This is the anti-vacuity anchor: both must keep delivering.

## DESIGN — suppression becomes bar-owned settable state; first key toggles it
- **State ownership (the shape change):** `RbKeyboardBar` owns a single field `softKeyboardEnabled: boolean`, **default `false` (suppressed — R40.3's behaviour preserved)**. Replace the unconditional `suppressSoftKeyboard(textarea)` call with `setSoftKeyboard(enabled)`:
  - `enabled=false` → apply the R40.3 suppression to the terminal textarea (the existing mechanism — confirm at build: `inputmode="none"` / `readonly` toggle / focus-blur; whichever R40.3 uses).
  - `enabled=true` → REMOVE the suppression so the native keyboard shows on focus.
  This is now a STATE the bar sets, not a construction-time fact. **Exactly one owner** of suppression (the setter) — R40.3's unconditional call is REPLACED, not supplemented (no 2nd suppression path; grep-lint no other `suppressSoftKeyboard` caller).
- **First key = the toggle:** the keybar's FIRST `KeyDef` (data-driven, keymap `c16abc17`) is the toggle control → tap → `setSoftKeyboard(!softKeyboardEnabled)` → native keyboard shows/hides. Default load = suppressed (R40.3 gate stays green).

## ★ HARD AC — RETENTION (the difficult part)
The artificial keybar MUST stay **visible AND usable in BOTH states — never covered, never unmounted:**
- **keyboard HIDDEN (default/suppressed):** bar is the sole input, bottom compartment (current R40.3).
- **keyboard SHOWN:** the native keyboard occupies the bottom of the viewport; the bar MUST sit **ABOVE it, input-accessory-style** — track `window.visualViewport` (`resize`/`geometrychange`) and position the bar at `visualViewport.height` so it rides just above the keyboard. It is **NEVER unmounted when the keyboard appears** (a bottom-`fixed` bar without viewport-tracking gets covered — that is the failure mode to gate against).

## ★ ANTI-VACUITY (R40.3 lineage) — input STILL REACHES THE PTY in BOTH states
- keyboard HIDDEN: keybar synthetic keys → `sendSeq` → PTY (unchanged).
- keyboard SHOWN: **native typed input → `term.onData` → PTY** AND the keybar keys STILL work (`sendSeq` → PTY) — both simultaneously. A toggle that shows the keyboard but breaks PTY delivery (suppression-removal breaks `onData`, or the bar's `term.focus()` steals focus and blocks native typing) is VACUOUS. Both paths must deliver in the shown state.

## ★ DEVICE-ONLY VERIFICATION — real iOS @390, never headless-greenable
This is native-soft-keyboard behaviour; **Chromium/headless cannot reproduce it** ([[playwright-chromium-emulation-not-real-webkit]] — emulation runs Chromium; headless has no soft keyboard). So R40.20's gate is **REAL-DEVICE ONLY** (real-WebKit iOS @390), added to `gate:device:live`, auto-run post-deploy (item 1). It can NEVER pass headlessly — a headless "green" here is meaningless and the gate must refuse to certify off a non-WebKit runner (fail-closed to NOT-RUN via item 1).

## INVARIANTS
- **INV-R4020-1 suppression = bar-owned state:** `softKeyboardEnabled` is the single source; suppression is set via `setSoftKeyboard`, not an unconditional construction call. Default `false` (suppressed — R40.3 preserved); the FIRST key is the only toggle.
- **INV-R4020-2 retention:** the bar is NEVER unmounted/covered in either state; when the keyboard shows, it tracks `visualViewport` to sit above it (input-accessory).
- **INV-R4020-3 anti-vacuity PTY-both-states:** input reaches the PTY in BOTH states (keybar `sendSeq` always; native `onData` when shown); breaking either path fails the gate.
- **INV-R4020-4 device-only:** verified on real iOS @390 only — never headless (no soft keyboard in Chromium/headless); a non-WebKit runner → NOT-RUN (item-1 fail-closed), never a headless green.
- **INV-R4020-5 single-source-suppression:** exactly one suppression path (the bar's `setSoftKeyboard`); R40.3's unconditional call is REPLACED, not supplemented (grep-lint no 2nd caller). R40.3's default-suppressed gate (`r403a-*`) stays green.
- **★ INV-R4020-6 FRESHNESS (matters MOST here — PO):** the device-only ACs are the most tempting to satisfy with an old green, since a real-device run is expensive. So the R40.20 green MUST be STAMPED to the current served version+commit (INV-PDG-7); a gate result older than the live artifact is NOT-RUN → RED. A stale real-iOS green from a prior version certifies NOTHING about what is served now. No "it passed on my device last week."

## GATE (real iOS @390, DET-3x; STUB-MUST-FAIL) + registration
- tap first key → native keyboard SHOWS **and** bar RETAINED above it (visible, not covered); tap again → keyboard HIDES, bar retained.
- keyboard SHOWN: native-typed char reaches PTY (terminal echoes) AND a keybar key reaches PTY — BOTH.
- keyboard HIDDEN: keybar key reaches PTY.
- **STUB-MUST-FAIL:** stub `setSoftKeyboard` no-op → keyboard doesn't change → RED; break retention (bar covered/unmounted on keyboard show) → RED; break PTY delivery in shown state → RED (anti-vacuity).
- **R40.3 non-regression:** default load still suppressed; `r403a-*` gate stays green.
- Register: append `&& node test/visual/r4020-keybar-toggle-gate.mjs` to `gate:device:live`. Chain: UC `keyboardBar.toggleSoftKeyboard` → `RbKeyboardBar.setSoftKeyboard` + first-key wiring → Impl → the real-device gate Test. req mints; tester writes the .mjs (real device); I backstop (state-ownership single-source + retention + anti-vacuity + stub-must-fail + R40.3 non-regression).
- Deploy: client (`rb-keyboard-bar.ts` / `rb-terminal-detail.ts`) + gate .mjs + registration → real restart; runs via item 1.
