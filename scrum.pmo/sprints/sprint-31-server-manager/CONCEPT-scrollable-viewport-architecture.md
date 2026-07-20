# CONCEPT — Component Architecture: bar/compartment strip + scrollable viewport + WODA/editor as one model
**robbin-architect design (2026-07-20). CONCEPT ONLY — no code.** Companion to CONCEPT-scrollable-viewport-woda-layout.md.
Core law (Tron): **PRESENTATION ≠ FUNCTION.** One functional core; presentation (bar↔compartment, side-by-side↔scroll-snap, inline↔bottom-drawer) is a reactive layer over it. Never a second fork. (Same root as the in-flight R31.4 DRY drawer fix — the terminal via the shared /trace detail flow — generalized to the whole layout.)

## The 4 primitives (one component family; presentation is an attribute, not a new component)
1. **`rb-compartment`** — hosts full content `[]`. A single `presentation` attr toggles EXPANDED (full content) ↔ BAR (collapsed strip `|` of icons/verb-buttons). bar↔compartment = ONE component flipping `presentation`, NOT two components. Content + behavior are fixed; only the presentation layer (CSS + what's shown) changes. (What-bar↔What-compartment, changebar, Actions-bar are all `rb-compartment` in `presentation=bar`.)
2. **`rb-strip`** — the ordered row: an array of SEGMENT DESCRIPTORS `[{id,kind:'compartment'|'bar', content}]`. It lays them out and owns the responsive/scroll/snap behavior. The SAME rb-strip instantiates BOTH the editor and WODA — only the descriptor list differs.
3. **`rb-snap-nav`** — the bottom nav bar. DATA-DRIVEN from the strip's compartment segments: one button per compartment; click → snap the viewport's scrollLeft to that compartment's left edge. {L,C,R} for the editor, {What,Overview,Details,Actions} for WODA — one component, labels from the strip.
4. **`viewport`** — a CSS presentation MODE of rb-strip (not a separate element): landscape = flex row, all visible; portrait = `overflow-x:auto; scroll-snap-type:x` scroller. Same DOM; the mode is a class/attr from a container-query/orientation observer.

## One model, two instances (the strip descriptor IS the difference)
- **3-way editor `[L]|[C]|[R]`** = rb-strip with `[{C:L}, {bar:leftChangebar}, {C:C}, {bar:rightChangebar}, {C:R}]`; nav {Left,Center,Right}.
- **WODA `W|[O][D]|A`** = rb-strip with `[{bar-expandable:What}, {C:O}, {C:D}, {bar:Actions}]`; nav {What,Overview,Details,Actions}.
- The strip/viewport/scroll-snap/nav infrastructure is IDENTICAL; only the descriptor array + the content each compartment hosts differ. Adding a new layout = a new descriptor array, zero new infra.

## Responsive behavior — ONE component, a presentation mode (NOT two forks)
Driver: a container-query / ResizeObserver / orientation signal sets `rb-strip[data-mode=landscape|portrait]`. Same children, same components; only layout CSS branches.
- **Landscape / 16:9 / wide:** `display:flex; overflow:visible` — all compartments EXPANDED, all bars visible, side-by-side (`[]|[]|[]` or `W|[O][D]|A`).
- **Portrait / narrow:** `overflow-x:auto; scroll-snap-type:x mandatory` — a horizontally-scrollable viewport over the same row. Each compartment = a scroll-snap target (`scroll-snap-align:start`); free left↔right scroll with snap-in at each boundary. The viewport frames ~one compartment + the inter-bar + a peek of the next (compartment min-width ≈ 100% − peek).
- Scroll-snap is NATIVE CSS (no JS scroll math); `rb-snap-nav` just sets `scrollLeft`/`scrollIntoView` to a compartment's snap point. The editor snaps (`[]|[`, `]|[]|[`, `]|[]`) fall out of `scroll-snap-align` on compartments + the peek width — no bespoke per-snap logic.

## Drawer = the "Details" compartment — POSITIONING ≠ FUNCTION (the crux)
The Details compartment is ONE component (today's `rb-detail-drawer`, whose FUNCTION = host detail views via the shared render-detail flow + scroll + grab-bar + expand/minimize + the /trace detail path). Its POSITION is a presentation mode on the SAME instance:
- **Landscape:** rendered INLINE as the `[D]` segment of the strip (`position:static`, in-flow, sized by the strip).
- **Portrait:** rendered as the BOTTOM drawer (`position:fixed; bottom:0`), exactly as today.
- **INVARIANT (enforced by construction):** a `data-position=inline|bottom` attr branches ONLY layout CSS. The detail-render flow, content, scroll, grab-bar, expand/minimize, in-room R30.20 X→chat — ALL shared, untouched by position. There is NO "full-width drawer" second component (that fork = the regression Tron flagged). The current R31.4 fix (terminal via the shared detail flow, retire the showElement fork) is THIS invariant at the content level; the concept extends it to the position level.

## The invariant, testable
Presentation state ∈ {bar|compartment} × {landscape|portrait} × {inline|bottom} is a REACTIVE LAYER (CSS + mode attrs) over a FIXED functional core. **Test:** the same component instance, in ANY presentation combination, passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that changes with position/presentation is a defect (the anti-pattern). This is the acceptance shape for the eventual build.

## Migration path (later, Tron-authorized — noted, not planned here)
- Generalize `rb-detail-drawer` → the Details `rb-compartment` with `data-position`. Wrap the existing 3-way editor panes + changebars as strip segments. WODA as a new strip descriptor. Introduce `rb-snap-nav`. Each step preserves function; presentation is added around it. The R31.4 DRY drawer fix is step 0 (function-consistency) already in flight.

## Boundaries / open questions for req + planner
- req: capture as requirement(s) — the bar/compartment duality, the strip descriptor model, viewport+scroll-snap, data-driven nav, drawer=Details-compartment, and the positioning≠function INVARIANT as an explicit AC. Acceptance = coherent concept, not code.
- planner: Sprint 31 CONCEPT task (design artifact), separate from the R31.x server-manager build work.
- Open: exact peek width + snap granularity (per-compartment vs per-bar); whether bars are themselves snap targets; container-query vs orientation media-query as the mode driver (recommend container-query — composes when nested); focus/scroll restoration on mode flip. These are design-refinement items, not blockers to the concept.
