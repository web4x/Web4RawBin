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
