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

## S33-P3-FEATURES — RawBin project FOLDERS + ACTION BAR + PUML IMPORT — ARCHITECT DESIGN (robbin-architect 2026-07-30, Tron)
MEASURE-FIRST: R32.7 `puml-serializer.ts` has BOTH `modelToPuml` (:33 export) AND **`pumlToModel` (:69 PARSER, PUML→model)** — so PUML-import REUSES the existing parser (NO new parser needed). 55 .puml in scrum.pmo/sprints/*/diagrams/: **27 class/component (importable), 12 sequence/activity (OUT-of-scope — pumlToModel parses class/interface/<|--/-->/..> only, not participant/sequence), 16 other/unknown (per-file triage)**.

### (a) RawBin project → 3 FOLDERS (where artifacts LIVE in MODEL_STORE)
Under M1·Projects → RawBin, 3 sub-folders (reuse rb-trace-tree folders, like the MOF layers + P2b file-folders):
- **`ts/`** = the M1 ModelElements (RawBin's classes/functions/interfaces — the R32.2/P2a generated model).
- **`puml/`** = PUML artifacts (the .puml TEXT — R32.7 `modelToPuml` output + imported .puml sources). Storage = a small `PumlArtifact` unit (or the .puml text on a Diagram/project ref) in MODEL_STORE.
- **`diagram/`** = interactive Diagram units (R32.4 view-link diagrams — curated/generated/imported).
`mofLayerRoots` emits these 3 folders under the RawBin project node; each groups its artifact type. Isolation: MODEL_STORE only (INV-MOF4).

### (b) ACTION BAR (on /model — the RawBin project / diagram surface)
Reuse-first; each action = an owner/member-gated endpoint + a client button:
- **`+ Add diagram`** = create an empty Diagram unit in `diagram/` → curate via R32.11 add-view (drag desktop / tap-add touch — see R32.11-MOBILE fix). REUSE R32.4 Diagram + R32.11.
- **`Compile diagram → SVG`** = render a Diagram's view-links to SVG via R32.4 `buildDiagramSvg` (the "puml as svg" / exportable). REUSE R32.4. LOW.
- **`Compile → TypeScript`** = M1 model → .ts codegen. ★ BIG ROCK — this is the REVERSE of `TsToModel` (TS→model); model→TS codegen is NEW (generate valid .ts from M1 ModelElements). Non-trivial (member signatures, relations→imports/extends). FLAG as a later phase; NOT free.
- **`Import PUML`** (Tron's new ask) = pick/scan a .puml → `pumlToModel` (R32.7, REUSE) → {elements, relations} → create ModelElement units (M1; deterministic puml-scoped uuids since external .puml lack embedded [model:uuid:X]) + a Diagram unit with auto-grid view-links → store: .puml source→`puml/`, Diagram→`diagram/`, elements→`ts/` → render INTERACTIVE (R32.4). Isolation: MODEL_STORE only (INV-P4, R32.7). Owner-gated.

### PUML IMPORT — scope (measured)
- **IMPORTABLE (27 class/component):** class/interface/component .puml → the class-Diagram model via `pumlToModel` (handles class/interface + <|--/-->/..>). ✓
- **OUT-OF-SCOPE (12 sequence/activity):** participant/->/alt/activate = a DIFFERENT diagram model (not the class-Diagram); `pumlToModel` won't parse them meaningfully. FLAG — not importable to the class model (a separate sequence-model would be a future arc).
- **TRIAGE (16 other/unknown):** per-file — chain/mixed diagrams; some class-ish (importable), some not. Expert triages on build (parse-attempt → if yields class elements, import; else skip + report).

### INVARIANTS / reuse / big rocks / gate / deploy
- **INV-F-1 (reuse parser):** import uses R32.7 `pumlToModel` — no new parser. **INV-F-2 (folders):** diagram/puml/ts are rb-trace-tree folders over MODEL_STORE artifacts (no fork). **INV-F-3 (isolation):** all actions write MODEL_STORE only; prod untouched. **INV-F-4 (round-trip):** an imported .puml → model → re-export (`modelToPuml`) is stable (R32.7 INV-P3) for class diagrams.
- **REUSE (no fork):** R32.7 pumlToModel/modelToPuml, R32.4 buildDiagramSvg + Diagram, R32.11 add-view curation, R32.2 TsToModel (for ts/), rb-trace-tree folders, MODEL_STORE. NEW = the 3 project folders in mofLayerRoots + the action-bar endpoints (add-diagram/compile-svg/import-puml) + PumlArtifact storage. **Compile→TS = the one genuinely new engine (model→code), flagged big-rock.**
- **BIG ROCKS:** (1) ★ Compile→TypeScript (model→TS codegen, reverse of TsToModel) = the hardest, later phase; (2) sequence/activity .puml out-of-scope (class-model only); (3) puml/ storage model (PumlArtifact unit shape); (4) the @390 touch curation (R32.11-MOBILE fix is a prerequisite for Add-diagram on mobile).
- **GATE (@390):** RawBin project shows diagram/puml/ts folders; Import-PUML on a class .puml → interactive Diagram renders (R32.4 boxes+edges) + .puml lands in puml/ + Diagram in diagram/; Add-diagram + curate (touch); Compile→SVG exports; sequence .puml → clean 'not importable' (no crash); isolation (prod git-clean); /model gated. Gate the ACTIONS, not page-load.
- **DEPLOY:** server (folders in mofLayerRoots + action endpoints) + client (action bar) → real restart + boot-verify. PHASED: P3f-1 folders + Import-PUML + Add-diagram + Compile-SVG (all reuse); P3f-2 Compile→TypeScript (the codegen big-rock).

### ARCHITECT BACKSTOP — S33-P2b (R33.2) v0.8.16 / 8a0fee3ae (robbin-architect 2026-07-30): **PASS** — the 1195-flood is GONE
Restarted remoteShells:0.2 ([d] stop→npm start, not gated). served==committed(pkg)==SW(rawbin-v0.8.16)==HEAD==0.8.16; fresh pid 851729→886657.
- **★ INV-P2b-1 (bounded initial) — PROVEN:** GET /api/model/tree payload = **2 nodes** (M2·UML Profile[18] + M1·Projects[2]) — was **1195**. The @390 flood is eliminated (2-node initial DOM, not 1195).
- **INV-P2b-2 (lazy expand):** /api/trace/children/mof-m1 → [RawBin, test/fixtures/…] collections (synthetic-layer mofChildren, mof-m1|mof-m2|project:|file: scheme, server.ts:1069) — deeper layers load per-expand from MODEL_STORE, never inlined.
- **INV-P2b-3 (sub-grouped):** RawBin project → file-folders by sourceFile (25) lazily. **INV-P2b-4:** client model.ts:16 drops data-always-expanded (collapsed-initial).
- **GATE:** /model + /server-manager → 403 non-owner; /trace → 200 (unregressed). /api/model/tree public (no INV-D4 leak — the gated PAGE is /model; the tree data is public parity, same as before).
- **REMAINING:** the @390 render no-hang (mobile) = tester's render-perf gate on this bump (2-node DOM + lazy). mofChildren = uncredited helper riding mofLayerRoots [impl 5afeafe9] — flag if separate mint wanted. Owner-guard landmine still open (uncommitted, Tron to commit).

## S33 RE-SCOPE — WORKING INTERACTIVE DIAGRAM (the never-delivered core) — MEASURED GAP + DESIGN (robbin-architect 2026-07-30, Tron device-QA IMG_4771, CMM4 measure-first)
### ★ MEASURED GAP — WHY the drag→SVG-box never rendered VISUALLY (read the actual code, no assume)
1. **The SVG-box + compartment LOGIC IS BUILT:** `buildBox` (diagram-view-model.ts:24-38) renders a UML class box with name (+«interface»), an ATTRIBUTE compartment (rows), a METHOD compartment (rows), separators; `buildDiagramSvg` (:91) assembles boxes+edges into an `<svg viewBox preserveAspectRatio>` (pan/zoom-ready). `data-ref` on the box for select. So box-with-compartments render logic EXISTS and is unit-tested.
2. **MOVABLE boxes = NOT BUILT:** rb-diagram-detail has NO box-drag-to-move — boxes are static `<g transform>`; the only box interaction is click→`selectionModel` (select, R32.4 :117-119). The vision's "MOVABLE" is absent. GAP.
3. **The diagram is a TRANSIENT DRAWER DETAIL-VIEW, not a reachable persistent CANVAS:** rb-diagram-detail is registered as a drawer detail (tagMap `diagram:'rb-diagram-detail'`, rb-detail-drawer.ts:218), opened ONLY by selecting a `diagram:` ref. There is NO primary interactive diagram canvas Tron can navigate to, drop onto, and SEE. At @390 the path to a droppable diagram surface (via a diagrams folder + a Diagram node) was not built/reachable. GAP.
4. **The gates verified STRUCTURE, never the VISUAL @390 interaction:** buildDiagramSvg (DOM-free UNIT test) + add-view (endpoint curl) + tap-fires (R32.11) — but NEVER "navigate → drop → SEE a movable selectable box with compartments." Gated-path ≠ interaction at feature-vision scale ([[visual-features-gate-by-pixel]] / [[gate-the-ac-surface]]). THIS is the miss.
5. **Compartments populate ONLY IF resolved:** rb-diagram-detail.render (:77-100) fetches each view-link's element + members (fetchModel per member) → DiagramNode.attrs/methods → buildBox. For a RawBin class the members resolve → compartments; but this was never VISUALLY verified @390.
6. **Folders/labels/action-bar wrong-or-missing:** diagram(singular, should be **diagrams**); items show redundant `src/ts/scenario/X.ts` (DRY violation — should be FILENAME + resolve-to-file-for-edit); NO action bar on /model.

### DESIGN — fill the gaps (scenario-first, REUSE; the box logic exists — assemble the EDITOR)
1. **★ WORKING interactive diagram (the core):**
   - **Reachable canvas:** the **diagrams** folder → a Diagram node → opens rb-diagram-detail with the DnD surface (drawer detail is OK as the host, but must be REACHABLE + the drop/see/move loop must WORK). Empty diagram = a droppable blank canvas (the label is the zone, R32.11).
   - **Drop→VISIBLE box:** drop/tap a ts-item or M2 unit → addView (R32.11, x,y-on-drop) → re-render → `buildBox` renders the M2-instance box WITH compartments (attrs/methods/properties). VERIFY the resolver populates compartments (member fetch) — the pixel gate proves it.
   - **★ MOVABLE boxes (NEW build):** pointer/touch drag on a `.dm-box` → update that view-link's `x,y` → persist via a NEW `POST /api/model/diagram/move-view {diagramUuid, elementUuid, x, y}` (MODEL_STORE, INV-P4) → re-render at the new position. Disambiguate box-drag (on `.dm-box`) from canvas-pan (RbPanZoom on empty surface). Touch + mouse (the R32.11-MOBILE lesson: HTML5 DnD ≠ touch → use pointer/touch events for the move).
   - **Selectable:** box-click → selectionModel (exists). **Pan/zoom:** RbPanZoom (exists). Each M2-instance = an SVG box (buildBox — the puml-compiled-svg equivalent).
2. **Folders + DRY labels:** rename `diagram`→**`diagrams`** (plural); ts files INSIDE the `ts` folder (P2b file-folders → under ts/); item label = **FILENAME only** (drop the redundant `src/ts/scenario/` prefix), each item POINTS TO the real file + resolves it for EDIT (like the trace view opens the .ts). Reuse the trace file-resolve.
3. **ACTION BAR — REUSE the existing WODA component (LOCATED):** `rb-strip` / `rb-compartment` (src/public/ts/trace/ — my S31 CONCEPT primitives, BUILT) OR `rb-editor-toolbar` (components/). Mount on the /model diagram view (currently MISSING). NAMED actions (not icon-only): **"Add Diagram"**, **"Compile PUML→SVG"**, (+ Import-PUML from P3f). NO new fork — reuse rb-strip/rb-compartment segments.
4. **M2-instance SVG equivalent:** every dropped M2-instance (class/interface) → buildBox SVG with compartments (the puml-svg equivalent) — already in buildBox; ensure every instance renders + is selectable + movable.

### INVARIANTS / reuse / ★ GATE / big rocks
- **INV-S33V-1 (visible box):** drop/tap an item → a class box WITH attribute+method compartments RENDERS on the canvas (pixel-visible), not just an endpoint 200.
- **INV-S33V-2 (movable):** a box drags to a new x,y (touch+mouse), persists (move-view), survives re-render/reload.
- **INV-S33V-3 (selectable):** box-click selects (highlight + drawer node-detail). **INV-S33V-4 (isolation):** all writes MODEL_STORE only.
- **REUSE (no fork):** buildBox/buildDiagramSvg (R32.4 — box+compartments EXIST), RbPanZoom (R31.6), addView (R32.11), rb-strip/rb-compartment (action bar), R32.6 edges, R32.7 puml (Compile action), MODEL_STORE. NEW = move-view endpoint + box-drag interaction + action-bar mount + folder rename/DRY-label + reachable-canvas UX.
- **★ GATE POSTURE (Tron explicit):** @390 REAL interaction — drag/tap an item → SEE a selectable, MOVABLE SVG class box with compartments on the pan/zoom canvas — **screenshot + PIXEL**, NOT endpoint/structure. Planted-defect bite (e.g. a box that renders 0×0 or off-canvas must FAIL). This is the AC surface.
- **BIG ROCKS:** (1) ★ movable boxes (new box-drag vs canvas-pan disambiguation, touch+mouse, persist x,y) — the main new build; (2) reachable-canvas UX (diagram as a first-class surface); (3) compartment resolution verified by pixel (not unit); (4) action-bar reuse of rb-strip (confirm its API fits named actions).

### S33 ACs handed to req (0.4) — gate @390 by pixel
- AC1: on the diagrams canvas, drag/tap a ts-item/M2-unit → a SELECTABLE SVG class box with attribute/method/property COMPARTMENTS renders at the drop x,y (pixel-visible @390).
- AC2: the box is MOVABLE (drag to new x,y, touch+mouse) → persists (MODEL_STORE) → survives reload.
- AC3: folders = diagrams/puml/ts (ts-files inside ts); item labels = FILENAME only + resolve-to-file-for-EDIT (no redundant src/ path).
- AC4: an ACTION BAR (reuse rb-strip/rb-compartment WODA component) with NAMED actions Add-Diagram + Compile-PUML→SVG on /model.
- AC5: each M2-instance renders as its SVG box equivalent; relationship edges (R32.6) between on-canvas boxes.
- AC6: GATE = @390 Tron REAL interaction, screenshot+pixel (drag→SEE the movable selectable box), NOT endpoint/structure; planted-defect bite.

### ARCHITECT BACKSTOP — R33.3 interactive editor v0.8.17 / b3d12f5c1 (robbin-architect 2026-07-30): **PASS (deploy)** — VISUAL @390 = expert playwright + Tron pixel
Restarted remoteShells:0.2 ([d] stop→npm start). served==committed(pkg)==SW(rawbin-v0.8.17)==HEAD==0.8.17; fresh pid 886657→1135812.
- **STATIC:** NEW `POST /api/model/diagram/move-view` (server.ts:1672, updates view.x/y in MODEL_STORE, INV-S33V-2/4). Box-drag via **`pointerdown`** (rb-diagram-detail:190 — pointer events = touch+mouse, the R32.11-MOBILE lesson applied) → live transform → persist on release (:223). Reachable canvas + drop→box + action-bar built (client live).
- **★ INV-S33V-2 (movable+persist) — PROVEN:** POST move-view Circle→(999,888) → `{ok,x:999,y:888}`; MODEL_STORE Diagram file now has Circle view `{x:999,y:888}` = persists to disk (survives reload). INV-S33V-4 isolation: writes MODEL_STORE only (probe artifact in the resettable demo store).
- **GATE:** /model + /server-manager → 403 non-owner; /trace → 200. Guard grant preserved live (uncommitted).
- **REMAINING:** ★ the VISUAL @390 interaction (drag/tap item → SEE a selectable box w/ compartments → drag to move → persist-reload) = the expert's MANDATORY playwright self-verify (screenshot) + Tron device PIXEL gate — I'm 403-limited on the authed mobile UI, so the endpoint+persist+static is my ceiling; the pixel is theirs. Owner-guard landmine still open (Tron to commit).

## R33.3-BUG — ts/puml/diagrams folders expand EMPTY (Tron IMG_4774) — ROOT CAUSE (robbin-architect 2026-07-30)
Tron: the new diagrams/puml/ts folder layer shows badges (ts=25) but EXPANDING renders NO children; test/fixtures DOES show children.
LIVE REPRO: `GET /api/trace/children/project:RawBin` → 3 folders (rawbin:ts childCount 25 ✓); `GET /api/trace/children/rawbin:ts` → **`{}`** (empty).
ROOT (one-line dispatch mismatch): the /api/trace/children DISPATCH regex **server.ts:1837** = `/^(mof-m1|mof-m2|project:|file:)/` — **MISSING `rawbin:`**. `mofChildren`'s INTERNAL guard (server.ts:1073) WAS updated to `/^(mof-m1|mof-m2|project:|file:|rawbin:)/` for the R33.3 folder restructure, but the CALLER's dispatch (:1837) was NOT → `rawbin:ts|rawbin:puml|rawbin:diagram` never reach `mofChildren`; they fall through to the ModelElement path (:1845) → `isModelUnit('rawbin:ts')`=false → `idx.get`=null → **404 `{}`** = empty children. (`project:*`/`file:*` match → work; that's why test/fixtures shows children and RawBin's ts/puml/diagrams don't.)
FIX (hand expert, ONE LINE): server.ts:1837 add `rawbin:` to the dispatch regex → `if (/^(mof-m1|mof-m2|project:|file:|rawbin:)/.test(uuid))` (match the mofChildren guard :1073). Then rawbin:ts→25 file-folders, rawbin:puml→PumlArtifacts, rawbin:diagram→Diagram items resolve on expand. Server change → real restart. GATE = @390 expand ts → see the 25 file-folders (children); planted-defect: a synthetic-uuid layer added without the dispatch regex must FAIL (the mismatch class).

## R33.5 DIAGRAM UX POLISH — ARCHITECT DESIGN (robbin-architect 2026-07-31, Tron device-QA IMG_4778/4779, PO-R33.5) — 4 UX refinements on the WORKING R33.3 editor (mostly reuse/wiring)
MEASURE-FIRST per item (current code):

### Item 1 — AC-add-diagram-creates-itemview (client wiring)
MEASURED: `POST /api/model/diagram/create` EXISTS (server.ts:1695, empty Diagram → MODEL_STORE) AND `mofChildren('rawbin:diagram')` (server.ts:1103) already enumerates `ior:class:Diagram` units → a new Diagram WOULD show under diagrams/ on refresh. BUG = the Add-Diagram action never refreshes the tree, so the node doesn't appear until manual reload.
**FIX (client):** Add-Diagram onclick → /create → on `ok`, refresh the `diagrams/` folder — dispatch a tree-refresh (reuse the `rb-model-resynced`/tree-reload pattern rb-trace-tree already listens to, OR re-fetch `/api/trace/children/rawbin:diagram` + re-render that folder). New empty diagram node appears immediately, ready to drop into. No server change.

### Item 2 — AC-class-select-keeps-diagram (decouple box-select from drawer-swap)
MEASURED: rb-diagram-detail box-click (:141-142) = `selectionModel.replaceWith(box)` → the SHARED selection-changed → the drawer's onSelectionChanged → renderDetailForRef → SWAPS the drawer from diagram to class-detail (diagram gone, IMG_4779).
**FIX (client):** box-click sets a diagram-LOCAL `this._selectedBox=uuid` (highlight the box via a CSS class) + NAVIGATES/highlights that class in the TREE (reveal — dispatch a tree-reveal event / `location.hash='#uuid=<uuid>'` → rb-trace-tree.revealNode/onHashChange, REUSE the existing reveal). It does NOT call `selectionModel.replaceWith` → the shared selection is untouched → the drawer STAYS on the diagram. Class-detail opens ONLY on TREE-click (unchanged: tree node → selectionModel → drawer). Decouples in-diagram box-select from the drawer detail-swap.

### Item 3 — AC-drag-selected-no-pan (disambiguate by SELECTION STATE)
MEASURED: RbPanZoom pans on `mousedown`/`touchstart` at scale>1 (pan-zoom.ts:51-52,68); box-drag = pointerdown + a capture-guard stopPropagation on `.dm-box` mousedown/touchstart (rb-diagram-detail:191-194). Current disambig is TARGET-based; @390 still pans on a selected-box drag.
**FIX (client, extend R33.3 disambig to SELECTION-state):** pan ONLY when nothing is selected. Add `RbPanZoom.setEnabled(bool)`; rb-diagram-detail DISABLES pan whenever `this._selectedBox` is set (a box selected → no pan at all), RE-enables on deselect (click empty canvas → clear `_selectedBox`). Box-drag (existing `wireBoxDrag`) moves the selected box; empty-canvas drag pans (selection empty). Selection-state gate subsumes the target-based edge that leaked pan. Reuse RbPanZoom + wireBoxDrag.

### Item 4 — AC-puml-folder-populated (server)
MEASURED: `mofChildren('rawbin:puml')` (server.ts:1102) returns `ior:class:PumlArtifact` units → EMPTY because NO PumlArtifact units exist in the store (the .puml files were never registered). ts/ populates by enumerating M1 `sourceFile`s (:1097-1100).
**FIX (server):** populate puml/ with the project's .puml files as itemviews (mirror ts/'s file enumeration). REUSE the R32.7 `pumlToModel` parser (already imported, server.ts:32, Import-PUML feature D). Enumerate the project's .puml source set → one itemview per .puml → click = view puml code (+ optional parse-to-model). ★AMBIGUITY to resolve with req/Tron in the AC: WHICH .puml set — (a) the existing source .puml design files (the 55 in scrum.pmo/sprints/*/diagrams/) OR (b) generated "puml-as-code" per Diagram via R32.7 `modelToPuml` (the vision's puml-as-code). RECOMMEND (b) for the M1 project (puml generated from the model, DRY with R32.7) with (a) as Import-PUML; flag for Tron's call.

### INVARIANTS / reuse / gate / deploy / chain
- **INV-R33.5-1 (add→shows):** Add-Diagram → the new empty diagram node appears under diagrams/ immediately. **INV-R33.5-2 (diagram-stays):** in-diagram box-select navigates/highlights the TREE + KEEPS the diagram; class-detail opens ONLY on tree-click. **INV-R33.5-3 (drag-disambig):** pan only if nothing selected; a selected box's drag MOVES it (no pan). **INV-R33.5-4 (puml-populated):** puml/ shows the project's .puml itemviews.
- **REUSE (no fork):** rb-diagram-detail (box-click/drag), RbPanZoom (+ new `setEnabled`), rb-trace-tree revealNode + tree-refresh, mofChildren, /api/model/diagram/create, R32.7 pumlToModel/modelToPuml. NEW = RbPanZoom.setEnabled + box-select→tree-reveal + add-diagram→tree-refresh + puml enumeration.
- **GATE @390 (Tron REAL interaction, screenshot+pixel — per the re-scope discipline):** (1) Add-Diagram → new node under diagrams/; (2) select box → tree highlights class + diagram STAYS (not swapped), class-detail only on tree-click; (3) drag selected box → moves, NO pan; drag empty → pans; (4) puml/ → shows .puml itemviews. Planted-defect bite. NOT "loads".
- **DEPLOY:** items 1-3 CLIENT (rb-diagram-detail + pan-zoom + tree reveal/refresh); item 4 SERVER (mofChildren puml). Mixed → REAL restart + boot-verify + R31.7 invariant.
- **CHAIN (#126, req):** UC diagram.uxPolish (or per-item) → Class RbDiagramDetail/RbPanZoom + the mofChildren owner → Method (boxSelect/panGate/addDiagramRefresh/pumlChildren) → Impl → Test. I mint/repoint on ship if needed.

### R33.5 ITEM-4 RULING (Tron via PO 2026-07-31, DEC-puml-set = option a) + CHAIN SHAPES (confirmed to req)
ITEM-4 RESOLVED: puml/ = the **55 EXISTING SOURCE .puml** (scrum.pmo/sprints/*/diagrams/) as itemviews; **click → Import (R32.7 pumlToModel) → interactive diagram** (reuse R33.3). NOT generated-per-diagram (option b noted for later). `mofChildren('rawbin:puml')` enumerates the .puml source set → one itemview per file (mirror ts/); click imports it.
CHAIN SHAPES (per-item singular-chain #27/#38, confirmed): (1) UC diagram.addDiagramRefresh → Class = the **model-view / action-bar host** (model.ts, where 'Add Diagram' + the R33.3-AC4 action-bar markerPending live — NOT RbDiagramDetail; the action bar ≠ the drawer diagram-detail) → Method `addDiagramRefresh` [client]. (2) UC diagram.boxSelectKeepsDiagram → Class **RbDiagramDetail** → Method `boxSelect` [client]. (3) UC diagram.dragNoPan → Class **RbPanZoom** → Method `setEnabled` [client] (singular = the NEW decl; the RbDiagramDetail wiring is a call-site, no 2nd method). (4) UC diagram.pumlChildren → Class **c0a0921d** (the mofChildren/mofLayerRoots/serverModelPage owner) → Method `pumlChildren` [server] — NOW UNHELD (Tron ruled option a), mint alongside 1-3.
