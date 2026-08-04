# S35 DESIGN — Buttons→Actions + Universal On-Disk Scenarios (robbin-architect 2026-08-04)
MEASURE-FIRST at HEAD 83d47caed v0.8.45 (S34 7/7 closed). Builds on S34: universalActionBar ffd44b17 / onUniversalAction 005dbd3e / actionsForContext (model.ts:72) + A2 resolver ensureFolderFileUnit a09b474d (server.ts:1107). REUSE all — NO fork. The 4 inventories req asked for are below each cluster.

## R35.1 — convert legacy per-view buttons → universalActionBar actions
### INVENTORY (measured — the full bespoke-button set):
| View (file) | Button | Effect | → action verb (type) |
|---|---|---|---|
| rb-detail-view.ts:56/66 | ⬇ vCard | `downloadVCard({name,playerToken})` | `download-vcard` (member/user) |
| rb-detail-view.ts:158 | 👁 Preview | `renderFilePreview(uuid,mime,name,tok)` | `preview-file` (file) |
| rb-file-detail.ts:54 | ↗ New tab | `window.open(contentUrl)` | `open-newtab` (file) |
| rb-webitem-detail.ts:70 | ⟳ Preview via proxy | `toProxy()` | `proxy-preview` (webitem) |
| rb-file-detail.ts:55 / rb-webitem-detail.ts:79 | ⤢ Reset zoom | `pane.reset()`/`pz.reset()` | **NOT an item-action** — an in-pane VIEWER control (overlay, RbPanZoom state). EXCLUDE from the bar; stays in-pane (documented). |
Note: `.dv-link`/`.dv-parent-link` are NAVIGATION links (selectionModel.replaceWith), not buttons — unchanged.
### DESIGN (client-only, reuse S34 bar): add the verbs to `actionsForContext`/`ACTIONS_BY_TYPE` keyed by type (member/user→download-vcard; file→preview-file+open-newtab; webitem→proxy-preview); the `rb-drawer-action{verb}` handler (model.ts wireDrawerActions) dispatches to the EXISTING functions (downloadVCard/renderFilePreview/window.open/toProxy). REMOVE the bespoke button markup from the detail views → actions flow through the one shared bar. INV-1: no behavior lost (same effect, relocated); INV-2: no bespoke item-action button left in a detail view (zoom-reset excepted = viewer control). GATE @390: each converted action PRESENT + FIRES in the bar per type; old buttons gone.

## R35.2 — every item view resolves to a REAL on-disk scenario (both buttons always work)
### INVENTORY (measured — types WITH vs WITHOUT a backing on-disk unit):
- **HAVE a real unit (buttons work):** requirement/task/usecase/class/method/implementation/test (prod scenario/index trace units) · modelelement (MODEL_STORE) · diagram (MODEL_STORE Diagram) · webitem (createWebItemUnit) · file/folder as `file:`/`dir:` (S34 A2 ensureFolderFileUnit → MODEL_STORE).
- **LACK a unit (both buttons DEAD) = R35.2 targets:** the SYNTHETIC MOF nodes — `project:RawBin`, `rawbin:ts`, `rawbin:puml`, `rawbin:diagram`, `rawbin:traceability`(R35.4), `mof-m1`, `mof-m2`, `mof-m2:<mc>` (ensureFolderFileUnit returns null for non-`dir:`/`file:` — server.ts:1108) · `puml-src` leaves (source .puml, rendered but no unit).
- **N/A (runtime/feature, not MDA items):** otmuxpane (transient terminal), feature/profile (FeatureManager) — out of scope (not disk-scenario items).
### DESIGN (server, extend the A2 resolver — fork-A, MODEL_STORE-only): GENERALIZE `ensureFolderFileUnit` → a universal `ensureViewUnit(ior)` that also mints, for the currently-null cases: synthetic MOF folder refs → `ior:class:Folder` (keyToUuid('folder::'+ref)); `puml-src` → `ior:class:File`/`PumlArtifact` (keyToUuid('puml::'+path)). Deterministic keyToUuid (R32.2 law) = idempotent LAZY mint, no dup on re-open; MODEL_STORE only (prod scenario/index NEVER touched); tree/mofChildren BYTE-unchanged (only /api/ior + /scenario resolve to the new unit). Data-having gate sample per type: Folder=`rawbin:ts`, File=`file:src/ts/server/server.ts`, PumlArtifact=a real puml/ leaf. INV-A2-1 byte-unchanged / A2-2 idempotent-no-dup / A2-3 store-only.

## R35.3 — scenarios CONTAIN the item's info (not empty stubs)
### INVENTORY (per type → fields the unit carries, mirroring the node's view data):
| Type | Fields (populated from the node) |
|---|---|
| Folder (mof/artifact) | `name`, `kind:'folder'`, `location`(path/ref), `parent`, `childCount` |
| File (`file:`) | `name`, `location:rel`, `kind:'file'`, `sourceFile:'ior:file:<rel>'` (already S34 A2 :1117) |
| PumlArtifact (`puml-src`) | `name`, `kind:'pumlArtifact'`, `sourceFile`(.puml path), `location` |
| Project (`project:RawBin`) | `name:'RawBin'`, `kind:'project'`, `childCount:4` |
### DESIGN: the R35.2 resolver writes these fields at mint time (mirror mofFolder/node display data → unit model). REQ asserts fields-non-empty per type for a populated sample. Trace/modelelement/diagram units already carry their info (no change).

