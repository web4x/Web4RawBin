# T-room-render-inversion: identical files must render in ALL rooms (no per-room stale-cache suppression)
[task:uuid:51d53769-ef94-4ca9-b0c5-fedc23b4e0c6]

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
- [🔗 room.renderAllFiles](../usecase/room-renderallfiles.md)


## Task Description

R19.100 fix (v0.5.228): identical files in the SYSTEM TEST room do NOT render for Tron, while the md-safari room with the same files DOES — an inversion (same data renders in one room, not another). Likely per-room stale cache or per-room scenario-unit load inconsistency. FIX: file rendering deterministic per FileUnit UUID regardless of room — if the FileUnit is in the index AND in Room.files[], it renders; no per-room cache suppresses it. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect attaches useCases[]/chain (single-owner standard). In-room UX → Test node MUST be real E2E Playwright + screenshot (anti-false-green standard). Tester investigating.

## Subtasks


