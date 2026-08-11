# R37.7 GROUP-D backfill — R20.6a-h req→UC mapping (architect, for req to mint)

**Author:** robbin-architect · 2026-08-07. PO GO. req (0.4) is single-minter + wires per this map, verify-owner-first, adopts tester markers. MEASURED disk (not inferred): the 8 reqs R20.6a-h all have `useCases=[]`; Class `SelectionModel b57b8838` + 3 Methods + 3 UCs exist. The map below is grounded in each existing UC/Method's ACTUAL description on disk.

## ⚠ TWO CORRECTIONS from measurement (verify-owner-first)
- **`1fac9d23` and `b1c93799` are `ior:class:Task` units, NOT orphan Impls.** Do NOT wire Method+UC onto them — Tasks are navigation, not chain. `1fac9d23` = the BUG2 task (T-selection-tap-switch-longpress-toggle, covers R20.6c+d navigation); `b1c93799` = R20.4 Bug/ChangeRequest OOP task. Leave them as Tasks.
- **`3542dcb3` (the only real orphan Impl) is `RbDetailView.chainExcludesSelf` — a DETAIL-VIEW chain, NOT SelectionModel/R20.6.** It belongs to a chain-excludes-self requirement, not R20.6a-h. See §4.

## §1 — DIRECT WIRES (existing UC already owns the req — its on-disk desc cites the req; clean, no new units)
| Req | → UC (existing) | Method | verify-owner |
|-----|-----------------|--------|--------------|
| **R20.6a** `2ad98e53` app-wide singleton | `selectionModel.singleton` **2250545b** | `select` 10f3d3d4 | UC desc = "R20.6a: SelectionModel is a singleton" ✓ owns it |
| **R20.6b** `4bc97fdc` empty→chat drawer | `selectionModel.emptyShowsChat` **842cffe0** | `onEmptyShowChat` c3c70517 | UC desc = "R20.6b: when selection empty → chat" ✓ |
| **R20.6c** `c1dbd4c3` tap→single-select | `selectionModel.tapSwitches` **aee56fad** | `tapSwitchToggle` 6b21088e | Method = "tap = exclusive single-select" ✓ |

All three share Class `SelectionModel b57b8838` / Impl `6a626fa3`. req just sets `Requirement.useCases[] = [that UC]` + confirms the UC's `Requirement` back-ref. Distinct existing Tests already cover a/b/c intents — verify each on disk before crediting (don't assume).

## §2 — NEW UC, SHARED existing Method (R30.11 distinct-intent shared-impl)
- **R20.6d** `300a8952` long-press toggles add/remove → **NEW UC `selectionModel.longPressToggles`** → **SHARED** Method `tapSwitchToggle 6b21088e` (that ONE method implements BOTH tap-switch AND long-press-toggle — its UC `aee56fad` is the *tap* intent; d is the distinct *long-press* intent). Do NOT re-point/re-credit aee56fad. Distinct Test: **long-press toggles a ref in/out of the set** (vs c's tap-clears-then-selects-one). Verify-owner: aee56fad's Test must be the tap case, not the toggle case — else split.

## §3 — NEW UC + NEW Method (no existing chain — req's "may lack chains" CONFIRMED)
Each needs a fresh UC→Method→Impl. **Before minting a NEW Method, grep the code** for an existing function (verify-owner-first — the behavior may already be a method with no marker); wire to it if found, else design-ahead Impl.
- **R20.6e** `697965f7` selected items get CSS selected+active highlight → **NEW UC `selectionModel.highlightSelected`** → Method that applies the CSS on `selection-changed` (a VIEW concern; likely NOT the `select` method itself). Test: selected item carries the selected+active class.
- **R20.6f** `66a40392` drag one selected → drags ALL selected → **NEW UC `selectionModel.dragAllSelected`** → NEW Method (drag handler reads SelectionModel, moves the whole set). Test: multi-select + drag one → all move.
- **R20.6g** `7cda92d6` consolidate drawers into one via SelectionModel → **NEW UC `selectionModel.consolidateDrawers`** → Method (the drawer-unification path). ★ This likely maps to the SHIPPED drawer-DRY work (one `rb-detail-drawer` via `selectionModel.select → renderDetailForRef`) — grep for the consolidation method; if it exists, wire there (shared-impl), else NEW. Test: multiple drawer entry-points resolve through the one SelectionModel path.
- **R20.6h** `d6305209` remove awkward CSS highlight on default drawer, keep X → **NEW UC `selectionModel.defaultDrawerNoHighlight`** → Method (empty/default-drawer render; distinct from e which ADDS highlight to selected). May ride `onEmptyShowChat c3c70517` with a distinct Test (h = the empty drawer's styling). Test: default/chat drawer has no selected-highlight but keeps the X close.

## §4 — orphan Impl 3542dcb3 (separate chain, not R20.6)
`3542dcb3` = Impl `RbDetailView.chainExcludesSelf` → needs **NEW UC `detailView.chainExcludesSelf` → NEW Method `RbDetailView.chainExcludesSelf` → Impl 3542dcb3**. Owner = the chain-excludes-self requirement (a detail-view/traceability req — **req identifies its owning req; it is NOT one of R20.6a-h**). Keep it out of the SelectionModel group.

## Minting notes (req)
- Single-minter (req); verify-owner-first per row (confirm each existing UC's Test = the req's intent BEFORE crediting — the §1 wires are only clean if the UC's Test genuinely exercises a/b/c).
- §2/§3 new UCs: camelCase Object.verb; Method.ownerIor→Class SelectionModel b57b8838 (reuse the existing Class — do NOT mint a 2nd SelectionModel); Class.methods[] += new Method.
- §3 Impls: grep code first; if the fn exists → mark BUILT + real sourceFile; else designAhead:true. tester markers adopted on ship.
- Each backfilled req gets a DISTINCT-INTENT Test (#126); no cross-wiring onto a sibling's Test.
