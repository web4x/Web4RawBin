<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-selection-model: app-wide SelectionModel + selection-driven drawer/multi-select/drag (R20.6 compound)

[task:uuid:7047d04f-3226-46ff-a058-39f53f9aed58]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement (architect — SelectionModel class design + 8 atomic UC/Method/PUML)
  - [ ] creating test cases (tester — RED E2E per atomic a-h FIRST)
  - [ ] implementing (expert — SelectionModel + selection-driven UI)
  - [ ] testing (tester — RED→GREEN all 8 atomics + screenshots)
- [x] QA Review
- [ ] Done

## Task Description

R20.6 COMPOUND (S20, traceability-first): ONE task, ONE release v0.6.7, covering 8 atomics (R20.6a-h) — all driven by a single app-wide SelectionModel. Architect designs the SelectionModel class + per-atomic UC/Method/Impl; each atomic carries its own intendedChain + RED test in its req unit. ATOMICS: (a) Global SelectionModel — app-wide selection-array singleton; (b) nothing selected → default drawer shows in-room CHAT; (c) tap item middle → single-select → details drawer; (d) long-press toggles add/remove from selection array (multi-select); (e) selected items get CSS selected+active highlight; (f) drag one selected item → drags ALL selected; (g) consolidate multiple drawer implementations into one via SelectionModel; (h) remove awkward CSS highlight on default drawer, keep X close. S20 DISCIPLINE: full chain designed (architect: SelectionModel class + 8 chains) + RED test FIRST per atomic; UI → Playwright+screenshot gate; nothing ships chain-open. STRICT ORDER: queued AFTER BUG1 (v0.6.6). RELEASE → v0.6.7 + git tag (single release for all 8).

## Subtasks
