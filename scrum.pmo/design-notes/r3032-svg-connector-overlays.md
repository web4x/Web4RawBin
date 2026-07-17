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

## Chain (already minted — req 4e0b50f2, DESIGN superseded, NO re-mint)
Req `4e0b50f2` (R30.32) → UC `3f641eb5` (diffEditor.connectorOverlays) → RbDiffEditor `18165081` REUSE → **impl-edit `renderConnectorRibbons` [5051b2a4]** (single-ribbon rewrite) + **`renderCenterChangeBlocks` [37c9694c] / `renderSideChangeBlocks` [eb994dcd]** (DELETE box-outlines, keep line-tint) → Test. Markers STAY, no new units. Version-bump + atomic (R30.28).

## LOCKED AC — GATE BY PIXEL vs target image (never element-count; a 3rd false-green is unacceptable)
1. ONE continuous filled ribbon per change spanning Local→Result→Repo (single `<path>`), curve absorbs Y-offset — screenshot matches `R30.32-TARGET-rider-merge-connectors.png` layout.
2. Color by kind (blue change / red conflict / green active), translucent, text readable through it.
3. Modification → full 3-pane ribbon; one-sided → half ribbon (origin-exact).
4. NO box-outlines remain; accept icons on the edge don't occlude the ribbon.
5. Ribbon tracks aligned rows on scroll; pointer-events:none. Pixel-diff gate vs target, not element count.

## Handoff
Design superseded (no re-mint) → PO build-go → expert (single-ribbon rewrite + delete boxes, pure client, version-bump) → I backstop (markers stay + single path per change + offset-absorbing curve + origin-gate) → tester PIXEL gate vs target + Tron. **R30.31 STAYS held.**
