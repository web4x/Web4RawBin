# R30.x — 3-Pane Line Alignment (IntelliJ change-row alignment)

**Author:** robbin-architect · 2026-07-14. Tron R30.13 feedback #2: RawBin runs each pane's line numbers independently (47-112 / 47-113 / 33-99) so you can't trace a change across panes. IntelliJ inserts blank spacer rows so each change's region LINES UP horizontally across Local→Center→Right, and the connector ribbons then connect aligned rows. Design-only → req mints → I derive-confirm → PO build-go → expert (pure client). **Coordinates with the expert's R30.13 ribbon-visibility fix** (aligned rows make ribbon geometry near-horizontal = simpler + more legible). (#1 ribbon-invisible = expert's bug fix, not this design.)

## Measured substrate (rb-diff-editor.ts)
- `computeTwoWayHunks` builds `centerSeq` = alternating `{ok:string[]}` (equal runs, identical in all panes) + `{cid}` (a conflict). `Conflict{a:localLines, b:remoteLines, pick, span:[Result range]}`.
- `rebuildCenter` flattens `centerSeq` → CENTER + sets each conflict's `span` (Result line range). Runs on mount + every pick change.
- **No Monaco viewZones used** — 3 independent editors, independent numbering → change blocks sit at different visual rows because equal-runs before them differ in cumulative length across panes.
- `getTopForLineNumber(n)` — Monaco's Y for a line — **already accounts for viewZones** (zones are part of layout). So ribbons drawn AFTER alignment get the aligned Y for free.

## Design — alignment spacer viewZones — Method `RbDiffEditor.alignPaneRows` (NEW)
Walk `centerSeq` tracking the current visual row in each pane (Local/Center/Remote). Equal-runs advance all 3 equally (stay aligned). At each **conflict block**:
- `hLocal = a.length`, `hRemote = b.length`, `hCenter = picked.length` (picked = pick==='b'?b:a). `maxH = max(hLocal, hRemote, hCenter)`.
- Insert a spacer viewZone of `(maxH − hPane)` blank rows AFTER each pane's block (Local after its a-lines, Center after picked, Remote after its b-lines). Now every pane reaches the NEXT equal-run at the SAME visual row → the whole file stays aligned downstream.
- Monaco: per editor `changeViewZones(acc => acc.addZone({ afterLineNumber, heightInLines: spacer, domNode: blankDiv }))`; track zone ids, clear+re-add on each recompute.
- **Recompute** on every `rebuildCenter` (picks change block heights → span/maxH shift) + on mount. Real line numbers stay the file's own (47,48…) — IntelliJ keeps real numbers, just aligns the ROWS with blank spacers.

### ★ Ribbon visibility is X (width), alignment is Y — BOTH needed (expert diagnosis, 2026-07-14)
The R30.13 ribbons render but are INVISIBLE — expert's root cause: `.de-panes gap:1px` → every ribbon band spans Local-right-edge → Center-left-edge = **1px apart → 1px-wide sliver**. `alignPaneRows` makes bands HORIZONTAL (Y) but a horizontal band across a 1px gap is STILL 1px wide. **Fix needs BOTH:** Y = `alignPaneRows` (this design, mine) + X = **widen the inter-pane gutter to ~34px** (expert, = the correct IMPL of the already-minted R30.13 `renderInterPaneGutters` 98c5a33a — its whole job IS the inter-pane gutter; ~34px width + SVG z-above-editors + pointer-events:none/buttons-auto + horizontal extent are its impl details) + `renderConnectorRibbons` (ab145dab) draws across it. **NOT a new chain** — the gutter-widen is R30.13-impl; only `alignPaneRows` needs minting. **CO-BUILD both in ONE go** (interdependent: viewZones set Y, gutter sets X, both feed renderConnectorRibbons). Split: architect owns alignPaneRows; expert owns ribbon-visibility (gutter+z+extent).

### Coordination with ribbons (R30.13) + scroll
- **Run `alignPaneRows` BEFORE `renderConnectorRibbons`** in the render pass. After alignment, a change's source block and its Result block share the same Y-band → ribbons become near-horizontal (simpler geometry, more legible). `renderConnectorRibbons` needs NO endpoint-math change — `getTopForLineNumber` returns the post-align Y automatically.
- **`syncScroll3` UNCHANGED:** alignment makes cumulative heights equal at each conflict boundary, so `setScrollTop(sameValue)` keeps aligned rows aligned across panes.
- Works in BOTH 2-way + 3-way (both populate `centerSeq`/`conflicts`).

