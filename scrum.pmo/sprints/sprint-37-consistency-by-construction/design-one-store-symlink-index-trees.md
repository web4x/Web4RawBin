# ONE store + symlink index trees (Tron directive, design-only)

**Author:** robbin-architect 2026-09-05. Tron (authorized, his words): "units can have ln links in redundant index trees so we can have a model tree folder but not a duplicate index." = DRY-to-storage: ONE physical store of unit files (scenario/index); every other index/view = a tree of SYMLINKS into it. NO second physical store of duplicate unit files. **Supersedes my R40.69 "two stores are legitimate" ruling** — Tron applies DRY stricter: the model-store's separateness is fine as an ARRANGEMENT (symlink tree), not as a second PHYSICAL store. No build; design only.

## ★ SEQUENCING ANSWER (asked first) — INDEPENDENT; ship the children-provider FIRST. Your instinct is RIGHT.
- The children-provider fix is CLIENT-side derivation: both surfaces fetch `/api/trace/children/<ref>` through one provider. It reads the API, never the store files.
- The server children resolver the provider calls reads **readdir (getRoomDir/files) + scenario/index** (`pidx = new ScenarioIndex(scenario/index)`, server.ts:3056) — it does NOT read MODEL_STORE. So the visible Tron symptom (folder invisible in the tree) has ZERO dependency on where unit files are stored.
- The store migration is SERVER-side storage (where writes land + symlink trees). It changes the physical location of unit files, not the client's `/api/trace/children` contract.
- ⇒ **No collision.** Ship the provider now (unblocks Tron's invisible folder), migrate the store after, on its own gated schedule. The expert can build the provider on the current store safely — the store moving underneath does not touch the client derivation. (Guard: the migration must keep `/api/trace/children` + `/api/ior` responses byte-stable — it's a storage move, not an API change.)

## Measured current state
- scenario/index = 5947 unit files (the canonical store). data/model-store/index = 777. 33 uuids exist as REAL FILES in BOTH (byte-identical now; no rule for divergence — the split already cost a fabricated root-cause today).
- The symlink pattern ALREADY works elsewhere: room files dirs hold symlinks INTO scenario/index (verified: `…/files/2bd2bdb0….scenario.json -> ../../../../../../scenario/index/2/b/d/2/b/2bd2bdb0….scenario.json`). So MODEL_STORE is the outlier, not the norm.

## Where MODEL_STORE is written today (the writers to redirect)
All under the "INV store-only: prod scenario/index NEVER touched" rationale (now retired by Tron):
1. **Folder units** — `FolderService.mintRealUnit`/`createPhysicalFolder` (FolderService.ts:80/109), `createFolder` (server.ts:1272). (Room Trash 3e041bff came here.)
2. **Lazy VIEW units** — `ensureViewUnit`/ensureFolderFileUnit (server.ts:1365/1369): dir:→Folder, file:→File, puml-src:→PumlArtifact, project:→Project, roomcoll:→Folder — derived from a ref on access.
3. **Authored UmlTraceRelationship** units (server.ts:1289).
4. **generate-project** M1 units (generate-project.ts, MODEL_STORE-only).
5. Diagram/create + newElement (model view ops).
`MODEL_STORE = data/model-store/index` (server.ts:123); reads via `new ScenarioIndex(MODEL_STORE)` / mofChildren.

## What changes → one store
- **Writers land in scenario/index** (the one physical store). Retire the "prod-untouched" isolation (Tron's call).
- **What becomes a SYMLINK tree:** any redundant index/view arrangement (a "model tree folder") = a tree of symlinks into scenario/index — exactly the room-files pattern. `data/model-store/index` is eliminated as a store; if a distinct model-tree arrangement is still wanted it becomes a symlink tree, not duplicate files.
- The mint/read helpers point at ONE `INDEX_ROOT` (scenario/index); `ScenarioIndex(MODEL_STORE)` reads collapse to `ScenarioIndex(scenario/index)`.

## Migration (gated dry-run+count, R40.31; NO active loss)
- **The 33 byte-identical duplicates:** scenario/index is canonical → delete the MODEL_STORE copy (or replace with a symlink). Gate: assert byte-diff==0 per pair BEFORE removing (they agree now; the gate catches a future divergence = data loss). This is the R40.69 33-dedup, now executed.
- **The 744 MODEL_STORE-only units** — classify each (dry-run count by class):
  - **RE-MINTABLE lazy view units** (ensureViewUnit dir:/file:/puml-src:/project: derived): do NOT copy — they re-generate into scenario/index on next access once writers redirect (or a one-shot re-gen). Verify re-mintability per unit (has a deriving ref).
  - **PERSISTED / authored units** (room folders like 3e041bff, UmlTraceRelationships, generate-project M1 that aren't ref-derivable): MOVE the file into scenario/index (same uuid/shard). 
  - INV: distinct-uuid count across BOTH stores conserved (0 lost); every unit still resolves by uuid after.
- **Then eliminate `data/model-store/index`** — assert 0 non-symlink files remain; the model tree (if any) is symlinks.
- **INV-T:** `/api/trace/children` + `/api/ior` responses byte-stable before/after (storage move, not an API change) — this is what keeps the migration independent of the client provider fix.

## Handoff
req mints the store-consolidation req + ACs (one-store / symlink-trees-only / 33-dedup / 744-classify-move / API-byte-stable). planner stands up the gated migration task. expert builds AFTER the children-provider ships. I backstop (byte-diff==0 dedup, re-mintable-vs-move classification, API-byte-stable, 0-active-loss) + the symlink-tree invariant. Ship order: children-provider → store migration.
