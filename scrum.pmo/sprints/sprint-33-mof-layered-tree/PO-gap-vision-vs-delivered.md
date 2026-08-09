# Sprint 33 — GAP: v0.8.0 MDA vision vs delivered (Tron device-QA, 2026-07-30, IMG_4771)

**Tron (verbatim intent):** "i never saw a working interactive diagram nor a DnD action visualizing a svg on an interactive svg element after DnD… as a selectable box… as in any diagram editor. make this sprint 33, scenario-first. fill the gaps and show me working interactive diagrams filled by a DnD item. read the original v0.8.0 vision again. fill the gaps. measure. cmm4! add the missing folders and items!"

## THE CORE GAP (measured against sprint-32 PO-vision.md R32.4/5/6)
The vision (R32.5, verbatim): "Drag an itemView of an MDA unit into a (blank) diagram → added as a VIEW (class view). Views contain COMPOSED views: class UML SVG has an attribute compartment (attribute views), methods compartment (method views), properties compartment (getter/setter views). x,y = drop position; interactively SELECTABLE + MOVABLE." + interactive SVG in the drawer, pan/pinch-zoom.
**DELIVERED (gated GREEN but NOT the vision):** R32.4 diagram surface exists, R32.5 addView adds a view-link, R32.11 tap-to-add fires — BUT Tron has NEVER seen: drag/tap an item → a **selectable, movable SVG class box with attribute/method/property compartments** rendered on an interactive pan/zoom SVG canvas, like a real diagram editor. The gates verified endpoint/data/tap-fires (structure), NOT the VISUAL interactive diagram (the AC surface). Classic gated-the-path-not-the-interaction, at feature-vision scale. [[gate-the-ac-surface]] [[visual-features-gate-by-pixel]]

## GAPS TO FILL (Sprint 33, scenario-first, architect measures each vs current code)
1. **WORKING interactive diagram**: drag/drop a ts-file item (or MDA unit) into a diagram → renders its contents as **M2-instance SELECTABLE SVG BOXES** (class box w/ attribute/method/property compartments) on an interactive SVG canvas (RbPanZoom), x,y-on-drop, selectable + movable. Each M2 instance = an SVG equivalent (like the puml-compiled-svg output). THIS is the never-delivered core.
2. **Folder names + structure (Tron exact):** folders = **diagrams** (plural) / **puml** / **ts** — NOT "diagram". The ts FILES live INSIDE the **ts** folder (not top-level siblings). Named siblings that are missing must appear.
3. **DRY violation:** items show redundant "src/ts/scenario/X.ts" on every row — the discriminator is the FILE NAME. Show just the filename; the item POINTS TO the real file location + resolves it for EDIT (like the trace view opens the .ts). No repeated path prefix.
4. **Fill vs vision**: composed views (compartments), relationship views (R32.6 typed→other-unit), diagram→.puml (R32.7), action-sync (R32.8) — architect measures which are actually WORKING visually vs gated-structurally-only.

## ROUTE (CMM4: MEASURE first, then scenario-first)
- **architect**: MEASURE the gap — read sprint-32 PO-vision.md + the current rb-diagram-detail/buildDiagramSvg/addView/R32.6 code → WHY the drag→SVG-box never renders visually (what's missing between gated-structure and actual-interactive-diagram); design the fill (working interactive diagram + folder rename/structure + DRY/edit-resolve). Measure-first, no assume.
- **req**: formalize the gaps as S33 requirements + ACs — gate posture = **@390 Tron REAL interaction** (drag→see selectable SVG box), screenshot+pixel, NOT endpoint/structure (the miss).
- **expert**: HOLD current P3f-1 (folder names wrong + core-diagram missing); build the corrected scenario-first spec.
- **tester**: gate the VISUAL interaction @390 (Tron sees a working diagram box), planted-defect bite.

Ref: sprint-32 PO-vision.md (the v0.8.0 vision) + IMG_4771 (this device screenshot).

## ADDENDUM (Tron, same session): ACTION BAR
- The action bar must REUSE the existing **WODA action compartments/bars** component (NOT a new fork — architect locates it), with **NAMED actions**: "Add Diagram", "Compile PUML → SVG", … (named, not icon-only). It's currently MISSING entirely from the /model view.
- Folder rename: 'diagram' (singular, as built) → **'diagrams'** (plural, Tron's exact name). ts-files-inside-ts already correct.
- Expert WIP so far (HELD, may survive): 3 artifact folders (a6735a1d1, rename diagram→diagrams + DRY-label pending), import-puml endpoint (a5f76f8eb, R32.7 pumlToModel reuse). The CORE (interactive SVG diagram canvas: DnD → selectable M2 SVG boxes) is NOT built = the re-scope heart.
