# T-object-item-microtask-defer: queueMicrotask in rb-object-item connectedCallback (case-5 paint-interleave fix)
[task:uuid:aee9e758-bdfe-427a-aaa3-e8f00cbab48f]

## Status

- [x] Planned
- [x] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 objectItem.deferRenderToMicrotask](../usecase/objectitem-deferrendertomicrotask.md)


## Task Description

R19.97 fix (case-5, architect-diagnosed): headed-Chrome connectedCallback cascade interleaves with paint → first N rb-object-item instances paint before interactive setup completes (icon-only / not interactive). FIX: defer first render/setup in rb-object-item.connectedCallback via queueMicrotask so the callback cascade finishes before paint — every item fully initialized before shown. Covers the OPEN desktop-Chrome first-N-icon-only bug; complements R19.88/88.A. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect attaches useCases[]/chain (single-owner standard). GATE EXCEPTION (PO 2026-06-13): NOT Playwright-gatable — headed-Chrome paint timing between sync connectedCallbacks can't be reliably reproduced. Gate = Tron real-Chrome + ?debug=1 overlay (anti-false-green principle held, human-real-browser gate instead of automated).

## Subtasks