## ★ COVERAGE decision (expert scoping) — R30.16 = v1 (conflicts[]-only), v2 = fast-follow
Both `renderCenterChangeBlocks` and `renderConnectorRibbons` iterate the SAME `conflicts[]` → **they agree on coverage by construction** (same source set), regardless of what's in it. The only open decision = does `conflicts[]` include 3-way auto-applied one-sided changes:
- **2-way: FULLY covered either way** — every hunk is a `Conflict` (kind=change) → blue blocks + ribbons for all. This is Tron's CURRENT primary use (README-vs-version compares, the screenshots).
- **3-way:** diff3 auto-applies non-conflicting one-sided changes into `ok`-runs (NOT `conflicts[]`) → v1 shows blocks/ribbons for TRUE CONFLICTS only (red), not the blue one-sided changes IntelliJ also shows.
- **DECISION (architect): R30.16 = v1 (conflicts[]-only).** Ships full 2-way coverage + 3-way conflicts NOW, keeps the co-build shippable, ribbons+blocks always agree (same `conflicts[]`). **v2 = a clean fast-follow req:** `computeMergedCenter` impl-edit surfaces each 3-way one-sided diff3 region (an `ok`-run whose content ≠ its base slice) as a `kind:'change'` hunk (auto-picked to the changed side, but tracked so it gets a blue block + ribbon + take-over arrow) — full IntelliJ 3-way coverage. Bounded impl-edit, no new Class/Method. Reason to phase: 3-way merges (real merge-base) are currently rare in RawBin; v1 delivers the visible value for the active 2-way use immediately; v2 completes 3-way fidelity without bloating this co-build.

