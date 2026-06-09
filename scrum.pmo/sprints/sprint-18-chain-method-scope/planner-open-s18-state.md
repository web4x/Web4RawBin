# Sprint 18 — Open Tasks Inventory (planner authoritative)

[Back to Sprint 18 Planning](./planning.md)

**Author:** robbin-planner
**Date:** 2026-06-09
**Anchor commit:** 8e9e6a06 (v0.5.121 expert R18.34.B pinch-commit fix)
**Source of truth:** scenario units (this file is a hand-derived report, not generated)

## Summary

**Sprint 18.tasks[] = 13 total** (Sprint canonical IOR `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962`) — updated 2026-06-09 after the second-wave reconcile (675cc8e3 disposed as redundant; T202 stood up; T187 testing-hop done; anomaly #4 resolved).
- **7 🏁 Done** (Tron-QA-approved, status=Done in scenario)
- **6 OPEN** (status=Planned or In Progress)
  - 3 Tron-blocked: SVG (R18.34/B), T189, T187 (testing-hop done 2026-06-09 per PO — 10/10 TS GREEN on real WebKit)
  - 3 actionable: T190, T188 (req-anchor LANDED, architect refinement next), T202 (just stood up — req-eng canonicalize placeholder first)
- **+1 sub-track:** hand-written `task-planner-s2-s9-backfill.md` (decision-only, no scenario unit)

## OPEN — Blocked on Tron (awaiting QA, no role work)

| Task | uuid | status | What's pending |
|------|------|--------|----------------|
| SVG viewer fullscreen iframe + native zoom | `bef36fd2` | In Progress 🧪 | **Architect chain wired (`38653299`)**: UC `c27d67d8 svgViewer.pinchZoom` + Class `7dd2f3c3 SvgViewer` (sourceFile=server.ts:843) + Method `4a4591ca SvgViewer.onPinchEnd` (lines 880-881) + Impl `094c18a4` touchend+touchcancel apply() flush. **Tester champagne PASS (`82ddae97`)**: Test `10c2e3ca` 2-touch pinch (touchstart→move→end no pan), 2/2 PASS; chain Impl→Test wired (Impl.tests[]=[Test], Test.verifies[]=[Req042bab1a R18.34]). Impl shipped v0.5.114 → v0.5.121; rule-pair (a)+(b) ✓. **Only Tron iPhone+Mac device re-verify remains.** |
| T189 Role skills SKILL.md | `a7f7f216` | In Progress | **🧪 testing-hop DONE 2026-06-09 per skill-expert via PO**: code chain complete (45/45 tests reach Req roots), UseCase `89aff659` linked, R18.13 captured, 19 Skill units done as orphan-by-design (Skill is metadata type outside the 6-step code chain — accepted, analogous to TraceLink per learning #34). Tron QA pending. Scenario status synced 2026-06-09 (was Planned, now In Progress; statusChecklist testing[x]). |
| T187 Trace narrowing — chain walker selects ONE method per UC | `292d8931` | In Progress | **🧪 testing-hop DONE 2026-06-09 per PO**: tester 10/10 TS GREEN on real WebKit engine with architect's corrected UC→Class→Method narrowing expectations; R18.34.B verified on same run. statusChecklist testing[x] sync'd. Follow-on per-UC Class.method bug tracked separately as T202. Tron QA pending. |
| S2-S9 backfill (decision-only, hand-written .md) | `03fb4511` | (no scenario) | PO decision (b) DEFER recorded 2026-06-07; QA Review awaits Tron acknowledgement; no role work |

## OPEN — Actionable now (role work to assign)

| Task | uuid | status | Actionable role(s) | Suggested first move |
|------|------|--------|--------------------|---------------------|
| SVG viewer — R18.34.B chain wiring | `bef36fd2` | In Progress | **architect** | Create UseCase `svgViewer.pinchZoom AC9.1`, Class `SvgViewer`, Method `SvgViewer.onPinchEnd` — chain plan from 83ccbd0e ("Architect to wire UC svgViewer.pinchZoom AC9.1 + SvgViewer Class + SvgViewer.onPinchEnd Method"). Real v4 uuids required (learning #17). Wire `Method.implementations[]` to the v0.5.121 impl annotation. |
| SVG viewer — champagne test | `bef36fd2` | In Progress | **tester** | Write champagne test (pinch→release, no pan, zoom persists) per 83ccbd0e plan + R18.34.B AC; pair with architect's Method unit so `Test.verifies[]` points at SvgViewer.onPinchEnd. |
| T187 trace-narrowing chain walker | `292d8931` | In Progress | **architect/expert** | Continuation of T187 (ownerIor anomaly flagged — points at S18-dup `396197533cdb`, not canonical `5b950725-…`; recommend reconcile to canonical before further work). Statuschecklist sync needed once impl state is recorded in the architect's task .md. |
| T190 tree expand append-only | `08e46ce3` | In Progress | **architect/expert** | Same anomaly as T187 (ownerIor points at S18-dup `396197533cdb`). Reconcile owner first; then continuation. |
| T188 dogfood view-gen | `8a31ba75` | Planned | **req + architect** | Net-new task, no refinement yet. Generator already exists (`scripts/generate-sprint-md.ts`). Scope: planning.md + task-*.md emitted from scenario.json Sprint+Task units (per task name). Req captures the formal directive verbatim, architect designs the round-trip (regen + integrity check); expert implements; tester verifies a known sprint regen matches scenarios. |
| `675cc8e3` Source link on all types + Browse-File → /md/ + line param → /edit#L | `675cc8e3` | Planned | **req-eng FIRST, then architect + expert** | **TRIAGE 2026-06-09 (planner): NAME MISLEADS — this task is NOT about R18.13/14/15.** Its `coveredRequirements[]` carries 6 STALE entries that are 3 distinct duplicate scenario units (no `altId`, 0 task back-refs) of R18.13/14/15 — these dups don't match the task's actual source-link feature scope. The CANONICAL R18.13 (`68bdef75` altId=R18.13 "test-chain-termination") is owned by **T187** (tester executing per PO); canonical R18.14 (`574f9ac1` "drawer shadow when closed") + R18.15 (`9de73675` "back-button no shift") are owned by **T190** (tester executing per PO). So PO's "R18.13 done by skill-expert" maps to T187's chain-termination work, not this task. **Actual `675cc8e3` scope:** source-code hyperlinks UI feature — needs req-eng to capture a fresh Tron directive (an R-? atomic req) for the source-link feature, then re-wire `coveredRequirements` to it; architect designs the link-emit pattern; expert implements; tester verifies. **Decision needed (PO):** (a) accept triage and have req-eng capture the source-link req; OR (b) rename the task to clearly reflect "source-link UI feature" and drop the misleading R18.13-15 prefix; OR (c) declare it covered by T187+T190 and delete `675cc8e3`. |

## ANOMALIES (planner-flagged, decision needed)

1. **Duplicate Sprint 18 scenario unit — RESOLVED 2026-06-09.** Dup `8662d51e-a7e8-4815-ab0a-396197533cdb` ("Sprint chain method scope") owned 3 tasks via ownerIor: T187 (`292d8931`), T190 (`08e46ce3`), and the previously-hidden R18.13-15 (`675cc8e3`). Per PO decision: re-pointed all 3 victims' `ownerIor` → canonical `5b950725-…`; added `675cc8e3` to canon `Sprint.tasks[]` (was missing — would have been orphaned); deleted dup unit file. Verified zero residual references in `scenario/index/`. Canon now owns 13 tasks (was 12; surfaced R18.13-15). Chain audit per learning #27 unblocked for T187+T190+R18.13-15.

2. **SVG task statusChecklist drift (now FIXED).** Scenario JSON `model.statusChecklist` was literal markdown with all checkboxes unchecked, while `model.status="In Progress"` and architect's task .md reflected impl-shipped. Synced 2026-06-09 to match reality: planned[x] + in-progress[x] + refinement[x] + creating-test-cases[x] + implementing[x] + testing[ ] + QA[ ] + Done[ ].

3. **R18.34.B chain wired this cycle.** SVG task `coveredRequirements[]` now includes both R18.34 (042bab1a) AND R18.34.B (6ee95023). R18.34.B.tasks[] reciprocates with SVG task IOR. Loop closed both directions per learning #38.

4. **NEW 2026-06-09: Duplicate R18.13/14/15 requirement scenario units.** Three orphan dups: `7d59b620` (mirrors R18.13 canonical `68bdef75`), `a0abb37d` (mirrors R18.14 `574f9ac1`), `b1299650` (mirrors R18.15 `9de73675`). Distinguishing features:
   - Canonical: `altId=R18.x`, **1 task back-ref** (to T187 or T190), **2 useCases** linked.
   - Duplicates: no `altId`, **0 task back-refs**, only 1 useCase, name has "R18.x:" prefix.
   - All 6 (3 canon + 3 dup) live in canonical Sprint 18 (`ownerIor` matches).
   - The 3 dups are ONLY referenced by `675cc8e3`'s `coveredRequirements[]` (the misleading-name task). After PO triage decision on `675cc8e3`, recommend **deleting the 3 dup requirement units** (analogous to the Sprint dup reconcile).

5. **NEW 2026-06-09: T187 + T190 + T188 timeline catch-up.**
   - **T187** (`292d8931`) — In Progress, owns canonical R18.13. PO confirms tester executing.
   - **T190** (`08e46ce3`) — In Progress, owns canonical R18.14 + R18.15. PO confirms tester executing.
   - **T188** (`8a31ba75`) — req anchor LANDED `ea1d9b2a` (R18.3 verbatim Tron quote captured); 5 coveredRequirements + 1 useCase wired by req. Scenario `status` still "Planned" but architect refinement can start. Move from "awaiting req" → "📝 refining (architect)" once architect engages.
   - Hotfix `522c919e` v0.5.122 — expert R18.8 missed location fix (`/api/trace SCENARIO_FORWARD requirement→useCases`). Not a task closure, but a defect-fix iteration.

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

- **architect** — SVG R18.34.B chain DONE in `38653299` (UC `c27d67d8` + Class `7dd2f3c3` + Method `4a4591ca` + Impl `094c18a4`). Pending: refine `675cc8e3` source-link feature AFTER req-eng captures the fresh req (see anomaly #4 + R18.13-15 triage).
- **req-eng** — refine T188 (dogfood view-gen) and T189 (role skills SKILL.md) by capturing the originating Tron directives verbatim as Requirement units; both are status=Planned with no req anchor yet
- **expert** — standby; v0.5.121 is the current ship line. Watch tester verify; assist if a D5 surfaces.
- **tester** — SVG R18.34.B champagne DONE in `82ddae97` (Test `10c2e3ca` 2/2 PASS). Primary remaining: T187 + T190 verification (PO confirms in flight); SVG 3-platform device re-verify is Tron's gate (not a planner-routable role).
- **req-eng** — capture the SOURCE-LINK fresh atomic Tron directive for `675cc8e3` (its current 6 reqs are stale R18.13/14/15 dups — anomaly #4). T188 (`8a31ba75`) req anchor LANDED `ea1d9b2a` R18.3 — net new actionable next-hop is architect refinement.

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
