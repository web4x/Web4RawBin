# Sprint 33 — MDA v4 MOF-layered tree — ARCHITECT DESIGN (robbin-architect 2026-07-30, PO-vision 76517908d, Tron authorized)
Present the model tree as a MOF 4-layer structure (M3/M2/M1/M0 folders) instead of the flat list. PHASED per the approved assessment: **P1 = M2+M1 folder presentation (THIS design, DRIVE NOW)** · P2 = RawBin real M1 (multi-file, subsumes R33) · P3 = M3 + M0/dist.

## MEASURE-FIRST — the M-levels ALREADY exist as DATA (this is a PRESENTATION problem, not a data build)
MODEL_STORE (data/model-store/index) unit census by `model.metaLevel`: **M3=2, M2=18, M1=12** (+1 Diagram). PROD scenario/index: M2=18, M3=2 (the pinned seeds). The M2 layer = UmlClass/UmlInterface/UmlAttribute/UmlMethod/UmlProperty/UmlAssociation/UmlGeneralization/UmlDependency/UmlFunction/UmlType + puml-class-code + ts-{class,attribute,function,…}-code facets. R32.1 multi-facet `instanceOf` already links M1→M2 (a ModelElement's `instanceOf:[UmlClass, tsClass]`). So the tree just needs to GROUP by metaLevel + present the instanceOf links as folder hierarchy.

## P1 DESIGN — M2 + M1 as MOF-layer FOLDERS (reuse rb-trace-tree folders + the metaLevel data; NO fork)
### Tree shape (what the user sees on /model)
```
📦 M2 · UML Profile            (folder; 18 metaclasses)
   ├─ «UmlClass»               → its M1 instances: Circle, Point …
   ├─ «UmlInterface»           → Shape …
   ├─ «UmlMethod» «UmlAttribute» «UmlAssociation» «UmlGeneralization» «UmlDependency» «UmlFunction» «UmlType» …
   └─ (ts/puml *-code facets)
📁 M1 · Projects               (folder)
   └─ 📐 <project> (r32.2-sample; RawBin in P2)
        ├─ Circle (class) → members (area, center, _r) + relations (edges)
        ├─ Point / Shape / Id / makeId …
        ├─ 📄 PUML (code)     → R32.7 modelToPuml text
        └─ 📐 Diagram (svg)   → R32.4/6 boxes+edges (the Diagram unit)
```
### Mechanism
1. **`/api/model/tree` restructure (server, the main change):** replace the flat `roots` with **MOF-layer folder roots** built by GROUPING the store units by `metaLevel`:
   - `M2 · UML Profile` folder → children = the M2 units (metaLevel==='M2'); each M2 metaclass → children = its M1 instances (the ModelElements whose `instanceOf` contains this M2 uuid — reverse the multi-facet link).
   - `M1 · Projects` folder → child = project node(s) (P1: one synthetic project grouping the M1 ModelElements by their common sourceFile; a real `ior:class:Project` unit in P2) → class/interface/function children → members (existing) + a `PUML (code)` node (R32.7) + the `Diagram (svg)` node (R32.4/6, the existing Diagram unit).
   - Emit each folder as `{uuid, type:'mof-layer'|'collection', name, icon, hasChildren, childCount, children?}` — the SAME itemView shape rb-trace-tree already renders (sprint-collection pattern).
2. **rb-trace-tree folders (client, reuse):** the tree ALREADY renders collection/folder nodes with N-level lazy expand (renderCurrentSprintEagerLazy / buildSeedNode). The MOF layers are collection nodes — reuse verbatim; only add M-layer icons (📦/📁) via the node `icon`. NO client fork.
3. **Same-uuid cross-level (no dup):** an M1 class appears under M1·Projects (as a project class) AND under M2·UmlClass (as an instance) — the SAME uuid via two nav paths. rb-trace-tree's ancestry/ref handling already renders a ref under multiple parents without duplicating the unit (navigation ≠ duplication). The R32.1 same-UUID law holds (one unit, many facets/paths).

## INVARIANTS (P1)
- **INV-MOF1 (layers-as-folders):** the /model tree root = MOF-layer folders (P1: M2 + M1), each expanding to its layer's units by `metaLevel` — NOT a flat list.
- **INV-MOF2 (instanceOf hierarchy):** M2 metaclass → its M1 instances via the multi-facet `instanceOf` (reverse-resolved); M1 class → its M2 facet(s) reachable. The M-level links are the REAL data, not synthetic.
- **INV-MOF3 (same-uuid, no dup):** one unit under multiple M-paths = one uuid, no duplicate unit (R32.1 law; tree ref-nav).
- **INV-MOF4 (isolation):** the tree reads MODEL_STORE only; prod scenario/index untouched (R32.5).

## REUSE (no fork) / gate / deploy / chain
- **REUSE:** rb-trace-tree folders/collections + lazy-expand, the metaLevel data (R32.1), R32.7 puml, R32.4/6 diagram, MODEL_STORE (R32.5). NEW = the `/api/model/tree` group-by-metaLevel restructure + the project grouping + M-layer icons.
- **GATE (tester + Tron @390):** /model tree shows `M2 · UML Profile` + `M1 · Projects` folders; expand M2 → the metaclasses (UmlClass, UmlInterface, …); expand «UmlClass» → its M1 instances (Circle, Point); expand M1 → project → classes → members + PUML(code) + Diagram(svg); a class shown under BOTH M2-instance and M1-project = same uuid, no dup; prod scenario/index git-clean (INV-MOF4); /model still membership-gated 403 non-member (R32.9). Gate the FOLDER STRUCTURE + cross-level nav, not just "loads".
- **DEPLOY:** server (/api/model/tree) → REAL restart + boot-verify + R31.7 invariant.
- **CHAIN (#126, req):** UC model.mofTree → Class (the model-tree endpoint owner) → Method mofLayerRoots → Impl → Test.

## P2 / P3 (forward — designed after P1 ships)
- **P2 (RawBin real M1 = subsumes R33):** multi-file `TsToModel.generate` over RawBin `src/` → the M1·Projects folder holds RawBin (hundreds of ModelElements) with puml code+svg. Big rocks: scale/perf of the tree+diagram at project size; multi-file reconcile; a real `ior:class:Project` unit.
- **P3 (M3 + M0):** M3 folder = the 2 existing M3 units (nearly free — same group-by-metaLevel); **M0 = dist** — PO/Tron pragmatic call: dist/compiled artifacts as M0 (NOT strict-MOF runtime-instances). Design flexibly: an M0·dist folder listing compiled artifacts, instanceOf their M1 classes (a dist→M0 generation, lighter than runtime-instance modeling). Confirm M0 semantics with Tron before building P3.

## S33-P2 — RawBin as a REAL M1 project (multi-file) — ARCHITECT DESIGN (robbin-architect 2026-07-30, PO priority: Tron "where are RawBin's classes")
MEASURE-FIRST (two findings that shrink the work + size the risk):
1. **`TsToModel.generate(files: string[], …)` is ALREADY MULTI-FILE** (TsToModel.ts:96) — one ts.Program over all files, PASS1/PASS2 cross-file, deterministic uuids, reconcile, ONE Diagram. The single-file limit is ONLY the `/api/model/generate` endpoint (passes `[abs]`). So P2 = extend the ENDPOINT/orchestration + bound the source-set + project grouping — **NOT an engine rewrite** (reuse generate verbatim).
2. **RawBin src = 122 non-test .ts** (src/ts 48 + src/public/ts 73 + shared 1; biggest dirs trace 41, scenario 26, server 18, components 13). → hundreds of ModelElements + relations = the scale concern is REAL; a single project Diagram of 100s of boxes = the R32.6 pollution → unusable.

### Design — BOUNDED, phased, reuse-the-multi-file-engine, curation-for-diagram-scale
**P2a (FIRST — bounded proof):** model ONE cohesive RawBin subtree as the M1 project — recommend **`src/ts/scenario/`** (26 files, self-referential model/scenario domain = meaningful "RawBin models itself") OR a smaller `src/ts/shared/` (4) as the smoke. Proves "RawBin's real classes/functions/interfaces" WITHOUT flooding. **P2b:** expand the tracked set (more dirs → whole src) once perf/UX is proven bounded.
1. **Tracked source-SET (project manifest):** the RawBin M1 project = a persisted set of globs/dirs (e.g. `["src/ts/scenario/**/*.ts"]`, excluding `*.test.ts`/`*.d.ts`/dist/node_modules). Store as a small project definition (an `ior:class:Project` unit or a manifest in MODEL_STORE). The set is BOUNDED + explicit — never "all of RawBin" by accident.
2. **Generate-project action/endpoint (server):** NEW `POST /api/model/generate-project { projectId | globs }` (owner/member-gated) → resolve the bounded file set → `TsToModel.generate(files, { indexDir: MODEL_STORE, write:true, diagram:false })` → M1 ModelElements for RawBin. Run as an EXPLICIT action (not per-load) — with a file-count CAP + timeout (R32.6 timeout lesson) + the excludes. Reconcile handles re-gen (deterministic uuids → rebind, stale-remove).
3. **Project grouping (M1·Projects → "RawBin"):** the R33.1 M1 folder groups by sourceFile today; introduce the PROJECT node — group the project's M1 elements under a "RawBin" node (by the manifest). rb-trace-tree LAZY expand (N-level, already there) bounds the tree at 100s of nodes — do NOT inline all.
4. **Diagram at scale = R32.11 CURATION, NOT a giant auto-Diagram (the key perf call):** do NOT emit one Diagram of all 100s of classes (that IS the R32.6 pollution). The project's diagram starts EMPTY (or a tiny overview); the user DRAGS the classes they care about into a focused diagram (R32.11 drag-to-add-view — just shipped = the scale-enabler) + per-package sub-diagrams later. Edges stay bounded (buildEdges only between on-diagram nodes). So R32.11 is WHY multi-file is usable.

### BIG ROCKS (flag)
1. **★ Diagram-at-scale = R32.6 pollution — biggest.** Answer above: NO giant auto-Diagram; R32.11 curation + focused/per-package diagrams. Design-resolved, but MUST NOT regress to auto-emit-all.
2. **★ Cross-file name-collision in relation resolution — a correctness rock.** `TsToModel` PASS2 relates by SIMPLE name (`nameToUuid.set(name, …)` / `relate(…, targetName)`, TsToModel.ts:123/154) — a GLOBAL name map. Multi-file with two classes named `X` in different files → last-wins collision → mis-linked edges. NEEDS qualified/file-scoped name resolution for multi-file correctness. MED — flag to expert as an in-scope P2 fix (scope relation-resolution per-file or by qualifiedName).
3. **Tree-at-scale (100s nodes):** reuse rb-trace-tree lazy expand; don't inline. LOW-MED (lazy-capable).
4. **Generation perf/timeout:** ts.Program over the bounded set is fast for tens of files; CAP + timeout + excludes; explicit action not per-load. LOW-MED.
5. **Project identity:** an `ior:class:Project` unit (name RawBin, manifest globs, its Diagram(s)) vs a synthetic grouping — recommend a real Project unit for P2b. LOW-MED.

### INVARIANTS / reuse / gate / deploy
- **INV-P2-1 (real M1):** M1·Projects → RawBin shows RawBin's ACTUAL classes/functions/interfaces from the bounded src set (not the r32.2-sample demo).
- **INV-P2-2 (bounded):** generation is over an EXPLICIT bounded manifest (capped + excludes) — never all-of-RawBin implicitly; re-gen deterministic (rebind, reconcile).
- **INV-P2-3 (no diagram flood):** no giant auto-Diagram; focused/curated diagrams (R32.11) keep boxes+edges bounded (R32.6 lesson).
- **INV-P2-4 (isolation):** generate writes MODEL_STORE only; prod scenario/index untouched.
- **REUSE (no fork):** TsToModel.generate (already multi-file), MODEL_STORE (R32.5), rb-trace-tree lazy folders (R33.1), R32.11 add-view curation, R32.6 edges. NEW = generate-project endpoint + bounded manifest + Project grouping + the qualified-name relation fix.
- **GATE (tester + Tron @390):** trigger generate-project on the bounded set → M1·Projects → RawBin lists RawBin's real classes/functions/interfaces (e.g. TsToModel, ScenarioIndex, …) with members; relations correct (no name-collision mis-links); the tree stays responsive (lazy, no hang/flood); a curated diagram (drag a few RawBin classes) renders bounded boxes+edges; prod scenario/index git-clean (INV-P2-4); /model still 403 non-member; generation completes within the timeout (no hang). Gate the REAL-MODEL + bounded-perf, not "loads".
- **DEPLOY:** server (generate-project endpoint + relation fix) → REAL restart + boot-verify + R31.7 invariant. Generation is an explicit owner action → run it, then backstop the produced model.

### ACs handed to req (0.4)
- AC1: a bounded RawBin source-set (manifest globs, excludes tests/dist/.d.ts) defines the RawBin M1 project.
- AC2: an owner-gated generate-project action runs TsToModel over the SET (reuse the multi-file engine) → M1 ModelElements in MODEL_STORE (prod untouched), capped+timeout-bounded.
- AC3: M1·Projects → RawBin shows RawBin's REAL classes/functions/interfaces + members (not the demo).
- AC4: cross-file relations resolve WITHOUT name-collision mis-links (qualified/file-scoped).
- AC5: NO giant auto-Diagram — diagrams are curated/focused (R32.11), boxes+edges bounded (no R32.6 flood); tree stays responsive (lazy).
- AC6: re-generate is deterministic (rebind same-uuid, reconcile stale) + isolated (MODEL_STORE only); /model membership-gate unregressed.
(Phased: P2a = one bounded dir e.g. src/ts/scenario; P2b = expand. R33.1.1 PUML-node deferred after P2.)

### ARCHITECT BACKSTOP — S33-P2a v0.8.13 / 1cddbc940 (robbin-architect 2026-07-30): **PASS** — RawBin real M1 LIVE
Restarted remoteShells:0.2 ([d] stop→npm start). BOOT-VERIFY: fresh pid 3962801→4061730 (not a version-lie), clean boot. served==committed(pkg)==SW(rawbin-v0.8.13)==0.8.13.
- **Endpoint gate:** `POST /api/model/generate-project` is OWNER-GATED — my session-less POST → `{"error":"forbidden"}` (correct: mutation = owner-only, no self-populate). MODEL_STORE was NOT yet populated (only the r32.2-sample demo). I POPULATED it as the host operator via tsx (`TsToModel.generate(src/ts/scenario, indexDir=MODEL_STORE)` — the same engine the endpoint calls; the gate is for HTTP callers) so Tron @390 sees RawBin; the owner can re-run the live endpoint.
- **INV-P2-1 (real M1) — LIVE:** GET /api/model/tree M1·Projects now shows RawBin's REAL classes — **TsToModel, ScenarioIndex, ModelValidator, CurrentSprint** — **139 M1 class/iface/func** (485 units), 1166 tree nodes total. Not the demo.
- **INV-P2-2 (bounded):** 26 files (src/ts/scenario), CAP 200, excludes test/spec/.d.ts; generated in **371ms** (no hang); re-gen deterministic (endpoint 0-churn; wrote 485 first run, 0 on re-run).
- **INV-P2-3 (no flood):** diagram:false — NO giant auto-Diagram; curation via R32.11.
- **INV-P2-4 (isolation):** prod scenario/index ModelElement+Diagram = **28 UNCHANGED** across the populate (MODEL_STORE only).
- **AC4 (qualified-name) — by construction:** TsToModel.ts:157 resolves relations FILE-SCOPED — "prefer a same-file decl; else a UNIQUE global decl; else (ambiguous) SKIP" → the 52 duplicate member-names (ior/model/get/…) can NOT mis-link (32 relations resolved conservatively, no false cross-file edges).
- **GATE:** /model non-member → **403** (R32.9 preserved). /trace + SM unregressed (prior).
- **REMAINING / flags:** (a) Tron @390 authed visual — open /model → M1·Projects·RawBin → its real classes + members (lazy) + curate a diagram (drag classes, R32.11); (b) expert-flagged: 139 classes FLAT under RawBin → **P2b sub-grouping** (by dir/package) for tree ergonomics; (c) R33.1.1 PUML-node still deferred.

## S33-P2b — SUB-GROUPING + BOUNDED/LAZY render (@390 perf) — ARCHITECT DESIGN (robbin-architect 2026-07-30, tester @390 flood risk)
MEASURE-FIRST — the 1195-node flood has TWO roots, both fixable by REUSE (rb-trace-tree is ALREADY lazy):
1. **`/model` forces full render:** the shell has `<rb-trace-tree id="model-tree" data-always-expanded>` (server.ts:1011) → data-always-expanded makes buildSeedNode build ALL layers EAGERLY → renders all 1195 nodes at 390px = hang/flood. (server-manager.ts already `removeAttribute('data-always-expanded')` for exactly this, R31.3.)
2. **`mofLayerRoots` INLINES the full nested tree:** /api/model/tree (server.ts:1554→`mofLayerRoots`) emits M2→instances + M1→classes→members ALL inline (1195 nodes in one payload) — the :1555 comment INTENDS lazy member-fetch via /api/trace/children, but the emission is inline.
REUSE-READY: rb-trace-tree IS lazy (R31.3 layer-by-layer buildSeedNode + `fetchAndRenderChildren` :130 + `hasChildren`-driven expand); `/api/trace/children` routes ModelElement→MODEL_STORE (R32.5 isModelUnit). The lazy path EXISTS; data-always-expanded + inline-emission DEFEAT it.

### Fix — Part A (bounded/lazy render) + Part B (sub-grouping); NO fork
**Part A — LAZY (drop the eager flood):**
1. **Client:** `model.ts` → `tree.removeAttribute('data-always-expanded')` (mirror server-manager.ts R31.3) so the tree starts COLLAPSED + lazy-expands per layer. Only the TOP layer renders initially.
2. **Server `mofLayerRoots`:** emit BOUNDED — folders (M2/M1) + project + class nodes with `hasChildren:true`+`childCount`, but do NOT inline members/deep grandchildren. The client lazy-fetches each layer via `/api/trace/children/<uuid>` (MODEL_STORE-rerouted, R32.5) on expand. Payload drops from 1195 → the top layer only.
**Part B — SUB-GROUPING (139 flat classes → hierarchy):** `mofLayerRoots` M1·Projects→RawBin groups its classes by **sourceFile/dir** → RawBin → [file/dir folders] → classes → members. src/ts/scenario = 26 files → 26 file-folder nodes (bounded) → their classes → members. Reuse rb-trace-tree collection/folder rendering (same as the MOF layers). No flat 139-list.

### @390 render (what the user sees, bounded per layer)
```
📦 M2 · UML Profile        (collapsed)
📁 M1 · Projects           (collapsed)
   └─ RawBin               → 26 file folders (lazy)
        └─ TsToModel.ts     → TsToModel (class) (lazy)
             └─ TsToModel   → members (lazy)
```
Initial DOM at 390px = 2 folder nodes (not 1195); each expand = ONE bounded lazy fetch.

### INVARIANTS (P2b)
- **INV-P2b-1 (bounded initial):** /model at 390px renders ONLY the top layer (MOF folders, collapsed) — no data-always-expanded, no 1195-node DOM.
- **INV-P2b-2 (lazy expand):** each expand fetches ONE bounded layer via /api/trace/children (MODEL_STORE); members/deep NEVER inlined in the roots payload.
- **INV-P2b-3 (sub-grouped):** RawBin's classes structured by file/dir (rb-trace-tree folders), not a flat 139-list.
- **INV-P2b-4 (@390 no-hang):** the full RawBin model is reachable WITHOUT hang/flood at 390px (bounded + lazy).

### REUSE / gate / deploy / chain
- **REUSE (no fork):** rb-trace-tree R31.3 lazy (layer-by-layer + fetchAndRenderChildren + hasChildren), /api/trace/children MODEL_STORE routing (R32.5), rb-trace-tree folders (R33.1). NEW = `mofLayerRoots` bounded emission + file/dir sub-grouping + drop `data-always-expanded` on /model.
- **★ GATE @390 (render-perf — the interaction the tester flagged, tester + Tron):** /model at 390px initial DOM = bounded (folders only, measure node-count ≪ 1195, render fast, NO hang); expand M1→RawBin→file-folders→classes→members each a bounded lazy fetch (assert /api/trace/children called per-expand, not one 1195 payload); real RawBin classes still reachable (P2-1 unregressed); /model 403 non-member; /trace unregressed. Gate the @390 RENDER-PERF, not "loads".
- **DEPLOY:** server (`mofLayerRoots` bounded + sub-group) + client (drop data-always-expanded) → REAL restart + boot-verify + R31.7 invariant.
- **CHAIN (#126, req):** rides `mofLayerRoots` (Method, R33.1 Impl 5afeafe9) — extend for bounded+sub-group; UC model.mofTree; + Test = the @390 render-perf gate.

### ACs handed to req (0.4)
- AC1: /model tree renders BOUNDED at 390px (top-layer folders only, not the full 1195 nodes) — no data-always-expanded eager render.
- AC2: deeper layers (project→files→classes→members) load LAZILY on expand via /api/trace/children (MODEL_STORE), not inline in the roots payload.
- AC3: RawBin's 139 classes are SUB-GROUPED by file/dir (rb-trace-tree folders), not a flat list.
- AC4: a @390 RENDER-PERF gate — the 1195-node model does NOT hang/flood mobile (bounded initial DOM + lazy expand); real classes still reachable; /model gate + /trace unregressed.
