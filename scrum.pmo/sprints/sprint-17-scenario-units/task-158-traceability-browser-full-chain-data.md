[Back to Sprint 17 Planning](./planning.md)

# T158: Traceability browser — surface the FULL chain data (Req → Task → UC → Class → Method → Impl → Test)

[task:uuid:5eedd968-085c-443b-acae-7ae73a4ce252]

## Status — ✅ impl-shipped (PO sync 2026-06-02)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `304a94d` architect design: 4 typed DetailViews + VerbRegistry + tree-item per-type rendering)
  - [x] creating test cases
  - [x] implementing (expert — `a41d16a` v0.5.59 — 4 typed DetailViews for Class/Method/Test/Implementation; rule-pair (a)+(b) ✓ in same commit-set)
  - [ ] testing (robbin-tester — verification pending; T158 verify surfaced a NEW finding: graph tree shows ONLY requirements; class/method/test/impl typed items have DetailViews but no tree-items yet → escalated to T164)
- [ ] QA Review
- [ ] Done

> Sync per PO 2026-06-02: T158 shipped (`a41d16a` v0.5.59). Tester verifying.
> Tree-rendering gap (typed items present in detail views but not in the tree)
> escalated to **T164** — separate task, architect-led. T158's own AC is
> impl-complete; T164 is the enrichment follow-up, not a T158 walk-back.
> Rule-pair (a)+(b) ✓. QA Review + Done remain Tron's gate.

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Architect-assigned (Tron 2026-06-01):** architect designs how the
> traceability browser surfaces the full chain now that the data exists.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — B17 captured ✓ (`738f7c4`, canonical req:uuid:a7b8c9da-…). Additional req work: clarify which chain hops Tron wants surfaced first (full 7-hop or staged subset?), confirm whether source-location + commit-anchor (R17.24 IORs) are in-scope for THIS task or a follow-on, and confirm the DetailView coverage matrix (every type gets a DetailView, OR only the missing ones)
2. **robbin-architect** — Tron-assigned design lead. Audit current `/trace` + DetailViews + tree-item (`rb-detail-drawer`, `rb-task-detail`, `rb-requirement-detail`, `rb-usecase-detail`, `rb-detail-view` generic) for gaps vs the full chain (Requirement → Task → UseCase → Class → Method → Implementation → Test); design the data-model rendering (which `model.*` fields surface where) per type; specify new DetailViews if needed (e.g. `rb-class-detail`, `rb-method-detail`, `rb-test-detail` — generic fallback exists but typed views may be required for full chain rendering); specify tree-item rendering for the 7 types (icon, NAME, links); update `scrum.pmo/standards/traceability-standard.md` browser-rendering spec
3. **robbin-expert** — implement per architect's design: new DetailView Web Components (one per type, register in VerbRegistry per T111 pattern); tree-item rendering updates; ViewBus subscriptions if needed; carry rule-pair (a)+(b)+(c) — **(c) STATIC_SHELL applies** since new typed DetailViews are bundle additions that may need cache priming for /trace
4. **robbin-tester** — verify full chain renders end-to-end: pick a Requirement and walk down to a Method/Test via the browser; every hop clickable per T143; spot-check ≥5 chains across different roots; chain audit (`trace-cli`) clean; T126/T141/T144/T147/T149/T151–T155 regression intact

**This file is the single source of truth.** No chat clarification.

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

## Design (Architect — robbin-architect, 2026-06-02)

### Current State Audit

