# Sprint 31 — CONCEPT: Responsive Scrollable Viewport + Scroll-Snap Nav + WODA bar/compartment layout

**Tron directive (2026-07-20): PLAN a detailed CONCEPT (req + architect + planner). DO NOT IMPLEMENT yet. Sprint 31.**
This is a foundational responsive-layout architecture. Plan thoroughly; Tron authorizes implementation later.

## 1. Core model — everything is BARS `|` and COMPARTMENTS `[]`
- **Bar `|`** = a thin strip of COLLAPSED content:
  - a **"What" bar** — collapsed itemViews shown as ICONS (expands → a "What" compartment with full itemViews);
  - an **"Actions" bar** — action buttons mapped to `object.verb` methods that take NO parameters;
  - in the 3-way diff editor, the **changebar** between editors IS a bar `|`.
- **Compartment `[]`** = EXPANDED full content:
  - "What" compartment (full itemViews), "Overview" compartment, "Details" compartment;
  - in the 3-way editor, each **editor** is a compartment `[]`.
- A bar can EXPAND into a compartment and a compartment COLLAPSE into a bar (What ↔). This bar/compartment duality is the generalization.

## 2. WODA layout: `W|[O][D]|A`
`What(bar, expandable) | Overview(compartment) [O] | Details(compartment) [D] | Actions(bar)`.
- Far-left = What bar `|`; middle = Overview `[O]` + Details `[D]` compartments; far-right = Actions bar `|`.
- Bottom scroll-snap nav bar with **4 buttons: What / Overview / Details / Actions**.

## 3. The 3-way diff editor is an INSTANCE of the same model: `[L]|[C]|[R]`
`Left-editor [] | left-changebar | Center-editor [] | center-changebar | Right-editor []`.
- Bottom scroll-snap nav bar with **3 buttons: Left / Center / Right** (snap to left-of-L / left-of-C / left-of-R).

## 4. Responsive behavior
- **Desktop 16:9 / mobile LANDSCAPE:** all compartments+bars side-by-side, fully visible — `[]|[]|[]` (editor) or `W|[O][D]|A` (woda).
- **Portrait phone (narrow):** a **horizontally scrollable viewport** over the full row. The viewport covers ~ONE compartment + the inter-compartment bar + a FEW CHARACTERS of the next compartment. **Freely scrollable left↔right and back**, with **scroll-snap** points:
  - 3-way editor snaps (from full `[]|[]|[]`):
    - **snap LEFT** → viewport shows `[]|[` (left editor + left changebar + start of center)
    - **snap CENTER** → viewport shows `]|[]|[` (center editor framed by both changebars)
    - **snap RIGHT** → viewport shows `]|[]` (right changebar + right editor)
  - Full left-right scrollable WITH snap-in at each compartment boundary.

## 5. Scroll-snap NAV bar (bottom)
Snaps the horizontal scroll to the BEGINNING (left edge) of a compartment. Button set depends on the layout instance: {L,C,R} for the 3-way editor; {What,Overview,Details,Actions} for WODA.

## 6. Drawer = the "Details" compartment — POSITIONING ≠ FUNCTION (Tron's law)
- **16:9 / landscape:** the drawer BECOMES the Details compartment INLINE in the layout (`[D]`).
- **Portrait:** the drawer is a BOTTOM drawer, EXACTLY as it is today.
- ★★★ **A different positioning FORMAT must NOT change FUNCTION.** The landscape/full-width drawer and the portrait bottom-drawer must have IDENTICAL function; only their position differs. This is the DRY principle again (same root as the /trace-detail-flow reuse).

## 7. The regression Tron flagged (context)
A "full-width drawer" change regressed: BEFORE it moved INTO the detail compartment (landscape); AFTER, the layout stayed mobile-first AND the full-width drawer's FUNCTION now differs from the portrait drawer. "Why should a different positioning format change function!" → the concept must guarantee one function, two positions. (The in-flight R31.4 DRY drawer fix — terminal via the shared /trace detail flow — addresses the immediate drawer-function-consistency; THIS concept generalizes it.)

## Deliverable — CONCEPT ONLY, do NOT implement
- **req (0.4):** capture scenario-first as requirement(s): the bar/compartment model, scrollable viewport + scroll-snap, nav bar, responsive drawer=Details-compartment, positioning≠function invariant. Acceptance = a coherent concept, not code.
- **architect (0.3):** design the component architecture — how bar↔compartment, the scrollable viewport, scroll-snap, and the nav bar GENERALIZE; how the 3-way editor AND WODA both instantiate it; how the drawer becomes the Details compartment in landscape with identical function; portrait vs landscape via one component, not two forks.
- **planner (0.6):** structure it in Sprint 31 as a CONCEPT task (design artifact), NOT a build task; keep the current R31.x server-manager work separate.

Plan thoroughly. Implementation is a LATER Tron-authorized step.
