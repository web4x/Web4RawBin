<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-share-link-offline: sw.js cacheFirst ignoreSearch for /app?join=<uuid> offline navigation

[task:uuid:0608a036-7c07-4477-8746-f68cda79e915]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [ ] creating test cases
  - [ ] implementing expert (in flight per PO)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

sw.js cacheFirst with ignoreSearch for navigation requests so /app?join=<uuid> cache-hits even offline (currently misses because query string differs from cached /app). Covers R19.32.

## Subtasks
