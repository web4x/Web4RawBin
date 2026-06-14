# T-url-file-opens-drawer: click url-type file item opens ContentPreviewer drawer (regression fix)
[task:uuid:77122058-be05-4b22-9a0b-32973ee40a87]

## Status

- [x] Planned
- [x] In Progress
  - [ ] refinement (architect — UC/Class/named-Method + PUML)
  - [ ] creating test cases (tester — RED drawer-opens E2E FIRST)
  - [ ] implementing (expert — named method + marker-in-body)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 fileItem.openDrawer](../usecase/fileitem-opendrawer.md)


## Task Description

R20.1 (S20, traceability-first): REGRESSION — clicking a .url/.html.url file item in the room tree does NOT open the ContentPreviewer drawer (likely 862868bfe partial-commit broke the .url path during R19.84/85 iframe-zoom half-wire). FIX: restore the url-type file-click → drawer-open. intendedChain (for architect to canonicalize into REAL named-method units + PUML): UC fileItem.openDrawer (click url-type item → drawer opens with preview buttons); Class RbObjectItem or RbRoomContent; Method onFileClick/openPreviewDrawer (real NAMED METHOD, marker IN body per SM strict ruling); Test RED: click .url file item → assert drawer opens + two buttons visible (currently FAILS). S20 DISCIPLINE: full chain designed + Test FIRST; named-method impl required (no inline/closure/template); in-room UX → Playwright+screenshot. Architect attaches useCases[]/Class hop (single-owner standard).

## Subtasks


