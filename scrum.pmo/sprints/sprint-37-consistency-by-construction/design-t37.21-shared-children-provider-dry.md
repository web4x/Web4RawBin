# T37.21 — SHARED children-provider (Tron DRY: sunburst + tree from ONE source)

**Author:** robbin-architect 2026-09-05. Tron root (v0.8.170): added folder "Trash" → appears in the sunburst, NOT in the items-tree. His words: "how is this not ONE DRY method on class Folder." Ruled: two divergent CLIENT derivation lifecycles over the SAME server source. Fix = one shared children-provider both surfaces derive from. NOT a tree-only patch. Push-freeze: local commit + served deploy.

## MEASURED root (not a missing unit — both-or-neither is INTACT)
- The Trash **dir** exists (`data/users/8f74dfba/rooms/3231db71/files/Trash`) AND the Trash **unit** exists in **MODEL_STORE** (`data/model-store/index/…/3e041bff`, `location: roomcoll:3231db71:files/Trash`). mkdir+mint both ran. (The "no unit" alarm was a scenario/index grep of the wrong store — folder units live in model-store.)
- **Both surfaces read the SAME server source** `/api/trace/children/<ref>` (the roomcoll resolver, server.ts:3055-3089, readdir's the physical subdirs incl Trash, unconditional of mode).
- **The divergence is two CLIENT derivation lifecycles:**
  - **DETAIL/SUNBURST** (`rb-detail-view.ts:79`): `fetch('/api/trace/children/'+uuid)` on EVERY detail-open → FRESH → shows Trash.
  - **TREE** (`rb-trace-tree`): renders children from the INLINE SEED captured at initial room-tree load (`buildSeedNode`, gk=child.children, :144) — captured BEFORE Trash — then relies on a SEPARATE live-update `reDeriveDirectChildren` (:132, re-fetches the same endpoint on a unit-changed) to add new children. When that live-update doesn't fire → the tree keeps the stale seed → no Trash.
- So it is NOT two server sources; it is one source read by two independent client paths, one of which (the tree) has a staleness window the detail lacks.

## THE FIX — ONE shared children-provider (correct-by-construction DRY)
New `src/public/ts/trace/children-provider.ts` — the SINGLE place any surface derives a ref's direct children:
- `getChildren(ref): Promise<TreeNode[]>` — fetch `/api/trace/children/<ref>` (the ONE source), memoised per ref.
- `subscribeChildren(ref, cb): () => void` — cb fires whenever ref's children change.
- `invalidateChildren(ref)` — drop the cache entry, re-fetch, notify all subscribers.
**Wiring (retire the divergent paths):**
1. **live-bridge:** a `unit-changed` frame for `ref` → `invalidateChildren(ref)` — the ONE invalidation point (replaces the tree's per-node reDeriveDirectChildren re-fetch AND is the single live signal).
2. **Tree node:** children = `getChildren(ref)`; `subscribeChildren(ref, () => reconcile-my-child-list)`. RETIRE the inline-seed-only render + the standalone reDeriveDirectChildren fetch. The seed may still paint first-frame, but the node's truth becomes the provider.
3. **Detail/sunburst:** children = `getChildren(ref)`; `subscribeChildren(ref, () => re-render sunburst)`. The detail's fetch-on-open goes THROUGH the provider (shares the cache).
**Result:** one source, one cache, one invalidation → the tree and the detail **cannot diverge by construction**. A new folder invalidates once → both re-read → both show it. That is Tron's "ONE DRY method": a folder in the sunburst appears in the tree by construction.

## Why this beats a tree-only patch
Fixing only `reDeriveDirectChildren` (making the tree's separate live-update fire) leaves TWO independent derivations that happen to agree today — the exact "we keep fixing one path while the other stays broken" trap Tron named. The provider makes agreement structural, not maintained.

## Branch-A discriminator (still runs — confirms the live signal reaches)
Even the provider needs its `invalidateChildren(ref)` to fire on the change. Expert: `console.log` the ref at the top of `reDeriveDirectChildren` (today's live-update) — one room add-folder: NEVER logs = the unit-changed frame isn't reaching the tree's subscriber (frame-not-delivered / never-subscribed) → the provider's invalidation would miss too, so ALSO verify the live-bridge → invalidateChildren path fires. Logs with the right ref but no insert = the re-derive fired but the render/merge dropped it. This tells us whether the fix is "wire the provider invalidation to the frame" vs "the frame itself isn't arriving."

## Gate / backstop (mine)
Both surfaces @390 real-WebKit: add a folder → it appears in the TREE and the SUNBURST in the SAME action, no reload, both browsers. Assert ONE fetch of `/api/trace/children/<ref>` serves both (shared provider, not two fetches diverging). Isolated scratch (R40.31); stub-must-fail (seed a stale tree + a fresh detail → the gate must RED if they disagree). Server source unchanged (readdir already lists subdirs); the fix is client-only DRY.
