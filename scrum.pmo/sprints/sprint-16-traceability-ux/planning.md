[Back to README](../../README.md) · [Sprints overview](../sprints.overview.md)

# Sprint 16 Planning — Traceability UX & DetailViews

## Sprint Goal
The traceability browser (/trace, S15) works but its UX is clumsy. Make the
traceability tree interactive and legible: a Google-Maps-style detail drawer
(DetailViewContainer) with typed DetailViews, a redesigned tree-item (speaky name,
word-wrapping description, square type icon, OS drag, tap-collapse, children
expander), and complete the req→usecase→class→method traceability chain so every
method traces back to its originating requirement (UseCase as a first-class PUML
class).

## Source & Requirements
- **Compound requirement source (Tron verbatim):** [compound-requirement-source.md](./compound-requirement-source.md)
- **Requirement split (req-eng):** R16.1–R16.10 — req-eng formalizes each as
  `requirement:uuid` linking UP to the compound source. Tasks below link to these.
  (req + architect rewinding 2026-05-27; this plan maps tasks to the R16.x hints —
  reconcile to req's formal split when it lands.)

## Requirement → Task map
| Req | Summary | Task |
|-----|---------|------|
| R16.1 | DetailViewContainer (drawer, holds typed DetailViews) | T110 |
| R16.2 | Specialized DetailViews (Task/Requirement, extensible) | T111 |
| R16.3 + R16.4 | Tree-item: speaky name (+generate) + word-wrap description | T112 |
| R16.5 | Tree-item: square SVG type icon (free lib, architect-chosen) | T113 |
| R16.6 | Tree-item: OS drag-and-drop | T114 |
| R16.7 + R16.8 | Tree-item: tap-icon collapse/expand + ">" children expander | T115 |
| R16.9 | Traceability-chain review: every method → requirement | T116 |
| R16.10 | UseCase as class instances in PUML | T117 |

## Task List

> **Progress legend** (at-a-glance per task; `[ ]` stays = Tron's Done gate):
> ⏳ planned · 📝 designed (refinement-done) · 🔧 implementing · ✅ impl-shipped · 🧪 testing · 🏁 Tron-QA-done

### Phase 1 — Detail drawer infrastructure

- [ ] ✅ [T110: DetailViewContainer — Google-Maps-style detail drawer](./task-110-detailview-container.md)
  **Status:** impl-shipped (51812eb — rb-detail-drawer + trace-page wiring + viewRegistry; build clean, 795 tests pass) — testing (robbin-tester) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.1
  - Drawer-like container (like room chat drawer) on /trace; clicking a tree item shows its details inside

- [ ] ✅ [T111: Specialized DetailViews (TaskDetailView, RequirementDetailView)](./task-111-detail-views.md)
  **Status:** impl-shipped (51812eb — rb-task-detail + rb-requirement-detail + rb-usecase-detail; rb-detail-view fallback; 795/795) — testing (robbin-tester) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.2
  - Typed views rendered inside the container; extensible per object type

### Phase 2 — Tree-item redesign

- [ ] ✅ [T112: Tree-item — speaky name (generate if absent) + word-wrap description](./task-112-tree-item-name-desc.md)
  **Status:** impl-shipped (13c9dc1 — name + word-wrap description, generateName() first-5-words, 3-line clamp; 795/795) — testing (robbin-tester) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.3 + R16.4
  - `name` attr = human short name; generate from requirement text if none; word-wrapping description paragraph below name

- [ ] ✅ [T113: Tree-item — square SVG type icon (free icon library)](./task-113-tree-item-icon.md)
  **Status:** impl-shipped (5b9b86c — Lucide ISC, 7 vendored icons, 32×32 square, per-type CSS custom props; 795/795) — testing (robbin-tester) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.5
  - Left-side catchy quadratic (square) SVG icon per type (requirement/task); architect picks a free lib (Lucide/Tabler/Feather, MIT/ISC)

- [ ] 📝 [T114: Tree-item — OS drag-and-drop](./task-114-tree-item-drag.md)
  **Status:** refinement done (architect, 9324e4c) — awaiting impl
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.6
  - OS-specific drag-and-drop of a tree item

- [ ] 📝 [T115: Tree-item — tap-icon collapse/expand + ">" children expander](./task-115-tree-item-collapse-expand.md)
  **Status:** refinement done (architect, 9324e4c) — awaiting impl
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.7 + R16.8
  - Tap icon once → collapse to just the square icon; tap again → expand to name + description
  - Right-side ">" icon when item has children; clicking expands the subtree

### Phase 3 — Traceability chain integrity

- [ ] 📝 [T116: Traceability-chain review — every method traces to its requirement](./task-116-chain-review.md)
  **Status:** refinement done (architect, 9324e4c) — awaiting impl
  **Owner:** robbin-expert (implement), robbin-tester (verify) · maps R16.9
  - Chain: requirement → task → use cases → classes (nouns) → methods (verbs); ensure EVERY method traces back to its originating requirement

- [ ] 📝 [T117: UseCase as class instances in PUML](./task-117-usecase-as-class.md)
  **Status:** refinement done (architect, 9324e4c) — awaiting impl
  **Owner:** robbin-architect (design), robbin-expert (implement), robbin-tester (verify) · maps R16.10
  - Track use cases in PUML as dedicated instances of a UseCase class (first-class, not labels) — enables T116's method→UC→requirement chain

## Dependency Graph
```
Phase 1: T110 (drawer) ──→ T111 (typed views, render inside drawer)
Phase 2: T112 (name+desc) ─┐
         T113 (icon) ──────┼─→ all reshape the tree-item; T115 needs T113's icon
         T114 (drag) ──────┤
         T115 (collapse/expander) ┘
Phase 3: T117 (UseCase-as-class PUML) ──→ T116 (chain review uses UC instances)
Tree-item click (Phase 2) feeds DetailViews (Phase 1): T111 consumes T112 data.
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 8 (T110–T117) |
| Tron QA-approved (Done) | 0/8 |
| Impl-shipped, testing+QA pending | 4 (T110, T111, T112, T113) |
| Refinement done (architect 9324e4c), awaiting impl | 4 (T114, T115, T116, T117) |
| New client | DetailViewContainer + DetailViews; redesigned tree-item on /trace |
| Traceability | every method → requirement (R16.9); UseCase first-class in PUML (R16.10) |

## Definition of Done
- [ ] Clicking a tree item opens its details in the DetailViewContainer drawer
- [ ] TaskDetailView + RequirementDetailView render inside the container
- [ ] Tree-item shows speaky name (generated if absent) + word-wrapping description
- [ ] Tree-item has a square SVG type icon from a free library
- [ ] Tree-item is OS-draggable
- [ ] Tap icon collapses/expands the item; ">" expands children
- [ ] Every method traces back to its requirement (chain complete)
- [ ] Use cases are first-class UseCase instances in PUML
- [ ] Full traceability per `scrum.pmo/standards/traceability-standard.md`
- [ ] Version bumped + sw.js cache; no regression in S1–15
- [ ] Tron QA approved

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-27
**Sprint:** Sprint 16 — Traceability UX & DetailViews
