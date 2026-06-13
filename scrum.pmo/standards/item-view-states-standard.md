# Item View States Standard

**Source:** Tron directive 2026-06-13 (via robbin-po). Resolves R20.3 rework caused by conflating "collapsed" (children-hidden) with "icon-only" (item-compact).
**Author:** robbin-architect
**Scope:** Every rb-object-item instance in /trace, in-room, and /scenario trees.

---

## The Three States

### State 1: EXPANDED

```
┌──────────────────────────────────┐
│ 🔷  Task Name Here      ④  ›    │  ← icon + name + desc + count badge + expander rotated 90°
│     Description text...          │
├──────────────────────────────────┤
│   ├── 🟢 Child UC               │  ← children VISIBLE (lazy-rendered on first expand)
│   ├── 🟣 Child Class             │
│   └── 🔴 Child Method            │
└──────────────────────────────────┘
```

- **Item card:** full (icon + name + description + count badge + expander)
- **Children/subtree:** VISIBLE (`.tt-children { display: '' }`)
- **Expander ›:** rotated 90° (`[children-open] .oi-expand { transform: rotate(90deg) }`)
- **Attribute:** `children-open` present on rb-object-item

### State 2: COLLAPSED (DEFAULT)

```
┌──────────────────────────────────┐
│ 🔷  Task Name Here      ④  ›    │  ← icon + name + desc + count badge + expander (not rotated)
│     Description text...          │
└──────────────────────────────────┘
  (children exist but are HIDDEN — NOT empty)
```

- **Item card:** full (icon + name + description) — IDENTICAL to expanded card
- **Count badge:** VISIBLE — shows child count (e.g. ④ = 4 children). Eagerly loaded (count known before expand via prefetch/data). **Collapsed does NOT mean empty or childless** — the badge proves content exists.
- **Expander ›:** NOT rotated (points right, indicates "can expand")
- **Children/subtree:** HIDDEN (`.tt-children { display: none }`). Children nodes lazy-render on FIRST expand (not pre-rendered while collapsed).
- **Attribute:** `children-open` ABSENT, `has-children` present, `child-count` set
- **This is the DEFAULT state on every fresh load (R20.3)**

**Collapsed ≠ empty.** A collapsed Members(4) item looks like it HAS 4 members (badge visible, expander visible). A collapsed Files(7) item looks like it HAS 7 files. The user knows there IS content; they choose when to expand.

### State 3: ICON-ONLY (compact)

```
┌────┐
│ 🔷 │  ← icon only, square aspect, no name/desc/expander/badge
└────┘
```

- **Item card:** COMPACT — only the square icon visible
- **Name, description, expander, badge:** all hidden
- **Children/subtree:** hidden
- **Attribute:** `collapsed` present on rb-object-item
- **CSS:** `rb-object-item[collapsed] { width: 40px; height: 40px; }` + content hidden

---

## Eager Lazy-Load (collapsed shows count, expand renders children)

**Collapsed does not mean empty — the eager lazy load applies.**

| What | When known | How |
|------|-----------|-----|
| Child COUNT (badge number) | EAGER — on initial render, BEFORE expand | `computeBadges()` reads from prefetch cache or `child-count` attr set by data source |
| Child NODES (actual items) | LAZY — on FIRST expand click | `fetchAndRenderChildren()` or `buildSeedNode` children loop runs on first `toggle-children` open event |

A collapsed item always shows:
- Its full card (icon + name + desc)
- The count badge (red circle with number) — e.g. ④
- The › expander (indicating expandable)

This communicates: "there are N children here, click to see them." NOT: "this is empty."

### Room tree example

```
COLLAPSED (default on load):
┌──────────────────────────────────┐
│ 👥  Members (4)          ④  ›    │  ← user KNOWS there are 4 members
│     Room members                 │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ 📁  Files (7)            ⑦  ›    │  ← user KNOWS there are 7 files
│     Room files                   │
└──────────────────────────────────┘

AFTER user taps › on Members:
┌──────────────────────────────────┐
│ 👥  Members (4)          ④  ›    │  ← expander rotated, children visible
│     Room members                 │
├──────────────────────────────────┤
│   ├── 👤  Alice (Online)         │
│   ├── 👤  Bob (Offline)          │
│   ├── 👤  Carol (Online)         │
│   └── 👤  Dave (Host)            │
└──────────────────────────────────┘
```

