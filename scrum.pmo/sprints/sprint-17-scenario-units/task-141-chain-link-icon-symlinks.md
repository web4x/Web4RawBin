[Back to Sprint 17 Planning](./planning.md)

# T141: Chain-link icon → sprints.json symlink in generated MD views

[task:uuid:f0af3251-3884-4238-9159-7eeac15c46d6]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — anchor verbatim Tron quote; formalize `requirement:uuid` below
2. **robbin-architect** — design chain-link icon rendering + symlink-href generation; decide scope (UseCase template first, then extend to all 7 templates? or single shared fragment?)
3. **robbin-expert** — implement per architect's design across the chosen template set
4. **robbin-tester** — visual + click-through verification on /md/ generated views

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:f0af3251-3884-4238-9159-7eeac15c46d6]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:bdda9290-56d0-499a-8277-954bdb35e818]` —
    "Generated MD views should render a chain-link icon (🔗 or similar) on every
    cross-reference, with the link pointing into the `scenarios/sprints.json/`
    speaking-name symlink tree (not the raw UUID index). Start with the UseCase
    template; architect decides whether to extend to all 7 class templates."
    (Tron via PO 2026-05-31; req-eng to anchor the verbatim Tron quote here.)
- down
  - None (atomic task; may split if architect extends to all 7 templates)
- follows
  - [T126: Generated views](./task-126-views.md) — provides the 7 class templates this task extends
  - [T131: File-browser symlink support](./task-131-file-browser-symlinks.md) — visibility of the symlink tree this task points into
  - [T134: Traceability-as-units](./task-134-traceability-as-units.md) — source of the chain edges to render
  - [T128.1: Sprint 1 exemplar migration](./task-128-migration.md) — supplies the live symlink tree to link into
- chain (req → usecase → puml → class/method)
  - **requirement:** chain-link icon → sprints.json symlink (Tron 2026-05-31)
  - **use case:** existing `view.render` UC (T124.6 PUML) — T141 extends per-class HTML+MD chain rendering; architect may add `view.renderChainLink` UC as a new instance
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds the UC if introduced)
  - **class/method:** `src/ts/templates/` — UseCase template first (one shared helper or per-template render); affects per-class chain rendering blocks emitted by T126 ViewGenerator

## Problem Statement (req-eng to refine)
Tron via PO 2026-05-31: in the generated MD views (T126 ViewGenerator output —
`scenarios/sprints.md/<class>/<uuid>.md`), cross-references in the chain block
(up/down/follows/changes/chain links) should render with a visible chain-link
icon (🔗) anchoring the user's eye to a clickable link AND the link should
resolve into the `scenarios/sprints.json/` speaking-name symlink tree (the
human-readable path) rather than the raw UUID index path. UseCase template
first; architect decides scope (extend to all 7 class templates? shared
helper? individual emitters?).

req-eng: anchor the verbatim Tron quote above; clarify which icon (🔗 standard
text emoji, SVG, both?) + which views (MD only, or HTML too?).

## Architect Design (TO FILL during refinement)
Architect: walk the current `scenarios/sprints.md/usecase/<uuid>.md` rendered
output (e.g. on T128.1 migration output); inspect how chain refs render today
vs. desired:
- **Today:** likely raw `[type:uuid]` text or relative path to `scenario/index/<5char>/<uuid>.scenario.json`
- **Desired:** `🔗 [speaking-name](../../sprints.json/sprint-N/task-M/...)` — chain-link icon prefix + symlink-tree href

Design questions:
1. **Icon scope:** 🔗 emoji (simple, MD-friendly) vs. SVG icon (richer; needs HTML template only)? Likely 🔗 for MD-uniformity.
2. **Href generation:** given a target IOR (e.g. `task:<uuid>`), resolve to its speaking-name path in `scenarios/sprints.json/`. Needs a helper that walks the symlink tree OR looks up the target unit's `speakingPath` field if T125.3 stored it.
3. **Template scope:** UseCase first (Tron explicit). Architect decides if a single shared `renderChainLink(targetIor)` helper handles all 7 classes or each template emits its own. Recommend shared helper (DRY).
4. **Broken-link handling:** if the target unit doesn't exist in the index OR the symlink path doesn't resolve, fall back to the raw IOR text (no broken link displayed).

## Design (architect → expert)
TO FILL after architect refinement. Should include:
- New helper signature: `renderChainLink(ior, opts?) → string` (returns markdown like `🔗 [Speaking Name](relative/path/to/sprints.json/...)`)
- File path: `src/ts/scenario/templates.ts` or new `src/ts/scenario/chain-link.ts`
- Per-template integration: which class templates get the helper (UseCase first; then ?)
- Resolution algorithm for IOR → speaking-name path (walk symlink tree or use stored field)
- HTML counterpart (if scope extends to .html views) — `<a href="..." class="chain-link">🔗 Speaking Name</a>`

## Acceptance Criteria
- [ ] AC1 — UseCase template chain block renders `🔗 [Speaking Name](sprints.json/...)` for every cross-reference (every existing chain edge in the migrated Sprint-1 UseCase units)
- [ ] AC2 — Links resolve through the `scenarios/sprints.json/` symlink tree to the target's speaking-name path (T131 file-browser symlink support already makes these navigable)
- [ ] AC3 — Broken/missing target falls back to raw IOR text — no broken links in output
- [ ] AC4 — Architect's scope decision documented in this file: UseCase-only, or extended to all 7 (Sprint/Task/Requirement/UseCase/Class/Method/Test)
- [ ] AC5 — If scope extends, all 7 class templates render chain links consistently (uniform icon + path format)
- [ ] AC6 — Visual: tester opens 3 sample views on `/md/scenarios/sprints.md/usecase/...` and confirms the icon + clickable link + correct target
- [ ] AC7 — `npm run build` succeeds; full suite passes; **rule-pair (a) package.json + (b) sw.js CACHE_NAME bumped** per learnings #15 (T126 output served via /md/ = user-facing); **(c) STATIC_SHELL exempt** per #16 (template-only change, no new route — confirm in commit)
- [ ] AC8 — No regression: existing T132 (HTML status template) + T133 (FSM rendering) + T134 (TraceLink view) all still render correctly

## Test Scenarios
File: `test/vitest/template-chain-link.test.ts` (new).

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Render UseCase template with 3 chain refs (1 task, 1 requirement, 1 other-uc) | All 3 links emit `🔗 [Speaking Name](sprints.json/...)` |
| TS2 | Render with a broken IOR (target not in index) | Falls back to raw IOR text; no broken link emitted |
| TS3 | Visual: open `/md/scenarios/sprints.md/usecase/<sample-uuid>.md` on live | Chain-link icons visible; links navigate to target via symlink tree (T131 visibility holds) |
| TS4 | If scope extended: render Task/Requirement/Class/Method/Test templates | All show consistent chain-link rendering |
| TS5 | Rule-pair: post-bump, PWA reloads | New CACHE_NAME activates; new template visible on device |

## Dependencies
- **Requires:** T126 (templates + ViewGenerator), T131 (symlink visibility on /md/), T134 (TraceLink unit — chain edge source), T128.1 (migrated sample to render against)
- **Coordinate-with:** T140 (source-location IOR — may also need chain-link rendering for class/method)
- **Enables:** legible chain navigation in migrated views; precondition for T128.3 active-batch migration aesthetic

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **req-eng** anchors the verbatim Tron quote in the requirement: block; clarifies icon + view-set + extend-to-all-7 question.
2. **architect** designs (helper signature + IOR→speaking-path resolution + scope decision); writes the Design section.
3. **expert** implements per architect's design — single commit covering chosen template scope; includes rule-pair bump.
4. **tester** runs TS1-TS5 + visual on 3+ sample views; commits the verification report in this file's QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓, (c) exempt
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-31: Tron via PO 2026-05-31 directed planning. CMM4 4-role engagement enforced (learnings #18). Real v4 uuids per #17. Awaiting req anchor + architect design.

## Subtasks
None (atomic task; architect may split if extend-to-all-7 is large).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 3 follow-on*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 7 (visual legibility of chain navigation in generated views)*
