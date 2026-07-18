# R30.38 — Both-versions change renders as TWO per-side blocks (not one merged block)

**Author:** robbin-architect @ robbin-architect robbinTeam2:0.3 · **Status:** design → req mints → build · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.35 REWORK (center holds both versions) — **this renders that model**. Ref screenshot line 73/74.
**Depends on** the R30.35 both-versions center (center region = left lines THEN right lines).

## Now vs wanted
- **NOW:** a both-versions change = ONE block over BOTH center lines + one continuous Local→Center→Repo connector.
- **WANTED (Tron):** TWO per-side blocks — (A) LEFT line ⟷ ITS center line (left/OLDER), (B) RIGHT line ⟷ ITS center line (right/NEWER). Each connector links ONE side to ITS OWN center line, NOT merged. Applies to ALL both-versions changes.

## Center sub-spans (the split)
For a both-versions region the center holds `[left lines][right lines]` (R30.35 rebuildCenter order), so decompose `c.span`:
- **centerLeft** = `[c.span[0], c.span[0] + c.a.length]`   (the left/older lines in center)
- **centerRight** = `[c.span[0] + c.a.length, c.span[1]]`   (the right/newer lines in center)
"Both-versions" = `c.a.length > 0 && c.b.length > 0`. One-sided (add/delete) keeps a SINGLE block (no split).

## renderCenterChangeBlocks `[37c9694c]` (impl-edit) — 2 decorations for both-versions
```
if (c.a.length && c.b.length) {          // both versions in center → split
  deco(centerLeft,  `de-block-${c.kind}-older`);   // LEFT/older  → DARK  (dim fill)
  deco(centerRight, `de-block-${c.kind}-newer`);   // RIGHT/newer → HIGHLIGHTED (bright fill)
} else {
  deco(c.span, `de-block-${c.kind}`);    // one-sided → single block (unchanged)
}
```
CSS: `-older` = kind hue @ low alpha (~0.12) / dim; `-newer` = kind hue @ higher alpha (~0.28) + brighter — same HUE (kind identity), age = brightness only.

## renderConnectorRibbons `[5051b2a4]` (impl-edit) — 2 half-ribbons, each side→ITS center rows
Replace the single Local→Center→Repo band with, for a both-versions change, TWO independent half-ribbons:
- **Block A (LEFT/older):** Local `aStart..aStart+a.length` ⟷ **centerLeft** rows.
  `aT=lineY(edLocal,c.aStart)`, `aB=lineY(edLocal,c.aStart+c.a.length)`; `clT=lineY(edCenter,c.span[0])`, `clB=lineY(edCenter,c.span[0]+c.a.length)`.
  Path (left gutter only): `M Lr,aT · C mL,aT mL,clT Rl,clT · L Rl,clB · C mL,clB mL,aB Lr,aB · Z` — older colour (dim).
- **Block B (RIGHT/newer):** **centerRight** rows ⟷ Repo `bStart..bStart+b.length`.
  `crT=lineY(edCenter,c.span[0]+c.a.length)`, `crB=lineY(edCenter,c.span[1])`; `bT=lineY(edRemote,c.bStart)`, `bB=lineY(edRemote,c.bStart+c.b.length)`.
  Path (right gutter only): `M Rr,crT · C mR,crT mR,bT Sl,bT · L Sl,bB · C mR,bB mR,crB Rr,crB · Z` — newer colour (bright).
- **One-sided change:** a single half-ribbon (existing origin-gate) — unchanged.
Each ribbon links exactly ONE source side to ITS OWN center sub-span (NOT across all three). `Lr/Rl/Rr/Sl/mL/mR` as today (`:490-503`).

## Chain to mint (req R30.38, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.38 | Both-versions change renders as two per-side blocks — LEFT⟷its-center (older) + RIGHT⟷its-center (newer) |
| UC   | new | `merge.perSideVersionBlocks` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | impl-edit | `renderCenterChangeBlocks` [37c9694c] (split older/newer) · `renderConnectorRibbons` [5051b2a4] (2 half-ribbons per side→its center) |
| Test | new | per-side-block DET (AC below) |
Markers STAY, no new units.

## LOCKED AC (DET-3x + Tron visual, ref line 73/74)
1. A both-versions change (a>0 && b>0) shows TWO center blocks: LEFT/older (dark) over centerLeft rows, RIGHT/newer (highlighted) over centerRight rows — same kind hue, distinguished by brightness.
2. TWO connectors: Local⟷centerLeft (older) and Repo⟷centerRight (newer); each links ONE side to ITS center rows — no single merged Local→Center→Repo band for both-versions changes.
3. One-sided ADD/DELETE unchanged (single block + single half-ribbon).
4. Line 73/74 (adjacent both-versions changes): each renders its own two per-side blocks; no cross-contamination.
5. Kind identity preserved (add=green/delete=red/modify=blue/conflict=brown); scroll-tracked; pointer-events:none.

## Handoff
Depends on R30.35 both-versions center landing. req mints R30.38 → I derive-confirm (impl-edit; markers 37c9694c/5051b2a4 stay; no new units) → PO build-go → expert → I backstop (2 blocks + 2 side→center ribbons + older/newer styling) → tester DET + Tron on line 73/74.
