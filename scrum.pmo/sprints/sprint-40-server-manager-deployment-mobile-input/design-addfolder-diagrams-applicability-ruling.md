# Add-folder on a collection (diagrams) fails bad-parent-loc — architect RULING (2026-09-05)

PO-dispatched (Tron reported repeatedly → the survival is as important as the bug). **Design-only, commit path-limited.** Ruling for robbin-po; expert implements on build-go.

## Measured root (source, dist excluded)
- `action-applicability.ts:33` — add-folder is **CLASS-KEYED**: `{ verb:'add-folder', appliesTo:{ classes:['Folder'] } }`. The `diagrams` collection is `ior:class:Folder` → the verb IS offered (correctly, per the T37.21 universal ruling).
- The MODEL endpoint routes add-folder to `FolderService.createPhysicalWithUnit` → `resolveFolderRefToDir(parentRawRef)` (FolderService.ts:54). That resolver maps **only** `dir:*` and `rawbin:ts→src`; it returns `''` for **everything else** — `project:`, `file:`, `roomcoll:`, a bare collection ref, and **the `diagrams` collection**. `''` → `createPhysicalWithUnit` returns `bad-parent-loc` (FolderService.ts:138).
- `action-applicability.ts:31` comment: *"folder-create fail-closes server-side (bad-parent-loc) for a genuinely non-physical parent, so an offer on a virtual bucket is harmless."* — **this is the rationalisation that let it survive.**
- **Two create paths already exist:** `mintRealUnit(storeDir,name,parent,kind:'folder'|'diagrams')` (FolderService.ts:72) mints a **store-only model Folder UNIT** — no physical dir, MODEL_STORE only, prod untouched (comment: *"'Physical' = a REAL PERSISTED unit (Tron); the shard mkdir is … not a user directory"*). `createPhysicalFolder` (FolderService.ts:98) does a real `mkdir` and needs a physical parent.

## THE RULING

### 1. Which of the three — offer-not / truthful-applicability / must-succeed?
**Neither "don't offer" nor "fail-closed is fine." The verb MUST SUCCEED on `diagrams`, via the MODEL, and applicability must be MODEL-DERIVED so it is offered exactly where the model can parent a child.**

- **Not option-1 (suppress the verb on diagrams).** `diagrams` is a real collection a user legitimately adds a folder to; suppressing add-folder there re-introduces the "sometimes a button" behaviour Tron **explicitly rejected** in the T37.21 universal-add-folder ruling. Wrong direction.
- **Option-3, but through the model (not a filesystem mkdir).** A `Folder` unit is a **model object**, not inherently a directory. The create on a virtual collection must go through **`mintRealUnit`** — a store-only child Folder unit whose `parent` = the diagrams collection ref. That path needs **no physical parent dir**, so it succeeds by construction. The physical `mkdir` path (`createPhysicalFolder`) is only for refs that ARE real repo dirs (`rawbin:ts→src`, `dir:*`).
- **The defect is the ROUTING, not the resolver.** The MODEL endpoint collapses both create-paths into the physical one and then fail-closes. Fix: the endpoint **branches on a model-derived predicate** — *does this parent ref resolve to a physical directory?*
  - physical-dir-backed parent (`dir:*`, `rawbin:ts`) → `createPhysicalWithUnit` (mkdir + unit), as today;
  - virtual/model Folder (a collection like `diagrams`, any Folder with no physical location) → `mintRealUnit` (store-only model child, `kind` inherited/`'folder'`).
  Both branches succeed for a legitimately-offered node. `bad-parent-loc` then reverts to a TRUE fail-closed that fires only on a genuinely malformed ref — which, being malformed, is not a Folder and is not offered.

### 2. Applicability must DERIVE from the model (the doctrine point — agreed, in full)
Offering an action that structurally cannot work is a **functional construct beside the model — the same family as the re-seed** ([[correct-by-construction]], [[scan-the-hazard-not-the-actors]]). Applicability is *guessed* (class===Folder ⇒ offer) and then *excused* when the guess is wrong (*"harmless"*). The truthful predicate is **"the model can parent a new Folder child here."** For every `Folder`, the model CAN — via `mintRealUnit` — so the class-keyed offer is actually correct; what was missing is a handler that honours it for the virtual case instead of demanding a physical parent. After the fix, applicability and behaviour agree by construction: offered ⟺ succeeds. **Delete the "harmless" comment** — a verb we show the user and that then fails is a broken promise, never harmless.

### 3. Third cause or regression? — **UNCOVERED THIRD CAUSE.**
The FolderService:46 comment claims the resolver "fixes BOTH bad-parent-loc causes at one point": **cause 1** = redundant `collection:` display prefix on a synthetic inner; **cause 2** = `rawbin:` synthetic → repo dir. Both are refs that **DO** map to a real dir but were mis-resolved. `diagrams` is **neither** — it is a ref that maps to **NO physical dir at all** (a genuinely virtual model collection). The prior fix made real-dir-backed refs resolve; it never addressed a Folder with no physical directory, because the whole MODEL endpoint assumed add-folder always targets a physical parent. So this is a **third, structurally-distinct cause**, not a regression of that fix — the fix's two causes remain closed. The third cause is: *a Folder-classed node with no physical location, for which physical-create is impossible and model-unit-create was never routed on the model endpoint.*

## Handoff
- Expert (on build-go): make the MODEL add-folder endpoint branch on `resolveFolderRefToDir(parent)===''` → route virtual/collection parents to `mintRealUnit` (store-only, MODEL_STORE, prod untouched); keep the physical path for real-dir refs. Remove the "harmless" excuse comment. No new machinery — both methods already exist.
- Gate (isolated, R40.31, must be able to FAIL): pick `diagrams` → add-folder → a real model Folder unit is minted parented to diagrams (drawer renders the child, NOT bad-parent-loc); **stub-must-fail**: a genuinely malformed non-Folder ref still returns bad-parent-loc. Scratch MODEL_STORE, cleanup surviving failure. Device @390: Tron adds a folder under diagrams → it appears.
- Traceability: this is a defect ruling; req captures the requirement + the truthful-applicability AC, then I wire UC→(FolderService branch) Method→Impl. Flag: no chokepoint touched (both create methods exist; only the endpoint branch changes).
