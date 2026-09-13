# Synthetic-ref / DnD-unify — every tree node must BE a scenario unit (robbin-architect, 2026-09-13)

Tron: "T37.20xx is ALL ABOUT UNIFYING DND TO SCENARIO UNIT JSONS ON ALL UNITS." Defect: in the Model-Driven Code Quality tree, `MessageTypes.ts` renders with a FOLDER icon, drags as a folder, detail = "COLLECTION / scenario". Radical-OOP violation: `collection:file:src/shared/MessageTypes.ts` is a path wearing a ref's clothes, not a File instance. PO routed TOP, by-construction, scenario-first, design-only → expert. T37.20 pulled back to In-Progress (AC-A1 fails on his device).

## ★ ROOT — measured, and it REFINES the mint-vs-resolve framing (citation)
The resolve-on-read path **already produces the real class**: `ensureViewUnit` (server.ts:1554-1567) maps `file:<rel>` → a genuine **`ior:class:File`** unit (name/location/sourceFile/ext populated) and `dir:<rel>` → **`ior:class:Folder`**, uuid = `keyToUuid('file::'+rel)` (deterministic, idempotent). `resolveRefUnit` (synthetic-ref.ts) returns that FULL unit JSON. `rb-detail-base:60` already resolves through it.

So the node CAN already become a real File at the boundary. Why does it render/drag as a collection? Because the **tree render and the DnD payload use the raw `MofNode`, not the resolved unit**:
- `mofFolder(...)` defaults `type='collection'` (server.ts:1456) → a FILE node is emitted with `type:'collection'` and a **double-prefixed ref** `collection:file:src/…`. The render reads `type` → folder icon; the DnD reads the raw ref/type → drags as a collection; the detail path only works because `resolveRefUnit` **compensates** by stripping the outer `collection:` (synthetic-ref.ts:28-30, flagged "KNOWN-COMPENSATED … NOT fixed at source — a future tree cleanup; not now"). **Now it's the fix.**
- Net: one root (node emitted as a collection-typed string that is never materialized to its real class for render/drag) surfacing in three places (icon, drag payload, detail). **Do not fix three things** — fix the node's type-at-source + route DnD through the resolver.

## ★ THE SHAPE DECISION (R12 — state both, PO takes to Tron; I do NOT infer)
The model/shape question: should a code-tree node's scenario unit be **MINTED (persisted)** or **RESOLVED-on-read (computed at the boundary)**? Measurement shows resolve-on-read **already exists and already yields the real File/Folder class** — so this is less "build one" than "ratify the existing shape vs change it."

**Option A — RESOLVE-on-read (lazy; the CURRENT mechanism; my measured lean).**
The node keeps a synthetic ref for addressing; at the object boundary (drag, detail, icon) it materializes to the real File/Folder via `ensureViewUnit` (deterministic uuid). Tron's law holds AT THE BOUNDARY: `resolveRefUnit` yields a genuine `ior:class:File` instance — the synthetic string is its ADDRESS, exactly as a uuid is an address.
- COSTS: `ensureViewUnit` must be correct+complete (it is, for file:/dir:) and ideally cached; every render/drag/detail must go THROUGH the resolver (the fix enforces this); no persisted copy.
- BENEFITS: **no staleness** (computed from live disk — a changed/added/deleted src file reflects immediately; no regen job), **no bloat** (the code tree is thousands of files — not materialized into the index), mechanism already built. Avoids re-introducing exactly the persisted-copy-drifts-from-truth problem R40.81 just spent a sprint deleting.

**Option B — MINT (persist each code-tree node as a stored File/Folder unit in prod scenario/index).**
- COSTS: **bloat** (thousands of src files+dirs → stored units), **staleness** (code changes → stored units drift from disk → needs a sync/regen job + a drift gate — the model-store drift class), migration of the existing tree.
- BENEFITS: uniformity (the node IS a persisted unit, DnD trivially reads stored JSON, no boundary resolution); a strict reading of "A FILE IS A FILE CLASS" as "there must be a persisted File unit."
- NOTE: `keyToUuid` is deterministic, so A and B share the SAME identity — B is A plus persistence. B does not make the node "more real" at the object boundary; it only pre-persists it.

