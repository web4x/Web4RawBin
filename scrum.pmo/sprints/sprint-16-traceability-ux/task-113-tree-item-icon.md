[Back to Sprint 16 Planning](./planning.md)

# T113: Tree-item — square SVG type icon (free icon library)

[task:uuid:d1135c9f-a037-4b24-e5d1-4c3b9f602e83]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect — icon-library choice)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:d1135c9f-a037-4b24-e5d1-4c3b9f602e83]`

- up
  - [Sprint 16 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R16.5** (square SVG type icon)
- down
  - None (atomic task)
- chain (req → usecase → puml → class/method) — to be completed by req + architect
  - **requirement:** R16.5 (req-eng to formalize)
  - **use case / puml / method:** TBD (architect)

## Task Description
On the **left side** of each tree-item, render a catchy **quadratic (square) SVG** icon
per type (requirement vs task). Architect chooses a good **free** icon library (e.g.
Lucide / Tabler / Feather — square, MIT/ISC) and records the choice + license here.

## Context
Tron 2026-05-27: "on the left side they should gave a catchy icon for requirement or
task. quadratic svgs… choose a good free library."

## Acceptance Criteria
- [ ] AC1 — Each tree-item shows a square SVG icon on its left, distinct per type (requirement/task)
- [ ] AC2 — Icons come from a free, appropriately-licensed library (choice + license documented here)
- [ ] AC3 — Icons render crisply at the tree-item size (and the collapsed icon-only size, see T115)
- [ ] `npm run build` succeeds; version + sw.js bumped; no regression

## Architect Design — Icon Library Decision

### Choice: **Lucide Icons** (vendored inline SVGs)

| Library | License | Icons | ViewBox | Bundle strategy | Verdict |
|---------|---------|-------|---------|-----------------|---------|
| **Lucide** | ISC (MIT-compatible) | 1500+ | 24x24 square | Individual SVG strings — vendor ~10 icons inline | **CHOSEN** |
| Tabler | MIT | 5000+ | 24x24 | Same strategy possible but heavier catalog | Too many, overkill |
| Feather | MIT | 287 | 24x24 | Unmaintained (Lucide is its active fork) | Dead project |
| Heroicons | MIT | 300+ | 24x24 | Tailwind-focused, React-first | Wrong ecosystem |
| Phosphor | MIT | 9000+ | 256x256 | Non-square default, needs viewBox override | ViewBox mismatch |

### Why Lucide
1. **ISC license** — permissive, no attribution in UI required
2. **Square 24x24 viewBox** — matches Tron's "quadratic SVG" requirement
3. **PWA-safe** — vendor the SVG path strings directly, zero CDN/npm runtime dependency
4. **Active maintenance** — Lucide is THE maintained Feather fork (600+ contributors)
5. **Crisp at small sizes** — 2px stroke, designed for 24x24 rendering

### Vendored Icons (inline SVG strings, no npm dependency)

Create `src/public/ts/trace/icons.ts`:
```typescript
// Vendored from Lucide (ISC License — https://lucide.dev)
// Each icon is a 24x24 SVG path string. Only the icons we use are included.
export const TRACE_ICONS: Record<string, string> = {
  requirement: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>', // circle-check-big
  task:        '<svg ...><rect .../><path d="m9 11 3 3L22 4"/></svg>',  // clipboard-check
  usecase:     '<svg ...><path .../></svg>',  // puzzle-piece
  class:       '<svg ...><rect .../><line .../></svg>',  // box (or component)
  method:      '<svg ...><path .../></svg>',  // function-square
  implementation: '<svg ...><path .../></svg>',  // code-2
  test:        '<svg ...><path .../></svg>',  // flask-conical
};
```

Expert copies the exact SVG paths from https://lucide.dev/icons/ for each chosen icon. ~7 icons, each is one line.

### Icon-to-type mapping

| Object type | Lucide icon name | Rationale |
|-------------|-----------------|-----------|
| requirement | `circle-check-big` | Goal/target — checkmark in circle |
| task | `clipboard-check` | Task list with checkmark |
| usecase | `puzzle-piece` | Interlocking use case |
| class | `box` | Container/structure |
| method | `function-square` | Function in a square — matches "quadratic" |
| implementation | `code-2` | Code brackets |
| test | `flask-conical` | Test/experiment |

### Integration with rb-object-item

Replace the emoji `TYPE_ACCENT` map (line 13-15 of rb-object-item.ts) with SVG icons:

```typescript
import { TRACE_ICONS } from './icons.js';

// BEFORE: <span class="object-item-accent">${accent}</span>
// AFTER:  <span class="object-item-icon">${TRACE_ICONS[type] || '•'}</span>
```

CSS for the square icon:
```css
.object-item-icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; background: var(--type-bg, #f0f0f0);
  color: var(--type-color, #666);
}
.object-item-icon svg { width: 20px; height: 20px; }
```

Type-specific colors via CSS custom properties:
```css
rb-object-item[type="requirement"] { --type-bg: #e8f5e9; --type-color: #2e7d32; }
rb-object-item[type="task"]        { --type-bg: #e3f2fd; --type-color: #1565c0; }
rb-object-item[type="usecase"]     { --type-bg: #fff3e0; --type-color: #e65100; }
rb-object-item[type="class"]       { --type-bg: #f3e5f5; --type-color: #6a1b9a; }
rb-object-item[type="method"]      { --type-bg: #fce4ec; --type-color: #c62828; }
rb-object-item[type="implementation"] { --type-bg: #efebe9; --type-color: #4e342e; }
rb-object-item[type="test"]        { --type-bg: #e0f7fa; --type-color: #00695c; }
```

## Dependencies
- **Requires:** architect icon-library decision — **DONE (Lucide, ISC)**
- **Enables:** T115 (collapsed item = just this square icon)

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-27: Planned from compound source R16.5. Awaiting architect icon-library choice, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 4 (Phase 2 — tree-item icon)*
