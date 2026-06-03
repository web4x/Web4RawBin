[Back to Sprint 17 Planning](./planning.md)

# T167: /trace mobile-first layout + hard width-cap on right (detail) pane

[task:uuid:d0881ad6-ade5-4d60-94a2-fbe5347fd4b6]

## Status — 🧪 tester-VERIFIED (PO 2026-06-03; closes R-D+R-G with T170)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — **`6486399` req anchor + `2638f52` architect design: mobile-first /trace layout + 480px width-cap**)
  - [x] creating test cases
  - [x] implementing
  - [x] testing (PO 2026-06-03 per #69 trust-tester-PASS-over-sync-lag: "T167+T170 VERIFIED... closes R-D+R-G")
- [ ] QA Review
- [ ] Done

> Sync per rule #11: `2638f52` lands the design; refinement [x]. Expert next.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim Tron R-D quote from `compound-requirement-source-2.md` (Tron completion); confirm scope (mobile-first whole `/trace` layout; right-pane is the detail drawer / DetailViewContainer from T110)
2. **robbin-architect** — design mobile-first `/trace` layout (tree-as-primary on phone; drawer/detail as secondary); specify the **hard width-cap** rule on the right pane (max-width + responsive breakpoints); decide single-column-stack vs split with cap; interaction with T110/T111 drawer, T143 tree-item redesign, T165 7/7 tree rendering
3. **robbin-expert** — implement per architect's design (CSS media queries + max-width on drawer); rule-pair (a)+(b)
4. **robbin-tester** — visual on iPhone (Tron's reference device) at multiple widths; regression on desktop layout; verify the width-cap holds in all classes (req/task/uc/class/method/test/impl detail views)

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:d0881ad6-ade5-4d60-94a2-fbe5347fd4b6]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) → **R-D** (Tron completion 2026-06-02)
  - **R-D /trace mobile-first layout + hard right-pane width-cap**
    `[requirement:uuid:ff3f06e7-228f-408f-ac06-8db50051108e]`
    > TRON DIRECTIVE: "keep it mobile first layout and limit the with hard to the current right window size"
- down
  - None (atomic; CSS + responsive scope)
