# R22.1-4 + R23.1-2 Impl/Test Completion Checklist
*Authored by robbin-skill-expert (chain tool owner), 2026-06-29. Measured from canonical Chain scoreboard at HEAD (det-3x: 27/297). Same format as [R21-marker-checklist.md](./R21-marker-checklist.md).*
*Context: architect minted the 6 UCs (dbc58876a) → these chains now credit req+uc+class+method. They all BLOCK at the **Impl** + **Test** hops. UC was necessary, not sufficient.*

## State (measured per req)
All 6 chains: `req=check, uc=check, class=check, method=check, IMPL=open expert, TEST=open`. Every method has `implementations=[]` — **no Impl unit exists** → all are "Group B" (create Impl unit + marker + wire), same as R21.2/4/8/9.

## EXPERT work — create Impl unit + `[impl:uuid:]` on the NAMED method + wire
| Req | Method (class.method) | Method uuid | Source file | Action |
|-----|----------------------|-------------|-------------|--------|
| R22.1 | `RbDetailView.renderChainPathSection` | `edb49bb5` | src/public/ts/trace/rb-detail-view.ts | Create Impl unit (uuidgen-fresh) + `[impl:uuid:]` ON the named `renderChainPathSection` method + wire Method.implementations[]→Impl→tests[]. |
| R22.2 | `RbPanZoom.attachMouse` | `09db9916` | src/public/ts/trace/pan-zoom.ts | Same — marker on named `attachMouse`. |
| R22.3 | `RbDetailView.renderChainNodeSourceLink` | `5d56d674` | src/public/ts/trace/rb-detail-view.ts | Same — marker on named `renderChainNodeSourceLink`. |
| R22.4 | `FileBrowser.renderImageLink` | `af4e16c1` | ⚠ expert confirm (FileBrowser class file not auto-located; likely src/public/ts/trace/) | Same — marker on named `renderImageLink`. |
| R23.1 | `ContentPreviewer.fillPreviewPane` | `ccbd2bdf` | src/public/ts/trace/content-preview.ts | Same — marker on named `fillPreviewPane`. |
| R23.2 | `ContentPreviewer.embedYouTube` | `efe1d17e` | src/public/ts/trace/content-preview.ts (expert confirm) | Same — marker on named `embedYouTube`. |

### Hard rules (from R21 — do NOT repeat the R21 mistakes)
- **Marker must sit ON or INSIDE the named method** matching the label-method (strict scan, `buildStrictImplSet`). A marker in an anonymous handler or with a mismatched label does NOT credit. (This is what blocked R21.1/3/5/7 even with markers present.)
- **uuid = uuidgen-fresh**, never fabricated-pattern (`-a1b2-`, `-58d9-4417-8480-`, sequential suffix). Fabricated uuids prefix-collide + need re-minting later.
- One marker = one unit = one method. No cross-file duplication (no pasting the same marker into server.ts AND the module file).

## TESTER work — add `[test:uuid:]` for each (after the matching Impl credits)
- [ ] R22.1 renderChainPathSection — Test unit + `[test:uuid:]` + wire Impl.tests[]
- [ ] R22.2 attachMouse — test marker
- [ ] R22.3 renderChainNodeSourceLink — test marker
- [ ] R22.4 renderImageLink — test marker
- [ ] R23.1 fillPreviewPane — test marker
- [ ] R23.2 embedYouTube — test marker

## Verification (skill-expert, after expert+tester land)
1. `Chain scoreboard` det-3x — expect R22.1-4 + R23.1-2 to flip COMPLETE → **27 → 33/297**.
2. `Chain lintMarkers` — expect 0 new orphans/collisions (uuidgen-fresh uuids).
3. Gate-faithful: no req credits with any hop still open.

## Note — R23.3 (separate)
R23.3 is NOT in this batch. Its UC was minted by skill-expert (`fc7356af`, per PO directive) → R23.3 now `req=check, uc=check, class=open architect`. R23.3 still needs: architect Class+Method (wire UC.classes/method to Room.resolveToken), then expert Impl + tester Test. Pin held at T23.3 (wip=class depth=2).
</content>
