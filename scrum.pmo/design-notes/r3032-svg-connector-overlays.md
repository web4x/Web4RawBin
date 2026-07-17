# R30.32 — SVG connector overlays (IntelliJ left↔center + center↔right) — VERIFY + ENHANCE existing

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** assessment + fix spec → req mints R30.32 · **Date:** 2026-07-17 · **Priority: FIRST (before R30.31, held)**
**Class:** RbDiffEditor `18165081` REUSE · **crossRef:** R30.13/16/17 renderConnectorRibbons (5051b2a4) · R30.19 renderSideChangeBlocks (eb994dcd) · R30.16 renderCenterChangeBlocks (37c9694c).

## ASSESSMENT of the existing overlay (Tron: "WE NEED THESE" — most of it EXISTS)
`renderConnectorRibbons` (marker `5051b2a4`, :439) already implements the core:
- **PRESENT + wired:** called from `renderMergeGutter` (:311) and re-drawn on scroll (`syncScroll3` :517).
- **SVG overlay:** `_ribbonSvg` (`.de-ribbons`), `position:absolute;inset:0;z-index:5;pointer-events:none`, inserted into `.de-panes` (:444-448).
- **BOTH directions:** Local↔Center band (:469 `band(lRight→cLeft)`) AND Center↔Repository band (:470 `band(cRight→rLeft)`). Filled Bézier trapezoids, colored by the shared `conflictColor(c)`, origin-gated (`a.length>0` left, `b.length>0` right).
- **Block backgrounds** already on all 3 panes: `renderCenterChangeBlocks` (center) + `renderSideChangeBlocks` (Local/Repository, R30.19).
So the SVG connector curves + colored blocks EXIST on both sides. R30.32 is **verify-visible + IntelliJ-parity enhancement**, NOT a from-scratch build — req must NOT mint a duplicate overlay.

## LIKELY GAP = VISIBILITY (bands collapse if the inter-pane gutter is ~0 wide)
The bands span from `lRight` (local right edge) to `cLeft` (center left edge) — i.e., across the GUTTER between panes. If a later layout change (R30.16 alignPaneRows / R30.30 re-anchor) narrowed the inter-pane gap, the band width → ~0 → **invisible** (this is the SAME class as the R30.13 root cause: "ribbon-visibility was WIDTH, not z/opacity → gutter-widen"). PRIMARY suspect for "WE NEED THESE": the ~34px inter-pane gutter regressed. First action: MEASURE `lRight` vs `cLeft` (and `cRight` vs `rLeft`) at runtime — if the delta is near 0, restore the gutter width.

## FIX / ENHANCE spec (impl-edit — markers STAY, no new units unless a box helper is added)
1. **Restore visibility (primary):** ensure a real inter-pane gutter (~34px each side) between Local|Center and Center|Repository so the bands have width to render. Verify `.de-panes` layout + gutter columns after R30.16/R30.30.
2. **IntelliJ boxes (screenshot 3):** add a STROKE OUTLINE rectangle around each change block on Local / Center / Repository (complement the existing fill) — impl-edit to `renderCenterChangeBlocks` (37c9694c) + `renderSideChangeBlocks` (eb994dcd): add `de-block-outline-<kind>` (1px solid `CONFLICT_PALETTE[kind]`) so each block reads as a boxed region like IntelliJ.
3. **Show HOW the mapping is calculated (Tron HARD req):** the trapezoid bands already connect corresponding change regions L↔C↔R (that IS the visual mapping). Enhance so it's unambiguous: (a) draw bands for MODIFICATIONS too (post-R30.29 a>0 AND b>0 → BOTH bands already fire → a modification connects across all 3 panes); (b) OPTIONAL faint straight guide at each stable/blank RE-ANCHOR row (R30.30) so the viewer sees unchanged lines map straight across while changes fan through the trapezoids — makes the alignment logic legible. (c) When R30.31 (manual mapping) ships, draw its user-anchor connector in a distinct style (dashed) — deferred with R30.31.
4. Keep SVG `pointer-events:none`, `z-5` under the `z-6` icon strips; re-render on scroll (already wired).

All geometry from editor mounts + `lineY`/`getTopForLineNumber` (viewzone-aware) — no syntax parsing.

## Chain to mint (req R30.32, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.32 | SVG connector overlays — visible L↔C + C↔R curves + change boxes showing the line mapping (IntelliJ) |
| UC   | new | `diffEditor.connectorOverlays` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.renderConnectorRibbons` [5051b2a4] (visibility + guides) + `renderCenterChangeBlocks` [37c9694c] + `renderSideChangeBlocks` [eb994dcd] (box outlines) |
| Test | new | connector-overlay DET-3x (AC below) |
If a distinct box-drawing method is preferred over impl-editing the two block renderers, that's a NEW Method (name-exact) — architect will re-derive; default is impl-edit under the existing markers.

## LOCKED AC (DET-3x + Tron visual)
1. Both connector sets VISIBLE: Local↔Center AND Center↔Repository trapezoid curves render with non-zero width for every change region (measure `lRight<cLeft` and `cRight<rLeft` gap > ~20px).
2. Each change block shows a boxed outline on all 3 panes (fill + stroke), colored by kind (conflict/change/resolvable palette).
3. A MODIFICATION connects across all 3 panes (both bands); a one-sided INSERTION shows ONE band (origin-exact, R30.17 preserved).
4. Curves track the aligned rows on scroll (re-render); pointer-events:none (don't block editor).
5. The overlay makes the mapping legible: unchanged lines read as straight/aligned, changes as fan-through trapezoids. Language-agnostic.

## Handoff
req mints R30.32 → I derive-confirm (impl-edit reuse; markers 5051b2a4/37c9694c/eb994dcd stay; no new units) → PO build-go → expert (pure client) → I backstop (both bands non-zero width + boxes + scroll-track) → tester DET-3x + Tron. **R30.31 (manual line-mapping) HELD until R30.32 ships.**
