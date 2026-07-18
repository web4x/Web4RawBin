# R30.36 — Diff nav-aids: current-change highlight + open-change count (FOR TRON REVIEW, pre-build)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → Tron review → then build · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` REUSE · **Req:** R30.36 `a6b0fb6b6` · **crossRef:** R30.35 CONFLICT_PALETTE, jumpToChange `65c465fa`.
**Not blocked by the x/>> HARD GATE** — this is nav/display only, touches no merge-action semantics.

## (a) diffNav.highlightCurrentChange — the CURRENT change (UP/DOWN nav) renders BRIGHTER, kind-identity intact
Today `jumpToChange` (`:514`, marker `65c465fa`) moves `_jumpIdx` + `revealLineInCenter`, but the landed change is NOT visually marked → indistinguishable from its neighbours of the same kind.

**Design — EMPHASIS is a MONOCHROME boost of the SAME kind hue (never changes hue → kind-identity preserved):**
- Track `this._currentId = list[_jumpIdx].id` in `jumpToChange`; clear on recompute (`:216`).
- `renderCenterChangeBlocks` / `renderSideChangeBlocks`: the current block's decoration gets `de-block-current` IN ADDITION to `de-block-${kind}`. Each `de-block-${kind}` exposes a CSS var `--kind: <palette colour>` (green/red/blue/brown); the emphasis rule reads it — no per-kind class explosion:
  ```
  .de-block-current {
    filter: brightness(1.35) saturate(1.25);          /* same hue, brighter+richer */
    box-shadow: inset 0 0 0 2px var(--kind),           /* solid full-opacity KIND-colour border */
                0 0 6px rgba(255,255,255,0.35);         /* subtle glow → pixel-distinguishable */
  }
  ```
- `renderConnectorRibbons`: for `c.id === this._currentId` boost the SAME kind colour — fill-opacity 0.22→0.45, stroke-opacity 0.6→1.0, stroke-width 1→2. Brighter same-hue ribbon.
- `jumpToChange` calls `renderMergeGutter` after setting `_currentId` so blocks+ribbons re-render with the current one emphasised.
- **Kind-identity guarantee:** emphasis only scales brightness/saturation/border-weight/opacity of the block's OWN kind colour — a current ADD is a brighter GREEN, a current CONFLICT a brighter BROWN. Hue is untouched, so kind is never confused; the current one is pixel-distinguishable (≈35% brightness delta + 2px solid border + glow) from non-current same-kind blocks.
**FOR TRON:** confirm the emphasis recipe (brightness/border/glow) — tune values to taste; the principle (same-hue brighter, never re-hue) is the ask.

## (b) diffNav.openChangeCount — live count of OPEN changes → 0 (NEW Method, marker 8b6abf77)
**Precise definition of "open" (architect call — flag for Tron):** an OPEN change = a change block the user has NOT yet ACTED ON (≫ / ≪ / ✕). Every change starts OPEN; ANY action (`acceptChange` or dismiss) marks it RESOLVED. This makes the count a **review-progress** indicator: "K changes still to review" → 0 when the user has touched every change.
- New field `private _resolved = new Set<number>()`; `acceptChange` (`:526`) and the ✕/ignore handler (`:157`) both `this._resolved.add(id)`; clear on recompute (`:216`, beside `dismissed.clear()`).
- **NEW Method** `RbDiffEditor.openChangeCount(): number` → `return this.conflicts.filter(c => !this._resolved.has(c.id)).length;`  **[marker `8b6abf77`, uuid `643de373`]** — proposed name confirmed (verb-noun, clear).
- Display: extend `.de-count` (`:68/:346`) to append "· K open"; recompute in `renderMergeGutter` + after every action → decrements live to 0.
- **Decrement semantics:** each distinct ≫/≪/✕ on a change resolves it → count −1. Dismiss counts as a resolution (a decision). Re-acting on the same change does not double-decrement (Set).
- **ALTERNATIVE for Tron:** "open" = unresolved TRUE CONFLICTS only (auto-applied one-sided changes excluded, since they need no action). I recommend the review-progress definition (all changes) so the count reflects "everything reviewed"; Tron picks.

## Chain to mint (req R30.36 a6b0fb6b6). RbDiffEditor 18165081 REUSE.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | R30.36 (a6b0fb6b6) | Diff nav-aids: current-change highlight + open-change count |
| UC   | diffNav.highlightCurrentChange | → `jumpToChange` `65c465fa` (impl-edit: set `_currentId` + emphasis in blocks/ribbons) |
| UC   | diffNav.openChangeCount | → **NEW** `RbDiffEditor.openChangeCount` [`643de373` / marker `8b6abf77`] |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Test | new | nav-aids DET (AC below) |
Impl-edit riders (markers STAY): `renderCenterChangeBlocks 37c9694c` / `renderSideChangeBlocks eb994dcd` / `renderConnectorRibbons 5051b2a4` (current-emphasis) + fields `_currentId`,`_resolved`. **Derive note:** req's `jumpToChange 6a4b95fe` vs code impl-marker `65c465fa` — reconcile (6a4b95fe = Method uuid, 65c465fa = its Impl marker) on derive.

## LOCKED AC (DET-3x)
1. UP/DOWN nav → the landed change renders BRIGHTER (brightness+2px kind-colour border+glow) than non-current same-kind blocks; pixel-distinguishable; HUE unchanged (add=green/delete=red/modify=blue/conflict=brown).
2. The current change's ribbon is brighter (fill/stroke opacity + width); same kind colour.
3. `openChangeCount()` = # changes not yet acted-on; = total at load; −1 per distinct ≫/≪/✕; = 0 when all acted.
4. `.de-count` shows "K open", updates live; recompute resets `_currentId` + `_resolved`.
5. No kind-identity regression; no merge-action semantics touched (independent of the x/>> HARD GATE).

## Handoff
Tron reviews (emphasis recipe + "open" definition) → req confirms → I derive-confirm (jumpToChange impl-edit + NEW openChangeCount name-exact/marker; riders' markers stay) → PO build-go → expert → I backstop → tester DET.
