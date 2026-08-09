# R40.19 — History back-navigation regression gate (item 2)

**Author:** robbin-architect · 2026-08-08. PO-authorized. req `9ed484bbd`. **DEPENDS ON item 1** (post-deploy device-gate trigger) — this gate is ADDED to `gate:device:live` so it auto-runs post-deploy. DESIGN → tester writes the .mjs → I backstop. Tron: back-nav is **PERFECT NOW and must not regress.**

## WHAT IT PROTECTS (measured, v0.8.74)
`src/public/ts/components/rb-editor-toolbar.ts`:
- `#tb-back` click → **`historyBack()` = `window.history.back()`** (Impl `6b4d7714`, "genuine").
- `#tb-path` click → **`pathLabelNav()` = `window.location.href = containingFolderHref()`** (Impl `197054f9`, folder nav).
- Class `RbEditorToolbar`.
The music player died to a **unification refactor that dropped an eager call nobody re-checked** — these three are the same class of fragile-under-refactor. This gate makes any such drop go RED.

## Device-gate pattern (reuse, measured)
`test/visual/r4011-carveout-unresolved-gate.mjs`: `@playwright/test` `webkit` + `devices` (iPhone-12 @390), `page.goto(BASE, networkidle)`, tap/locator, screenshot to `test-results/`, DET-3x loop, `process.exitCode = green ? 0 : 1`. Crucially it carries an **anti-over-fire clause** (tap a REAL unit → must still resolve) — R40.19 mirrors that as anti-vacuity.

## DESIGN — a real-WebKit@390 BEHAVIOURAL gate (not DOM-count)
`test/visual/r4019-history-back-gate.mjs`, WebKit iPhone-12 @390, DET-3x, against the LIVE served artifact:
- **(A) BACK LANDS ON THE CORRECT PREVIOUS VIEW:** navigate A→B (e.g. `/trace` → open a unit detail), tap `#tb-back` → MUST land back on **A**, asserted by A's **rendered identity** (URL + a visible landmark of A), NOT by "the back button exists."
- **(B) PATH-LABEL NAV RESOLVES:** tap `#tb-path` → the **containing-folder view RENDERS** (resolves — not blank/404), asserted by the folder view's rendered content.
- **★ BEHAVIOURAL / PIXEL, never DOM-count:** a rendered `#tb-back` that does NOTHING passes a count — so the gate asserts the **navigation OUTCOME** (the view actually became the correct target), verified by rendered content/URL. [[visual-features-gate-by-pixel]] / [[visual-features-verify-by-screenshot-not-dom]].

## ★ STUB-MUST-FAIL (else it certifies nothing)
The gate is self-proven by a deliberately-broken variant that MUST go RED:
- **neuter `historyBack`** (stub `window.history.back` to a no-op) → tap back does NOT land on A → gate **RED**. If it stays green, the assertion isn't really testing back-nav.
- **neuter `pathLabelNav`** → folder view does not render → gate **RED**.
- The harness includes these broken-variant runs as part of the gate's own validation (proving the assertion bites), the same way [[correct-by-construction-needs-gate-verification]] demands a gate be shown to fail on the defect.

## ★ ANTI-VACUITY (mirror r4011's anti-over-fire)
- Assert the back outcome is the **CORRECT** previous view, not merely "some navigation happened."
- Negative control: a non-back tap does NOT navigate back (prevents a gate that passes by always-navigating). This is the R40.3-family anti-vacuity discipline applied to nav.

## ★ REFACTOR-GUARD RULE (the music-player lesson, made structural)
**No refactor may touch `RbEditorToolbar` / `historyBack` (6b4d7714) / `pathLabelNav` (197054f9) without R40.19 GREEN.** Enforced structurally, not by memory:
- Because these are client files, the **item-1 post-deploy trigger runs R40.19 automatically** on every deploy — a refactor that drops the eager call (the exact music-player failure) turns R40.19 RED post-deploy → deploy un-verified (INV-PDG-1).
- Plus a **check-lint**: a commit that modifies `rb-editor-toolbar.ts` or those two Impl markers MUST have a **fresh R40.19-green `device-gate` unit for the served version** (record-gates links the gate to the Method/Test uuids). "File changed AND no fresh R40.19-green" → block. This closes the "nobody re-checked" hole by construction.

## INVARIANTS
- **INV-R4019-1 behavioural-not-DOM:** asserts the navigation OUTCOME (correct previous view rendered / folder resolves), never a DOM-count of the control.
- **INV-R4019-2 stub-must-fail:** neutering historyBack/pathLabelNav MUST turn the gate RED (self-proof).
- **INV-R4019-3 real-device:** WebKit@390 iPhone-12, DET-3x, live served artifact (via item 1), never headless-greenable.
- **INV-R4019-4 anti-vacuity:** outcome is the CORRECT target + a negative control (non-back tap doesn't go back).
- **INV-R4019-5 refactor-guard:** a change to RbEditorToolbar/historyBack/pathLabelNav requires a fresh R40.19-green device-gate unit for the served version, else deploy un-verified.

## GATE / registration
- Assertions: (A) back-lands-correct, (B) path-resolves, both @390 DET-3x; stub-historyBack→RED; stub-pathLabelNav→RED; anti-vacuity negative.
- **Register in `gate:device:live`** (append `&& node test/visual/r4019-history-back-gate.mjs`) → auto-runs post-deploy via item 1. NOT in headless ci:gates (needs live webkit).
- Chain: UC `editorToolbar.historyBackRegression` → `RbEditorToolbar` / historyBack `6b4d7714` + pathLabelNav `197054f9` → the r4019 gate Test. req mints; tester writes the .mjs; I backstop (stub-must-fail proven + registered + behavioural-not-DOM).
- Deploy: client + gate .mjs + gate:device:live registration → real restart; runs via item 1.
