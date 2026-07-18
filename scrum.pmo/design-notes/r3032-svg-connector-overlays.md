# R30.32 — Continuous spline ribbons across 3 panes (Rider-style) — REDESIGN (supersedes boxes)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** REDESIGN → build (chain already minted req 4e0b50f2) · **Date:** 2026-07-17 · **DESKTOP-first (mobile = R30.34 separate)**
**Class:** RbDiffEditor `18165081` · **crossRef:** brief `R30.32-spline-ribbon-design-brief.md` + target `diagrams/R30.32-TARGET-rider-merge-connectors.png`. **Supersedes the box-outline design (Tron REJECTED v0.7.46).**

## Target (Rider "Merge Revisions") — the bar
ONE filled translucent ribbon per change flows **Local range → (curve across left gutter) → Result range → (curve across right gutter) → Server range**, as a SINGLE shape. Each pane's range sits at a DIFFERENT Y (e.g. Local L20-21 → Result L20-22); the cubic-bezier ABSORBS the vertical offset (horizontal tangents at each gutter edge = smooth S-curve). Color: **blue = change, red/brown = conflict, green = active/acceptable**. Translucent fill, readable text through it. Accept controls (× » «) sit ON the edge (z-above), don't occlude.

## What to DELETE
1. The **box-outlines** added in v0.7.46 (revert the `de-block-outline-<kind>` stroke additions in `renderCenterChangeBlocks` [37c9694c] / `renderSideChangeBlocks` [eb994dcd]). Keep the translucent line-tint decorations (they color the changed lines behind text — the ribbon ties into them).
2. The **two separate center-Y-pinned bands** in `renderConnectorRibbons` [5051b2a4] (R30.17 pinned both endpoints to center Y = "straight horizontal band"). Replaced by the single offset-absorbing ribbon below.

## Geometry — EXACT control-point construction (hand to expert)
All coords relative to `.de-panes` bounding rect (as today). Per change `c` (skip if dismissed):

**X anchors** (pane edges, from `mount(...).getBoundingClientRect()` − `pr.left`):
- `Lr` = local mount RIGHT edge · `Rl` = center LEFT edge · `Rr` = center RIGHT edge · `Sl` = remote LEFT edge
- `mL = (Lr+Rl)/2` (left-gutter midline) · `mR = (Rr+Sl)/2` (right-gutter midline)

