[Back to README](../../README.md)

# Sprint 12 Planning — Editor Fixes

## Sprint Goal
Fix confirmed Monaco editor bugs from Tron's usage (Sprint 8 editor follow-ups).
Small, focused UI/editor fix sprint — separate from contacts-ui (Sprint 10) and
traceability (Sprint 11).

## Why This Sprint
The Monaco editor shipped in Sprint 8. Tron's real-world use surfaced editor
navigation bugs that are neither contacts (Sprint 10) nor traceability (Sprint 11)
scope. This sprint collects confirmed editor defects. All tasks follow the
approved [traceability standard](../../standards/traceability-standard.md).

## Task List

- [ ] [T84: Editor back button navigates to parent directory, not /app](./task-84-editor-back-button.md)
  **Status:** impl-done + committed (24482f7, v0.4.10) — testing (TS1-TS4) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  - `rb-editor-toolbar.ts:36` hardcodes `<a href="/app">` — derive parent dir from `this._path`
  - Relabel "← App" → "← Back"; keep `📂` root-browse button
  - 6 AC; e2e editor-back.spec.ts

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 1 (T84) — opening |
| Tron QA-approved (Done) | 0/1 |
| Impl-done, testing+QA pending | 1 (T84, v0.4.10) |

## Definition of Done
- [ ] Editor back button goes to parent dir of current file (all AC)
- [ ] Version bumped + sw.js cache (PWA update reaches device)
- [ ] No regression in Sprint 8 editor
- [ ] Tron QA approved

---
**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-25
**Sprint:** Sprint 12 — Editor Fixes
