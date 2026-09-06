# R40.81 — MODEL_STORE elimination migration (architect design, 2026-09-06)

Tron: *"FULL MIGRATION … AND NO REGRESSION"* + the refinement that **defines the target**: *"a model tree folder holding LINKS to the scenario index is VALID but NOT a second Index"* → **de-duplicate STORAGE, do not delete STRUCTURE.** ONE canonical owner of DATA, many legitimate VIEWS by reference. R40.81 = canonical home (R40.95 folded/tombstoned). **Design-only, no build until build-go.** Built on the committed measurement (`b72e18b35` + corrected `8d3f7e527`) and the two committed baselines. Migration **REFUSES to run without the snapshot** (guarded).

## Ground truth (measured, committed)
- MODEL_STORE = `data/model-store/index` (server.ts:122) — a genuinely separate shard tree of `.scenario.json`, **gitignored** (git cannot replay it).
- 784 units: **669 ONLY in MODEL_STORE** (relocate set) + **115 overlap, ALL BYTE-IDENTICAL, 0 divergent** (loss-free collapse, no which-wins).
- Hard gate **SATISFIED**: `test/baseline/model-store-premigration-v0.8.186.tar.gz` (702 real + 82 symlinks @ ca146c9b4) committed → reversibility floor. No-regression oracle **committed**: `1c46ad3aa` = 212 model-subtree read-path outputs (the runtime git can't replay).
- Blast radius ~67 refs (measurement §3): WRITERS (TsToModel.generate bulk, model folder create, diagram verbs, trace author, element hide/remove, FolderService.createPhysicalFolder via storeDir) + READERS (mofChildren(MODEL_STORE), trace-merge, the `isModelUnit?MODEL_STORE:scenario/index` fork @server.ts:3269/3525, usage-index.json).

## Target unit model (after)
- Every unit lives **exactly once in `scenario/index`**. No parallel unit-file store.
- The **model tree SURVIVES as folders-of-refs**: Folder units (`children[]` = refs) + the MOF/diagram/collection trees resolve BY LINK into the one index. A view holding refs is not a second owner.
- `isModelUnit(uuid)` survives ONLY as a **provenance predicate** (is this a generated model unit?) used to scope re-generate reset — **never** as a store-routing switch.
- Resettable re-generate preserved WITHOUT a second store: **replace-on-regen by deterministic key** in the one index (idempotent-in-place); "reset" = delete-by-generated-provenance + re-mint, not wipe-a-store.

## Migration mechanism — 3 ordered slices (each leaves the system WORKING; never breaks readers)
Order is deliberate: **unify data → repoint resolvers → retire the empty store.** Emptying the store before repointing would break every model read; repointing before relocating would 404. So relocate first (harmless temporary duplication), repoint second, retire last.

### SLICE 1 — DATA UNIFICATION (relocate 669 + collapse 115)
- **Relocate** the 669 MODEL_STORE-only units into `scenario/index` at their own uuid shard path — **byte-identical copy**, same uuid (no re-mint, no re-key). Idempotent: a uuid already present in scenario/index is skipped (the 115 overlap → skip, they're byte-identical).
- After Slice 1: all 784 uuids resolve in `scenario/index`. MODEL_STORE still physically holds its copies (harmless, still the live read path until Slice 2).
- **Dry-run FIRST with COUNTS**: `{ relocated, skipped-identical, divergent }`. **divergent MUST be 0** (measured; if the dry-run ever reports divergent>0 → ABORT, a unit changed since measurement → re-measure, never silently pick a copy).
- **Gate (INV-DATA):** after apply, every one of the 784 uuids resolves in scenario/index exactly once; count relocated==669, skipped==115, lost==0. Run on a **branch/scratch index copy** (R40.31 isolated, prod untouched); reversible via the snapshot tar. **stub-must-fail:** feed a divergent fixture → dry-run reports divergent≥1 and REFUSES apply.

### SLICE 2 — RESOLVER/WRITER REPOINT (collapse the second path)
- Flip every reader to `scenario/index`: `mofChildren` (2814/3210/3237), trace-merge (1660), and **★ the `isModelUnit?MODEL_STORE:scenario/index` fork (3269/3525) collapses to a single `scenario/index` resolution** — this fork IS the "second path" Tron named. `isModelUnit` is retained only as a provenance query for re-gen scoping.
- Flip every writer (generate 2835/2854, model folder create 3041-3043, diagram verbs, trace author, element hide/remove, `FolderService.createPhysicalFolder` storeDir) to mint into `scenario/index`.
- usage-index.json → derived from the one index (or dropped if re-derivable).
- After Slice 2: nothing reads/writes MODEL_STORE; the model tree resolves folders-of-refs from the one index.
- **Gate (INV-NO-REGRESSION):** the committed 212-ref baseline (`1c46ad3aa`) reproduces **byte-identical** — MOF tree, diagrams, trace-merge, detail resolution. **INV-RESETTABLE:** re-generate replaces its own generated set in-place by deterministic key, touches **0 authored units**, idempotent (re-run = identical). **stub-must-fail:** point a reader back at MODEL_STORE → baseline diff ≠ 0 (RED).

### SLICE 3 — RETIRE THE STORE (INV-NO-SECOND-INDEX)
- Empty/remove `data/model-store/index` + `usage-index.json`. `data/model-store` may survive only as a link/view structure (or gone entirely).
- **Gate (INV-NO-SECOND-INDEX):** `data/model-store/index` holds **0 unit files** AND **0 code paths** read/write unit files there (grep: no `new ScenarioIndex(MODEL_STORE)`, no `path.join(MODEL_STORE, …)` unit write). A recurrence guard (ci:gates, R40.88 family): a second unit-file index = build-RED. **stub-must-fail:** re-introduce one MODEL_STORE unit write → guard RED.

## NON-NEGOTIABLE invariants (each must be able to FAIL; R40.31 isolated; proven-red-now where applicable)
1. **NO DATA LOSS** — 784 uuids resolve in scenario/index post-migration; 0 lost (INV-DATA).
2. **NO REGRESSION** — 212-ref behavioural baseline byte-identical (INV-NO-REGRESSION); tester owns the oracle, committed BEFORE any build.
3. **ONE CANONICAL OWNER** — the isModelUnit store-fork is gone; no residual second read/write path (INV-NO-SECOND-INDEX).
4. **RESETTABLE PRESERVED** — re-generate is replace-in-place by deterministic key, idempotent, authored-units-untouched (INV-RESETTABLE).
5. **REVERSIBLE** — runs on a branch; the snapshot tar restores pre-migration MODEL_STORE; migration **refuses to run if the snapshot is absent** (hard guard).

## ★ CHOKEPOINT FLAGS (PIN — expert HOLDS for architect confirm; never approved by availability)
1. **The relocate/collapse writes go through `ScenarioIndex.put`.** Expert must NOT route through any auto-reuse/dedup mint helper — an explicit byte-identical relocate keyed on the source uuid, no re-mint, no re-key. HOLD for my confirm before the apply pass.
2. **The `isModelUnit` store-fork collapse touches the resolution chokepoint** (ensureViewUnit / detail resolution, server.ts:3269/3525) — the shared read path for ALL units. FLAG: do not redesign the resolver by availability; I confirm the collapsed single-owner resolution shape before the expert edits it.

## Schedule (reach empty, honest)
- **Slice 1 (data unification)** first on build-go — pure data, fully gated + reversible, no behaviour change (readers still on MODEL_STORE which is byte-identical). Lowest risk.
- **Slice 2 (repoint)** next — the behavioural slice; gated by the 212-ref baseline. Medium-high (the fork collapse).
- **Slice 3 (retire + guard)** last — only after Slice 2 proves the one index reproduces every read. Adds the recurrence guard.
- Each slice ships independently and is independently reversible. Tester commits/extends the baseline before Slice 2; req captures the requirement ACs (already R40.81) + the truthful invariants.

## R40.86 correction folded (measurement §5, do not re-entrench)
`Folder.acceptDrop` (Impl 4d4ac272) mints into **scenario/index** parented by ref — the MODEL_STORE blob-create path is RETRACTED. Post-migration there is no other store to mint into by construction, so this correction is consistent with the target.
