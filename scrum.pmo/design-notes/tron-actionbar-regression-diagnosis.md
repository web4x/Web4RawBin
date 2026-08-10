# Tron regression — element-select shows no action-bar verbs : ROOT + FIX

**By:** robbin-architect 2026-08-10, per PO (measured, not guessed). BUG-D ellipse CONFIRMED fixed; this is the SEPARATE action-bar regression.

## ROOT (measured) — box-select's type signal is ORPHANED; the bar replays the DIAGRAM type
When Tron selects a diagram element, `boxSelect` (rb-diagram-detail.ts:341-353) fires TWO events:
1. `rb-active-diagram{uuid}` → model.ts:95 → `drawer().refreshActions()`.
2. `rb-drawer-detail-shown{type:'modelelement', ref}` (:352).

But the action bar is driven ENTIRELY by `universalActionBar(type,ref)` (rb-detail-drawer.ts:420), and **`_shownType` is set ONLY inside `universalActionBar` (:421)** — which is called ONLY from the drawer's own `renderDetailForRef → showActionsForType`. For an OPEN diagram, that last ran with `type='diagram'`.
- `refreshActions()` (:435) re-runs `universalActionBar(this._shownType, …)` = **`'diagram'`** → A1 defaults + diagram-level verbs. (Step 1.)
- The external `rb-drawer-detail-shown{type:'modelelement'}` is heard ONLY by model.ts:91, which sets a model-local `shownRef` + `ensureProvider()` — it **NEVER touches the drawer's `_shownType` and never calls `universalActionBar`**. (Step 2 is a dead signal.)

⇒ `universalActionBar` is NEVER called with `type='modelelement'` on a box-select, so `actionsForContext('modelelement', …)` — the element's UNIT verbs (New / Rename / **Delete class**) + MEMBERSHIP verbs (Add-to / **Discover** / **Remove-from-diagram**) — never render. The bar keeps the diagram-level verbs. **Exactly the screenshot** (incl. missing `Delete`, a UNIT verb — which is why it's not merely `hasActiveDiagram=false`; the whole modelelement branch is absent).

**This is the R34.7/R-E unification-dropped-connection class** (the music-player precedent, verbatim): the unification (f28939b41) made `_shownType` the drawer's INTERNAL state settable only by its own `renderDetailForRef`, ORPHANING `boxSelect`'s `detail-shown{modelelement}` signal that the pre-unification HOST-listener used to turn into `setActions`. Same as PO candidate (b)/(c): the provider composition is fine — it's simply never CALLED with `modelelement`.

**Single-source framing:** "what type is currently shown" is stated in TWO diverging places — the drawer's `_shownType` (`'diagram'`) and the `rb-drawer-detail-shown{type}` event (`'modelelement'`). They disagree; the bar uses the internal one; the event is ignored. Same single-source-of-relationship disease as the week's other bugs.

## node.kind (R40.23) — EXONERATED (confirmed, not taken on trust)
The PO's `node.kind` nullable change (R40.23, `m.kind ? String(m.kind) : null`) is entirely in the RENDER path (`facetKind`/renderFacet), NOT the action path: `universalActionBar`'s `type` comes from the ref-prefix / the `detail-shown` event, never `node.kind`. And render doesn't crash on null — every `.kind` use is a `===` compare or `String(node.kind)` (String(null)='null', safe), and the ellipse renders (Tron confirmed). **The node.kind change did not contribute.** Plainly: exonerated.

## FIX (by-construction — single-source the "shown type" trigger)
Make `rb-drawer-detail-shown{type,ref}` the ONE authoritative signal that drives the bar, from ANY source:
- **The drawer LISTENS to `rb-drawer-detail-shown{type,ref}`** → `this._shownType = type; this._shownRef = ref; this.universalActionBar(type, ref)`.
- `renderDetailForRef`/`showActionsForType` stops calling `universalActionBar` directly and just **dispatches** `detail-shown` (it already does, :406) — so there is ONE trigger path (dispatch → listener → bar), not two. No double-fire.
- Then `boxSelect`'s `detail-shown{modelelement}` drives element verbs via the identical path as `renderDetailForRef`. `refreshActions` (on `rb-active-diagram`) now replays the CORRECT `_shownType` because the event set it.

**Minimal alternative** (if a smaller diff is wanted): expose `drawer.showType(type,ref)` and have `boxSelect`/the host call it on the detail-shown — but that re-adds a per-caller wire (the very thing the unification removed) and can drift again. The listener version is single-source and drift-proof.

**GATE (@390 device):** select a diagram element → bar shows `Delete class` + `New`/`Rename` + (diagram open) `Add to / Remove from diagram` + `Discover related`; deselect → diagram-level verbs return; /trace + non-diagram drawers unaffected. Regression test: assert `universalActionBar` is invoked with `type='modelelement'` on a synthetic box-select (drives the bar), and that the two-trigger→one-trigger change didn't drop the renderDetailForRef case.
