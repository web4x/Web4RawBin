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

### Coordination with ribbons (R30.13) + scroll
- **Run `alignPaneRows` BEFORE `renderConnectorRibbons`** in the render pass. After alignment, a change's source block and its Result block share the same Y-band → ribbons become near-horizontal (simpler geometry, more legible). `renderConnectorRibbons` needs NO endpoint-math change — `getTopForLineNumber` returns the post-align Y automatically.
- **`syncScroll3` UNCHANGED:** alignment makes cumulative heights equal at each conflict boundary, so `setScrollTop(sameValue)` keeps aligned rows aligned across panes.
- Works in BOTH 2-way + 3-way (both populate `centerSeq`/`conflicts`).

## Chain to mint (scenario-first — req). Class RbDiffEditor 18165081 REUSE (21→22m, +1), 0-dup, name-exact, designAhead.
| UC | Method (NEW, name-matching) | sourceFile | Impl |
|----|-----------------------------|-----------|------|
| `diffEditor.paneLineAlignment` | `RbDiffEditor.alignPaneRows` | src/public/ts/components/rb-diff-editor.ts | designAhead |

**Build-note (impl-edit, marker STAYS):** the existing recompute path (`rebuildCenter` / the computeMergedCenter render tail) calls `alignPaneRows` after spans are set + before `renderConnectorRibbons`. REUSED unchanged: `computeTwoWayHunks`/`computeMergedCenter`/`acceptChange`/`syncScroll3`/`renderConnectorRibbons` (endpoint math unchanged — reads aligned Y). crossRef R30.13 (renderConnectorRibbons ab145dab) + R30.12.

## Build flags (expert)
- viewZone `domNode` = an empty `<div>` (background matches editor gutter) — pure spacer, no content, no line number.
- Clear prior zones each recompute (`changeViewZones` remove by id) to avoid stacking on repeated picks.
- Perf: N conflicts → ≤3N zones; recompute only on pick/mount, not on scroll.
- Reference: IntelliJ/Rider 3-way merge alignment + VS Code merge editor (MIT) view-zone alignment.

## Gate / handoff
On req commit → I derive-confirm (1 NEW Method name-exact, RbDiffEditor 21→22 REUSE 1-unit/0-dup, designAhead, unit-level ownerIor, impl-edit units unchanged) → PASS/FAIL → PO build-go → expert (pure client, no restart) → I confirm the alignPaneRows marker AST-attached → tester DET-3x + Tron visual (change rows line up L↔C↔R + ribbons connect aligned rows). **Coordinate build order with the expert's ribbon-visibility fix — land alignment so ribbons draw on aligned rows.**
