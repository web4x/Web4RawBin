# MODEL_STORE elimination — MEASUREMENT (architect, 2026-09-06)

Tron: *"FULL MIGRATION… AND NO REGRESSION!!!!"* — eliminate MODEL_STORE, one store only (scenario/index), everything a scenario unit. **Measurement committed BEFORE the design (PO care-cut; design done fresh post-cut).** This is measured, not asserted.

## (1) What MODEL_STORE IS today — a GENUINELY SEPARATE STORE, not a façade
`server.ts:122  const MODEL_STORE = path.join(__dirname, '../../../data/model-store/index')` — a real, physically separate directory (`data/model-store/index`), distinct from prod `scenario/index`. Reads/writes go to that dir via `new ScenarioIndex(MODEL_STORE)` and direct `path.join(MODEL_STORE, ...)` file writes. NOT an index/view over the same files — its own shard tree of `.scenario.json` files. Also a sidecar `data/model-store/usage-index.json` (server.ts:1544).

## (2) 784 units in MODEL_STORE = **669 ONLY there + 115 overlap (BYTE-IDENTICAL)** ★ CORRECTED + DE-RISKED
784 total by type: ModelElement 661, Folder 86, File 19, Diagram 6, PumlArtifact 6, Project 3, UmlTraceRelationship 3. **★ I originally ASSERTED "none is in scenario/index" WITHOUT cross-checking — WRONG. Measured cross-check (scenario/index = 6111 units):**
- **669 live ONLY in MODEL_STORE** → must RELOCATE into scenario/index (the data-loss-risk set).
- **115 OVERLAP** (same uuid present in both stores) — and **all 115 are BYTE-IDENTICAL** (0 divergent). → collapsing them to one copy is **LOSS-FREE, no "which copy wins" conflict**. Dropping the MODEL_STORE duplicate loses nothing.
- **0 DIVERGENT overlaps** = the de-dup is clean; no conflict-resolution step needed. Big de-risk.
(The File=19 + Folder=86 are the model-collection folders/files — the R40.86 surface.)

## (2b) TARGET STATE (Tron clarification 2026-09-06) — DE-DUP STORAGE, not delete STRUCTURE
FORBIDDEN = a SECOND INDEX (units stored twice / a parallel store of unit files). VALID = a MODEL TREE of folders holding LINKS/REFS into the ONE scenario index (structure-by-reference is fine; a view holding refs is NOT a second owner). So the migration is a **de-duplication of storage, not a deletion of the model tree**: (1) every unit lives EXACTLY ONCE in scenario/index (relocate the 669, collapse the 115 to one copy); (2) the model tree SURVIVES as folders-of-refs (MOF tree / diagrams / collections keep working, resolved BY LINK); (3) `data/model-store` stops being an INDEX of units → becomes a link/view structure or is derived from refs; (4) mofChildren / isModelUnit-fork / trace-merge stop forking on WHICH store, resolve from the one index. Same shape as everything: ONE canonical owner of DATA, many VIEWS by reference. Resettability EASIER: re-generate replaces units in the ONE index by deterministic key (idempotent-in-place), the link-tree is derived/rebuilt from refs — nothing to wipe.

## (3) BLAST RADIUS (~67 src refs; all in src/ts/server/server.ts unless noted)
**WHY it exists (server.ts:52, deliberate):** *"generate writes ONLY here; model reads reroute here; trace reads stay prod; store is RESETTABLE; prod scenario/index NEVER touched."* The isolation's SOLE purpose is a **resettable re-generate** (re-run TsToModel without clobbering prod). That is the only property unification must preserve — achievable in one store via replace-on-regen by deterministic key.

**WRITERS (mint ONLY into MODEL_STORE):**
- Model GENERATION — `TsToModel.generate` / `generateProjectModel` (server.ts:2835, 2854) — the BULK: 661 ModelElement + 3 Project + 6 PumlArtifact.
- Model FOLDER create (server.ts:3041-3043: `createPhysicalWithUnit` / `mintRealUnit`) — 86 Folder.
- Diagram add-view / move-view / zoom / create (server.ts:2876, 2967, 2992, 3012) — 6 Diagram.
- Trace author UmlTraceRelationship (server.ts:1288, 3106) — 3.
- Element hide / remove (server.ts:1476, 1488).
- `FolderService.createPhysicalFolder` writes via its `storeDir` arg = MODEL_STORE when called from the model path (FolderService.ts:105).

**READERS / resolve-through paths:**
- `mofChildren(new ScenarioIndex(MODEL_STORE))` — the /model MOF tree (server.ts:2814, 3210, 3237).
- Trace merge — merges the M1 counterpart from MODEL_STORE into the trace view (server.ts:1660).
- `isModelUnit(uuid) ? MODEL_STORE : scenario/index` — the routing fork in ensureViewUnit / detail resolution (server.ts:3269, 3525). ★ This fork IS the "second path" that must collapse to one canonical owner.
- Usage-index (server.ts:1538, 1544 → `data/model-store/usage-index.json`).
- generate-project INV comments (generate-project.ts:8), file-unit.ts:38 (notes a retired MODEL_STORE folder mint).

## FOR THE DESIGN (post-cut — NOT decided here)
Deferred to the fresh design: (3-model) the unit model after migration (Folder=unit, File=unit, parent-by-ref, so `Folder implements DropTarget` mints into the ONE store); (4) the migration mechanism — data-move vs re-parent vs re-derive; idempotent; REVERSIBLE on Tron's live data; what happens to units that exist in both stores; how re-generate stays resettable in one store (replace-on-regen by deterministic key); collapsing the `isModelUnit?MODEL_STORE:scenario/index` fork to one canonical owner. NON-NEGOTIABLES: NO DATA LOSS (784 units — Tron's real data), NO REGRESSION (tester pre-migration baseline must be committed first), ONE canonical storage owner after (no residual second path).

## R40.86 immediate correction (already flagged to PO)
Retract the "build a MODEL_STORE blob-create path" — that ENTRENCHED the second store (my error compounding). Folder.acceptDrop mints a scenario unit in **scenario/index** parented by ref. The wired Impl 4d4ac272 description must drop the MODEL_STORE build item (design correction, post-cut).
