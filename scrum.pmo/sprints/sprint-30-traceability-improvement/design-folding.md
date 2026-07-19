# Design: Changes-Focused Code-Folding — R30.53 (NATIVE Monaco folding) — supersedes R30.51 v1

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 (Tron redesign directive)
**⚠ REVERSAL:** The R30.51 `setHiddenAreas` approach shipped BAD — Tron's screenshots show hidden lines yanked out → crammed non-contiguous line-numbers + chaotic ribbons, unreadable. **Tron OVERRODE the v1 "setHiddenAreas not FoldingController" decision.** R30.53 = redesign on NATIVE Monaco folding. Expert reverted the broken setHiddenAreas (v0.7.76); builds native at v0.7.77.

## Tron's rules
1. **Do NOT hide lines.** Use Monaco's STANDARD collapse/expand — native folding: fold-gutter chevron + collapsed `⋯` placeholder that KEEPS the region as one foldable line.
2. **Fold by METHOD boundaries** (semantic — function defs, e.g. oosh/bash `private.x() { ... }`, ts `methodName(...) { ... }`).
3. **Collapse corresponding blocks across ALL 3 editors when they contain NO change** (synced unchanged-method collapse); **change-regions stay EXPANDED**. **MOBILE must work.**

## Why native folding works now (the v1 concerns dissolve)
- v1 "can't GUARD change-regions from collapse" → NOT NEEDED. Change-methods START expanded (we only collapse UNCHANGED methods); manual folding of anything stays allowed.
- v1 "can't SYNC 3 editors" → unchanged methods have IDENTICAL content in Local/Center/Repo → the same method exists in all 3; collapse the corresponding range in each. One semantic unit → 3 aligned ranges.
- v1 "FoldingController internal/fragile" → accepted per Tron override; pinned to monaco-editor@0.52.2 (version-locked CDN); `editor.contrib.folding` id is stable.

## Method-set (→ R30.53 UC markers)
| Method | UC / marker | Purpose |
|--------|-------------|---------|
| `registerMethodFoldingProvider()` + `folding:true` (common:166) | nativeFoldByMethod → **foldByMethodBoundaries ddc5ea1c** | `monaco.languages.registerFoldingRangeProvider` at method boundaries (def-line + matching-close brace-depth scan); revert v1 `folding:false`. Native chevron+`⋯` free. |
| `computeMethodRanges()` | (supports ddc5ea1c) | per-editor method `[start,end]` list |
| `unchangedMethods()` | changeMethodsStayExpanded → **keepChangeMethodsExpanded fca7b5f7** | filter OUT methods whose `[start,end]` overlaps any conflict per-editor range (CENTER `span` / LEFT `aStart+a` / RIGHT `bStart+b`) → change-methods excluded from collapse |
| `applyChangesOnlyFolding()` | syncUnchangedCollapse → **syncNativeFold e64924cb** (initial) | FoldingController `getFoldingModel().setCollapsed(unchanged)` in all 3, at computeMergedCenter tail |
| `syncNativeFold()` | **syncNativeFold e64924cb** (ongoing) | `foldingModel.onDidChange` → mirror a method's collapse-state to the corresponding method (align 1:1 by seq/name) in the other 2; re-entrancy-guarded (syncScroll3:705 flag) |

Programmatic collapse: `const fc = ed.getContribution('editor.contrib.folding'); const fm = await fc.getFoldingModel(); fm.setCollapsed(<unchanged region idxs>, true);` — native fold (`⋯` placeholder, chevron), NOT setHiddenAreas.

## SYNC
Initial: applyChangesOnlyFolding collapses all unchanged methods in all 3. Manual fold/unfold: foldingModel.onDidChange → identify toggled method (start line → identity) → apply same state to the corresponding method in the other 2, re-entrancy-guarded. After any fold change → `renderInterPaneGutters()+renderConnectorRibbons()`.

## Coexistence (spline / decorations / highlight / MOBILE)
- **Spline:** `getTopForLineNumber` (lineY :515) is fold-aware. **Why v2 ribbons stay clean (v1 didn't):** v1 hid arbitrary GAP ranges mid-change → change endpoints shifted unpredictably. v2 folds only WHOLE UNCHANGED methods → change regions always fully expanded + contiguous → ribbon endpoints on visible lines. Recompute after fold.
- **Decorations:** folded (unchanged) lines don't render; change-line decorations render normally. No change.
- **Highlight (R30.41):** unaffected.
- **MOBILE (Tron AC):** native fold chevron + `⋯` must be TOUCH-tappable (no hover-only affordance); tap-to-fold/unfold + synced unchanged-collapse work on the mobile viewport across the 3 panes. Gate on device — flag: verify chevron tap-target size + that the reflow holds on the stacked mobile layout.

## Build order + decisions
Fold order: `folding:true` + registerMethodFoldingProvider (ddc5ea1c) → unchangedMethods (fca7b5f7) → applyChangesOnlyFolding + syncNativeFold (e64924cb) → reflow. Wire register + initial fold + onDidChange at mountThreePane / computeMergedCenter tail.
- **Method-boundary detection** is language-dependent: brace-depth scanner keyed on a per-language def-line regex (oosh/bash `^\s*[\w.]+\s*\(\)\s*\{`, ts/js `\)\s*\{$`), fallback to Monaco's BUILT-IN language folding when available. Confirm target langs (oosh/bash + ts primary).
- **FoldingController internal API** — Tron-mandated, pinned monaco 0.52.2; single revisit point on a Monaco bump.
Behavior/visual → commit+bump+rebuild+deploy + DET-3x gate at Tron's viewport (native chevron+`⋯`; unchanged methods collapsed synced across 3; change-methods expanded; MOBILE tap works; ribbons/decorations/highlight intact).