## ★ Scroll-to-last-line (Tron R30.13#3) — FOLD into R30.16 (2 causes, MEASURED)
Symptom: synced scroll won't bring a file's LAST line to the top; stops wrong. TWO causes:
1. **Pane length-mismatch → syncScroll3 clamp-drag.** `syncScroll3` sets raw `setScrollTop(e.scrollTop)` on all 3; with different scrollHeights the shorter pane CLAMPS, and since each pane is also a scroll SOURCE, the clamped one fires back and drags the others → wrong stop. **`alignPaneRows` FIXES this:** spacers make all 3 panes EQUAL total height (equal-runs identical + each conflict padded to maxH) → one consistent scroll range → no clamp-drag. ✔
2. **`scrollBeyondLastLine: false` (MEASURED, mountThreePane common opts line 114) → last line can NEVER reach the TOP** (can't scroll past it). Even with equal heights, last-line-to-top needs `scrollBeyondLastLine: TRUE`. This is a SEPARATE, direct cause. **Companion impl-edit** to `mountThreePane` (c4c84142): flip `scrollBeyondLastLine` to `true` on all 3 editors (marker STAYS).
Optional hardening (not required once aligned): sync by TOP-LINE (getTopForLineNumber map) instead of raw pixels. Not needed — equal heights + scrollBeyondLastLine:true suffice.
**ADD ACs to R30.16:** (a) post-alignment all 3 panes equal total height + synced scroll reaches each file's full extent (no mismatch clamp); (b) `scrollBeyondLastLine:true` on all 3 → last line scrolls to the TOP.

## ★ CENTER colored rounded-block decorations (Tron IntelliJ fidelity) — 2nd R30.16 method
Tron: the CENTER (Result) change regions need COLORED ROUNDED-BLOCK backgrounds matching the ribbon colors — marking WHERE+WHAT each incoming change is as it lands. Rider palette: **BLUE = change from one side, GREEN = cleanly-resolvable one-sided, RED/BROWN = conflict/deletion**; rounded corners; ribbons flow INTO these blocks. Current RawBin = FLAT maroon full-width row highlights (renderMergeGutter's `de-conflict-line`), not shaped/typed.
- **NEW Method `RbDiffEditor.renderCenterChangeBlocks`:** Monaco range decorations on each CENTER hunk's Result span, className = color-by-type + `border-radius` (rounded block; top-radius on first line / bottom-radius on last line of the hunk for a continuous rounded block; slight inset via margin so it reads as a block not a full-bleed bar). SUPERSEDES renderMergeGutter's flat `de-conflict-line` center deco (renderMergeGutter impl-edit: delegate/drop the center flat deco; marker STAYS).
- **Shared color classifier (DRY) — CLASSIFY-AT-SOURCE so it matches BY CONSTRUCTION (expert alignment 2026-07-14):**
  - **Ownership (a):** architect OWNS `CONFLICT_PALETTE` + `conflictColor()` **module-level in rb-diff-editor.ts** (introduced with R30.16 renderCenterChangeBlocks). Expert IMPORTs/calls it, drops the local ribbon hex (single owner = no merge collision on the shared const). Palette = single source: `conflict #a5603a` / `resolvable #3a8a5a` / `change #3a6ea5` (my #3a8a5a stands; expert's old #3a8a4a dropped).
  - **Semantics (b) — the real fix:** the center-block classifier and the ribbon classifier must NOT bucket independently (expert's ribbon = {conflict / one-sided ins-del / two-sided change}; palette = {conflict / resolvable / change} — different buckets → a ribbon + its block could mismatch). SOLUTION: **add a `kind: 'conflict'|'resolvable'|'change'` field to the `Conflict` interface, SET ONCE at hunk creation** where the semantic info is known — `computeMergedCenter` (3-way: diff3 true-conflict → 'conflict'; surfaced one-sided → 'resolvable') + `computeTwoWayHunks` (2-way one-side take-over → 'change'). Then `conflictColor(c) = CONFLICT_PALETTE[c.kind]` is a PURE fn of the hunk. **BOTH `renderCenterChangeBlocks(c)` and `renderConnectorRibbons(c)` pass the SAME Conflict object → same `kind` → same color. Zero independent re-classification → match guaranteed by construction, not by convention.** (Impl-edits to the Conflict type + the two producers set `kind`; markers stay.)

## Chain to mint (scenario-first — req). Class RbDiffEditor 18165081 REUSE (21→23m, +2 NEW methods), 0-dup, name-exact, designAhead.
| UC | Method (NEW, name-matching) | sourceFile | Impl |
|----|-----------------------------|-----------|------|
| `diffEditor.paneLineAlignment` | `RbDiffEditor.alignPaneRows` | src/public/ts/components/rb-diff-editor.ts | designAhead |
| `diffEditor.centerChangeBlocks` | `RbDiffEditor.renderCenterChangeBlocks` | src/public/ts/components/rb-diff-editor.ts | designAhead |

**Build-note (impl-edit, marker STAYS):** the existing recompute path (`rebuildCenter` / the computeMergedCenter render tail) calls `alignPaneRows` after spans are set + before `renderConnectorRibbons`. REUSED unchanged: `computeTwoWayHunks`/`computeMergedCenter`/`acceptChange`/`syncScroll3`/`renderConnectorRibbons` (endpoint math unchanged — reads aligned Y). crossRef R30.13 (renderConnectorRibbons ab145dab) + R30.12.

## Build flags (expert)
- viewZone `domNode` = an empty `<div>` (background matches editor gutter) — pure spacer, no content, no line number.
- Clear prior zones each recompute (`changeViewZones` remove by id) to avoid stacking on repeated picks.
- Perf: N conflicts → ≤3N zones; recompute only on pick/mount, not on scroll.
- Reference: IntelliJ/Rider 3-way merge alignment + VS Code merge editor (MIT) view-zone alignment.

## Gate / handoff
On req commit → I derive-confirm (1 NEW Method name-exact, RbDiffEditor 21→22 REUSE 1-unit/0-dup, designAhead, unit-level ownerIor, impl-edit units unchanged) → PASS/FAIL → PO build-go → expert (pure client, no restart) → I confirm the alignPaneRows marker AST-attached → tester DET-3x + Tron visual (change rows line up L↔C↔R + ribbons connect aligned rows). **Coordinate build order with the expert's ribbon-visibility fix — land alignment so ribbons draw on aligned rows.**
