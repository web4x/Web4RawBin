# Design: Changes-Focused Code-Folding in the 3-Way Merge (Tron feature)

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 · scenario-first (req minting in parallel)
**Ask:** (1) SYNC expand/collapse across the 3 Monaco editors; (2) PREVENT collapsing any region containing a change; (3) START fully collapsed, ONLY change regions expanded (changes-only view).

## Measured current state
- Monaco default `folding:true` but **unmanaged** — no code touches folding; no `setHiddenAreas`/`getContribution`/`foldAll` usage anywhere.
- `lineY` (:512-515) = `node.top + (ed.getTopForLineNumber(line+1) - scrollTop)` — **getTopForLineNumber already accounts for hidden areas/viewZones** (comment :418). → the spline reflows correctly post-fold **if recomputed**.
- Change line-ranges live in `conflicts[]`: CENTER `[c.span[0]..c.span[1]]`, LEFT `[c.aStart..c.aStart+c.a.length]`, RIGHT `[c.bStart..c.bStart+c.b.length]` — the SAME source decorations (renderCenter/SideChangeBlocks) + spline (renderConnectorRibbons :580-582) already use.

## Approach: setHiddenAreas-driven (NOT the internal folding model)
**Decision:** drive folding via `editor.setHiddenAreas(IRange[])` (public, stable in monaco 0.52.2) and **DISABLE native folding** (`folding:false` in `common` :166). Rationale: the FoldingController / onDidChangeFoldingState is INTERNAL + version-fragile + can't cleanly (a) guard change-regions from collapse nor (b) sync 3 differently-lined editors. setHiddenAreas gives deterministic control of EXACTLY which lines hide → guard (2) becomes structural, sync (1) state-driven, initial (3) direct.

## Region model (b) — reuse conflicts[]
- Per editor, CHANGE ranges from conflicts[] (above). GAPS = the complementary ranges (before first change / between changes / after last), each shrunk by a CONTEXT margin K (K lines kept around every change).
- **Gap index k is SHARED across the 3 editors** — the k-th gap maps to a different line-range per editor (via its neighbouring changes' per-editor ranges). One gap-set → three projections.

## (a) Monaco API used
`editor.setHiddenAreas(IRange[])` (hide arbitrary line ranges). `getTopForLineNumber` (hidden-area-aware, already in lineY). NOT used: foldAll/unfoldAll/onDidChangeFoldingState/getContribution (internal/fragile).

## (c) SYNC across 3 — STATE-driven (cleaner than syncScroll3's event-mirror)
- Shared `private _collapsedGaps = new Set<number>()` (gap indices).
- `applyFold()`: for each editor, map every collapsed gap-index → that editor's line-range → `setHiddenAreas(ranges)`. One state, 3 projections = inherent sync (no event ping-pong).
- Any expand/collapse mutates `_collapsedGaps` then calls `applyFold()` → all 3 reflow together.

## (d) GUARD — structural
Change line-ranges are NEVER placed in any hidden range (only GAPS are collapsible). Native folding OFF (`folding:false`) so the gutter can't override. A change region simply has no collapse control → impossible to collapse by construction.

## (e) INITIAL changes-only
On merge (end of computeMergedCenter :223 / mountThreePane): `_collapsedGaps = {all gap indices}` → `applyFold()` → only change regions (+K context) visible. Expanding a gap reveals its context on demand.

## Coexistence (spline / decorations / highlight)
- **Spline:** after EVERY applyFold, call `renderInterPaneGutters() + renderConnectorRibbons()` — lineY/getTopForLineNumber auto-account for hidden lines (:515); change endpoints are always visible (guard) → valid Y. Same recompute the scroll handler already does (:712).
- **Decorations:** deltaDecorations on hidden lines simply don't render; visible-line decorations render normally. No change.
- **Highlight (R30.41):** tokenization is unaffected by hiding lines. No change.
- **Gap affordance:** a Monaco VIEW ZONE per collapsed gap — "⋯ N lines · expand" (GitHub-style), click → remove gap from `_collapsedGaps` → applyFold. (View zones already used here — lineY :418/pad comments.) Expanded gaps get a re-collapse affordance at their top.

## Fix-sites / methods
| Site | Change |
|------|--------|
| `common` :166 | add `folding: false` (disable native; setHiddenAreas drives folding) |
| NEW `computeFoldRegions()` | conflicts[] → per-editor change-ranges + shared gap list (context margin K) |
| NEW `applyFold()` | `_collapsedGaps` → 3× setHiddenAreas → render gap view-zones → renderInterPaneGutters + renderConnectorRibbons |
| NEW `toggleGap(idx)` | mutate `_collapsedGaps` → applyFold |
| NEW `_collapsedGaps: Set<number>` | shared fold state |
| computeMergedCenter :223 / mountThreePane | seed `_collapsedGaps = all gaps` → applyFold (changes-only initial) |
| syncScroll3 :702 | unchanged (fold reflow reuses its render calls) |

## Decomposition (UCs → Methods)
- **UC-Fold1 folding.changesOnlyInitial** — computeFoldRegions + applyFold(all-gaps-collapsed) on merge. Methods: computeFoldRegions, applyFold. [core]
- **UC-Fold2 folding.syncExpandCollapse** — `_collapsedGaps` + toggleGap + gap view-zone affordance; one state → 3 projections = sync. Method: toggleGap (+ view-zone render).
- **UC-Fold3 folding.guardChangeRegions** — `folding:false` + only-gaps-collapsible (structural). No change-region collapse control.
- **UC-Fold4 folding.coexistReflow** — post-applyFold renderInterPaneGutters+renderConnectorRibbons (spline tracks visible geometry); decorations/highlight auto. (Woven into applyFold; own UC for traceability.)

**Build order:** Fold3 (disable native) + Fold1 (compute+initial) → Fold2 (toggle UI) → Fold4 (reflow, inside applyFold).

## Feasibility + one decision to flag
FEASIBLE + robust: setHiddenAreas is public/stable; reuses conflicts[] + the lineY geometry that already accounts for hidden areas; coexistence is the existing render-recompute. New surface = computeFoldRegions/applyFold/toggleGap + gap view-zones + `folding:false`.
**DECISION (Tron):** CONTEXT margin K — "ONLY change regions expanded" literal = K=0 (pure changes-only); GitHub-like = K≈3. RECOMMEND K=3 (a few context lines aid reading) but default to Tron's literal if he wants strict changes-only. Behavior/visual → commit+bump+rebuild+deploy + DET-3x gate at Tron's viewport (initial changes-only; expand a gap → syncs across 3; change region has no collapse; spline/decorations/highlight intact after fold).
