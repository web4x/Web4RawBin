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

## ★ ROOT FOUND (2026-09-05, via sourcemap map of 310:7277) — STALE BUILD, not a code trigger
The tester's decisive stack pointed at `app-T63M63I4.js:310:7277` (a client.on WS-emit handler). Mapped it by reading the minified bundle at that offset:
```
this.client.on(b.FILE_ADDED, i=>{ if(this.roomId!==i.roomId)return;
  let r=document.getElementById("room-tree"); r?.renderSeed && r.renderSeed(this.roomId),   // ← THE COLLAPSE
  this.chatSheet?.addMessage("system","System",`File uploaded: ${i.name}`) })
```
The **served bundle's FILE_ADDED handler STILL calls `r.renderSeed(this.roomId)`** — but the **current SOURCE (RoomView.ts:82-88) has it REMOVED** (my R40.84 fix; only the chat message remains). Verified:
- Source `grep renderSeed RoomView.ts` = ONLY :84 (comment) + :214 (federation drag-drop). NOT in FILE_ADDED. ✓
- `git show --stat e0b8cb582` = **0 `public/dist` files** — the R40.84 fix (source delete, landed d9eddfce5) changed SOURCE ONLY, never rebuilt the client dist.
- `git log -- src/public/dist/app-T63M63I4.js` last build = **04f0e517c**, an ANCESTOR of d9eddfce5. So the committed/served bundle predates the source fix = STALE.
- folder-add emits `FILE_ADDED` (a room folder is a file-unit) → the stale handler's `renderSeed(roomId)` fires → full root re-seed → collapse. `reDeriveDirectChildren` never fires because the re-seed rebuilds the whole tree first.

**Severity:** the R40.84 fix NEVER DEPLOYED — prod v0.8.176 serves this same stale bundle, so the re-seed clobber is still LIVE in prod, not just in the gate.

## THE FIX (hand to expert — NO source change, source is already correct)
1. **REBUILD the client dist from HEAD source** (`npm run build` / the esbuild client bundle) — this removes the FILE_ADDED `renderSeed` BY CONSTRUCTION (source has no such call). New content-hash filename replaces app-T63M63I4.js.
2. **Verify the new bundle**: grep it for `FILE_ADDED` — the handler must have NO `renderSeed`; folder-add then rides the LIVE path (server `publishUnitChanged(Files-ref, 2553)` → per-node ViewBus sub → `reDeriveDirectChildren` in-place, R40.86/8693dc2b).
3. **Commit the dist ATOMICALLY** with the version bump (served==committed==source, R31.7) + **DEPLOY + boot-check**. Revert the 3 temp probes in the SAME commit. ★ **DEPLOY-GO: FULL (PO 2026-09-05, hold LIFTED).** The brief deploy-hold was withdrawn — shipping a fix to Tron's OWN live defect is the team's job, not a customer approval gate. Expert has full build+deploy+boot-check.
4. **Tester**: r4023 goes GREEN once served==source. NOTE a harness gap the tester found — r4023's `buildDist` served the STALE COMMITTED bundle despite ARM_BUILD=1 (it did not rebuild the app bundle); the gate was testing committed-dist, not source. Fix the harness to rebuild (else a stale committed dist hides a real source-vs-served drift) — this is why the "necessary-but-not-sufficient" fix looked residual: the gate never saw the source fix.

**No chokepoint. No new code.** The delegate-to-reDeriveDirectChildren the expert asked about is ALREADY the source behavior; the bug was purely that it was never built+shipped.

## R40.84-B (invisible added folders, v0.8.177 — collapse fixed, new folder does not render)
PO: removing the re-seed removed the child-refresh; the in-place reDerive never renders the new child. I traced the FULL folder-add live path — **every link is correct, there is NO missing wire:**
- server room folder POST: `createFileUnit` (server.ts:2544) links the Folder unit into `room.files[]` (MUST — the re-seed showed it, and re-seed reads the same units), then `publishUnitChanged('ior:class:Folder','roomcoll:<id>:files')` (2553).
- `publishUnitChanged` (190) sends `{type:'unit-changed', ior, uuid:'roomcoll:<id>:files'}` to all ws clients.
- live-bridge (21): synthetic uuid → `viewBusKey('roomcoll:<id>:files')`.
- the Files node is built with uuid `roomcoll:<id>:files` (server.ts:3259) and subscribes at rb-trace-tree.ts:442 `ViewBus.subscribe(viewBusKey(uuid), ()=>reDeriveDirectChildren(node,uuid))` — **key matches the publish by construction.**
- lazy-expand (`fetchAndRenderChildren`, onToggleChildren) renders INTO the Files node's kids without rebuilding it → the :442 subscription survives.
- `reDeriveDirectChildren` (133) fetches `/api/trace/children/roomcoll:<id>:files` → the roomcoll branch (3164) → `roomFilesChildren` (1393), which RETURNS the new folder (direct-child-by-location filter confirmed) with `Cache-Control: no-cache` (3165, fresh) → appends any child not in `existing`.

**Conclusion: the mechanism the PO/expert want is ALREADY the code. No wiring change is correct here — the bug is that reDerive doesn't FIRE or doesn't APPEND at runtime, which a static read cannot resolve and a guess would only churn correct code.** (Same lesson that just paid off twice: measure, don't ship a guess.)

### The decisive probe (tester's proven prototype-wrap harness — one run names it)
Wrap `reDeriveDirectChildren` (and log inside it) on folder-add, capture:
1. **Does it FIRE?** (log `ref` on entry). If NEVER → subscription/key bug: log the runtime Files-node `uuid` actually subscribed vs the publish `msg.uuid` (a display-prefix like `folder:roomcoll:…` on one side = viewBusKey mismatch).
2. If it fires, **`data.children`** — does it contain the new folder? If NO → server read-after-write: the Folder isn't in `room.files[]` at fetch time (ordering: publish before the files[] link commits) → fix = link-then-publish ordering.
3. If `data.children` HAS it, **`existing`** set + the child `cref` — is the new folder's `cref` (`${type}:${uuid}`=`collection:roomcoll:<id>:files/<name>`) wrongly already in `existing` (blocking the append), or does buildSeedNode's itemRef differ from the `existing` `ref` attribute (reconcile-key mismatch) → fix = align the cref/itemRef key.
4. If appended, is `kids` the LIVE visible container (not collapsed/detached)?

Each branch has a pre-identified ONE-LINE fix; the probe picks the branch deterministically. Then I hand the expert that exact line. MAX PRIORITY; probe is minutes.
