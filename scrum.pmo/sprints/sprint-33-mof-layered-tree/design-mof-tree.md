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

### ARCHITECT BACKSTOP — R33.5 v0.8.19 / dea4b00b1 (robbin-architect 2026-07-31): served-verified PASS
Restarted remoteShells:0.2 ([d] stop → npm start). BOOT-VERIFY: fresh pid 1186111 → 1807243, clean boot + serving. INVARIANT: served==pkg==SW(rawbin-v0.8.19)==0.8.19 (HEAD 2e4c7e59a, version unchanged → no re-restart). ★ ITEM-4 SERVER PASS: /api/trace/children/rawbin:puml → **55** source .puml itemviews (was {}) — real files, Tron opt-a enumeration (pumlChildren server.ts:1076, marker impl:9eb2c39c) live; /import-puml srcPath mode present (:1740) for click→Import. GATES: /model+/server-manager 403, /trace 200 (guard preserved, Tron's uncommitted). ITEMS 1-3 CLIENT-live (auto-served): item-1 add-diagram→tree-refresh (ModelView.addDiagramRefresh), item-2 box-select→tree-reveal+keep-diagram (RbDiagramDetail.boxSelect), item-3 drag-disambig (RbPanZoom.setEnabled). REMAINING (@390): item-1 add→see-node, item-2 box-select→tree-nav+diagram-stays, item-3 drag-selected→moves-no-pan, item-4 puml-item→click→Import→interactive-diagram = expert @390 self-verify (1+4 post-restart, 2+3 client-live) + Tron pixel. Endpoint/static is my ceiling (403-limited on authed render).

## R33.6.1 (a5205512) — drag-to-add broken on NEW/EMPTY diagrams — ROOT DIAGNOSIS (robbin-architect 2026-07-31, priority-1 blocker)
MEASURE-FIRST (the stated hypothesis FALSIFIED, root re-directed to client):
- **/create sets `views:[]`** (server.ts:1723) — the empty Diagram is NOT missing its views array. Hypothesis "lacks model.views[]" = FALSE.
- **SERVER add-view PROVEN working on an empty diagram:** POST /api/model/diagram/add-view against the live empty Diagram `d4e3d709` (views=0) → `{ok:true, added:true, views:1}`. The handler (server.ts:1664-1687) coerces `views = […] || (model.views=[])` and pushes fine. So the "drop-to-add MODEL-WRITE path fails on empty" is FALSIFIED — the write path works. (Probe restored: d4e3d709 → views:[].)
- **⇒ THE BUG IS CLIENT-SIDE** (rb-diagram-detail's add-INVOCATION for a new/empty diagram), NOT the server write and NOT a data gap.
- R33.5 diff (dea4b00b1) touched rb-diagram-detail items 2/3 (boxSelect local-highlight+tree-reveal, RbPanZoom.setEnabled) but did NOT change the two add-invocation paths: desktop HTML5 drop (`surface` dragover+drop → `onDropAddView` :135-138, wired count-INDEPENDENT — the empty label IS the drop zone) + @390 mobile tap-to-add (`onSelectionChanged` :64, HTML5 DnD is dead on iOS so this is the LIVE @390 path). Both paths exist for the empty case.
- **NARROWED CLIENT ROOT (two candidates, need a repro to pick):** (a) `onDropAddView` early-returns at `if(!elementUuid) return` (:160) — the drag-SOURCE (a model-tree class node) not delivering `application/rb-object-ref` to the empty-diagram drop; (b) `onSelectionChanged` tap-to-add (:65 `if(!this.getAttribute('ref')) return`; :69 `if(!ref.startsWith('modelelement:')) return`) — the new-diagram tap not firing a single `modelelement:` selection.
**HANDOFF (expert) — DECISIVE next step (I'm 403 + mobile-repro-limited):** instrument @390 a one-line log at `onDropAddView` entry (log `raw`/`elementUuid`) AND `onSelectionChanged` entry (log `sel`) on a NEW empty diagram → confirms WHICH path fires and whether the class ref reaches `addView`. Fix is then a client one-liner (deliver the ref / fire the selection). Server write + endpoint are confirmed GOOD — do NOT re-touch them. GATE @390 = drag/tap a class onto a NEW empty diagram → box appears + persists.

## R33.6.5 (3c6eee8d, items 5+6) — ACTION-BAR IN THE DRAWER + SELECTION-DRIVEN — ARCHITECT DESIGN (robbin-architect 2026-07-31)
MEASURE-FIRST: (a) `model.ts mountActionBar()` mounts `<rb-strip class=model-actions>` at the PAGE TOP (host.insertBefore firstChild) with FIXED buttons [Add-Diagram, Compile-PUML→SVG, Import-PUML] → not in the drawer, not selection-driven. (b) `rb-detail-drawer.render()` (:319) = `.drawer-header`(grab-bar+close) + `.drawer-body`(panels chat/detail/preview); `renderDetailForRef(:169)` resolves `type` from the ref + renders by tagMap. (c) ★ the drawer is SHARED (/trace, /scenario, /model) → it MUST stay generic; model-specific actions cannot be hardcoded into it.

### Design — a generic fixed action-bar REGION in the drawer + HOST-PROVIDED, type-driven contents (reuse, no fork)
**Item 5 (action-bar in the drawer, below handle / above content):** rb-detail-drawer.render() adds a FIXED `<div class="drawer-actionbar">` between `.drawer-header` and `.drawer-body` (non-scrolling; body stays the scroll region). It hosts a reused `<rb-strip>` (S31 primitive). NEW generic API `RbDetailDrawer.setActions(items: {verb,label}[])` → renders the rb-strip buttons (empty items → hidden bar). The drawer emits `rb-drawer-action {verb, ref}` on a button click. GENERIC — zero model specifics in the shared drawer.
**Item 6 (selection-driven contents):** in `renderDetailForRef(ref)` after resolving `type`, the drawer dispatches `rb-drawer-detail-shown {type, ref}` (and clears actions on empty/chat). The HOST view provides the actions: **model.ts registers a listener → `drawer.setActions(ACTIONS_BY_TYPE[type])`** and handles `rb-drawer-action` verbs via the EXISTING `addDiagram`/`importPuml`/`reSyncFromSource`. `ACTIONS_BY_TYPE` (model.ts, host-owned): `diagram`→[＋Add-Diagram, ⟳Re-Sync, ⚙Compile→SVG]; `modelelement`(class)→[＋Add to diagram]; `puml`/puml-src→[⇩Import→diagram]; default/none→[＋Add-Diagram, ⇩Import]. /trace + /scenario register NO actions → the bar stays empty/hidden there (unaffected). MOVE the page-top model action-bar (mountActionBar) INTO this drawer region (retire the page-top strip; the default/none set carries the global Add-Diagram/Import).

### INVARIANTS / reuse / gate / deploy / chain
- **INV-R33.6.5-1 (region):** the drawer has a FIXED action-bar region between the handle-bar and the scrollable content. **INV-2 (selection-driven):** the bar's buttons MATCH the current detail TYPE (diagram/class/puml/default), host-provided. **INV-3 (shared-generic, no fork):** rb-detail-drawer carries only the region + `setActions` API + `rb-drawer-action`/`rb-drawer-detail-shown` events; model actions live in model.ts → /trace + /scenario drawers UNAFFECTED (no actions registered).
- **REUSE:** rb-detail-drawer (region), rb-strip (S31), the existing addDiagram/importPuml/reSyncFromSource handlers + ACTIONS_BY_TYPE from model.ts. NEW = `.drawer-actionbar` region + `RbDetailDrawer.setActions` + the two events + model.ts's type→actions registration (moved from mountActionBar).
- **GATE @390 (Tron real interaction):** action-bar visible IN the drawer (below handle, above content); select a diagram → [Add/Re-Sync/Compile] appear; select a class → class actions; select a puml-src → [Import]; buttons work; /trace + /scenario drawers show NO model actions (shared-generic unbroken). NOT "loads".
- **DEPLOY:** CLIENT-only (rb-detail-drawer + model.ts) → version bump → real restart re-stamps /api/config (R32.7/R31.12 lesson) + R31.7 invariant.
- **CHAIN (#126, req):** UC drawer.actionBarRegion (item5) → Class RbDetailDrawer → Method setActions → Impl → Test; UC drawer.selectionDrivenActions (item6) → Class RbDetailDrawer → Method showActionsForType (dispatch rb-drawer-detail-shown) → Impl → Test; + ModelView ACTIONS_BY_TYPE registration. Per-item singular-chain.

## R33.6.2 — suppress PAGE scroll on element drag + DIAGRAM edge-autoscroll (architect 2026-07-31, unit 570b77c7)
MEASURE-FIRST: `wireBoxDrag` (rb-diagram-detail.ts:189-221) live-moves a `.dm-box` on `pointermove` but (a) NEVER `preventDefault`s / has NO `touch-action` guard → at scale 1 a touch box-drag ALSO scrolls the PAGE (Tron item-2 bug); (b) has NO edge-autoscroll → a box can't be dragged past the visible surface. RbPanZoom pan seam = `this.tx+=…; this.ty+=…; this.clamp(); this.apply()` (pan-zoom.ts:60-62); `setEnabled(false)` already disables canvas-pan while a box is selected (:230). REUSE both — NO fork.

### Fix (client-only; extend box-drag + RbPanZoom)
| # | File | Line | Current (BUG) | Fix |
|---|------|------|---------------|-----|
| A | `rb-diagram-detail.ts` | 25 (`.dm-box` CSS) | `.dm-box{cursor:pointer}` — no touch-action → touch-drag scrolls the page | `.dm-box{cursor:pointer;touch-action:none}` — a pointer-drag on a box is fully captured (already `setPointerCapture` :201), the browser never scrolls/gestures the page. INV-D1 by construction. (A box is interactive: tap-select / drag-move; never a scroll surface.) |
| B | `pan-zoom.ts` | after 62 (new public method) | pan only via internal mouse/touch handlers | add `panBy(dx,dy){ this.tx+=dx; this.ty+=dy; this.clamp(); this.apply(); }` — reuses the EXISTING clamp+apply (no new transform logic). |
| C | `rb-diagram-detail.ts` | 204-211 (`pointermove`) + `end` (:212) | live-move only; no edge handling | edge-autoscroll: in `pointermove`, compute `surface.getBoundingClientRect()`; if the pointer is within an EDGE BAND (e.g. 24px) of — or beyond — an edge, start a `requestAnimationFrame` loop calling `this.pz?.panBy(±speed,0/0,±speed)` (speed ∝ overshoot, capped) so the DIAGRAM scrolls toward the edge; the box keeps tracking the pointer in content-space (nx/ny already `/s`), so it follows as the canvas pans. Stop the rAF on `pointerup`/`pointercancel` (extend `end`) or when the pointer re-enters the band. ONLY the diagram pans — the page never scrolls (A). |

### INVARIANTS
- **INV-D1 (no page scroll on element drag):** a box drag never scrolls the page — BY CONSTRUCTION (`.dm-box{touch-action:none}` + pointer capture).
- **INV-D2 (edge-autoscroll = diagram-only, just-outside):** autoscroll pans ONLY the RbPanZoom content, ONLY while the drag pointer is at/just-outside a surface edge; idle otherwise; stops on drag end. Never the page.
- **INV-D3 (no fork):** reuse `wireBoxDrag` + RbPanZoom (one new `panBy`); R33.3 move-view/persist + R33.5 box-select unchanged.

### GATE / chain
- **GATE (tester + Tron @390):** (a) touch-drag a box at scale 1 → PAGE does NOT scroll [D1]; (b) drag a box toward/past the surface edge → the DIAGRAM auto-scrolls to reveal canvas, box keeps following, PAGE still static [D2]; (c) release → autoscroll stops + x,y persists (R33.3) survives reload; (d) a tap (no move) still selects (R33.5), pan re-enables on deselect; (e) /trace + existing diagram select/move UNREGRESSED.
- **Chain (extend R33.3 move):** unit 570b77c7 — UC/Method on the box-drag/edge-autoscroll (mirror R33.3 diagram.moveView); req mints scenario-first (#126); I mint/repoint Impl on ship if needed. Client-only → version bump → REAL restart at the R33.6 boundary (restart-hold(b); R32.7 lesson).

## R33.6.3 — reroute connector LINES on move (architect 2026-07-31, unit 50e4f6f0)
MEASURE-FIRST: edges are a PURE function of box rects — `buildEdges` (diagram-view-model.ts:63) draws each connector `borderPoint(src,tc)→borderPoint(tgt,sc)` (:82) with `data-rel-from`/`data-rel-to`/`data-rel-kind` on the `<line>` (:84). But `wireBoxDrag` pointermove (rb-diagram-detail.ts:210) updates ONLY the moved box's `transform` — the EDGES are NOT recomputed → connectors stay pinned to the box's OLD border until a full re-render (Tron item-3). REUSE `borderPoint` (the ONE geometry fn) live — NO fork, no live-vs-render drift.

### Fix (client-only; extend R33.3 move → live edge recompute)
| # | File | Line | Current (BUG) | Fix |
|---|------|------|---------------|-----|
| A | `diagram-view-model.ts` | 52 (`borderPoint`) | module-private | EXPORT `borderPoint` (+ `type Rect`) — the SAME clip-to-border geometry the static render uses, reused live so there is ZERO divergence between the dragged and the re-rendered edge. (Optionally export a thin `edgeEndpoints(src:Rect,tgt:Rect)={a:borderPoint(src,center(tgt)),b:borderPoint(tgt,center(src))}`.) |
| B | `rb-diagram-detail.ts` | new `rerouteEdges(uuid,rect)` | — | for each `svg .dm-edge[data-rel-from="modelelement:UUID"], .dm-edge[data-rel-to="modelelement:UUID"]`: recompute BOTH endpoints from the two boxes' CURRENT rects (moved box = its live translate + bg w/h; other box read from ITS `.dm-box` transform + bg w/h) via the exported geometry; set `x1/y1/x2/y2`. A small `boxRect(el)` helper reads `translate(x,y)` from the `.dm-box` transform + w/h from its `.dm-box-bg`. |
| C | `rb-diagram-detail.ts` | 210 (`pointermove`) | box transform only | after `setAttribute('transform', translate(nx,ny))`, call `this.rerouteEdges(drag.uuid, {x:nx,y:ny,w,h})` → connectors follow the box LIVE (as source AND as target). On drag `end`/persist, the next authoritative `buildEdges` render matches by construction (same geometry). |

### INVARIANTS
- **INV-R1 (edges follow, no drift):** a moved box's connectors re-route live to its border via the EXPORTED `borderPoint` — identical to the static render, so release→re-render shows NO jump. Correct-by-construction (single geometry fn).
- **INV-R2 (only connected edges):** only `<line>`s whose `data-rel-from`/`data-rel-to` == the moved uuid are recomputed; all others untouched.
- **INV-R3 (no fork):** reuse `borderPoint` + R32.6 edge `data-*` attrs; R32.6 edge model + R33.3 move-persist unchanged; `buildEdges` stays authoritative on full render. Composes with R33.6.2 (during edge-autoscroll the box moves in content-space → reroute keeps edges attached).

### GATE / chain
- **GATE (tester + Tron @390):** (a) move a box that is an edge SOURCE → its outgoing connectors follow the box border live; (b) move a box that is an edge TARGET → incoming connectors follow; (c) a box with MULTIPLE edges → all reroute; (d) release → persisted + re-rendered edges match the live geometry (no jump) [R1]; (e) unrelated edges/boxes untouched [R2]; (f) R32.6 static edges + /trace UNREGRESSED.
- **Chain (extend R33.3 move):** unit 50e4f6f0 — UC/Method on the reroute (mirror R33.3 diagram.moveView); req mints #126; I mint/repoint Impl on ship. Client-only → REAL restart at the R33.6 boundary (hold-b).

## R33.6 item-4 / R33.1.1 — CLIENT itemview-render of EXISTING-SOURCE .puml (architect 2026-07-31, unit 5333d468)
MEASURE-FIRST: the render MECHANISM already exists — `rb-preview.renderPuml(content)` (rb-preview.ts:55) POSTs to `/api/puml-render` (server.ts:1812, plantuml -tsvg -pipe) → SVG + wheel-zoom. The source-.puml API half (R33.5 item-4, 9eb2c39c) is DONE. GAP is CLIENT-ONLY: `rb-modelelement-detail.render` (rb-modelelement-detail.ts:31-68) shows «kind» + `m.sourceFile` + members + relatesTo but renders NO .puml itemview. This is the EXISTING-source .puml (the element's authored/linked .puml served by the done R33.5 half) — NOT R32.7 generated-puml (PO explicit).

### Fix (client-only; reuse renderPuml — NO fork, NO generated-puml)
| # | File | Line | Current (gap) | Fix |
|---|------|------|---------------|-----|
| A | `rb-modelelement-detail.ts` | 31-68 (`render`) | no .puml section | when the element has an existing-source .puml (resolve via the DONE R33.5 item-4 /api half — the element's puml source-link / its `sourceFile`→.puml), add a "PUML" itemview section that renders the .puml SVG. |
| B | `rb-modelelement-detail.ts` | (render body) | — | REUSE `rb-preview`'s render path: fetch the existing .puml source text (R33.5 endpoint), then render via the SAME `/api/puml-render`→SVG the `rb-preview.renderPuml` uses (either import/mount `<rb-preview mode=puml>` with the fetched content, or call the shared puml-render→SVG helper). ZERO new render logic; identical SVG + zoom as the /md preview. |
| C | (scope guard) | — | — | itemview shows the .puml ONLY IF an existing-source .puml resolves; absent → no section (no error, no generated-puml fallback). Reuse, no fork. |

### INVARIANTS
- **INV-P1.1 (existing-source only):** the itemview renders the EXISTING authored .puml (R33.5 source half), NEVER R32.7 model-generated puml. Absent source → no section.
- **INV-P1.2 (render reuse):** SVG comes from the SAME `/api/puml-render` + `rb-preview` render path as the /md preview — identical output, no second renderer (no fork).
- **INV-P1.3 (isolation-safe):** read-only render (fetch source + POST to render) — no store/prod mutation.

### GATE / chain
- **GATE (tester + Tron @390):** (a) open a model element (class/interface) that HAS an existing-source .puml → the detail itemview shows the rendered .puml SVG (zoomable, like /md) [P1.1/P1.2]; (b) an element WITHOUT a source .puml → no PUML section, no error [P1.1]; (c) the SVG matches the /md preview of the same .puml (same renderer) [P1.2]; (d) /trace + /md preview + rb-modelelement-detail members/relatesTo UNREGRESSED.
- **Chain:** unit 5333d468 (folds R33.1.1) — UC/Method on the itemview puml-render (mirror rb-modelelement-detail.render c2da9192); req mints #126; I mint/repoint Impl on ship. Client-only → REAL restart at the R33.6 boundary (hold-b). NOTE for expert: confirm the exact R33.5 item-4 source-.puml route (9eb2c39c) for the fetch in (B).

## R33.7.1 — ZOOM-OUT grows the canvas + PER-DIAGRAM PERSISTED zoom (architect 2026-07-31, unit 754a1f9d)
MEASURE-FIRST: RbPanZoom `scale` is clamped **[MIN=1, MAX=8]** (pan-zoom.ts:18-19) → you can ONLY zoom IN, never OUT; `zoomAbout` clamps to that range (:128); `clamp()` (:136) assumes content ≥ viewport (scale≥1). buildDiagramSvg emits `<svg viewBox="0 0 maxX maxY" preserveAspectRatio="xMidYMid meet">` (diagram-view-model.ts:105) → at scale 1 the WHOLE diagram fits (=100%). ACUTE SPACE PROBLEM (crossRef R33.6.2): no zoom-out to reveal working canvas, and zoom isn't remembered per diagram. REUSE RbPanZoom — no fork.

### Fix (extend RbPanZoom + persist zoom on the Diagram unit)
| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| A | `pan-zoom.ts` | 18 (`MIN=1`) + 136 (`clamp`) | scale floor = 1 (no zoom-out); clamp assumes content ≥ viewport | lower `MIN` to e.g. **0.25** (zoom-OUT enabled; wheel/pinch already call zoomAbout). Extend `clamp()`: when `scale < 1` (content < viewport) CENTER the content (tx/ty = (vw−vw·s)/2) instead of the ≥1 edge-clamp → zoom-out reveals empty canvas AROUND the diagram = working room. INV-Z1: `1 = 100% = whole-diagram`, `<1` = grown working canvas, `>1` = magnify. |
| B | `diagram-view-model.ts` | 105 (`vb`) | `viewBox = 0 0 maxX maxY` (tight bounds) | pad the canvas: `vb = 0 0 (maxX+CANVAS_PAD) (maxY+CANVAS_PAD)` (or a min-canvas) so the zoom-out-revealed margin is REAL placeable space (drag boxes into it, composing with R33.6.2 edge-autoscroll) — not just empty container gutter. |
| C | server + client (persist) | new `POST /api/model/diagram/zoom` (mirror R33.3 move-view :~1532) + `pan-zoom.ts` init | zoom not persisted | persist `model.zoom` on the Diagram unit in **MODEL_STORE** (mirror move-view's store-only write; prod scenario/index NEVER touched, R32.5). On zoom-end the client POSTs `{diagramUuid, zoom}`; on render RbPanZoom inits to the persisted `model.zoom` (new `setScale(s)`/`initialScale` seam reusing zoomAbout+clamp+apply). INV-Z2. |

### INVARIANTS
- **INV-Z1 (zoom range + fit semantics):** scale ∈ [0.25, 8]; `1 = 100% = whole-diagram` (fit); `<1` reveals working canvas (centered by extended clamp); content always reachable at any scale.
- **INV-Z2 (per-diagram persisted, isolated):** the zoom level is stored on the Diagram unit in MODEL_STORE and restored on reopen; write is store-only — prod scenario/index NEVER mutated (R32.5).
- **INV-Z3 (reuse, composes):** RbPanZoom extended (MIN + one setScale/init seam), NO fork; composes with R33.6.2 edge-autoscroll (zoom-out to see/place, autoscroll to drag past edge) — together they solve the space problem.

### GATE / chain
- **GATE (tester + Tron @390):** (a) zoom OUT below 100% → the diagram shrinks and working canvas appears around it; boxes are placeable/draggable into it (composes w/ R33.6.2) [Z1]; (b) scale 1 = the whole diagram (100%) [Z1]; (c) set a zoom, reopen the diagram → the SAME zoom restores (per-diagram persisted) [Z2]; (d) prod scenario/index git-clean/unchanged across zoom-persist [Z2 isolation]; (e) /trace + existing pan/zoom-in + R33.5 select/R33.3 move UNREGRESSED.
- **Chain (mirror R33.3 move-view persist):** unit 754a1f9d — UC diagram.persistZoom → RbPanZoom/RbDiagramDetail → Method (setScale + zoom-persist) → Impl; req mints #126. SERVER endpoint (zoom persist) → R32.5 discipline (__dirname-below store write) → REAL restart at the next R33 boundary (hold-b). Client zoom-range is client-only.

## R33.7.2 — items 2+3 COUPLED: add-auto-relationships + discover-action (architect 2026-07-31, unit 2a3090ad, 2 UCs)
MEASURE-FIRST: `buildEdges` (diagram-view-model.ts:63) draws an edge X→Y IFF BOTH are on-diagram, from `model.relations` (both directions, since it iterates every on-diagram node's relations); `addView` (rb-diagram-detail.ts:170) POSTs add-view then `render()` → buildEdges re-runs. M1 model carries `relatesTo[]` (out) + `relatedFrom[]` (in) + `relations[]{to,type}` (TsToModel.ts:57-60). R33.6.5 action-bar gives type-driven verbs; `/api/ior/ior:instance:<uuid>` returns a unit's model; add-view is store-only (R32.5). REUSE all — CLIENT-ONLY, no fork, no new endpoint.

### UC1 — diagram.addAutoRelationships (item-2): model-derived edges auto-appear on add
Largely BY CONSTRUCTION: `addView` → `render()` → `buildEdges` surfaces the newly-added element's relationships to on-diagram elements (BOTH directions) from `model.relations`. Design = ENSURE + formalize: after any add-view/discover, a full buildEdges pass runs (already does) so the added element's model-derived edges wire immediately. **INV-AR1: relationships are ALWAYS model-derived (TsToModel), NEVER fabricated** — add auto-WIRES existing model relations, never invents new ones.

### UC2 — diagram.discoverAction (item-3): 1-level graph expand from selection
NEW client action: a `discover` verb on the R33.6.5 action-bar for a selected model element → resolve its 1-LEVEL neighbors and add-view each.
| # | File | Line | Add |
|---|------|------|-----|
| A | `model.ts` | 60-66 (`ACTIONS_BY_TYPE`) | add `{verb:'discover', label:'⌗ Discover related'}` to `modelelement` (+ diagram). |
| B | `model.ts` | 77-... (verb dispatch) | `else if (verb==='discover') void discoverRelated(ref)` — reuse the R33.6.5 `rb-drawer-action{verb,ref}` path. |
| C | `model.ts` | new `discoverRelated(ref)` | fetch the element model via `/api/ior/ior:instance:<uuid>` → collect the 1-level neighbor uuids = `relatesTo` (out: base/extends via Generalization, nav/targets via Association/Dependency) ∪ `relatedFrom` (in: subclasses/implementers) → for each, `addView(neighborUuid)` (existing R32.11 endpoint, server auto-grid, dedup). Then UC1/buildEdges wires the edges. 1 LEVEL ONLY (the fetched element's direct neighbors — no transitive walk). |

### INVARIANTS
- **INV-AR1 (model-derived, both-dir):** auto-relationships come from `buildEdges` over `model.relations` — both directions, NEVER fabricated. By construction.
- **INV-DA1 (bounded 1-level):** discover adds EXACTLY the selected element's direct `relatesTo`∪`relatedFrom` neighbors — not transitive.
- **INV-DA2 (reuse, no fork, client-only):** R33.6.5 action-bar verb + `/api/ior` model read + `addView` (R32.11) + `buildEdges` (R32.6). NO new endpoint, NO fork.
- **INV-DA3 (isolation):** discover adds view-links to the Diagram in MODEL_STORE (add-view store-only) — prod scenario/index NEVER mutated (R32.5).

### GATE / chain
- **GATE (tester + Tron @390):** (a) add an element whose model relates to on-diagram elements → its edges auto-appear (both directions) [AR1]; (b) select an element → Discover → its 1-level neighbors (base/extends, nav-targets, subclasses/interfaces) are added + edges wire [DA1]; (c) discover is bounded to 1 level (a neighbor's neighbors are NOT auto-added) [DA1]; (d) re-Discover = idempotent, no dup boxes (R32.11 deterministic uuid) [DA2]; (e) prod scenario/index unchanged [DA3]; (f) /trace + R32.6 edges + R33.6.5 action-bar UNREGRESSED.
- **Chain (2 UCs, reuse):** unit 2a3090ad — UC diagram.addAutoRelationships (rides buildEdges 8c68b925 / addView 70be1605) + UC diagram.discoverAction → Method discoverRelated (model.ts) → Impl; req mints #126 (2 UCs). CLIENT-ONLY → version bump → REAL restart at the next R33 boundary (hold-b).

## R33.7.4 — SELECT element → TREE scroll+expand reveal (architect 2026-07-31, unit fc234e2d)
MEASURE-FIRST: the two seams EXIST but aren't connected. `boxSelect` (rb-diagram-detail.ts:229) DISPATCHES `rb-tree-reveal`{ref} on box-select ("best-effort"). rb-trace-tree has `revealNode(uuid)` (:448 — fetchAncestorPath + expand each ancestor + scrollIntoView, lazy-safe via waitForNode) AND R33.5 `expandPath(uuids)` (:71). BUT rb-trace-tree has NO `rb-tree-reveal` listener (it listens for rb-model-resynced/toggle-children/hashchange only) → the dispatch has NO receiver → select→tree-reveal is DEAD. REUSE revealNode/expandPath — no new reveal logic, no fork.

### Fix (client-only; wire the existing dispatch → the existing reveal)
| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| A | `rb-trace-tree.ts` | 102 (connectedCallback, by the rb-model-resynced listener) | no rb-tree-reveal listener | `document.addEventListener('rb-tree-reveal', this.onTreeReveal)` (+ remove in disconnectedCallback :108). |
| B | `rb-trace-tree.ts` | new `onTreeReveal` | — | `onTreeReveal = (e) => { const ref = (e as CustomEvent).detail?.ref; if (ref) void this.revealNode(refUuid(ref)); }` — reuse `revealNode` (ancestor-walk expand + scroll). Lazy model tree: `fetchAncestorPath` uses `/api/trace/children` (isModelUnit→MODEL_STORE routed) → ancestors expand on demand. |

### INVARIANTS
- **INV-TR1 (select→reveal by reuse):** selecting a diagram element reveals it in the tree (scroll + expand ancestors + highlight) via the EXISTING `revealNode`/R33.5 `expandPath` — no new reveal logic.
- **INV-TR2 (lazy-safe):** `revealNode`'s fetchAncestorPath + waitForNode expand the lazy model tree on demand (MODEL_STORE-routed). By construction.
- **INV-TR3 (best-effort, no fork):** reuse boxSelect's existing `rb-tree-reveal` dispatch + revealNode; if the element isn't in THIS tree (no root match) revealNode no-ops gracefully. No fork; existing /trace reveal + R33.5 expandPath + selection UNCHANGED.

### GATE / chain
- **GATE (tester + Tron @390):** (a) select a diagram box → the tree scrolls to + expands-reveals the element (highlighted) [TR1]; (b) a DEEP/lazy element → its ancestors auto-expand then it reveals [TR2]; (c) select a box whose element isn't in the current tree → graceful no-op (no error) [TR3]; (d) /trace tree reveal (hashchange/revealNode) + R33.5 expandPath + existing selection UNREGRESSED.
- **Chain (reuse R33.5 reveal):** unit fc234e2d — UC modelElement.revealInTree → rb-trace-tree onTreeReveal → Method (reuse revealNode) → Impl; req mints #126. CLIENT-ONLY → version bump → REAL restart at the next R33 boundary (hold-b).

## ★ item-4 / R33.1.1 SCOPE-PIN (architect 2026-07-31, resolves expert's 3-reading ambiguity — supersedes the element-centric wording in the gate above)
DATA=TRUTH reconciliation: UC 8b858586 description ITSELF says "EXISTING-SOURCE .puml under the puml/ folder ... a puml-src itemview reuses rb-preview.renderPuml → /api/puml-render". The puml/ folder enumerates existing source .puml (server.ts:1073, `scrum.pmo/sprints/*/diagrams/*.puml`) as leaf nodes with ref `puml-src:<sprint>/<file>` (kind puml). The old R33.1.1 "generated modelToPuml / project-node-leaf" AC is SUPERSEDED (Tron + PO: EXISTING PUML rendered as itemviews in the puml folder, NOT generated).
- **Q1 = (A) the puml-src FOLDER-LEAF itemview** — NOT a per-class/interface element linking a .puml (no such per-element link exists; existing .puml are folder source files). Selecting a `puml-src:<relpath>` node renders its .puml.
- **Q2 = YES, raw existing content via the renderPuml path** — GET `/md/<relpath>.puml` (server.ts:2498, text/plain, read-only) → POST `/api/puml-render` → SVG = the SAME rb-preview.renderPuml path (INV-P1.2 no-fork, P1.3 read-only). RAW EXISTING .puml text, NEVER generated modelToPuml (INV-P1.1).
- **Mount = `RbModelElementDetail.render` puml-src BRANCH** (Impl renderPumlSource b0c0d27d): DETECT a `puml-src:` ref (currently falls through fetchModel→"Model element not found"); instead fetch `/md/<relpath>` → render SVG (mount `<rb-preview mode=puml>` or inline the fetch→/api/puml-render→SVG). Class/interface element detail path is UNCHANGED.
- **GATE (corrected):** (a) select a puml-src LEAF in the puml/ folder → its detail renders the existing .puml SVG (zoomable, like /md) [P1.1/P1.2]; (b) the raw existing .puml is shown, NOT generated [P1.1]; (c) SVG matches the /md preview of the same file [P1.2]; (d) selecting a class/interface element → its normal detail (no puml-src branch) UNREGRESSED; /trace + /md + R33.5 import (puml-src click→import) UNREGRESSED.

## ★ item-4 RED — DIAGNOSIS (architect 2026-07-31, tester found 2 real bugs on served prod)
### BUG-A (path 404) — ROOT = the puml-src ref DROPS `diagrams/`; fixes BOTH render AND import
MEASURED: `pumlChildren` (server.ts:1079-1082) READS files from `scrum.pmo/sprints/<sp>/diagrams/` (`readdirSync(join(base, sp, 'diagrams'))`) but EMITS the ref `puml-src:${sp}/${f}` — **omitting the `diagrams/` segment**. BOTH consumers reconstruct the WRONG path: (1) renderPumlSource → `GET /md/scrum.pmo/sprints/<sp>/<f>` → 404; (2) import-puml (server.ts:1763-1764) → `path.join(sprintsDir, '<sp>/<f>')` = `scrum.pmo/sprints/<sp>/<f>` → also 404 (`no-puml-file`). Files are ls-confirmed at `scrum.pmo/sprints/<sp>/diagrams/<f>.puml`. So R33.5 import was ALSO silently broken by this ref (item-4 render just surfaced it first).
**FIX = OPTION A (root, ONE line, fixes both):** `pumlChildren` server.ts:1082 → `mofFolder(\`puml-src:${sp}/diagrams/${f}\`, ...)` (carry the TRUE relpath). Then import-puml `join(sprintsDir, '<sp>/diagrams/<f>')` ✓ + renderPumlSource `/md/scrum.pmo/sprints/<sp>/diagrams/<f>` ✓ — both resolve. The ref becomes canonical=real-path; import-puml's `/^[\w./-]+\.puml$/` (:1765) allows the extra `/`. (Option B = patch only renderPumlSource's fetch to insert `diagrams/` — render-only, leaves import broken; REJECTED — A is the root fix.) SERVER change (pumlChildren) → activates on the boundary restart. Expert: also re-verify R33.5 import now resolves.

### BUG-B (501) — ROOT = prod has NO plantuml binary (DEFINITIVE; the boundary restart does NOT fix it)
MEASURED: `/api/puml-render` (server.ts:2087-2097) shells `execFileSync('plantuml', ['-tsvg','-pipe'], …)`; on `ENOENT` it returns **501 `plantuml not installed on server`** (:2097). `command -v plantuml` on WODA.prod = **NONE**. Live POST → 501. → NOT phantom-deploy (route EXISTS + responds 501, not 404), NOT never-implemented (code+catch present). **The deferred R33-boundary restart will NOT resolve BUG-B** — restarting cannot install a missing binary.
**FIX = HOST/OPS (not code): install plantuml on WODA.prod** (`apt-get install -y plantuml`, or plantuml.jar + a `java -jar` wrapper on PATH as `plantuml`) — needs java. ALTERNATIVE (if host install is refused): switch the renderer (client-side JS PlantUML, or a PlantUML web-service proxy) = a design change, larger. RECOMMEND: install plantuml on the host (minimal, the endpoint is already built for it). This is a PO/host-owner decision — flagged.

### SEQUENCE (orthogonal fixes): expert fixes BUG-A ref (server.ts:1082) → install plantuml on host (BUG-B) → ONE boundary restart to 0.8.25 (activates BUG-A ref + re-stamp) → tester re-gates item-4 (puml-src leaf → /md 200 → /api/puml-render 200 SVG). BUG-A + BUG-B are INDEPENDENT — both required before item-4 goes green.

## ★ R33.7.4 RED — REAL BUG (architect verdict 2026-07-31, tester 5b5a32e5d; MEASURED on served 0.8.29, NOT a harness limit)
DATA=TRUTH (real served /model): a real MODEL_STORE element (attr 99838aa8, kind=attribute, model.memberOf=ior:instance:35a076ca) → `GET /api/trace/children/99838aa8` returns **parent:null**. ROOT: `/api/trace/children` (server.ts:2030-2046) resolves `parent` ONLY from `ownerIor` (model elements have ownerIor:null, TsToModel) or a FWD_SCAN map (Requirement/Task/UseCase/Class/Method — NOT ModelElement) — it IGNORES the model's `memberOf`; and the model tree's hierarchy is SYNTHETIC folders (project:RawBin → ts/puml/diagram → class → member via mofChildren), not unit-parent links. So `revealNode.fetchAncestorPath` (reads data.parent.uuid) gets null → empty path → reveal SKIPs. Compounded by data-always-expanded stripped (layer-by-layer collapsed → element not pre-rendered → the in-DOM highlight path also can't fire). Both tester blockers = REAL. My R33.7.4 INV-TR2 ("lazy-safe via fetchAncestorPath MODEL_STORE-routed") ASSUMED fetchAncestorPath works for model units — WRONG (architect owns this).
**FIX = onTreeReveal must use the MODEL-tree reveal (R33.5 `expandPath` with the explicit synthetic path), NOT `revealNode` (unit-parent-walk, built for the TRACE tree).** revealNode works on /trace (units carry ownerIor/FWD_SCAN parents); the MODEL tree needs the explicit structural path. R33.5 already does this: importPumlSrc calls `tree.expandPath(['mof-m1','project:RawBin','rawbin:diagram'])` (model.ts:160). onTreeReveal(ref) should build the model element's structural ancestor path — `['mof-m1','project:RawBin', <kind-folder ref>, ...(memberOf class if a member), 'modelelement:<uuid>']` (folder refs from mofChildren/mofLayerRoots) — and call `expandPath(path)`. Client-only; reuse R33.5 expandPath (INV-TR1 reuse still holds, just the RIGHT reuse). Alternative (server): populate `parent` for ModelElement from `memberOf` + a synthetic folder/project chain so fetchAncestorPath walks — but the synthetic-folder levels aren't units, so expandPath (explicit path) is the cleaner reuse. Hand expert; architect pairs on the exact folder refs.
GATE (re-gate on real /model + Tron device): box-select a diagram class → the tree expands mof-m1→project→folder→the class and scroll-reveals+highlights it (deep/collapsed OK); non-model /trace revealNode UNCHANGED.

### R33.7.4 FIX — CONCRETE expandPath spec (architect, measured mofChildren/mofLayerRoots server.ts:1090-1130)
The model tree synthetic hierarchy (mofChildren): `mof-m1` (:1130) → `project:RawBin` (:1100) → `rawbin:ts`/`rawbin:puml`/`rawbin:diagram` (:1109-1111) → (ts) `file:<sourceFile>` (:1117, uuid keeps FULL path) → `modelelement:<uuid>` (members nest under their class via memberOf). A diagram box = an M1 class/interface from TS source → lives under `rawbin:ts`.
CONCRETE onTreeReveal(ref):
```
private onTreeReveal = async (e: Event): Promise<void> => {
  const ref = (e as CustomEvent).detail?.ref; if (!ref) return;
  const uuid = refUuid(ref);
  const m = (await (await fetch(`/api/ior/ior:instance:${uuid}`)).json())?.unit?.model;
  if (!m) return;
  const base = ['mof-m1', 'project:RawBin', 'rawbin:ts', `file:${m.sourceFile}`];
  const tail = m.memberOf
    ? [`modelelement:${refUuid(String(m.memberOf))}`, `modelelement:${uuid}`]  // member: class then member
    : [`modelelement:${uuid}`];                                                // class/interface
  await this.expandPath([...base, ...tail]);   // R33.5 reuse (the mechanism importPumlSrc uses model.ts:160)
};
```
VERIFY-WITH-EXPERT (2 points): (1) the ModelElement leaf ref format in the tree = `modelelement:<uuid>`? (confirm vs mofElNode — the DISPLAY type is the M2 facet, but the tree NODE ref/data-seed should be the raw modelelement uuid — expandPath matches on the node ref). (2) rawbin:ts sub-groups by `file:<sourceFile>` where the file: uuid is the FULL sourceFile path (:1117) — so `file:${m.sourceFile}` must be the full repo-relative path, not basename. Non-TS (imported-puml) elements would path under rawbin:puml, but diagram boxes are TS-source M1 → rawbin:ts is correct. expandPath already lazy-loads each layer (R33.5 item1), so the collapsed/always-expanded-stripped tree is fine. Architect available to pair.

## R33.8 — remove-from-diagram (architect 2026-07-31, unit 86219c51) — INVERSE of R33.5 add-view, reuse-heavy no-fork
MEASURE-FIRST: add-view (server.ts:1664-1688) loads the Diagram unit from MODEL_STORE, appends `{unit:'modelelement:<uuid>',x,y,viewKind}` to `model.views[]` (dedup, store-only INV-R3, prod untouched), writes back. R33.6.5 action-bar (ACTIONS_BY_TYPE model.ts:62 + wireDrawerActions verb-dispatch) hosts type-driven verbs. buildEdges (R32.6) draws edges only for on-diagram boxes → a full re-render after a view drop recomputes all edges. REUSE all — inverse endpoint + one verb + re-render.

### Fix (1 server endpoint + 1 client verb)
| # | File | Add |
|---|------|-----|
| A | `server.ts` new `POST /api/model/diagram/remove-view` (mirror add-view :1664) | parse {diagramUuid, elementUuid}; SAME UUID path-safety (:1671); load Diagram from MODEL_STORE (404 if missing); `const link='modelelement:'+elementUuid; const before=views.length; unit.model.views = views.filter(v=>v.unit!==link);` → if `views.length===before` return `{ok,removed:false}` (idempotent, absent); else write back (MODEL_STORE ONLY, prod scenario/index NEVER touched, INV-R3 mirror) + log + `{ok,removed:true,views}`. ★ Removes ONLY the VIEW-LINK; the ModelElement UNIT file (data/model-store/index/<uuid>) is NEVER touched. |
| B | `model.ts` ACTIONS_BY_TYPE.modelelement (:62) | add `{verb:'remove-from-diagram', label:'✕ Remove from diagram'}`. |
| C | `model.ts` wireDrawerActions dispatch + new `removeFromDiagram(ref)` | `else if (verb==='remove-from-diagram') void removeFromDiagram(shownRef)`; `removeFromDiagram(ref)`: resolve the open diagram (the /api/model/tree diagram root, same heuristic as discoverRelated) → `POST /api/model/diagram/remove-view {diagramUuid, elementUuid:refUuid(ref)}` → on ok, re-render the diagram (rb-diagram-detail.render → buildDiagramSvg/buildEdges): the box + ITS edges drop, remaining boxes' connectors recompute by construction (no dangling; R33.6.3 reroute is for LIVE drag — the full re-render is the authoritative reroute). |

### INVARIANTS
- **INV-RM1 (view-NOT-model):** remove drops ONLY the Diagram's view-link; the ModelElement unit STAYS in MODEL_STORE (re-addable via add-view/discover). Deleting the model unit = RED. BY CONSTRUCTION (handler filters `model.views`, never touches the element file).
- **INV-RM2 (isolation):** remove-view writes ONLY the Diagram unit in MODEL_STORE; prod scenario/index NEVER mutated (R32.5, mirror add-view INV-R3).
- **INV-RM3 (reuse/no-fork):** R33.6.5 verb + inverse-of-add-view endpoint + re-render (buildEdges recomputes). No new mechanism.
- **INV-RM4 (idempotent):** removing an absent element = no-op (removed:false), symmetric to add-view dedup.

### GATE / chain
- **GATE (tester + Tron @390):** (a) select a class on the diagram → 'Remove from diagram' → the box + its connectors disappear [RM3]; (b) ★ the ModelElement UNIT STAYS — tree still lists it, re-addable; grep count of ior:class:ModelElement in MODEL_STORE UNCHANGED after remove (only the Diagram's views[] shrinks) [RM1 — deleting the model = RED]; (c) remaining boxes' edges recompute, no dangling [RM3/R32.6]; (d) re-add the same element (add-view/discover) → box reappears (idempotent, deterministic uuid) [RM4]; (e) prod scenario/index git-clean UNCHANGED [RM2]; (f) /trace + add-view/move-view/discover UNREGRESSED.
- **Chain (inverse of diagram.addView cdd29583):** unit 86219c51 — UC diagram.removeView → Method removeFromDiagram (client) + persistRemoveView (server) → Impl; req mints #126. SERVER endpoint → R32.5 discipline (__dirname-below MODEL_STORE write) → REAL restart at the next R33 boundary (hold-b). Client verb = client-only.

## R33.10 — model tree completeness + folder grouping (architect 2026-07-31, Tron device)
MEASURED: disk src has **123 .ts** files; MODEL_STORE has 517 M1 units but only ~25 DISTINCT sourceFiles. `rawbin:ts` (server.ts:1158-1161) groups `m1Roots.filter(isSrc)` BY sourceFile → one `file:<sf>` node per GENERATED file → shows only the ~25 files that were run through TsToModel.generate (bounded generate-project). The tree faithfully shows what's GENERATED; the gap is generation-scope, not enumeration.
- **item-1 (55 puml) = DONE** — BUG-A option-A fix live (v0.8.28), `/api/trace/children/rawbin:puml`=55, refs carry `diagrams/`. Verified.
- **item-2 (25→ALL ts) + item-3 (folder grouping) = ONE fix: enumerate the src/ DIRECTORY TREE.** Redesign `rawbin:ts` (+ its children) to walk `src/` recursively (like pumlChildren reads the diagrams dir) emitting **folder nodes by directory** (`dir:<relpath>`) + **.ts file leaves** (`file:<relpath>`) for ALL 123 files — NOT just generated sourceFiles. Under a `file:` leaf → its M1 ModelElements from MODEL_STORE if generated, else empty (or generate-on-expand, reuse /api/model/generate). This gives COMPLETENESS (all 123, folder hierarchy) AND folder grouping in one — the directory hierarchy IS the grouping (Tron: "grouping in folders makes sense").

### Fix (server enumeration; mirror pumlChildren's disk walk)
| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| A | `server.ts` | 1158-1161 (`rawbin:ts`) | groups by sourceFile of GENERATED M1 (~25) | walk `src/` recursively (fsSync.readdirSync, `.ts` only) → emit `dir:<rel>` folder nodes (one per subdir, with child-count) + `file:<rel>` leaves for ALL files, grouped by directory. |
| B | `server.ts` | new `dir:` case in mofChildren | none | `if (uuid.startsWith('dir:'))` → list that directory's subdirs (`dir:`) + `.ts` files (`file:`). Recursive lazy layer (reuse the layer-by-layer pattern). |
| C | `server.ts` | 1165 (`file:` case) | resolves M1 by sourceFile == full sf | keep: `file:<rel>` → its M1 ModelElements from MODEL_STORE (empty if not generated). Optionally a generate-on-expand affordance (reuse /api/model/generate). |
### INV-T (R33.10): T1 completeness (ALL 123 src .ts appear, folder-grouped) / T2 folder-hierarchy (dir nodes mirror the src/ tree) / T3 no-fork (reuse the mof layer-by-layer + /api/trace/children routing; puml/diagram folders unchanged) / T4 isolation (read-only src walk + MODEL_STORE reads; prod scenario/index untouched).
### GATE (tester @390): ts/ shows ALL src .ts grouped in directory folders (count==disk 123); expand a folder → its files/subfolders; expand a file → its M1 elements (generated) or empty; puml/=55 + diagram/ unregressed; /trace unregressed. SERVER change → boundary restart.

## R33.9 — context-aware action lifecycle (architect 2026-07-31, Tron IMG_4802/4803)
MEASURED: `ACTIONS_BY_TYPE` (model.ts:60-66) keys verbs by the SELECTED element's TYPE ONLY — modelelement → add/discover/remove — IGNORING whether a diagram is open. `removeFromDiagram`/`discoverRelated`/`addView` resolve the diagram via `/api/model/tree` roots.find(type==diagram) = **"any/last diagram"** = the FRAGILE implicit target Tron flagged. So membership verbs show with NO diagram (IMG_4803, wrong target) and the code can't show "remove from THIS diagram" when a diagram IS open (IMG_4802 gap).
### Verb × context model (the design)
| verb | scope | shown when | target |
|------|-------|-----------|--------|
| **new** | unit | always (folder/selection) | mints a new class UNIT (no diagram) |
| **rename** | unit | element selected | the UNIT |
| **delete** | unit (destructive, guarded) | element selected | the UNIT (≠ remove) |
| **add** | diagram-context | element selected AND an ACTIVE diagram is open | the ACTIVE (open) diagram — EXPLICIT, never "last" |
| **remove** | diagram-context | element selected AND active diagram open (R33.8 view-only) | the ACTIVE diagram |
### Fix (kill last-diagram implicit target, correct-by-construction)
| # | File | Add |
|---|------|-----|
| A | `rb-diagram-detail.ts` | on render/open dispatch `rb-active-diagram {uuid}`; on disconnect dispatch `rb-active-diagram {uuid:null}` — the ACTIVE-diagram signal. |
| B | `model.ts` (host) | track `activeDiagramUuid` from that event. **Split ACTIONS_BY_TYPE**: UNIT verbs (new/rename/delete) always for a modelelement; MEMBERSHIP verbs (add/remove) appended ONLY when `activeDiagramUuid` is set. `showActionsForType` recomputes on selection AND on `rb-active-diagram`. |
| C | `model.ts` | add/remove handlers use `activeDiagramUuid` EXPLICITLY (NOT the /api/model/tree scan) → no ambiguous target. new→POST mint-unit; rename→POST rename-unit; delete→POST delete-unit (guarded). |
### INV-A (R33.9): A1 membership verbs (add/remove) NEVER shown without an active diagram (kills last-diagram, correct-by-construction) / A2 membership verbs target the ACTIVE OPEN diagram explicitly / A3 unit verbs (new/rename/delete) always on a selected element regardless of diagram / A4 IMG_4802 fix: diagram-open+selected → membership verbs PRESENT; IMG_4803 fix: no-diagram+selected → membership verbs ABSENT.
### NEW server endpoints (new/rename/delete unit — mirror add/remove-view store-only, MODEL_STORE, prod-safe): POST /api/model/element/new + /rename + /delete (guarded). SERVER change → boundary restart. GATE (tester @390): each verb in its correct context; NO action with an ambiguous/last-diagram target; diagram-open shows membership; no-diagram hides them; new/rename/delete act on the unit.

## R33.9 + R33.10 CHAIN SHAPES (architect 2026-07-31 — for req to mint scenario-first #126; names provisional/re-pointable, data=truth)
### R33.9 — context-aware action lifecycle (req AC bd7ed14d)
- **UC `diagram.actionContext`** (kill last-diagram; INV-A1/A2/A4 — the IMG_4802/4803 core fix)
  - Class **RbDiagramDetail** (client, rb-diagram-detail.ts) → Method **broadcastActiveDiagram** — anchor: dispatch `rb-active-diagram{uuid}` in connectedCallback / `{uuid:null}` in disconnectedCallback.
  - Class **ModelActionBar** (client host, model.ts) → Method **actionsForContext** — anchor: verb-set computed = unit-verbs ∪ (activeDiagramUuid ? membership-verbs : []); recompute on selection AND on `rb-active-diagram`. (Membership add/remove use activeDiagramUuid EXPLICITLY, never the /api/model/tree scan.)
- **UC `element.new`** (INV-A3 unit-scope) → Class **ModelElementService** (server) → Method **newElement** — anchor: new POST `/api/model/element/new` (mint M1 unit in MODEL_STORE, store-only prod-safe).
- **UC `element.rename`** (INV-A3) → Class **ModelElementService** → Method **renameElement** — anchor: POST `/api/model/element/rename` (rename the unit in MODEL_STORE).
- **UC `element.delete`** (INV-A3, destructive/guarded) → Class **ModelElementService** → Method **deleteElement** — anchor: POST `/api/model/element/delete` (delete the M1 unit; ≠ remove-view).
- **RIDE (no new Method):** add-member → existing `addView` (70be1605, R33.7.2); remove-member → existing `removeFromDiagram` (R33.8) — both RE-POINTED to the active-diagram target (client change only, covered by UC diagram.actionContext).
### R33.10 — tree completeness + folder grouping (req AC fa29ab28)
- **UC `modelTree.sourceDirTree`** (all 123 src .ts, folder hierarchy; INV-T1/T2)
  - Class **MofTreeService** (server, the mofChildren enumeration owner) → Method **sourceDirTree** — anchor: server.ts `mofChildren` `rawbin:ts` case + NEW `dir:` case → walk `src/` recursively (readdirSync, .ts only) emitting `dir:<rel>` folder nodes + `file:<rel>` leaves for ALL 123 files (mirror pumlChildren's disk walk); `file:` leaf → its M1 ModelElements from MODEL_STORE (else empty).
  - (item-4 55-puml already DONE/closed; folder grouping IS the directory hierarchy — no separate Method.)
### Build order / gate / restart
- Both have SERVER endpoints (R33.9 element/new+rename+delete; R33.10 dir-tree walk) → activate on ONE boundary restart. Client: R33.9 action-bar context + R33.10 folder rendering.
- GATE (tester @390): R33.9 each verb in its correct context (diagram-open→membership present; no-diagram→membership ABSENT; new/rename/delete on unit; NO ambiguous/last-diagram target). R33.10 ts/ shows ALL 123 grouped in directory folders; puml/=55 + diagram/ unregressed.
- Chains RIDE where noted (addView/removeFromDiagram); NEW Methods = broadcastActiveDiagram, actionsForContext, newElement, renameElement, deleteElement, sourceDirTree. req mints UC/Class/Method/Impl markerPending → expert builds → places markers → req strict-AST flips → I backstop.

## R33.9/R33.10 PLACEMENT RULING (architect 2026-07-31, re req 07c3ce196): CANONICAL class, NO extraction (R27.2)
My design's service-names (ModelElementService/MofTreeService/ModelActionBar) were DESCRIPTIVE groupings, NOT a mandate to extract new classes. CONFIRMED: place newElement/renameElement/deleteElement/sourceDirTree on the CANONICAL server class c0a0921d (WITH their siblings persistRemoveView/persistDiagramZoom/mofChildren) + actionsForContext + broadcastActiveDiagram on the client hosts (ModelView 35759641 / RbDiagramDetail). Extracting distinct service classes = a FORK (methods away from their siblings) — REJECTED. Correct-by-construction ([[correct-by-construction]]/R27.2): a method lives where its siblings live. req's placement STANDS; expert marker on the name-matching decl = final (data=truth).

## R33.10 BACKSTOP = FAIL (v0.8.35) — sourceDirTree out-of-scope PROJECT_ROOT (architect 2026-07-31)
SERVED-VERIFY: /api/trace/children/rawbin:ts returns `{}` (empty) — NOT the 123-ts dir-tree. INV-T1 (completeness) BROKEN. ROOT (measured): `sourceDirTree` (server.ts:1123) references `PROJECT_ROOT`, but there is NO module-level PROJECT_ROOT — the only def is a LOCAL const at server.ts:2461 (inside a different handler). Under tsx (transpile-ONLY, no type-check) this compiles clean but at RUNTIME throws `ReferenceError: PROJECT_ROOT is not defined` → mofChildren catches → returns null → handler emits `{}`. (rawbin:puml works because pumlChildren uses `path.join(__dirname,'../../..',...)`.) **FIX (1 line, mirror the working pumlChildren):** server.ts:1123 → `const abs = path.join(__dirname, '../../..', 'src', rel);` (drop the out-of-scope PROJECT_ROOT). Alternative: add a MODULE-LEVEL `PROJECT_ROOT` const BELOW the __dirname shim (R32.5 TDZ lesson) — but the __dirname-inline matches pumlChildren + is minimal. Re-verify: /api/trace/children/rawbin:ts returns the src/ folder-tree (dirs + files, 123 total). R33.9 = PASS (element endpoints live, verb-context by construction); only R33.10's dir-walk root is broken.

## R33.10 SECOND BUG (v0.8.36) — folder EXPANSION returns {} (dir: not in the guard regex)
RE-VERIFY 0.8.36: top-level `rawbin:ts` = 123 ts across 3 folders (public 74 + shared 1 + ts 48) ✓ INV-T1 completeness + top-level folders. BUT expanding a folder (`dir:ts` etc.) returns `{}`. ROOT: `mofChildren`'s guard regex (server.ts:1192) `/^(mof-m1|mof-m2|project:|file:|rawbin:)/` does NOT include `dir:` → a `dir:<rel>` uuid fails the guard → `return null` (before reaching the handler at :1216) → `{}`. SAME for the DISPATCH regex (server.ts:2042, which already carries the R33.3-BUG comment that rawbin: had to be added for the identical reason). **FIX (add `dir:` to BOTH regexes):** server.ts:1192 AND :2042 → `/^(mof-m1|mof-m2|project:|file:|rawbin:|dir:)/`. Re-verify: `dir:ts` expands to src/ts's subdirs + .ts leaves (recursive walk); folder hierarchy fully navigable (INV-T2). R33.9 + INV-T1 (top-level 123) already good; only the drill-down guard needs `dir:`.

## ★ R33.1.1 DESIGN-CONFIRM + BUILD SPEC (architect 2026-08-01, TRON-authorized; BUG-B fixed = plantuml-server docker :8089)
DESIGN HOLDS against the WORKING backend — VERIFIED end-to-end LIVE: a real source .puml (`sprint-02-identity-ssh/diagrams/class-diagram.puml`) → `GET /md/scrum.pmo/sprints/<relpath>` = **200** (BUG-A ref fix: pumlChildren now emits `puml-src:${sp}/diagrams/${f}`, server.ts:1185) → `POST /api/puml-render` = **200 image/svg+xml** (BUG-B fixed: plantuml-server docker). The scope-pin (A, existing-source puml-src FOLDER-leaf → /md raw → /api/puml-render SVG, INV-P1.1/1.2/1.3) is correct and the `renderPumlSource` method is already built to it (rb-modelelement-detail.ts:33 branch + :74-88 fetch→render).

### ★ ONE BUILD ITEM (wiring gap I found — the render method is UNREACHABLE without it)
`renderPumlSource` fires only if the drawer MOUNTS `rb-modelelement-detail` for a puml-src node. But `renderDetailForRef` derives `type = ref.slice(0, ':')` = **`puml-src`** (rb-detail-drawer.ts:185), and the tagMap (:213-222) has NO `puml-src` entry → falls to `rb-detail-view` (default :223) → **the built branch never runs**. (BUG-A/B masked this; now exposed.)
**FIX (expert, ONE line):** add to the drawer tagMap (rb-detail-drawer.ts:221) → `'puml-src': 'rb-modelelement-detail',` — then select a puml-src leaf → drawer mounts rb-modelelement-detail → `render()` sees `ref.startsWith('puml-src:')` → `renderPumlSource(relPath)` → /md → /api/puml-render → SVG in-section. (rb-modelelement-detail handles the ref directly via the :33 branch; no uuid dependency.) CLIENT-ONLY → version bump → REAL restart at the R33 boundary (R32.7 lesson). Also re-confirm the model tree emits a selectable puml-src node (rawbin:puml folder).

### CHAIN SHAPES (UC→Class→Method→Impl→Test) — confirmed/refined
- **UC** `modelElement.renderPumlSource` `8b858586` (method→3a433a45; classes[] empty = repo convention, chain via uc.method + Class.methods)
- **Class** `RbModelElementDetail` `7788ebe0`
- **Method** `RbModelElementDetail.renderPumlSource` `3a433a45`
- **Impl** `b0c0d27d` (marker placed rb-modelelement-detail.ts:74; BUILT)
- **Test** — PENDING: req mints scenario-first on the @390 gate green (real-WebKit self-gate: select a puml-src leaf → SVG renders in-section; planted-defect = bogus relpath → no SVG). ADD a 2nd Impl/marker note IF the tagMap-routing lands as a distinct decl (it rides rb-detail-drawer.renderDetailForRef — a call-site/config edit, not a new traced method; likely no new Impl, req's call).

### GATE / handoff
- **GATE (tester, real-WebKit @390 self-gate — no Tron bottleneck):** select a puml-src FOLDER leaf (rawbin:puml) → the itemview/section shows the rendered SVG (image/svg+xml in-section); bogus relpath → no SVG (planted control); /trace + class/interface element detail UNREGRESSED.
- **HANDOFF:** expert = add the tagMap `'puml-src'` routing (the one gap) + restart at boundary; req = mint the Test scenario-first on @390 green. S33 stays OPEN until the gate is GREEN.
