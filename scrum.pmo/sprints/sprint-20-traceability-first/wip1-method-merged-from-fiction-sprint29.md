[Back to README](../../README.md) · [Sprints overview](../sprints.overview.md)

# Sprint 29 Planning — RADICAL FORWARD PLANNING (WIP=1)

## Sprint Goal
Deliver value as a single, continuously-flowing feature pipeline. Exactly ONE
"Current Task" is driven end-to-end across ALL roles — and it is REPLACED only
when it is DELIVERED (shipped via version bump). No parallel batch, no half-done
backlog. The board always shows the one thing in flight and the one thing next.

## The Method (Tron directive 2026-06-14)

**WIP = 1.** One Current Task at a time. It moves through the full chain, role by
role, IN SEQUENCE — not in parallel:

```
requirement → use case → class → method → implementation → test → DELIVERED
   (req-eng)   (architect)         (expert)        (tester)    (PO-verify + ship)
```

- **Replace-on-delivery only.** The Current Task is swapped for the next ONLY when
  it is genuinely DELIVERED: feature works end-to-end (Tron screenshot OK) AND a
  version bump shipped — patch + sw.js cache stamp + git tag. Until then, nothing
  else is driven.
- **No parallel batch.** Other forward work (queues, climbs, bug sets) is PAUSED
  and PINNED-as-next, not worked. The single chain gets the team's full focus.
- **One driver (planner) orchestrates the handoffs.** Each role's link is verified
  complete before the next role starts. Progress is pinned in the Current-Task unit
  and in the 📌 CURRENT SPRINT block at the top of sprints.overview.md.
- **Champagne is delivered, not just claimed.** The same methods that make the
  feature work complete their req→…→test chains genuinely (real named method +
  marker-in-body + test + det-3x) — delivery and champagne are the same act.

This sprint's structure IS the 📌 CURRENT SPRINT block in
[sprints.overview.md](../sprints.overview.md) — that block is the live expression
of Sprint 29.

## Current Task (first driven)

**"Drawer/trace DETAIL works end-to-end" → v0.6.23**
- BUG8 + BUG10: collection-renders-children (both surfaces: /trace tree + in-room drawer)
- BUG9: leaf-renders-detail
- BUG11: URL-actions-work (HIGH regression)
- Completes the RbDetailDrawer champagne chains (handleDragResize / renderFilePreview /
  openForRef / close — same methods, genuine impl+test). Task unit 3c7d1853.
- DELIVERY GATE: end-to-end works + v0.6.23 (patch + sw.js + git tag) → THEN replace.

Pipeline state: req ✓ → architect ✓ (chains clean) → **EXPERT (active)** → tester →
PO-verify → planner delivery-gate verify → DELIVER.

## Definition of Done (per Current Task)
- [ ] Feature works end-to-end (Tron screenshot / device-verify OK)
- [ ] All in-scope bug tests RED→GREEN; chain tests pass; no regression
- [ ] Champagne chains genuinely complete (det-3x + per-req-trace)
- [ ] Version bump delivered: patch + sw.js cache + git tag
- [ ] PO-verify → only THEN the Current Task is replaced

## Roles
- **req-eng**: requirement + RED tests up front
- **architect**: UC/class/method chain + named-method design
- **expert**: real in-body impls + bug fixes
- **tester**: RED→GREEN bug + chain tests, E2E/screenshot
- **planner**: orchestrate handoffs in sequence, det-3x champagne closes, verify the delivery gate (version+sw.js+tag), pin progress
- **PO**: verify + greenlight delivery; Tron QA

---

**Product Owner:** robbin-po (robbinTeam2:0.0)
**Tron:** research
**Created:** 2026-06-14
**Sprint:** Sprint 29 — Radical Forward Planning (WIP=1)
