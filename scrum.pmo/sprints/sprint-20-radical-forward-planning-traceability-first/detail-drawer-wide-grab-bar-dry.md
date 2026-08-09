<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-detail-drawer-grab-bar: default detail drawer nudge becomes the wide grab-bar (DRY with chat drawer)

[task:uuid:fe8c43a5-cd15-4aed-ac5b-97df558d8fea]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — canonicalize UC/Class/Method + PUML from intendedChain)
  - [x] creating test cases (tester — write RED grab-bar-match E2E FIRST)
  - [ ] implementing (expert — against designed chain + test)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Task Description

R20.2 (S20, traceability-first): the default DetailViewContainer (rb-detail-drawer) nudge is a tiny grey stub pill + X (bad UX). FIX: render the SAME wide grab-bar as the chat drawer — visually + functionally identical (drag-resize per R19.84); ONE DRY grab-bar component shared across both drawers. intendedChain (from req, for architect to canonicalize into real units + PUML): UseCase=detailDrawer.showGrabBar; Class=RbDetailDrawer; Method=renderGrabBar (replace renderNudge stub with chat-drawer wide grab-bar); Implementation=RbDetailDrawer.renderGrabBar() renders same grab-bar element as ChatDrawer, shared CSS class; Test=RED: open default detail drawer → assert grab-bar matches chat drawer (width/height/class) and is NOT stub pill+X (currently FAILS). S20 DISCIPLINE: full chain designed + Test written FIRST; in-room UX → Playwright+screenshot gate; nothing ships chain-open.

## Subtasks
