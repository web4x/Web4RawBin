# DRY/OOP Audit — In-Room Tree vs /trace Tree

*robbin-skill-expert (audit) pairing robbin-architect (consolidation design) · 2026-06-11 · PO-directed*

## Scope
`RoomView.ts` (333 lines) re-implements tree rendering that `rb-trace-tree` (406 lines) +
`rb-object-item` already provide on /trace and /scenario. RoomView reuses the ITEM component
(since ff82b0ad T-room-ui-shared) but re-implements the TREE layer around it.

## DRY violations (4)

| # | RoomView | Duplicates | Evidence |
|---|----------|------------|----------|
| D1 | Hand-built `div.tt-node > div.tt-row > rb-object-item` scaffolding | `RbTraceTree.nodeEl()` (L150) + `buildSeedNode()` (L220) build the identical structure | RoomView.diffRenderItems L286-291 |
| D2 | `toggle-children` listener (show/hide `.tt-children`) | `RbTraceTree.onToggleChildren` (L53-99) — richer: lazy child fetch, ancestry cycle guard, localStorage expand-persist | RoomView L201-207 — a DEGRADED copy: no persistence, no lazy load |
| D3 | Static tree skeleton baked into an HTML template literal (members/files collection nodes with `has-children children-open`) | `buildSeedNode()` constructs the same shape programmatically from data | RoomView L163 (one giant template string) |
| D4 | `diffRenderItems()` — private child-reconciliation algorithm (R19.90 update-in-place) | No equivalent in RbTraceTree (it re-renders) — the diff is GOOD but lives in the wrong class; /trace + /scenario would benefit too | RoomView L271-294 |

## OOP boundary breaks (4)

| # | Break | Why it's wrong |
|---|-------|----------------|
| B1 | RoomView owns rb-object-item lifecycle: creates items, mutates attributes, removes nodes | Item lifecycle belongs to the tree component. RoomView should hand it DATA (member/file lists), not manage DOM |
| B2 | Document-global reach-ins: `document.querySelector('#rrc-members-node rb-object-item')`, `getElementById('rrc-tree')` | Crosses component encapsulation via global selectors instead of holding a component reference with an API |
| B3 | Click routing bypass: RoomView adds its own click listener on the tree to intercept file items (L209-218) | rb-object-item already routes clicks through the Navigator seam (nav.ts setActiveRouter). Room should register a navigator/verb, not eavesdrop on DOM events |
| B4 | Feature divergence: /trace tree has expand-persist, cycle guard, revealNode highlight (T200); room tree has none | Same interaction, inconsistent UX — the cost of the fork, compounding with every tree feature |

## Consolidation recommendation (architect to design, expert to implement)

`RbTraceTree` already has TWO data modes: `setGraph()` (/trace) and `data-seed-ior`/`renderSeed()`
(/scenario). `buildSeedNode(uuid, type, name, children[], hasChildren)` is ALREADY
shape-compatible with members/files collections.

1. **Add a third data mode** — `setCollections([{ ref, type, name, description, children: ItemData[] }])`
   (or generalize renderSeed's data path to accept locally-supplied seed data instead of fetching).
   RoomView then creates ONE `<rb-trace-tree>` and feeds it member/file data on every update.
2. **Move D4's diff-reconciliation INTO RbTraceTree** as the node update path (update-in-place
   keyed on ref) — /trace + /scenario inherit the no-flicker behavior for free.
3. **Click handling via the existing Navigator seam**: room registers a navigator (or verb
   handler) for `file:`/`member:` refs → openFilePreview / member sheet. Delete the raw listener.
4. **Delete from RoomView** (~80 lines): diffRenderItems, the DOM halves of
   renderRoomTreeMembers/Files (keep the pure data-mapping), the toggle-children listener,
   the static tt-* template HTML. RoomView's remaining tree responsibility = data shaping only.
5. **Expand-persist key**: reuse the tree's localStorage pattern with a per-room key
   (`rawbin-room-expanded-<roomId>`), matching /scenario's per-seed keys (R-N2).

## Risk + sizing
- rb-trace-tree gains ~40 lines (mode + diff), RoomView loses ~80. Net -40, one tree owner.
- Chain impact: existing Impl markers in RoomView (62f77af0 renderRoomTreeMembers,
  e4b1fe11 renderRoomTreeFiles, 6471cfbd preview click) move/re-anchor with the code —
  renameUuid not needed if uuids stay verbatim; markers travel with the moved methods.
- Test impact: room-tree vitest cases assert tt-* DOM — they keep passing if the component
  emits the identical DOM contract (it does — that was 00656eee's goal).

## Verdict
The fork is real debt: 4 DRY violations, 4 boundary breaks, divergent UX. Consolidation is
LOW-RISK because the DOM contract is already identical and the item component already shared —
only the tree layer needs to change ownership.