---

## Gestures (what toggles what)

| Gesture | Target | Toggles | From → To |
|---------|--------|---------|-----------|
| **Tap › expander** | `.oi-expand` span | `children-open` attr | COLLAPSED ↔ EXPANDED |
| **Long-press icon** (500ms) | `.oi-icon` span | `collapsed` attr | COLLAPSED/EXPANDED ↔ ICON-ONLY |
| **Tap item card** (name/desc area) | `.oi-content` | Navigate / open drawer | — (not a state toggle) |

### Gesture details

- **Expander tap:** `toggleAttribute('children-open')` → dispatches `toggle-children` CustomEvent → tree handler shows/hides `.tt-children`. Only present on items with `has-children`.
- **Icon long-press:** 500ms touchstart timer → `toggleAttribute('collapsed')`. touchmove/touchend/dragstart cancel the timer (prevents accidental collapse during scroll/drag).
- **Icon drag:** dragstart on `.oi-icon` (draggable="true"). Does NOT trigger collapse (dragstart cancels the long-press timer).

### Cursor CSS

| Element | Cursor | Click-eligible on iOS? |
|---------|--------|----------------------|
| `.object-item` (rb-object-item) | `cursor: pointer` | ✓ Yes |
| `.oi-icon` | `cursor: pointer` | ✓ Yes (changed from `grab` for iOS click-eligibility) |
| `.oi-expand` | `cursor: pointer` | ✓ Yes |

---

## State Transitions

```
                    long-press icon
    ┌──────────────────────────────────────┐
    │                                      │
    ▼                                      │
 ICON-ONLY ──── long-press icon ────► COLLAPSED (default)
                                          │
                                    tap › │
                                          ▼
                                      EXPANDED
                                          │
                                    tap › │
                                          ▼
                                      COLLAPSED
```

---

## Default State

**COLLAPSED** — always, on every fresh load, for every item with children, in every tree. No item starts expanded. No auto-expand of root nodes, collection nodes, or any special case. Count badges are eagerly populated so collapsed items look informative, not empty.

Items WITHOUT children (leaf nodes) have no expander, no badge, no collapsed/expanded distinction — they always show their full card.

---

## CSS Attribute Summary

| Attribute | On element | Meaning | Set by |
|-----------|-----------|---------|--------|
| `has-children` | rb-object-item | Item has expandable children | `.data` setter / buildSeedNode |
| `children-open` | rb-object-item | Children currently visible | Expander tap toggle |
| `child-count` | rb-object-item | Number of children (badge text) | `computeBadges()` / data source |
| `collapsed` | rb-object-item | Item in icon-only compact mode | Icon long-press toggle |

---

## Mislabeled Requirements Review

| Req | Original wording | Issue | Correction |
|-----|-----------------|-------|------------|
| R19.27 | "collapse to icon" | ✓ Correct — means ICON-ONLY (state 3) | — |
| R19.92 | "icon collapse = long-press" | ✓ Correct — icon long-press → ICON-ONLY | — |
| R20.3 | "default collapsed" | ⚠️ Was read as icon-only, meant children-hidden | Clarified: COLLAPSED = state 2. Redesigned method to `defaultChildrenHidden`. |

---

## Team Protocol

When specifying a visual state in requirements, task descriptions, or designs:
- **ICON-ONLY** = state 3 (compact square, icon only, long-press gesture)
- **COLLAPSED** = state 2 (full card + count badge + expander, children hidden) — the DEFAULT
- **EXPANDED** = state 1 (full card + count badge + expander rotated, children visible)
- NEVER use "collapsed" to mean "icon-only"
- ALWAYS mention the count badge when describing collapsed state — collapsed ≠ empty

---

**Formulated by:** robbin-architect (2026-06-13)
**Reviewed by:** (pending req-eng + PO)
