# Sprint 18 — Open Tasks Inventory (planner authoritative)

[Back to Sprint 18 Planning](./planning.md)

**Author:** robbin-planner
**Date:** 2026-06-09
**Anchor commit:** 8e9e6a06 (v0.5.121 expert R18.34.B pinch-commit fix)
**Source of truth:** scenario units (this file is a hand-derived report, not generated)

## Summary

**Sprint 18.tasks[] = 12 total** (Sprint canonical IOR `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962`)
- **7 🏁 Done** (Tron-QA-approved, status=Done in scenario)
- **5 OPEN** (status=Planned or In Progress)
- **+1 sub-track:** hand-written `task-planner-s2-s9-backfill.md` (decision-only, no scenario unit)

## OPEN — Blocked on Tron (awaiting QA, no role work)

| Task | uuid | status | What's pending |
|------|------|--------|----------------|
| SVG viewer fullscreen iframe + native zoom | `bef36fd2` | In Progress | Impl shipped v0.5.114 → v0.5.121 (D1-D4 + R18.34.B pinch-commit); rule-pair (a)+(b) ✓ across all version commits; **tester 3-platform verify pending (iPhone Safari + Chrome/iPhone + Chrome/Mac)**; then Tron QA |
| S2-S9 backfill (decision-only, hand-written .md) | `03fb4511` | (no scenario) | PO decision (b) DEFER recorded 2026-06-07; QA Review awaits Tron acknowledgement; no role work |

## OPEN — Actionable now (role work to assign)

