# T-item-views-default-collapsed: every item view defaults COLLAPSED on render, always
[task:uuid:767dd241-127e-4a3f-a491-052b91118a3d]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — canonicalize UC/Class/Method + PUML from intendedChain)
  - [ ] creating test cases (tester — write RED all-collapsed E2E FIRST)
  - [ ] implementing (expert — against designed chain + test)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 itemView.defaultCollapsed](../usecase/itemview-defaultcollapsed.md)


## Task Description

R20.3 (S20, traceability-first): every item view (rb-object-item / tree item) in BOTH /trace AND in-room trees MUST default to COLLAPSED on render — always, every load; no item starts expanded; user expands by clicking. Universal default, not per-type/per-context. intendedChain (for architect to canonicalize into real units + PUML): UseCase=itemView.defaultCollapsed; Class=RbObjectItem (or rb-tree-item); Method=render/initCollapsed (set collapsed=true default before first paint); Implementation=constructor/connectedCallback sets this.collapsed=true, render reads it, no auto-expand; Test=RED: fresh load (/trace or room) → query all rb-object-item → assert every one collapsed (collapsed attr / compact class); currently FAILS (mixed/expanded). S20 DISCIPLINE: full chain designed + Test FIRST; in-room/UI → Playwright+screenshot gate; nothing ships chain-open. RELEASE → v0.6.2 + git tag.

## Subtasks