## R35.4 — traceability as the 4th folder under the MDA RawBin project
### INVENTORY (measured — folder-set + trace source):
- Folder set defined at **server.ts:1240-1247** (`if uuid==='project:RawBin'` → 3 mofFolder: `rawbin:ts`/`rawbin:puml`/`rawbin:diagram`); childCount hint `3` at :1236.
- Trace-tree source = the scenario traceability units Requirement→UC→Class→Method→Impl→Test (same chain /api/trace + the scoreboard walk).
### DESIGN (server, additive — no fork): (a) add a 4th `mofFolder('rawbin:traceability', 'traceability', traceCount, 'trace-icon')` at :1247; (b) bump the childCount hint `3`→`4` (:1236); (c) add `if (uuid==='rawbin:traceability')` → return the requirement-root MofNodes (walk /api/trace roots), so it expands into the REAL trace tree via the existing rb-trace-tree (reuse, no fork); (d) the folder + its children resolve to real scenarios (R35.2/R35.3 — trace units already real). GATE @390: RawBin expands to EXACTLY [ts, puml, diagrams, traceability]; traceability expands to the Req→…→Test tree; nodes open real detail + ◆Scenario/✎Edit.

## Build order / chain / gate
- **Order (PO-confirmed):** R35.2+R35.3 (one resolver pass, foundation) → R35.4 (traceability folder, uses the resolver) → R35.1 (buttons→actions, client). Server bits (R35.2/3/4) → REAL restart + my backstop at the boundary (BOOT_VERSION frozen-at-boot lesson); R35.1 client-only.
- **Chain:** per-req UC→Class→Method→Impl→Test; req mints scenario-first (#126, IMPL-MINT new / ride-existing residual: R35.2 rides/extends ensureFolderFileUnit a09b474d; R35.1 rides actionsForContext/onUniversalAction). I mint/repoint on ship if needed.
- **GATE = real-WebKit @390** (per S34): R35.1 actions fire per type; R35.2 both buttons resolve for every type (data-having sample); R35.3 fields non-empty; R35.4 4 folders + trace tree. All chain-to-Test.

## R35.1 DESIGN CALL — provider placement (architect 2026-08-04, expert measure-first gap)
MEASURED: the drawer's `_actionProviders` registry COMPOSES all providers (rb-detail-drawer.ts:420 `flatMap` → `setActions([...defaults, ...provided])`) — multiple providers are additive. But `/model` (model.ts:89 registerActionProvider) is the ONLY registrant and loads ONLY on /model. The R35.1 details mount ELSEWHERE (vcard=rb-detail-view, preview/newtab=file, proxy=rb-webitem-detail → in RoomView + trace). So adding the 4 verbs to `actionsForContext` surfaces them ONLY in /model → they won't fire in room/trace → @390 fails there.
### DECISION: (B/C) view-independent UNIVERSAL PROVIDER — NOT (A) per-host registration
- **REJECT (A)** register the provider in RoomView + trace-page + model separately: N-host duplication, fragile (miss a host → actions vanish there), and forces /trace to register a provider — muddies INV-E3 (shared drawer generic; /trace-chain types register none).
- **CHOOSE the view-independent universal provider**, implemented as a `registerActionProvider` PROVIDER (a type-conditional fn) in a NEW shared module `src/public/ts/trace/universal-actions.ts` that **rb-detail-drawer IMPORTS** (so it self-registers on EVERY page the drawer loads — room/trace/model/scenario). Maps the intrinsic type→verbs: member/user→`download-vcard`, file→`preview-file`+`open-newtab`, webitem→`proxy-preview`; + a shared `rb-drawer-action` handler dispatching to the EXISTING functions (downloadVCard / renderFilePreview / window.open / toProxy), fetching the ref's context the way the model verbs do (deleteElementAction(shownRef) pattern).
- **NOT in the drawer `defaults` (:421)** — defaults = the universal ◆Scenario/✎Edit (R-A A1, shown for EVERY type); the 4 verbs are TYPE-CONDITIONAL, so they MUST be a provider (type-keyed fn) or they'd leak onto wrong types (file-verbs on a webitem).
- **Detail views DROP their bespoke button markup** (actions flow through the shared bar); zoom-reset stays an in-pane viewer control (unchanged).
### WHY correct-by-construction
Composes via the EXISTING registry (no fork); ONE registration (not N hosts); fires wherever the detail mounts (@390 "each action fires per type" passes in room+trace+model). INV-E3 preserved: the drawer MECHANISM stays generic; MODEL-host verbs stay in model's provider (host policy); TYPE-INTRINSIC verbs go in the universal provider (type policy, view-independent) — the mechanism/policy boundary holds, just split host-policy vs type-policy. Rides the composing `_actionProviders`; req mints the R35.1 chain onto the universal provider + shared handler (new decl) + the 4 verb→handler bindings.