**Y anchors** (each pane's OWN range, viewZone-aware via `lineY(ed, line0)` = existing helper :395 → `getTopForLineNumber`):
- Local:  `aT = lineY(edLocal,  c.aStart)`,               `aB = lineY(edLocal,  c.aStart + max(c.a.length,1))`
- Result: `cT = lineY(edCenter, c.span[0])`,              `cB = lineY(edCenter, c.span[1])`
- Repo:   `bT = lineY(edRemote, c.bStart)`,               `bB = lineY(edRemote, c.bStart + max(c.b.length,1))`

**Single closed `<path>` (fill = kind color @ 0.22, stroke = kind color @ 0.6, 1px):**
```
M Lr,aT
C mL,aT  mL,cT  Rl,cT      // left-gutter TOP curve: Local top → Result top (horizontal tangents → absorbs aT≠cT)
L Rr,cT                     // across Result band top (left→right)
C mR,cT  mR,bT  Sl,bT      // right-gutter TOP curve: Result top → Repo top
L Sl,bB                     // down Repo's left edge (bT→bB)
C mR,bB  mR,cB  Rr,cB      // right-gutter BOTTOM curve: Repo bottom → Result bottom
L Rl,cB                     // across Result band bottom (right→left)
C mL,cB  mL,aB  Lr,aB      // left-gutter BOTTOM curve: Result bottom → Local bottom
Z                          // close up Local's right edge (aB→aT)
```
This fills BOTH gutters + the Result band as one shape and ties into the Local/Repo line-tint decorations at `Lr`/`Sl` → reads as ONE continuous ribbon Local↔Result↔Repo. The C control points use the gutter midline `mL`/`mR` with the SOURCE y on the first control and DEST y on the second → horizontal tangents at both edges (the Rider S-curve).

**Origin-gate (one-sided changes):** draw the left half (M…Rl,cT and the mirrored Rl,cB…Lr,aB close) only if `c.a.length>0`; draw the right half (Rr…Sl and mirror) only if `c.b.length>0`. A local-only insertion → Local→Result ribbon only; repo-only → Result→Repo only; a modification (both>0) → full Local↔Result↔Repo ribbon. (Preserves R30.17 origin-exactness, now as a continuous spline.)

**Color by kind** (reuse `conflictColor(c)`/`CONFLICT_PALETTE`): `change` #3a6ea5 (blue), `conflict` #a5603a (red/brown), `resolvable` #3a8a5a (green/active). SVG `z-5`, `pointer-events:none`, under the `z-6` accept-icon strips (unchanged). Re-render on scroll (already wired :534).

## ★ ALWAYS 3 COLUMNS — no orientation switch (Tron ruled)
**THE SPEC IS `diagrams/R30.32-TARGET-rider-merge-connectors.png`: 3 side-by-side COLUMNS with continuous curved splines sweeping ACROSS — ALWAYS, no matter the width.** There is NO responsive stacking, NO media query, NO `data-orient`, NO vertical spline. The layout is fixed 3-column; the spline always sweeps ACROSS (the approved v0.7.47 quality). Delete any stacking code (that revert is exactly the fix).

**Layout (`connectedCallback` `ef6708f6` impl-edit):** the fixed 3-column row, with a readable min-width per column so a narrow viewport SCROLLS horizontally instead of stacking:
```
.de-panes{ display:flex; flex-direction:row; gap:34px; overflow-x:auto; }   /* fixed 3 columns; narrow → horizontal scroll */
.de-pane{ flex:1 0 300px; min-width:300px; }                                /* each column stays readable; never collapses/stacks */
```
No media query anywhere. On a phone you see part of the 3-column layout and scroll/pinch-zoom ACROSS it — the columns never reflow.

### Mobile handling = scroll + zoom WITHIN the fixed columns (never stack)
- **Horizontal scroll:** `.de-panes{ overflow-x:auto }` + per-column `min-width:300px` → total content width `≈ 3×300 + 2×34 ≈ 968px`; narrower viewports pan across. Native momentum scroll.
- **Zoom:** native pinch-zoom preserved (do NOT set `user-scalable=no` in the viewport meta) — the user zooms into a column to read.
- **Spline follows the scroll content:** `_ribbonSvg` must cover the `.de-panes` SCROLL width (`scrollWidth`, not clientWidth) and its x-coords come from `mount(...).getBoundingClientRect()` which already reflect horizontal scroll → the ribbons stay anchored to their columns while panning. Set the SVG `width` to `panes.scrollWidth` (or `100%` with the SVG inside the scrolled content) and re-render on horizontal scroll as well as vertical.
- `syncScroll3` (vertical) unchanged — the 3 columns stay line-registered; `lineY` (:414) already viewZone-aware.

The regression is impossible by construction: there is no stacking code path at all. There is ONE spline model — the horizontal across-overlay (Local→Result→Repo) defined above. No vertical/down variant exists.

## Chain (already minted — req 4e0b50f2, DESIGN superseded, NO re-mint)
Req `4e0b50f2` (R30.32) → UC `3f641eb5` (diffEditor.connectorOverlays) → RbDiffEditor `18165081` REUSE → **impl-edit `renderConnectorRibbons` [5051b2a4]** (ONE across-overlay spline per change, Local→Result→Repo; delete the old 2-band renderer) + **`connectedCallback` [ef6708f6]** (fixed 3-column CSS + per-column `min-width:300px` + `overflow-x:auto`; DELETE any media-query/stacking) + **`renderCenterChangeBlocks` [37c9694c] / `renderSideChangeBlocks` [eb994dcd]** (DELETE box-outlines, keep SUBTLE line-tint) → Test. Markers STAY, no new units. Version-bump + atomic (R30.28).

## LOCKED AC — GATE BY PIXEL vs target image (never element-count; a 3rd false-green is unacceptable)
1. ONE continuous filled ribbon per change spanning Local→Result→Repo (single `<path>`), curve absorbs Y-offset — screenshot matches `R30.32-TARGET-rider-merge-connectors.png` layout.
2. Color by kind (blue change / red conflict / green active), translucent, text readable through it.
3. Modification → full 3-pane ribbon; one-sided → half ribbon (origin-exact).
4. NO box-outlines remain; accept icons on the edge don't occlude the ribbon.
5. Ribbon tracks aligned rows on scroll; pointer-events:none. Pixel-diff gate vs target, not element count.
6. **ALWAYS 3 COLUMNS:** no stacking at any width; no media query; ONE across-overlay spline (Local→Result→Repo) always. Narrow viewport → horizontal scroll + native pinch-zoom WITHIN the 3 columns; the SVG overlay spans the scroll width and stays anchored to its columns while panning.

## Handoff
Design superseded (no re-mint) → PO build-go → expert (single-ribbon rewrite + delete boxes, pure client, version-bump) → I backstop (markers stay + single path per change + offset-absorbing curve + origin-gate) → tester PIXEL gate vs target + Tron. **R30.31 STAYS held.**
