# R30.31 — Interactive manual line-mapping (user override anchor)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → req mints R30.31 · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` REUSE · **crossRef:** R30.30 absolute blank-anchor re-sync (this feeds a USER anchor into that same pass).

## Feature (Tron, screenshot 2)
Where auto-align can't resolve, the user pins a correspondence: right-click a line → "Map lines" (or click a source line-number) → click a CENTER line → CHECK equality → if equal, RECALCULATE diff+alignment from this now-correct manual anchor.

## Mechanism — a manual anchor is a USER-supplied stable anchor
R30.30 re-anchors at every diff3 STABLE line. A manual mapping adds ONE more stable anchor the auto-diff missed: force the picked source line and the picked center line onto the SAME visual row, then re-anchor downstream from it (R30.30 pass). No new alignment engine — it injects a forced anchor into the existing one.
1. **Gesture (2-click):** `mapLineStart(side, srcLine)` — armed by a source line-number click OR the "Map lines" context-menu item; highlights the picked source line, status "pick the matching CENTER line". Then `mapLineComplete(centerLine)` on the next CENTER click.
2. **Equality gate:** compare the two lines' content (exact; offer trimmed-compare fallback with a warning). If EQUAL → accept. If DIFFERENT → reject, status "lines differ — cannot map" (no anchor added). This keeps anchors honest (only genuinely-identical lines pin).
3. **Recalculate:** push `{side, srcLine, centerLine}` into `_manualAnchors[]`; re-run `computeMergedCenter`. The R30.30 re-anchor pass treats each manual anchor as a forced stable point (pad laggards so `srcLine` and `centerLine` share a row, then continue). Anchors persist across recomputes; CLEARED on `loadSide`(new file)/`openFromParams`.
4. **Escape hatch:** a "clear mappings" action (context-menu / toolbar) empties `_manualAnchors[]` and recomputes.

## Chain to mint (req R30.31, scenario-first). RbDiffEditor 18165081 REUSE. NEW methods (not impl-edit).
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.31 | Manual line-mapping — user pins an equal source↔center line; diff+alignment recalculates from that anchor |
| UC   | new | `diffEditor.manualLineMapping` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | NEW | `RbDiffEditor.mapLineStart` (arm: source line-number/context-menu → pick source line) |
| Method | NEW | `RbDiffEditor.mapLineComplete` (center click → equality gate → push anchor → recompute) |
| Impl | designAhead | `RbDiffEditor.mapLineStart impl` / `RbDiffEditor.mapLineComplete impl` (src/public/ts/components/rb-diff-editor.ts) |
| Test | new | manual-mapping DET-3x (AC below) |
Impl-edit riders (markers STAY): `computeMergedCenter` [a0b30550] + `alignPaneRows` [17c71adf] honor `_manualAnchors[]` as forced anchors. New field `_manualAnchors`.

## LOCKED AC
1. Click source line-number (or right-click → "Map lines") → click a CENTER line with EQUAL content → the two lines snap to the SAME visual row and alignment recalculates from there.
2. Picking a center line with DIFFERENT content → rejected with a clear status; no anchor added, no recompute.
3. Manual anchor persists across scroll/accept; CLEARED on new-file load.
4. "Clear mappings" restores pure auto-alignment.
5. Result byte-identical (mapping only moves spacers, never edits content); language-agnostic.

## Handoff
req mints → I derive-confirm (2 NEW Methods name-exact, RbDiffEditor REUSE, impl-edit riders a0b30550/17c71adf markers stay, `_manualAnchors` field) → PO build-go → expert → I backstop → tester + Tron.