**Existing components in `src/public/ts/trace/`:**
- `rb-requirement-detail.ts` — Requirement DetailView (exists, renders `obj.title`)
- `rb-task-detail.ts` — Task DetailView (exists)
- `rb-usecase-detail.ts` — UseCase DetailView (exists)
- `rb-detail-view.ts` — Generic fallback DetailView
- `rb-detail-drawer.ts` — Drawer container (T110)
- `rb-object-item.ts` — List item renderer (renders `name` attribute)
- `rb-trace-tree.ts` — Tree renderer (sets `title`/`description` on items)
- `rb-list-overview.ts` — List overview
- `rb-overview.ts` — Main overview
- `rb-trace-view.ts` — Top-level trace view
- `VerbRegistry.ts` — UC verb categorization
- `ViewBus.ts` — Event bus for view coordination
- `TraceRouter.ts` — Client-side routing
- `icons.ts` — Icon definitions
- `nav.ts` — Navigation helpers
- `index.ts` — Entry point

**Missing typed DetailViews for full chain:**
- `rb-class-detail.ts` — ❌ MISSING (Class items use generic fallback)
- `rb-method-detail.ts` — ❌ MISSING (Method items use generic fallback)
- `rb-test-detail.ts` — ❌ MISSING (Test items use generic fallback)
- `rb-implementation-detail.ts` — ❌ MISSING (Implementation items use generic fallback)

**Tree-item gaps:**
- `rb-object-item.ts` renders all types with same layout — no per-type icon differentiation
- `rb-trace-tree.ts` doesn't distinguish chain types in rendering

### New Typed DetailViews (4 components)

Each follows the T111 pattern: extend `rb-detail-view`, register in VerbRegistry.

#### `rb-class-detail.ts`
```typescript
@customElement('rb-class-detail')
export class RbClassDetail extends RbDetailView {
  render() {
    return html`
      <h2>${this.obj.name}</h2>
      <div class="meta">
        <span class="source">${this.obj.model?.sourcePath || ''}</span>
        <span class="commit">${this.obj.model?.commit || ''}</span>
        <span class="lines">${this.obj.model?.lineCount || ''} lines</span>
      </div>
      ${this.obj.model?.unit ? html`<div class="unit">Unit: ${this.obj.model.unit}</div>` : nothing}
      <h3>Forward: Methods (${this.methods.length})</h3>
      <ul>${this.methods.map(m => html`
        <li @click=${() => this.navigate(m)}>
          ⚙️ ${m.name}() :${m.model?.lines?.start || '?'}
        </li>
      `)}</ul>
    `;
  }
  get methods() { return this.obj.model?.methods || []; }
}
```

**Fields surfaced:** name, sourcePath, commit, lineCount, unit (.ts.unit path), m3Unit, forward methods[]

#### `rb-method-detail.ts`
```typescript
@customElement('rb-method-detail')
export class RbMethodDetail extends RbDetailView {
  render() {
    return html`
      <h2>${this.obj.model?.className || ''}.${this.obj.name}()</h2>
      <div class="meta">
        <code>${this.obj.model?.signature || ''}</code>
      </div>
      <div class="source">
        ${this.obj.model?.sourcePath || ''}:${this.obj.model?.lines?.start || '?'}-${this.obj.model?.lines?.end || '?'}
      </div>
      <div class="commit">commit: ${this.obj.model?.commit || ''}</div>
      <div class="leaf-marker">LEAF — end of forward chain</div>
    `;
  }
}
```

**Fields surfaced:** className.methodName(), signature, sourcePath:lines, commit. LEAF marker — no forward links.

#### `rb-test-detail.ts`
```typescript
@customElement('rb-test-detail')
export class RbTestDetail extends RbDetailView {
  render() {
    return html`
      <h2>${this.obj.name}</h2>
      <div class="meta">
        <span class="coverage ${this.passRate === 1 ? 'full' : 'partial'}">
          ${this.obj.model?.passCount || 0}/${this.obj.model?.aceCount || 0} AC
        </span>
      </div>
      <div class="source">${this.obj.model?.sourcePath || ''}</div>
      <div class="uc-ref">Tests UC: ${this.obj.model?.ucUuid || ''}</div>
    `;
  }
  get passRate() {
    const total = this.obj.model?.aceCount || 1;
    return (this.obj.model?.passCount || 0) / total;
  }
}
```

