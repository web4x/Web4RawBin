# T-reset-pwa-cache-on-main: red Reset PWA Cache button on the / main route
[task:uuid:ccb5e337-93be-4fa3-99f6-7d8232d307d3]

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
- [🔗 mainRoute.resetPwaCache](../usecase/mainroute-resetpwacache.md)


## Task Description

R19.95 fix (PRIORITY 1 — unblocks the md/safari stale-cache mystery): the / main route MUST show a RED 'Reset PWA Cache' button that clears all service-worker caches and reloads — same functionality as the offline page flush (R19.45) but on the main route so users can force-reset even when the app loads (not only when stuck offline). Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect attaches useCases[]/chain (single-owner standard). User-facing UI → prefer E2E/screenshot verification.

## Subtasks


