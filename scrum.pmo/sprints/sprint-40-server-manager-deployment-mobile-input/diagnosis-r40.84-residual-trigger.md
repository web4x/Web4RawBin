# R40.84 residual-trigger diagnosis (architect, 2026-09-05) — r4023 still RED 4/4 on HEAD d9eddfce5

PO handed me the residual: the re-seed delete (my e0b8cb582) was necessary-but-NOT-sufficient; a residual full-rebuild still collapses the tree on **folder-add** (r4023, room `#room-tree` data-seed-ior, @390). Tester eliminated: RoomView FILE_ADDED / seed-tree-'graph'-sub / rb-model-resynced.

## What I MEASURED (client render surface — every path traced, dist excluded)
I traced **every** `render()` / `renderSeed()` / re-seed trigger on both the tree and its room container. **None fires on a room folder-add as the code stands:**
- **`reDeriveDirectChildren`** (rb-trace-tree.ts:133) — the in-place mechanism — is CORRECT: appends only NEW children (reconcile by ref-set), never rebuilds/removes existing, `computeBadges()`. No collapse. ✓
- **`rb-tree-reveal` → `onTreeReveal` → `revealModelElement` → `expandPath`** (folder-add-specific: only `handleAddFolder` dispatches it) — `expandPath` (:70) only toggles found nodes open and `break`s if absent; `highlightNode` (:600) is scrollIntoView + a CSS flash. **No re-seed.** (This was my first hypothesis — measured FALSE, not handed to expert.)
- **`onHashChange`** (:609) — needs a `#…uuid=<36hex>` hash; folder-add sets no hash. Ruled out.
- **graph-sub `ViewBus.subscribe('graph', render)`** (:108) — GUARDED to `!data-seed-ior` trees; the room tree IS `data-seed-ior` (RoomView:181) so it never subscribes. Consistent with tester's elimination.
- **`onModelResynced`** (:182) — tester-eliminated.
- **RoomView container `render()`** (innerHTML wipe + fresh `<rb-trace-tree data-seed-ior>` → renderSeed) fires ONLY on MSG.ROOM_JOINED (:60) / ROOM_CONFIG_UPDATED (:71) / show() (:134). **NOT on FILE_ADDED** (my delete left no render there) and not on any folder event.
- **key match** (R37.12 one-builder-both-sides): server publishes `publishUnitChanged('ior:class:Folder','roomcoll:<id>:files…')` (server.ts:2553); live-bridge:21 keys a synthetic uuid on the ref STRING (`viewBusKey(ref)`), and the node subscribes with `viewBusKey(uuid)` (:442) — designed to match by construction.

**Conclusion: no statically-visible path re-seeds on folder-add.** The collapse is real (test proves it) but not explained by any render trigger I can read. Handing a guess here is exactly the R40.85 trap (my first guess was wrong). So the next step is a runtime instrument that names the actual caller — not another hypothesis.

## The decisive instrument (hand to expert/tester — zero-guess)
Add TWO temporary `console.trace` probes and re-run r4023 with console capture:
1. `renderSeed(rawUuid)` top (rb-trace-tree.ts:386): `console.trace('[r4023] renderSeed', rawUuid)`
2. `render()` top (:300): `console.trace('[r4023] render')`
3. (optional) `reDeriveDirectChildren` top (:133): `console.log('[r4023] reDerive', ref)`

**Read the captured stack — it discriminates the two failure families deterministically:**
- **If renderSeed/render FIRES on Add-folder** → the stack names the exact caller I couldn't see statically (a path outside these files, or an event I haven't mapped). Fix that caller to route through `reDeriveDirectChildren` instead. 
- **If renderSeed/render NEVER fires** (trace silent) → it is NOT a re-seed at all. Then the "collapse" is `reDeriveDirectChildren` running on the WRONG node (the ROOT/seed node instead of the Files node) OR the publish key resolving to the root — i.e. the whole subtree's children get re-derived and deep-expanded descendants are dropped. The `[r4023] reDerive` probe's `ref` argument proves which node it fires on (expect `roomcoll:<id>:files…`; a bare room-uuid = wrong-node bug).

This is one cheap instrumented run that converts "I can't find it" into the exact call site — the honest measure-don't-theorise path. I'll take the captured stack and hand the expert the precise one-line fix.

## Handoff
Expert (or tester in the r4023 harness): add the 3 probes, re-run r4023 @390, paste the `[r4023]` console lines + stacks. I convert that to the exact fix immediately. R40.87/R40.88 backstops stay queued behind this. No chokepoint involved.