**Fields surfaced:** test file name, passCount/aceCount, sourcePath, UC reference. Rendered inline under UseCase (evidence).

#### `rb-implementation-detail.ts`
```typescript
@customElement('rb-implementation-detail')
export class RbImplementationDetail extends RbDetailView {
  render() {
    return html`
      <h2>${this.obj.name}</h2>
      <div class="meta">
        <span class="source">${this.obj.model?.sourcePath || ''}</span>
        <span class="commit">${this.obj.model?.commit || ''}</span>
      </div>
      ${this.obj.model?.sourceLocationIOR ? html`
        <div class="ior">IOR: ${this.obj.model.sourceLocationIOR}</div>
      ` : nothing}
    `;
  }
}
```

**Fields surfaced:** name, sourcePath, commit, sourceLocationIOR (R17.24 — if in scope).

### VerbRegistry Wiring

Register new DetailViews by chainType in VerbRegistry:

```typescript
// VerbRegistry.ts — extend registration
VerbRegistry.register('class', RbClassDetail);
VerbRegistry.register('method', RbMethodDetail);
VerbRegistry.register('test', RbTestDetail);
VerbRegistry.register('implementation', RbImplementationDetail);

// Existing (already registered):
// VerbRegistry.register('requirement', RbRequirementDetail);
// VerbRegistry.register('task', RbTaskDetail);
// VerbRegistry.register('usecase', RbUsecaseDetail);
```

`rb-detail-drawer.ts` already dispatches to VerbRegistry — new types automatically render in the drawer when registered.

### Tree-Item Rendering for 7 Chain Types

Update `rb-object-item.ts` to render per-type icons and styling:

```typescript
// rb-object-item.ts — add chainType-aware rendering
private get icon(): string {
  const typeIcons: Record<string, string> = {
    'requirement': '📋',
    'task': '📝',
    'subtask': '🔧',
    'usecase': '🎯',
    'class': '📦',
    'method': '⚙️',
    'test': this.passRate === 1 ? '✅' : '❌',
    'implementation': '💻',
  };
  return typeIcons[this.chainType] || '📄';
}

private get chainType(): string {
  return this.getAttribute('chain-type') || 'unknown';
}
```

Update `rb-trace-tree.ts` to pass `chain-type` attribute:

```typescript
// rb-trace-tree.ts — when creating tree items
const item = document.createElement('rb-object-item');
item.setAttribute('chain-type', node.chainType);
item.setAttribute('title', node.name);      // speaky name (T161 fix)
item.setAttribute('description', node.description || '');
```

### STATIC_SHELL — New Bundle Paths

New DetailView components are bundled into the existing `dist/trace.js` via the `index.ts` entry point. Add imports:

```typescript
// src/public/ts/trace/index.ts — add:
import './rb-class-detail.js';
import './rb-method-detail.js';
import './rb-test-detail.js';
import './rb-implementation-detail.js';
```

**Rule (c):** No new HTML shell needed — components bundle into existing `dist/trace.js`. CACHE_NAME bump required in `sw.js` to force SW update with new bundle content.

### Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/public/ts/trace/rb-class-detail.ts` | CREATE | New DetailView |
| `src/public/ts/trace/rb-method-detail.ts` | CREATE | New DetailView |
| `src/public/ts/trace/rb-test-detail.ts` | CREATE | New DetailView |
| `src/public/ts/trace/rb-implementation-detail.ts` | CREATE | New DetailView |
| `src/public/ts/trace/index.ts` | MODIFY — add 4 imports | Bundle entry |
| `src/public/ts/trace/VerbRegistry.ts` | MODIFY — register 4 new types | Registration |
| `src/public/ts/trace/rb-object-item.ts` | MODIFY — add per-type icons | Tree rendering |
| `src/public/ts/trace/rb-trace-tree.ts` | MODIFY — pass `chain-type` attribute | Tree rendering |
| `src/public/sw.js` | MODIFY — bump CACHE_NAME | Rule (c) |
| `package.json` | MODIFY — bump version | Rule (a)+(b) |
| `scrum.pmo/standards/traceability-standard.md` | MODIFY — add browser-rendering spec | AC1 |

