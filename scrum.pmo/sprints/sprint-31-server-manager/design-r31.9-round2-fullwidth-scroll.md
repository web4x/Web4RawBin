# R31.9 ROUND-2 — full-width bottom tier + tree-scroll-past-drawer (robbin-architect 2026-07-24)

Tron device: 2 regressions from MY R31.9 refactor. I OWN them (measured, cited). BOTH have ONE root, on /trace AND SM/FM (DRY = one shared component, Tron confirmed). Fix = one CSS change (+ optional belt).

## ★ DIAGNOSIS — I OWN IT: one line caused both (app.css:398)
My R31.9 design fix-table #2 specified `rb-detail-drawer[data-position='bottom'] { position: fixed; bottom: 0 }` (shipped app.css:398). This CHANGED the bottom drawer from the OLD `position: static` (base rb-detail-drawer :283, unchanged) to a **fixed overlay**. That single change caused both:
- **ISSUE 1 — FULL-WIDTH LOST.** OLD: `position:static` → the drawer is an in-flow child of the `.trace-page` **flex column** (`app.css:271 display:flex;flex-direction:column`); a flex-column child with default `align-items:stretch` **stretches to 100% cross-axis = full viewport width**. NEW: `position:fixed; bottom:0` with **NO `left/right`/`width`** → a fixed box **shrink-wraps to content width** = the narrow/autosized drawer Tron saw (screenshot 2 /trace, screenshot 4 SM terminal). The full-width came for FREE from flex-stretch; going fixed dropped it.
- **ISSUE 2 — TREE-SCROLL-PAST-DRAWER (TRUE REGRESSION).** OLD: `position:static` → the drawer is IN-FLOW **below** `.trace-tree-panel` (flex:1, overflow-y:auto) in the column → the tree occupies the space ABOVE the drawer, no overlap, every item reachable. NEW: `position:fixed` → the drawer is REMOVED from flow and **overlays** the bottom of the (now full-height) tree-panel, and `.trace-tree-panel` (:272 `padding:0 8px`, no `padding-bottom`) has NO bottom scroll-space → the last item(s) sit permanently behind the drawer. The old static layout needed no bottom-inset because the drawer wasn't an overlay; making it fixed removed that for-free scroll-clearance.

**Both = app.css:398 (my fix-table #2 `position:fixed` for the bottom tier). The base was always `static`; only R31.9's data-position=bottom override went fixed.** Honest own: I over-eagerly changed the working in-flow bottom drawer to a fixed overlay when the R31.9 goal (continuous drawer↔compartment) only needed the INLINE branch changed — the bottom branch should have stayed static.

## DESIGN — FIX (correct-by-construction: restore the OLD working bottom layout; keep all R31.9 wins)
Change ONE rule; the bottom tier returns to the in-flow static drawer that worked pre-R31.9 (full-width by flex-stretch + below-the-tree no-overlap), while data-position=inline (desktop compartment) + observePosition + transition are UNTOUCHED.

| # | File | Change |
|---|------|--------|
| 1 | `src/public/app.css:398` | `rb-detail-drawer[data-position='bottom'] { position: fixed; bottom: 0 }` → **`position: static`** (revert to the base/old in-flow behavior). In-flow flex-column child ⇒ full-width by `align-items:stretch` (Issue 1) AND below the tree, no overlay ⇒ tree scrolls fully to the last item (Issue 2). Belt-and-suspenders: add `width:100%` (explicit, in case a host isn't a stretch flex parent). |
| 2 | (verify) resize | The R31.9 continuous-resize (Tron-confirmed working) sets inline `this.style.height`; on a `position:static; flex-shrink:0` flex child an explicit height overrides `max-height:40vh` and grows the drawer (pushing the tree up, tree still scrolls) — resize stays functional. Expert verify the drag still works on the static bottom drawer (it did pre-R31.9). |

**Why static, not fixed+left/right+padding:** the OLD drawer was `position:static` and Tron confirms it worked ("this was possible before"). Restoring static fixes BOTH by construction (full-width via flex-stretch, no-overlay via in-flow) with ONE line, no new bottom-inset bookkeeping, and cannot desync the scroll-space from the (draggable) drawer height. If instead a true fixed-overlay bottom drawer is ever desired (it was NOT in the old code), the alternative is `position:fixed; left:0; right:0` (full-width) + `.trace-tree-panel{padding-bottom: <live drawer height>}` — MORE complex + must track the dragged height; NOT recommended.

**Tiers delivered:** `<1025px` (mobile + intermediate) = `data-position=bottom` = full-width in-flow bottom drawer (both fixed) → `≥1025px` = `data-position=inline` = side Details-compartment (screenshot 5, works). "Full width until it switches to compartment" = satisfied by construction (bottom tier is static full-width for ALL widths below the compartment BP).

## GATE (tester — @390 + intermediate width + desktop, /trace AND SM/FM)
(1) drawer = FULL viewport width at @390 AND at the intermediate width (up to the ~1025 compartment BP) — not narrow/content-sized; (2) the background tree scrolls so the LAST item clears above the drawer at every drawer height (peek / expanded / dragged-tall) — the regression closed; (3) desktop compartment (≥1025) unchanged (screenshot 5); (4) continuous-resize still works (R31.9 win preserved); (5) same instance, no re-mount across BP. Both /trace and Server Manager (DRY). [[tron-on-390px-mobile-gate-there]]

## ROUTE
architect (this) → req formalizes the 2 ACs (AC-fullwidth-bottom-tier / AC-scroll-past-drawer-regression, each @390+intermediate+desktop, both surfaces) → expert builds (1-line + belt + verify resize) → tester gates → Tron device. Client-only CSS (no restart). Impl-edit on the R31.9 app.css (rides ff684e10), NO new node. I backstop full-width + scroll-clearance + resize-preserved + same-instance.
