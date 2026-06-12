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

## Addendum: self-healing custom-element pattern — VALIDATED (with 3 mandatory gaps closed)

*PO ask 2026-06-11: property-setter buffers data, connectedCallback renders from stored state,
zero external timing gate — robust standard vs attribute+whenDefined imperative?*

### Verdict: YES — this is the established Web Components standard ("lazy properties" pattern).
It converts temporal coupling (caller babysits readiness) into encapsulated state (component
owns readiness). Order-independent: set data before/after connect, before/after define — all
paths converge on the same render. The three styles coexisting today are strictly worse:

| Today | Failure mode |
|---|---|
| `await whenDefined()` (RoomView:236) | External timing gate = temporal coupling; caller must know component internals' lifecycle |
| `el.setGraph(g)` / `setMembers()` | TypeError if element not yet upgraded (method doesn't exist pre-upgrade) — loud but race-fragile |
| `el.graph = g` (index.ts x4, trace-page) | WORST: pre-upgrade assignment lands as own-property that SHADOWS the class accessor — setter never fires, render never happens, NO error |

### The 3 gaps that make-or-break the pattern (mandatory, not optional)

1. **upgradeProperty dance in connectedCallback** — without it the pattern silently inherits
   failure mode 3: `if (Object.hasOwn(this,'data')) { const v=this.data; delete this.data; this.data=v; }`
   per buffered property. This is THE difference between self-healing and self-deceiving.
2. **One source of truth per datum** — attributes for scalar/declarative config (rb-object-item's
   ref/type/title stay attributes: parser-settable, inspectable, observedAttributes works);
   property-setters for rich data (graph, members[], children[]). NEVER both for the same datum
   (dual-write drift). No attribute reflection for rich data.
3. **Idempotent render + teardown discipline** — render() from stored state must clear stale
   subscriptions (our ViewBus unsub pattern already does this — keep), and setters should
   no-op on same-reference reassign (pairs with the R19.90 diff: setter diffs, DOM updates in place).

### Encapsulation note
The pattern reinforces the audit's B1/B2 fixes: data flows DOWN through setters, events bubble UP
— parents never query child internals. whenDefined retains exactly one legitimate use: app-bootstrap
layout-dependent logic (measure/scroll after first upgraded render), never data delivery.

### Migration order (matches consolidation)
rb-trace-tree: `graph` + `collections` as buffering setters (setGraph stays as thin alias);
rb-member-list: `members` setter (setMembers alias); delete RoomView:236 whenDefined;
fix the 5 bare `el.graph =` sites for free (they become correct once the setter buffers).

## Appendix 2 (2026-06-12): systemic rb-object-item creation/listener audit — invariant validation

*PO ask: every creation path, 0x/2x listener risks, exactly-once + single-render-authority.
Audited POST-consolidation (v0.5.214).*

### Creation paths: 4 live, each item created by EXACTLY ONE path ✓
| Path | Mode | Style |
|---|---|---|
| nodeEl (tree L193) | graph (/trace) | `.data` setter ✓ |
| buildSeedNode (tree L251) | seed (/scenario) + items (room) | `.data` setter ✓ BUT adds per-item listener |
| rb-list-overview L94 | list | setAttribute (scalars only, no expander — OK per addendum rule) |
| rb-overview L47 | overview | template-string attrs (scalars only, no expander — OK) |
RoomView's 5th path (static template skeleton) was DELETED by consolidation — template now has
`<rb-trace-tree id="room-tree" data-mode="room">` and feeds `tree.items`. Data-down achieved.

### Listener wiring: one CONFIRMED 2x, one LATENT 2x, zero 0x
| Wiring | Verdict |
|---|---|
| item click delegate (connectedCallback, stable fn ref, removed on disconnect) | exactly-once ✓ (same-ref re-add is platform-deduped) |
| ViewBus subscribe (unsub on disconnect, re-bind on ref change) | exactly-once ✓ |
| dragstart on .oi-icon — wired INSIDE render() | **LATENT 2x**: safe only because render() reconstructs via innerHTML (old node dies with listener). The moment render goes update-in-place (R19.90 diff direction) this double-fires. Move to connectedCallback delegation on `this`. |
| **toggle-children** — per-item closure (buildSeedNode L266) AND tree-level onToggleChildren (L70) | **CONFIRMED 2x** in seed+items modes: event bubbles, BOTH run. Graph mode = tree-level only ✓ |
| 0x risks | none live (list/overview items never set has-children → no expander rendered) |
| whenDefined (RoomView:231) | DEAD GATE post-self-healing — delete |
| RoomView tree click listener (L201, file preview) | works, but still audit-B3 (Navigator seam bypass) |

### The 2x consequences (seed/items modes)
1. Dual display writes on same .tt-children (benign — same value).
2. **LS_KEY pollution (real defect)**: tree-level handler persists EVERY toggled ref into
   `rawbin-trace-expanded` (the /trace key) — room collection refs (`collection:members`) and
   /scenario seed refs leak into /trace expand state. buildSeedNode's closure writes the correct
   per-seed key; the tree-level write is the wrong-key duplicate.
3. Double scrollIntoView rAF (benign).
4. No double-fetch (tree-level skips fetch when .tt-children exists — by luck, not design).

### Invariant verdict
- **Exactly-once registration**: HOLDS for item-self listeners; **VIOLATED** for toggle-children
  in seed/items modes (architectural 2x — two handlers registered for one event type).
- **Single render authority**: HOLDS in graph mode; **VIOLATED** in seed/items — per-item closure
  AND tree handler both own .tt-children mutation; lazy-load state (loaded/branchPath/chainMethod)
  hides in closures, invisible to the component.

### Recommendation (architect design)
1. ONE toggle authority: tree-level onToggleChildren handles ALL modes. Replace per-item closures
   with component state `WeakMap<ttNode, {loaded, branchPath, chainMethod}>` populated by
   buildSeedNode. Delete the L266 per-item addEventListener.
2. Per-mode persist key inside the single handler (graph→LS_KEY, seed→scenarioExpandKey,
   items→none or per-room key). Kills the pollution.
3. Move dragstart wiring out of render() to connectedCallback (delegation via closest('.oi-icon')).
4. Delete RoomView:231 whenDefined.
5. (Carry-over B3) file-preview click → Navigator seam when touched next.

### Lint side-catch (skill-expert lane)
RoomView markers `dnd01002-...` (L81) + `dnd01003-...` (L96) are INVENTED NON-HEX uuids
('n' not hex) — invisible to scanner AND invalid. Replace with uuidgen-fresh via wireImplNode
when expert next touches RoomView.

## Appendix 3 (2026-06-12): collapse-state persistence trace — LS hypothesis REFUTED, real mechanism named

*PO ask: could stale/cross-mode LS cause first file item icon-only on accumulated device, expanded on fresh test?*

### Where each state lives (traced, exhaustive)
| State | Written by | Read by | LS? |
|---|---|---|---|
| `collapsed` (icon-only 40x40) | icon tap ONLY (rb-object-item onClickDelegate L104 toggleAttribute) | CSS `[collapsed]` rules | **NEVER persisted, NEVER restored** |
| `children-open` graph mode | tree onToggleChildren → this.expanded → persist(lsKey) | connectedCallback reads lsKey into this.expanded; nodeEl applies isOpen | yes: LS_KEY (/trace), 'rawbin-room-expanded' (room — expert's per-mode key, good) |
| `children-open` seed/items | per-item closure → toggleSeedExpanded('rawbin-scenario-expanded-<seed>') | **NOBODY — isSeedExpanded() defined, ZERO call sites** | write-only (half-dead persistence) |

### Verdict on the LS hypothesis: REFUTED for icon-only
No code path reads localStorage into `collapsed`. renderItems (room mode) never reads
this.expanded or isSeedExpanded — stored expand state CANNOT influence room item rendering
at all. A polluted LS entry can only affect /trace graph mode (children-open, not icon-collapse).

### The REAL mechanism for device-only + first-item icon-only
1. Icon tap = collapse toggle (T115) — and the icon is ALSO the drag handle (a6503fc4
   icon-only drag) and sits beside the tap-to-preview area. One accidental icon tap on the
   first file (the most-touched item) → `collapsed` set.
2. renderItems PATH-A (diff reuse) keeps that SAME DOM node alive across every
   FILE_ADDED/member update, and the data setter SETS attrs but NEVER REMOVES attrs absent
   from data → `collapsed` survives every re-render indefinitely.
3. Fresh test env: no tap history → expanded. DEVICE-ONLY ✓ FIRST-ITEM ✓ survives-updates ✓.
4. **Discriminating test**: does the symptom survive a page RELOAD? collapsed is DOM-only —
   reload clears it. Survives reload → different cause, escalate; gone after reload → confirmed.

### Two adjacent defects found during trace
- **D-A3a**: data setter one-way attribute application — `set data()` never clears stale
  attributes (collapsed, has-children, status…) on reused nodes. Diff-reuse made this live.
  Fix: setter diffs against previous data keys, removeAttribute for absent ones (EXCEPT
  user-interaction attrs like collapsed — decide policy explicitly).
- **D-A3b**: PATH-A root update sets `'has-children': cond ? '' : undefined` —
  setAttribute(k, undefined) coerces to the string "undefined" → attribute stays PRESENT
  when children drop to 0. Expander/badge ghost on emptied collections.
