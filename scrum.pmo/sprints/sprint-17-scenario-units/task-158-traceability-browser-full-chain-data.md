<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T158: Traceability browser — surface the FULL chain data (Req → Task → UC → Class → Method → Impl → Test)

[task:uuid:5eedd968-085c-443b-acae-7ae73a4ce252]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

`[task:uuid:5eedd968-085c-443b-acae-7ae73a4ce252]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B17 in [scrum.pmo/backlog.md](../../backlog.md), commit `738f7c4`
  - **B17 requirement** `[requirement:uuid:a7b8c9da-ebfc-4d01-a234-567890120b17]`
    Verbatim Tron quote:
    > "as now data exists that traces till the class method, architect how the traceability browser has to change to reflect the full data"
- down
  - None at parent level (architect may split T158.x per DetailView class or per chain-hop if scope warrants — coordinate with planner first)
- follows
  - [T110: DetailViewContainer drawer](./task-110-detailview-container.md) — the drawer T158 fills with full-chain typed views
  - [T111: Specialized DetailViews](./task-111-detail-views.md) — Web Component pattern T158 extends to remaining classes
  - [T126: Generated views + 7 templates](./task-126-views.md) — class templates T158 wires into browser
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — tree edges T158 walks
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — universal resolution T158 navigates
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — JSON arrays T158 reads
  - [T152: UC data quality (object/verb + PUML links)](./task-152-usecase-data-quality-object-verb-from-name-puml-links.md) — UC rendering data
  - [T153: UC residual fields (classes + requirement)](./task-153-populate-classes-requirement-on-ucs.md) — UC class refs T158 renders
  - [T154: Requirement name/description + tasks[]](./task-154-requirement-data-quality-name-description-tasks.md) — Requirement rendering data
  - [T155: Requirement bidirectional closure (tasks + tests)](./task-155-requirement-tasks-tests-bidirectional-closure.md) — Requirement → task/test edges T158 walks
  - [T140: source-location IOR](./task-140-source-location-ior.md) — source location IORs T158 may surface (architect decides scope; R17.24 in-scope?)
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B17 (above)
  - **use case:** UC-TBD (architect — likely `trace.renderFullChain`, `trace.detailView.<class>`, per-class show handlers)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** new DetailView Web Components (architect names — e.g. `src/public/ts/trace/rb-class-detail.ts`, `rb-method-detail.ts`, `rb-test-detail.ts`, `rb-implementation-detail.ts`), VerbRegistry wiring, tree-item updates, `scrum.pmo/standards/traceability-standard.md` browser-rendering spec

## Context

T151 standardized JSON `model.links.*` / `model.chain.*` arrays. T152/T153
populated UC `object`/`verb` + `classes[]` + `requirements[]`. T154 split
Requirement `name`/`description` + populated `tasks[]`. T155 closed
bidirectional tasks + tests. T140 introduced source-location IORs (R17.24).

The data is now there. The browser (`/trace` + drawer + DetailViews from
T110/T111) only renders a subset — Tron's directive: redesign the
browser to surface the **full chain**: Requirement → Task → UseCase →
Class → Method → Implementation → Test, with source-location and
commit-anchor visibility per R17.24 (architect decides scope inclusion).

Tron explicitly assigned the design to the architect.

## Intention

### Why this task exists
- Data is populated; browser doesn't reflect it
- Users walking the chain hit dead ends at Class/Method/Impl/Test (no typed
  DetailView, generic fallback only)
- T143 tree edges resolve but the destination view is sparse

### Problems this task solves
- DetailViews missing for Class / Method / Implementation / Test
- Tree-item rendering doesn't show all chain hops as first-class nodes
- Browser doesn't surface source-location IORs (R17.24)

### How it solves them
- Architect-led design: per-type DetailViews following T111 pattern
- VerbRegistry per-type wiring (extension of T111 registration)
- Tree-item per-type icon + NAME + links (extends T143)
- Standard update documents the full-chain rendering model

## Acceptance Criteria

- [ ] AC1 (Design — architect-led) — Architect-finalized design documented in `scrum.pmo/standards/traceability-standard.md`: per-type DetailView coverage matrix; tree-item rendering per type; data fields surfaced per view; scope decision on R17.24 source-location IORs
- [ ] AC2 (DetailViews — Class/Method/Test/Implementation) — Web Components exist per type (architect-finalized list); registered in VerbRegistry per T111 pattern; render data from `model.links.*` / `model.chain.*`
- [ ] AC3 (Tree-item rendering) — Tree-items show NAME + speaky description (per T146) + per-type icon + clickable chain edges (per T143); all 7 chain types render consistently
- [ ] AC4 (Full chain walk — FORWARD-ONLY per Tron 2026-06-01) — From any Requirement, the user can walk **forward-only** `Requirement → Task → (Subtask ∪ UseCase) → Class → Method` inside the browser; every forward hop clickable; **NO back-refs rendered** (task does NOT trace back to requirement; UC does NOT trace back to requirement). Multiple requirements may list the same task. Test/Implementation surfacing: architect decides direction (T140 source-location IORs may carry impl/test info forward from method, not back).
- [ ] AC5 (Source-location IORs) — R17.24 source-location IORs surfaced where applicable (architect decides scope — may be follow-on)
- [ ] AC6 (Spot-check ≥5 chains) — Tester walks 5+ chains from different Requirement roots; each fully renders
- [ ] AC7 (Regression) — No regression on T110 / T111 / T143 / T149 / T151-T155
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b)+(c) [learnings #15 + #16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped AND **STATIC_SHELL entry added** for any new typed-DetailView bundle paths in the SAME commit-set as the impl. T158 ships new bundles → (c) STATIC_SHELL required
- [ ] AC10 — All 4 roles committed work in this file (req confirm + architect design + expert impl + tester verify)

## Dependencies

- **Requires:** **T159 (forward-only chain refactor — HARD BLOCKER per Tron 2026-06-01)**, T110 (drawer), T111 (DetailView pattern), T126 (templates), T143 (tree), T149 (universal symlinks), T151 (JSON arrays), T152/T153 (UC data — back-refs to be removed by T159), T154/T155 (Requirement forward `tasks[]` retained; T155 back-ref input refactored by T159), T140 (source-location IORs — may be in-scope)
- **Coordinate-with:** future R17.24 source-location surfacing tasks
- **Enables:** the traceability browser becomes the **primary** chain-walk surface (currently sparse)

## Definition of Done

- [ ] All AC met (AC1–AC10) — especially AC4 (full-chain walk no dead ends)
- [ ] Rule-pair (a)+(b)+(c) ✓ — STATIC_SHELL entry mandatory for new bundles
- [ ] No regression on T110 / T111 / T143 / T149 / T151-T155
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-06-01: PO promoted backlog B17 → T158. Tron-assigned architect as design lead. B17 already captured by req-eng (`738f7c4`, canonical req:uuid:a7b8c9da-…). CMM4 4-role enforced (#18); real v4 uuids (#17); rule-pair (a)+(b)+(c) baked into AC9 + DoD (#15+#16) — (c) STATIC_SHELL required for new DetailView bundles. Awaiting architect design → expert impl → tester verify → Tron QA.

## Subtasks

None at parent level (architect may split T158.x per DetailView class or chain-hop if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 22 (Traceability browser full-chain data rendering)*
*Owners (CMM4): robbin-req → robbin-architect (Tron-assigned design lead) → robbin-expert → robbin-tester*
*Priority: 2 (data exists; browser must surface it — high visibility deliverable)*
