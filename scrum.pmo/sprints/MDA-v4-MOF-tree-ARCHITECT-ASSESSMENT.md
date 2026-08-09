# MDA v4 MOF-tree — ARCHITECT ASSESSMENT (robbin-architect 2026-07-30, for robbin-po)

Two asks from Tron (IMG_4716, R32.10 drawer confirmed working).

## (1) DnD "drag a card into the empty diagram" — did it DRIFT? — HONEST: YES, it drifted
**Current:** rb-diagram-detail shows *"Empty diagram — drop a class to add a view (R32.5)"* (:104); you manually drag a class card in to add each view-link.
**Assessment:** that drag-into-empty was a **R32.5 GO-LIVE scaffold** (a minimal way to populate the demo Diagram), NOT the envisioned end interaction. It drifted into being the ONLY path. Evidence:
- Tron's own confusion (IMG_4715 "how do i reach the circle class and drop it into the drawer diagram") = the manual-drag model is not discoverable/expected.
- `TsToModel.generate` ALREADY builds a Diagram with ALL the file's class boxes (deterministic auto-grid, TsToModel.ts:205-215) — the model already HAS a full diagram, so making the user hand-assemble an EMPTY one is backwards.
- The MOF vision (below) treats the diagram as an intrinsic REPRESENTATION ("puml as code AND svg" per M1) — a derived view, not a hand-built canvas.
**Recommendation (the right interaction):** **select-class → SHOW its view** (its box + immediate R32.6 edges) by construction — auto, no drag. Keep the full-model **Diagram node** (added R32.10) as "see everything." DEMOTE drag-a-card to an OPTIONAL "add to a focused sub-diagram" affordance (legit for curating a focused view), not the primary/only path. So: **default = derived/auto diagram on select; drag = optional curation.** This is a small R32.x follow-up (wire select-class→its-view in rb-modelelement-detail/rb-diagram-detail — reuse, no fork) OR fold into Sprint 33.

## (2) MOF 4-layer tree (M3/M2/M1/M0 folders) — DESIGN-ASSESS: FEASIBLE, builds on what exists
Vision: tree as MOF folders — **M3** meta-meta · **M2** UML profile classes (instances of M3) · **M1** projects (RawBin: TS classes + PUML code+svg) · **M0** dist (runtime instances).

### Reuse (strong — the foundation already exists)
- **The M-levels ALREADY exist in the data (R32.1 multi-facet `instanceOf`):** an M1 ModelElement carries `instanceOf:[UmlClass(M2-facet), tsClass(M2-facet)]` (TsToModel FACETS/M2 maps); the 20 M2 metaclass units are pinned seeds. So this vision is largely a **PRESENTATION** problem (M-layer folders), not a data rebuild.
- **rb-trace-tree already does FOLDERS / collections / N-level expand** (sprint collections, eager-lazy). → the M3/M2/M1/M0 folder roots reuse the existing tree folder rendering. LOW risk.
- **PUML-as-code = R32.7 (`modelToPuml`); PUML-as-svg = R32.4/6 (diagram+edges)** → present as artifacts under each M1 project. Reuse. LOW-MED.
- **`/api/model/tree` restructure**: today it emits flat M1 `modelelement` roots + a `diagram` root (R32.10); Sprint 33 emits 4 folder roots, each expanding to its layer. MED.

### Big rocks (flag — where the real work / ambiguity is)
1. **M1 = RawBin REAL multi-file model (subsumes R33).** `TsToModel` is single-file today; RawBin M1 needs multi-file gen over `src/` → hundreds of ModelElements → tree/diagram SCALE + gen perf. MED-HIGH. (This is the elevated R33; the vision's M1 project = R33's deliverable.)
2. **M0 = dist / "runtime instances" — the LEAST-DEFINED, biggest ambiguity.** MOF M0 = instances-of-M1-classes (runtime objects). "dist = compiled artifacts" is compiled-M1, not instances-of-M1 — a semantic stretch. NEEDS TRON to define: is M0 the compiled dist files, or actual runtime object instances, and what's the M1→M0 `instanceOf` generation? HIGH ambiguity — resolve before building M0.
3. **M3 layer reality.** The vision says M2 = "instances of M3", but there may be no explicit M3 units yet (M2 seeds exist; their `instanceOf→M3` may be unmodeled). Needs a few M3 seed units + M2→M3 wiring. LOW-MED.
4. **Same-UUID across M-folders (no dup).** A class is BOTH M2-instanceOf and M1-instanceOf at the SAME uuid (R32.1 law). Presenting one unit under multiple M-folders without duplicating it = the tree's ref/dedup/ancestry handling. MED.

### Recommendation — Sprint 33, PHASED (Tron authorizes; no auto-increment)
- **Phase 1 (low risk, high value):** present M2 (pinned UML profile) + M1 (demo, then real) as MOF **folders** in the tree — reuse rb-trace-tree folders + the existing multi-facet data. Proves the MOF presentation.
- **Phase 2:** M1 = RawBin REAL multi-file gen (R33) + puml-code/svg per project.
- **Phase 3:** M3 seed layer + M0/dist — GATED on Tron defining M0 semantics (big rock #2).
FEASIBILITY: **FEASIBLE**, foundation-present (R32.1 M-levels + tree folders + R32.7/R32.4-6 artifacts). Real work = R33 multi-file (Phase 2) + M0 definition (Phase 3). Scenario-first: architect designs the MOF-layer tree model + presentation → req formalizes → build. Recommend Tron authorize Sprint 33 with M0 semantics clarified up front.
