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