| Task | uuid | status | Actionable role(s) | Suggested first move |
|------|------|--------|--------------------|---------------------|
| SVG viewer — R18.34.B chain wiring | `bef36fd2` | In Progress | **architect** | Create UseCase `svgViewer.pinchZoom AC9.1`, Class `SvgViewer`, Method `SvgViewer.onPinchEnd` — chain plan from 83ccbd0e ("Architect to wire UC svgViewer.pinchZoom AC9.1 + SvgViewer Class + SvgViewer.onPinchEnd Method"). Real v4 uuids required (learning #17). Wire `Method.implementations[]` to the v0.5.121 impl annotation. |
| SVG viewer — champagne test | `bef36fd2` | In Progress | **tester** | Write champagne test (pinch→release, no pan, zoom persists) per 83ccbd0e plan + R18.34.B AC; pair with architect's Method unit so `Test.verifies[]` points at SvgViewer.onPinchEnd. |
| T187 trace-narrowing chain walker | `292d8931` | In Progress | **architect/expert** | Continuation of T187 (ownerIor anomaly flagged — points at S18-dup `396197533cdb`, not canonical `5b950725-…`; recommend reconcile to canonical before further work). Statuschecklist sync needed once impl state is recorded in the architect's task .md. |
| T190 tree expand append-only | `08e46ce3` | In Progress | **architect/expert** | Same anomaly as T187 (ownerIor points at S18-dup `396197533cdb`). Reconcile owner first; then continuation. |
| T188 dogfood view-gen | `8a31ba75` | Planned | **req + architect** | Net-new task, no refinement yet. Generator already exists (`scripts/generate-sprint-md.ts`). Scope: planning.md + task-*.md emitted from scenario.json Sprint+Task units (per task name). Req captures the formal directive verbatim, architect designs the round-trip (regen + integrity check); expert implements; tester verifies a known sprint regen matches scenarios. |
| T189 role skills SKILL.md | `a7f7f216` | Planned | **req + architect** | Co-specify planner/architect/req-eng SKILL.md from refinement-precedence-analysis.md Rules 1-11. Req captures the Tron directive verbatim, architect designs the 3 SKILL.md updates, planner+architect+req pair-edit, tester verifies via per-cycle pre-gate application. |

## ANOMALIES (planner-flagged, decision needed)

1. **Duplicate Sprint 18 scenario unit.** Two `ior:class:Sprint` units, both named "Sprint chain method scope": canonical `5b950725-a6f6-4d45-b802-4784ee6ef962` (owns 10 tasks via ownerIor) AND duplicate `396197533cdb` (owns T187 + T190). Sprint 18.tasks[] points at all 12 tasks, but ownership is split → chain audit will eventually fail per learning #27 strict-verify-bar. **Recommend:** PO decision on canonical → planner merges dup's tasks under canonical, then deletes dup.

2. **SVG task statusChecklist drift (now FIXED).** Scenario JSON `model.statusChecklist` was literal markdown with all checkboxes unchecked, while `model.status="In Progress"` and architect's task .md reflected impl-shipped. Synced 2026-06-09 to match reality: planned[x] + in-progress[x] + refinement[x] + creating-test-cases[x] + implementing[x] + testing[ ] + QA[ ] + Done[ ].

3. **R18.34.B chain wired this cycle.** SVG task `coveredRequirements[]` now includes both R18.34 (042bab1a) AND R18.34.B (6ee95023). R18.34.B.tasks[] reciprocates with SVG task IOR. Loop closed both directions per learning #38.

## Rule-pair audit (R18.34 chain impl commits)

| Commit | Version | package.json | sw.js | Verdict |
|--------|---------|--------------|-------|---------|
| `87dfee3b` | v0.5.114 | ✓ | ✓ | clean |
| `f1f7bd51` | v0.5.116 | ✓ | ✓ | clean |
| `2e71a312` | v0.5.117 | ✓ | ✓ | clean |
| `7422733c` | (rides v0.5.117) | — | — | mid-cycle hotfix; acceptable (next commit re-bumped) |
| `5513c08f` | v0.5.118 | ✓ | ✓ | clean |
| `df4d1831` | v0.5.119 | ✓ | ✓ | clean |
| `acacd044` | v0.5.120 | ✓ | ✓ | clean |
| `8e9e6a06` | v0.5.121 | ✓ | ✓ | clean |

## CMM4 4-role engagement check (R18.34 / R18.34.B)

- **req-eng:** ✓ R18.34 (c66ad3fd) + R18.34.B (83ccbd0e) — Tron verbatim captured, real v4 uuids
- **architect:** ✓ design D1-D4 (b3e8799c, 1f2524d8, 7422733c) — cross-browser design, Defects 3+4 diagnosis
- **architect:** ⏳ R18.34.B chain queued — UC + Class + Method scenario units PENDING
- **expert:** ✓ impl through v0.5.121 (8 commits, all rule-pair ✓ where applicable)
- **tester:** ⏳ PENDING — 3-platform verify + R18.34.B champagne test

## Recommended re-task (idle agents)

- **architect** — UC `svgViewer.pinchZoom AC9.1` + Class `SvgViewer` + Method `SvgViewer.onPinchEnd` (R18.34.B chain) ; reconcile T187/T190 owner anomaly to canonical S18
- **req-eng** — refine T188 (dogfood view-gen) and T189 (role skills SKILL.md) by capturing the originating Tron directives verbatim as Requirement units; both are status=Planned with no req anchor yet
- **expert** — standby; v0.5.121 is the current ship line. Watch tester verify; assist if a D5 surfaces.
- **tester** — primary: SVG R18.34/R18.34.B 3-platform verify per architect's plan + R18.34.B champagne test (pinch→release, no pan, zoom persists)

## Cross-references

- Sprint 18 scenario: `scenario/index/5/b/9/5/0/5b950725-a6f6-4d45-b802-4784ee6ef962.scenario.json`
- SVG task scenario: `scenario/index/b/e/f/3/6/bef36fd2-aa7c-4766-8001-db2b69452d61.scenario.json`
- R18.34 requirement: `scenario/index/0/4/2/b/a/042bab1a-46ff-4a92-8494-102b9ad928ac.scenario.json`
- R18.34.B requirement: `scenario/index/6/e/e/9/5/6ee95023-5639-4eb7-86cc-916ebb418e7e.scenario.json`
- Sprint 18 dup (anomaly #1): `scenario/index/.../396197533cdb.scenario.json`
- SVG task .md (architect design + Web4Articles compliance): `task-r18.34-svg-viewer-scoped-pinch-zoom.md`
- S2-S9 backfill .md: `task-planner-s2-s9-backfill.md`

---
*Generated by robbin-planner 2026-06-09 (hand-derived report). Re-derive any time via `git log` + `python3` scan of `scenario/index/` filtered by `ownerIor` = Sprint 18 IOR.*
