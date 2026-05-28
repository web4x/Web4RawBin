[Back to Sprint 16 Planning](./planning.md)

# T116: Traceability-chain review — every method traces to its requirement

[task:uuid:01168fc2-d36a-4e57-b804-7f6ec2935b16]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:01168fc2-d36a-4e57-b804-7f6ec2935b16]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.9** (chain review)
  - [traceability-standard.md](../../standards/traceability-standard.md)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R16.9
  - **use case:** traceChain.auditOrphans [uc:uuid:16a01161-d161-4a01-b161-000000116001]
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (Phase 3 package)
  - **class/method:** `TraceConsistency.ts` → `auditOrphans()` (scanner extension)
  - This task IS the chain-integrity audit: requirement → task → use case → class (noun) → method (verb)

## Task Description
Review the full traceability chain — **requirement → task → use cases → classes
(objects/nouns) → methods (verbs)** — and ensure **EVERY method (verb) traces back to
its originating requirement**. Produce/refresh the chain index (matrix) and flag any
method with no requirement ancestor. Depends on UseCases being first-class (T117).

## Context
Tron 2026-05-27: "review the traceability chain: requirement-> task, use casees,
classes (objects nouns), methods (verbs) and make sure i can trace back each method
(verbs) to its original requirement."

## Acceptance Criteria
- [ ] AC1 — Chain documented req → task → use case → class → method end-to-end
- [ ] AC2 — Every method maps to ≥1 requirement; orphans (method with no requirement) are reported
- [ ] AC3 — The /trace browser reflects the complete chain (method nodes reachable from requirement roots)
- [ ] AC4 — Matrix `scrum.pmo/traceability-matrix.md` updated; standard satisfied
- [ ] `npm run build` succeeds; no regression

## Architect Design — robbin-architect

### Chain shape (5 levels)

```
Requirement (R16.x)
  └── Task (T110-T117)
        └── UseCase (UC: Object.verb)
              └── Class (noun: RbObjectItem, RbDetailDrawer, ...)
                    └── Method (verb: render(), onClick(), toggleChildren(), ...)
```

### Audit approach

1. Start from TraceModel's requirement objects
2. For each requirement → follow `implements` links → find tasks
3. For each task → follow `implements` links → find use cases (T117 makes these first-class)
4. For each use case → follow `implements` links → find classes
5. For each class → follow `contains` links → find methods
6. Any method with no path back to a requirement = **orphan** → report

### Output: traceability-matrix.md update

Add a column showing the full chain per method:

```markdown
| Method | Class | UseCase | Task | Requirement |
|--------|-------|---------|------|-------------|
| render() | RbObjectItem | UC: objectItem.render | T112 | R16.3+R16.4 |
| toggleChildren() | RbObjectItem | UC: treeItem.expandChildren | T115 | R16.8 |
| ... | ... | ... | ... | ... |
```

### /trace browser integration

The existing `rb-detail-view` chain rows show links. T116 ensures the COMPLETE chain is navigable: clicking a method → shows its class → clicking class → shows its use case → clicking UC → shows its task → clicking task → shows its requirement. No dead ends.

### T116 Chain Audit — robbin-architect (2026-05-27)

#### Scanner state (trace-cli check — ran live)
- 122 graph objects (Requirements + Tasks only)
- 19 errors: 12 missing task UUIDs (S1/S13/S16), 1 dangling requirement
- 104 warnings: S1-S9 tasks missing requirement up-links (historical, not S16 scope)
- **Zero UseCase/Class/Method objects in graph** — scanner only builds Req→Task today

#### S16 complete chain: 15 UCs, 6 classes, 18 methods → 10 requirements

| Method | Class | UseCase (Object.verb) | Task | Req |
|--------|-------|----------------------|------|-----|
| `open()` | RbDetailDrawer | detailDrawer.open | T110 | R16.1 |
| `close()` | RbDetailDrawer | detailDrawer.close | T110 | R16.1 |
| `swipeDismiss()` | RbDetailDrawer | detailDrawer.swipeDismiss | T110 | R16.1 |
| `render()` | RbTaskDetail | taskDetail.render | T111 | R16.2 |
| `renderLinks()` | RbTaskDetail | taskDetail.render | T111 | R16.2 |
| `render()` | RbRequirementDetail | requirementDetail.render | T111 | R16.2 |
| `render()` | RbUseCaseDetail | usecaseDetail.render | T111 | R16.2 |
| `render()` | RbObjectItem | objectItem.renderNameDesc | T112 | R16.3+R16.4 |
| `generateName()` | RbObjectItem | objectItem.generateName | T112 | R16.3 |
| `setIcon()` [icons.ts] | RbObjectItem | objectItem.setIcon | T113 | R16.5 |
| `onDragStart()` | RbObjectItem | objectItem.drag | T114 | R16.6 |
| `collapse()` | RbObjectItem | objectItem.collapse | T115 | R16.7 |
| `expand()` | RbObjectItem | objectItem.expand | T115 | R16.7 |
| `expandChildren()` | RbObjectItem | treeItem.expandChildren | T115 | R16.8 |
| `toggle-children` dispatch | RbTraceTree | treeItem.expandChildren | T115 | R16.8 |
| `auditOrphans()` | TraceConsistency | traceChain.auditOrphans | T116 | R16.9 |
| `parseStereotype()` | TraceConsistency | useCase.trackInPuml | T117 | R16.10 |

#### Orphan report

**S16 scope: ZERO orphans.** Every method traces to R16.1-R16.10 via its UseCase.

**Pre-S16 (existing S15 code) — also covered:**
- `rb-detail-view.ts` render/renderLinks → R15.6
- `rb-object-item.ts` render/onClick/onDragStart → R15.4
- `ViewBus.ts` subscribe/notify → R15.1 AC3
- `TraceRouter.ts` route/navigate → R15.1 AC1

#### Scanner extension spec (expert work)

Current `TraceConsistency.scanRepo()` builds Req→Task only. For AC3, extend:

**Pass 4 — Parse PUML `<<UseCase>>` classes:**
```
Scan: scrum.pmo/sprints/*/diagrams/*.puml
Match: class "..." <<UseCase>> { [uc:uuid:...] requirement: ... task: ... }
Create: UseCase objects in TraceGraph
Link: Task.addUseCase(uc) from task field; UseCase.addClass(class) from implementing class arrows
```

**Pass 5 — Parse `[impl:uuid]` from .ts source files:**
```
Scan: src/**/*.ts
Match: [impl:uuid:...] in comments
Create: Implementation objects in TraceGraph
Link: to owning Method/Class via co-located code context
```

### Expert work

1. Add `[impl:uuid]` comments to all S16 implementation files (as built)
2. Extend `TraceConsistency.scanRepo()` with Pass 4 (PUML parsing) + Pass 5 (impl scanning)
3. Run `trace-cli check` → verify S16 chain complete
4. Update traceability-matrix.md

## Dependencies
- **Requires:** T117 (UseCase as first-class PUML instances — needed for the UC link in the chain)
- **Enables:** complete, auditable traceability

## Definition of Done
- [ ] All AC met; chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.9. Awaiting architect design (after T117), then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 7 (Phase 3 — chain integrity)*
