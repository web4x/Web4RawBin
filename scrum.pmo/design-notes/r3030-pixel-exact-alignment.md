# R30.30 — Is true pixel-perfect 3-pane alignment achievable? (analysis + hardening)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** analysis + fix spec → req (R30.30) if feasible · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.29 (row-count equality) · R30.16 alignPaneRows · syncScroll3 (e3431e87).

## The alignment identity
A line's vertical position in a pane is:
`Y(line) = (realLinesAbove + viewZoneSpacerRowsAbove) × lineHeight − scrollTop`
For two panes to place a CORRESPONDING line at the SAME Y (0px), three things must match:
1. **rowsAbove** (real + spacer) — equalized by **R30.29** anchor-resync at every stable/blank anchor.
2. **lineHeight** — must be identical across the 3 editors.
3. **scrollTop** — must be identical.

## Measured verdict on each candidate residual
- **Spacer heights not integer×line-height?** NO. viewZones use `heightInLines: pad` (:349) — exact integer multiples of lineHeight. Zero sub-pixel from spacers. ✅ ruled out.
- **Sub-pixel FONT rendering?** NO vertical effect. Monaco `lineHeight` is an INTEGER px; glyph sub-pixel AA is horizontal and never shifts a row's Y. ✅ ruled out.
- **scrollTop drift?** NO. `syncScroll3` (:515) does `dst.setScrollTop(e.scrollTop)` — the exact same px on all panes. ✅ ruled out.
- **line-height/padding mismatch between the 3 instances?** Currently uniform (all 3 built from one `common` config, :128, fontSize 12 → Monaco derives the SAME integer lineHeight) — but relied on BY COINCIDENCE: `lineHeight` and `wordWrap` are NOT set explicitly. Risk: a slow web-font load or a future per-pane config tweak could give one editor a different lineHeight; and a very long line with `wordWrap` on would become 2 visual rows in only the narrow pane → +1 row drift. **This is the only real residual source, and it is config-level, not fundamental.**
- **Within-change-region content differs?** INHERENT, NOT a residual to fix. Inside a change/modification block the 3 panes show DIFFERENT lines (local's version vs base vs remote's) — there are NO corresponding lines to align, only the BLOCK (boundaries align via `maxH`). IntelliJ has the identical property. "0px line-by-line inside a change" is undefined — there is no correspondence to be 0px about.

## VERDICT: YES — 0px is FEASIBLE for every corresponding line
Corresponding lines = **stable/blank lines + every block boundary**. For those, `Y` is identical by construction once R30.29 equalizes rowsAbove: integer `heightInLines` spacers × a uniform integer `lineHeight` − an identical `scrollTop` = the SAME pixel, at scrollTop=0 and after any scroll. The only thing standing between "works today" and "0px by construction, always" is making `lineHeight`/`wordWrap` explicit instead of coincidental. Within-change blocks are boundary-aligned only — correct and inherent, not a bug.

## FIX (R30.30 — config hardening, impl-edit, marker STAYS, language-agnostic)
In `mountThreePane` (marker `c4c84142`, :122), pin on the shared `common` config so all 3 editors are identical BY CONSTRUCTION:
```
const common = { ...existing, lineHeight: 19, wordWrap: 'off' as const };  // 19 = Monaco's fontSize-12 default, now explicit + uniform
```
- `lineHeight: 19` (explicit integer) → identical row pitch on all 3 regardless of font-load timing.
- `wordWrap: 'off'` → a long line is always exactly 1 visual row in every pane (horizontal scroll), so a narrow pane can never wrap-shift subsequent rows.
- Unchanged (already exact): viewZone `heightInLines` (:349), `syncScroll3` exact-px (:515), R30.29 row-count equality.
No syntax parsing — pure editor config + line-diff. Impl-edit under `c4c84142`; no new units (Req + UC only).

## Chain to mint (req R30.30, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.30 | Pixel-exact 3-pane rows — corresponding lines share the SAME Y (0px) across all 3 panes |
| UC   | new | `diffEditor.pixelExactRowHeight` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.mountThreePane` [Impl `c4c84142`] — pin lineHeight + wordWrap |
| Test | new | pixel-exact DET-3x (AC below) |

## LOCKED AC (DET-3x)
1. For EVERY stable/blank line and block boundary: `getTopForLineNumber` equal (±0px) across edLocal/edCenter/edRemote — at scrollTop=0 AND after scrolling to mid-file.
2. All 3 editors report identical `lineHeight` (19).
3. A line longer than the narrowest pane stays 1 visual row in all 3 (no wrap-shift).
4. Within a change block: boundaries align 0px; interior lines are documented as non-corresponding (different content) — no assertion on interior line-by-line equality.
5. Result byte-identical; language-agnostic (works on any language / plain text).

## Handoff
req mints R30.30 → I derive-confirm the impl-edit reuse (marker c4c84142 stays, no new units) → PO build-go → expert (pure client) → I backstop (lineHeight/wordWrap pinned + getTopForLineNumber 0px at anchors) → tester DET-3x + Tron visual.
