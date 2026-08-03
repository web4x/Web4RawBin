# R-E — Action bar on ALL usages of the drawer (Tron, 2026-08-03)

**Tron:** "add the action bar to all usages of the drawer… do not change how you planned and executed sprints last week."

## Requirement (deliver literally)
The action bar must appear on **EVERY usage of the drawer** — not just some detail contexts. The drawer (`rb-detail-drawer` / shared detail-container) is used in multiple places (trace detail, in-room, model detail, diagram detail, etc.); the action bar (with context-appropriate verbs via `actionsForContext` — unit verbs always, membership verbs when a diagram is active, universal «Scenario/Edit» default from R-A A1) must be present in ALL of them. Generic mechanic, **solved once in the shared drawer component** (not re-forked per usage) — same principle as R33.6.5/R33.9 action-bar and "generic behavior in the shared component."

## Scope note
- Relates to R-A A1 (universal Scenario/Edit default) but is BROADER: the action bar itself on **all drawer usages**, not only detail views. Architect enumerates every drawer usage/mount site and ensures the action bar renders (with the right verb-set per context) in each.
- Reuse `setActions`/`showActionsForType`/`actionsForContext` (R33.6.5/R33.9) — no fork. The fix is making the shared drawer render the action bar universally, driven by context.

## Process — UNCHANGED from last week (Tron's explicit instruction)
Same pipeline, no deviation:
1. **architect** — diagnose all drawer usage/mount sites + design the universal action-bar-in-drawer (solved-once in the shared component, verbs by context, reuse existing).
2. **req** — formalize the AC scenario-first (#126 IMPL-MINT), assign the R34.x number.
3. **expert** — build against the minted chain.
4. **tester** — real-WebKit @390 self-gate (Tron spot-checks by choice).
5. **planner** — flip to Done on GREEN.
- This is an S34 addition (Tron did not authorize a new sprint → existing sprint backlog per no-auto-increment).

---
# ARCHITECT DESIGN — universal action bar on ALL drawer usages (robbin-architect 2026-08-03)
MEASURE-FIRST (disk): the action-bar MECHANISM is already SHARED — `setActions`/`showActionsForType` live in rb-detail-drawer.ts (R33.6.5); `showActionsForType` is called from the shared detail render path (rb-detail-drawer.ts:187, `renderDetailForRef`) so `rb-drawer-detail-shown{type,ref}` fires on EVERY drawer detail-render, in EVERY usage. THE GAP: the ONLY listener that turns that event into actions is `model.ts` `wireDrawerActions` (:81, called :272). So the action bar appears ONLY on the /model page; every OTHER drawer mount shows NO bar (event fires → no listener → `setActions` never called → bar stays `display:none`).

## Drawer-usage MAP (mount sites — which wire the bar)
| # | Usage / page | Mounts a drawer | Wires action bar today | Bar shows? |
|---|--------------|-----------------|------------------------|-----------|
| 1 | `/model` (model.ts) | yes | YES (wireDrawerActions :81) | ✅ |
| 2 | `/trace` (trace-page.ts) | yes (trace-page.ts:35-37) | NO | ❌ MISSING |
| 3 | `/scenario` (scenario-view.ts) | yes | NO | ❌ MISSING |
| 4 | in-room (RoomView.ts) | yes | NO | ❌ MISSING |
| 5 | `/server-manager` (server-manager.ts) | yes | NO | ❌ MISSING |
| 6 | feature-manager (feature-manager.ts) | yes | NO | ❌ MISSING |
| 7 | trace/index.ts host | yes | NO | ❌ MISSING |
(rb-modelelement-detail / rb-task-detail / rb-detail-drawer = detail COMPONENTS rendered INSIDE the drawer, not separate mounts.) → **6 of 7 mount sites are MISSING the action bar** = exactly Tron's "add it to ALL usages."

## Design — solve it ONCE in the shared drawer (universal default), hosts ENRICH (no fork)
The base bar must not depend on a per-page host wiring it. Make the SHARED drawer render the universal default action set itself, on every detail render:
- **A shared universal actions-provider** (in rb-detail-drawer.ts, or a tiny `drawer-actions.ts` the drawer imports): owns the R-A A1 universal default `[{verb:'scenario',label:'◆ Scenario'},{verb:'edit',label:'✎ Edit'}]` + an OPTIONAL host-registration hook `RbDetailDrawer.registerActionProvider(fn)` where a host contributes EXTRA context verbs by type.
- **In `showActionsForType` (rb-detail-drawer.ts:187/364):** after dispatching `rb-drawer-detail-shown` (kept, backward-compatible), the drawer ALSO calls `setActions(universalDefault + registeredProvider?.(type, ctx))` — so EVERY usage shows at least Scenario/Edit, by construction. Empty/chat → clears (existing).
- **Model host (model.ts):** instead of its isolated `wireDrawerActions` computing the WHOLE set, it REGISTERS its context verbs via `registerActionProvider((type,ctx)=>actionsForContext(type,ctx.hasActiveDiagram))` (reuse R33.9 verbatim) + keeps its `rb-drawer-action`/`rb-active-diagram` handlers. So /model = default + model verbs (unchanged behavior); other pages = default (now PRESENT). NO fork — actionsForContext reused as-is; setActions/showActionsForType unchanged in signature.
- Verb handlers: `scenario`→open `/scenario?ior=<ref>`; `edit`→the edit flow — both GENERIC (no host needed), wired in the shared drawer's `rb-drawer-action` path so they work on every usage.

## INVARIANTS
- **INV-E1 (universal):** the action bar renders on EVERY drawer usage (all 7 mount sites) with the context-appropriate verb-set — by construction (shared drawer sets the default itself, not gated on a per-page host).
- **INV-E2 (context verb-set):** default [Scenario, Edit] everywhere; + model verbs (unit always / membership when a diagram active, R33.9 actionsForContext) ONLY where the model host registered; + per-type verbs where defined. Reuse actionsForContext (no fork).
- **INV-E3 (no fork / no regression):** setActions/showActionsForType/actionsForContext reused; the model page's existing bar + verbs UNCHANGED; rb-drawer-detail-shown still dispatched (back-compat); empty/chat still clears the bar.

## GATE / chain
- **GATE (tester WebKit @390):** the action bar is PRESENT on a detail in /trace, /scenario, in-room, /server-manager, feature-manager (default Scenario+Edit at minimum); /model still shows its full model verb-set (unregressed, R-A/R33.9); Scenario opens the scenario view, Edit opens edit; empty selection clears the bar; no page throws.
- **Chain:** UC drawer.universalActionBar → Class RbDetailDrawer → Method (the universal-default in showActionsForType + registerActionProvider) → Impl → Test. req mints scenario-first (#126, IMPL-MINT), assigns R34.x; I mint/repoint on ship. Client-only → REAL restart at the S34 boundary (BOOT_VERSION frozen lesson). Sequence: after/alongside R-A (R-A A1's default is the base this universalizes — build R-A A1 into the SHARED drawer per this design so A1 + R-E are one universal mechanism).