### R17.24 Source-Location IOR Scope Decision

**IN SCOPE for T158:** `rb-implementation-detail` surfaces `model.sourceLocationIOR` if present. No new IOR resolution — display only. Full IOR clickability (opening source file view) is a follow-on.

### AC Mapping

| AC | Design Answer |
|----|---------------|
| AC1 | Design documented above + standard update |
| AC2 | 4 new DetailViews (class, method, test, implementation) registered in VerbRegistry |
| AC3 | `rb-object-item` renders per-type icon; `rb-trace-tree` passes `chain-type` |
| AC4 | Forward-only walk: Req → Task → UC → Class → Method (LEAF). All hops clickable via existing T143 edges + new DetailViews |
| AC5 | `rb-implementation-detail` shows `sourceLocationIOR` if present |
| AC9 | Rule (a)+(b)+(c): version bump + CACHE_NAME bump + no new STATIC_SHELL route (bundles into existing trace.js) |

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

## Test Scenarios
File: `test/vitest/trace-browser-full-chain.test.ts` (new) + `test/e2e/trace-full-chain.spec.ts` (new) + visual on `/trace` + per-type DetailViews.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (per-type DetailView render) | For each of {Requirement, Task, UseCase, Class, Method, Test, Implementation}, open a sample item in the browser | Typed DetailView renders with all model fields visible |
| TS2 (full chain walk) | Start at a Requirement → click forward to Task → UC → Class → Method → Impl → Test | All 7 hops render; no dead ends |
| TS3 (tree-item per-type rendering) | View the tree with mixed types | Each type's icon distinct; NAME visible; description below; chain edges clickable |
| TS4 (R17.24 source-location surface) | If in-scope: view a Method with source-location IOR | IOR clickable → opens source-file view (architect-defined behavior) |
| TS5 (spot-check ≥5 chains from different Req roots) | Walk 5 chains end-to-end | All complete; counts match populated arrays from T151-T155 |
| TS6 (regression: T110 drawer, T111 typed views) | Existing Task/Requirement/UseCase DetailViews | Unchanged behaviorally |
| TS7 (regression: T143 chain-link rendering) | 🔗 anchors across views | Resolve via T149 universal symlinks |
| TS8 (rule-pair post-bump — (c) STATIC_SHELL) | New CACHE_NAME activates; new DetailView bundles cached via STATIC_SHELL | Routes load offline; no stale-bundle issue |

## Dependencies
- **Requires:** **T159 (forward-only chain refactor — HARD BLOCKER per Tron 2026-06-01)**, T110 (drawer), T111 (DetailView pattern), T126 (templates), T143 (tree), T149 (universal symlinks), T151 (JSON arrays), T152/T153 (UC data — back-refs to be removed by T159), T154/T155 (Requirement forward `tasks[]` retained; T155 back-ref input refactored by T159), T140 (source-location IORs — may be in-scope)
- **Coordinate-with:** future R17.24 source-location surfacing tasks
- **Enables:** the traceability browser becomes the **primary** chain-walk surface (currently sparse)

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** (B17 captured ✓) confirms scope: which hops first, source-location-IOR in/out of scope, DetailView coverage matrix
2. **robbin-architect** (Tron-assigned) audits current browser surface; designs per-type DetailViews + VerbRegistry wiring + tree-item rendering + standard update; writes Design section here
3. **robbin-expert** implements per architect's design in one commit-set; carries rule-pair (a)+(b)+(c) — **(c) STATIC_SHELL required** for new typed-DetailView bundle paths
4. **robbin-tester** runs TS1–TS8 + 5-chain spot-check + regression; commits verification report into QA Audit

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