**My measured recommendation: Option A (resolve-on-read).** It satisfies AC-A1/A2 (below) by materializing the real class at the boundary, it is the existing mechanism, and it avoids the staleness/bloat of persisting a live-changing code tree. But this re-shapes Tron's model either way — **PO decides with Tron; I present both.**

## THE FIX (makes AC-A1/A2 pass under EITHER shape)
1. **Type-at-source** (low-blast, the icon/detail symptom): `mofChildren`/`mofFolder` emit the CORRECT per-node type — a file node as `type:'file'` with ref `file:<rel>` (NOT `type:'collection'` / `collection:file:…`), a dir as `folder`. Kill the double-prefix at source; retire the resolver's `collection:`-strip compensation (synthetic-ref.ts:30) once source is clean. → file icon + File-class detail, no three-way compensation.
2. **DnD payload = the resolved unit JSON (AC-A2 "in ALL cases")**: the drag serializer resolves `node.ref` via `resolveRefUnit` → carries the real File/Folder unit JSON (for synthetic nodes too, since ensureViewUnit materializes them). A ref that resolves to null **fails loud** (no empty/string payload) — never drag a path-string.

## BLAST RADIUS (a fix that strands another consumer is not a fix)
- `resolveRefUnit` (synthetic-ref.ts) — the SOLE synthetic parser, grep-lint-enforced; keep it sole; the type-at-source fix lets its `collection:`-strip retire.
- `rb-detail-base:60` (resolves via it — unaffected, improves).
- `FolderService.ts:49-50` — fails-closed on a `collection:`-wrapped synthetic + strips the display prefix; if source stops emitting `collection:file:`, verify FolderService still fails-closed correctly on genuine room-collections (its real purpose) and isn't newly stranded.
- `universal-actions.ts:110` — peels a leading display-type wrapper (`folder:/collection:`) for add-folder; adjust to the corrected types.
- `RoomView.ts:406` — filters children by `type==='collection'` for folders; must treat `type:'folder'` consistently after the source fix.
- `mofFolder`/`mofChildren`/`ensureViewUnit` (server) — the type source + the resolver; `live-bridge.ts:24`; `rb-trace-tree`.
- ★ **POST-R40.81 — MEASURED, flag WITHDRAWN (not the defect I first feared):** `ensureViewUnit` (server.ts:1610-1615) writes via `ModelStoreLocator.modelDir()` — the R40.81 **coupling** (flag-resolved, single-owner of read+write), NOT a hardcoded dead path. `modelDir()` DEFAULT = `MODEL_STORE` (server.ts:140), which **exists on disk** and is FROZEN/behaviour-preserving per the code's own comment (server.ts:134-135: *"model-store is NOT deleted in the coupling step; deletion is a later step"*). So Shape A is safe here: ensureViewUnit's lazy-mint rides the SAME `ModelStoreLocator`, so when the flip (→scenario-index) + deletion eventually land, its writes move ATOMICALLY with reads — no special Shape-A handling. ★ But this CONTRADICTS the reported closure ("model-store DELETED ca0b4dd98 / flip v0.8.198 / arc closed"): HEAD code + disk say model-store is the frozen DEFAULT, NOT deleted, deletion is a LATER step. Disk/HEAD wins → flagged to PO (owns R40.81) to reconcile whether the deletion/flip was rolled back or "closed" meant the coupling step. Not a blocker for Shape A (the coupling protects it either way).

## FAILABLE BITE (required)
A `file:src/shared/MessageTypes.ts` node: (a) renders with a FILE icon (not folder); (b) its DnD payload is a scenario unit JSON with `ior:class:File` (AC-A2); (c) detail resolves to the File class (not "collection"). Remove the type-at-source fix → **RED** (reverts to collection, Tron's exact defect). Plus: EVERY node's DnD payload is a unit JSON or a loud failure — a node resolving to null must not drag a string.

## Scenario-first / chain
This IS T37.20 (AC-A1 a file drags as a file; AC-A2 DnD payload = scenario unit JSON in ALL cases) + the code-tree synthetic-ref model. req mints/updates the T37.20 AC set + a UC for the type-at-source + DnD-via-resolver fix; I wire/backstop on build. Fix ships first (AC-A1 fails on Tron's device now); chain attaches to shipped reality.