- follows
  - [T110: DetailViewContainer](./task-110-detailview-container.md) — provides the right pane this task width-caps
  - [T143: chain → tree rework (R17.26-R17.29)](./task-143-traceability-tree-rework.md) — tree-item rendering layout T167 makes mobile-first
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — full coverage T167 styles
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168 / PO 2026-06-02) — architect fills on refinement
  - **requirement:** R-D (above)
  - **use case:** UC-TBD (architect — likely `trace.layout.mobile` / `detail.widthCap`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `src/public/app.css` (and any `/trace` page CSS) — TBD
  - **implementation:** TBD
  - **test:** visual + responsive E2E spec TBD

## Context

Tron R-D (compound-requirement-source-2 completion 2026-06-02): `/trace` needs
to be **mobile-first** and the right pane (detail drawer / DetailViewContainer
from T110) needs a **hard width-cap** so it doesn't dominate small screens.

Today's `/trace` was built browser-first; on iPhone the layout cramps + the
drawer can fill the viewport. Tron asks for mobile-first reflow + an upper
bound on the right pane's width so the tree remains visible/usable.

## Intention

### Why this task exists
`/trace` is the primary navigation surface for the now-complete 7-class tree
(T165+T166). It must work well on iPhone — Tron's primary device.

### Problems this task solves
- `/trace` layout assumes desktop widths
- Detail drawer can dominate small viewports
- No width-cap rule for the right pane (any class's DetailView can sprawl)

### How it solves them
- Architect specifies mobile-first breakpoints + tree-primary stacking rule
- Hard `max-width` on right pane (architect picks the value — e.g. 480px / 50vw)
- Expert applies CSS; rule-pair (a)+(b) for cache invalidation

## Acceptance Criteria
- [ ] AC1 — `/trace` layout works mobile-first (iPhone 375px viewport: tree usable, no horizontal scroll)
- [ ] AC2 — Hard width-cap on right (detail) pane: enforces architect-specified max-width on all DetailViews (Req/Task/UC/Class/Method/Test/Impl)
- [ ] AC3 — Desktop layout (≥768px or architect's breakpoint) preserves the split tree+detail experience without regression
- [ ] AC4 — Width-cap holds when the detail content is wide (long titles, code blocks, deep chain links)
- [ ] AC5 — No regression on T110/T111/T143/T165/T166 (drawer + DetailViews + tree-item rendering)
- [ ] AC6 — `npm run build` succeeds; all existing tests pass
- [ ] AC7 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in same commit-set; (c) STATIC_SHELL exempt (no new route)

## Test Scenarios
File: `test/e2e/trace-mobile.spec.ts` (new) + visual on iPhone simulator + desktop.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open `/trace` on 375px viewport (iPhone) | Tree usable, no horizontal scroll, drawer respects width-cap |
| TS2 | Open `/trace` on 1280px viewport (desktop) | Split layout intact, drawer width-capped |
| TS3 | Open a Method DetailView with long content | Right pane stays within architect's max-width; content wraps/scrolls inside |
| TS4 | Walk all 7 DetailView types on mobile | Each renders without breaking the layout |
| TS5 (regression) | Existing tree-item interactions (T143 tap-collapse / `>` expand) | Unchanged |
| TS6 | Rule-pair post-bump | New CACHE_NAME activates; layout reaches device |

## Dependencies
- **Requires:** T110 (drawer), T143 (tree-item layout), T165 (7/7 tree rendering), T166 (Class+Method in graph)
- **Coordinate-with:** T164 (close-out — may overlap CSS area)
- **Enables:** usable `/trace` on Tron's iPhone

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors the verbatim Tron R-D quote when the cut sentence completes.
2. **robbin-architect** designs mobile-first layout + width-cap rule; writes Design section.
3. **robbin-expert** implements per design; carries rule-pair (a)+(b).
4. **robbin-tester** visual on iPhone + desktop; TS1-TS6; commits verification to QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] No regression on T110/T111/T143/T165/T166
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T167 (R-D from compound-source-2 Tron completion). CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC7+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.
- 2026-06-02: robbin-req anchored verbatim Tron R-D quote in traceability section.

## Design (Architect — robbin-architect, 2026-06-02)

### Current Layout (problems)

`/trace` page structure:
- Tree (`rb-trace-tree` / `.trace-tree`) — block element, full width
- Detail drawer (`rb-detail-drawer`) — `position: fixed; bottom: 0; left: 0; right: 0; max-height: 50vh`

**Problem 1:** Drawer spans full viewport width (`left: 0; right: 0`). On desktop, a wide detail pane dominates. No max-width.
**Problem 2:** On mobile (375px iPhone), tree + drawer compete for vertical space only. Drawer at 50vh leaves ~50vh for tree — OK vertically but drawer content doesn't wrap well horizontally.
**Problem 3:** No `/trace`-specific responsive rules exist — only generic app rules in `@media (max-width: 480px)`.

### Design: Mobile-First + Width-Cap

#### Breakpoints

| Width | Layout | Detail pane behavior |
|-------|--------|---------------------|
| ≤480px (phone) | **Single column.** Tree fills viewport. Drawer overlays from bottom (existing pattern). | Full width, max-height 60vh, swipe-dismiss |
| 481px–1024px (tablet) | **Single column.** Same as phone but more breathing room. | Full width, max-height 50vh |
| ≥1025px (desktop) | **Split.** Tree left (flex-grow), detail right (width-capped). | `max-width: 480px`, fixed right side |

#### Desktop Split Layout (≥1025px)

```css
/* /trace page container — new rule */
.trace-page {
  display: flex;
  gap: 0;
  height: 100vh;
}

.trace-page .trace-tree-panel {
  flex: 1;
  overflow-y: auto;
  min-width: 300px;
}

.trace-page rb-detail-drawer {
  /* OVERRIDE fixed positioning on desktop — becomes a static right pane */
  position: static;
  transform: none;
  max-width: 480px;         /* HARD WIDTH-CAP — Tron directive */
  width: 480px;
  flex-shrink: 0;
  max-height: 100vh;
  overflow-y: auto;
  border-radius: 0;
  border-left: 1px solid rgba(255,255,255,0.1);
}
```

#### Mobile Layout (≤480px) — Already works, minor tweaks

```css
@media (max-width: 480px) {
  .trace-page {
    display: block;  /* single column stack */
  }
  
  .trace-page rb-detail-drawer {
    /* Keep existing fixed-bottom overlay */
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 60vh;    /* slightly more room on phone */
    max-width: none;     /* full width on phone */
    border-radius: 16px 16px 0 0;
  }
}
```

#### Width-Cap Rule (Tron literal: "limit the width hard")

```css
/* Hard cap — applies at ALL breakpoints where detail is a side pane */
rb-detail-drawer {
  max-width: 480px;  /* architect-specified: matches iPhone viewport width */
}
```

On phone (≤480px) the full-width bottom-drawer is acceptable — the cap effectively means "never wider than the phone screen." On desktop the cap constrains the right pane to 480px max, preserving tree visibility.

#### Content overflow inside capped pane

```css
rb-detail-drawer {
  overflow-x: hidden;    /* prevent horizontal scroll from long content */
  word-break: break-word; /* wrap long titles/code within the cap */
}

rb-detail-drawer pre,
rb-detail-drawer code {
  overflow-x: auto;      /* scrollable code blocks inside the cap */
  max-width: 100%;
}
```

### HTML Structure Change

The `/trace` index.ts entry point needs to wrap tree + drawer in a `.trace-page` container:

```typescript
// src/public/ts/trace/index.ts — mount function
document.getElementById('trace-app')!.innerHTML = `
  <div class="trace-page">
    <div class="trace-tree-panel">
      <rb-trace-tree></rb-trace-tree>
    </div>
    <rb-detail-drawer></rb-detail-drawer>
  </div>
`;
```

### Files to Modify

| File | Change |
|------|--------|
| `src/public/app.css` | Add `.trace-page` flex container, desktop split at ≥1025px, `max-width: 480px` on drawer, mobile override, content overflow rules |
| `src/public/ts/trace/index.ts` | Wrap tree + drawer in `.trace-page` container |
| `package.json` | Bump version (rule-pair (a)) |
| `src/public/sw.js` | Bump CACHE_NAME (rule-pair (b)) |

STATIC_SHELL (c): exempt — no new route.

## Subtasks
None (atomic).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (mobile-first + width-cap)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 2 (Tron's primary device usability)*
