[Back to Sprint 17 Planning](./planning.md)

# T161: Requirement items render Tron-quote as NAME instead of speaky `model.name` (bug)

[task:uuid:6da66c11-558a-4718-8ca8-0b61a664260d]

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
> **Tron live bug 2026-06-01:** "the names do not fit the json" — /trace
> Requirement items render NAMES as raw literal Tron-quote text
> (e.g. `> Tron: clicking a joined…`, `> TRON DIRECTIVE: …`) instead of the
> **speaky 3–5-word `model.name`** that should exist on each Requirement
> scenario unit per T146 NAME-first format and T154 Requirement data quality.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron quote (PO-relayed 2026-06-01); replace the planner-suggested `requirement:uuid` below if req-eng has a canonical one; confirm symptom: only Requirement items render the wrong NAME, or other classes too (Task/UC/Class/Method)? Spot-screenshot a sample to attach to QA Audit if helpful
2. **robbin-architect** — diagnose root cause. Two candidate failure modes:
   - **(A) Data-store wrong:** `model.name` was populated with the verbatim Tron-quote blockquote (not the speaky 3–5-word summary). T154 was supposed to split: `model.name` = plain English ≤5 words; `model.description` = verbatim Tron quote. Audit a sample of Requirement JSONs from `scenarios/index/` to see what `model.name` currently holds vs `model.description`.
   - **(B) Renderer wrong:** `model.name` IS the speaky summary in JSON, but `rb-tree-item` / `rb-requirement-detail` / VerbRegistry renderer reads `model.description` (or another field) and surfaces it as the title. Audit the renderer code path.
   Identify (A), (B), or both. Specify the fix.
3. **robbin-expert** — implement per architect's design: (A) re-run T154's NAME/description split on Requirement scenarios so `model.name` holds the speaky summary (parser may need refinement to handle multi-line/quote-leading entries); AND/OR (B) fix the renderer to read `model.name` for the title and `model.description` for the description; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify per-Req: `model.name` is plain English ≤5 words (NOT a `>`-prefixed quote line); /trace browser renders that speaky NAME for Requirement items; `model.description` (verbatim Tron quote) renders in the detail body / tooltip per T146 design; spot-check ≥5 Requirements across sprints; regression: T146 / T154 / T126 / T143 / T149 intact

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:6da66c11-558a-4718-8ca8-0b61a664260d]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron bug capture (PO-relayed 2026-06-01):** *(req-eng to anchor a B-entry / verbatim capture commit — planner pre-recorded here pending capture)*
  - **Speaky-NAME-vs-Tron-quote requirement (planner-suggested; req-eng to anchor/override on capture)**
    `[requirement:uuid:23e7ec10-8a78-455b-ad58-8e14e5caf1b7]`
    Verbatim Tron quote (PO-relayed 2026-06-01):
    > "the names do not fit the json"
    Symptom evidence (from screenshot): /trace Requirement list renders
    titles like `> Tron: clicking a joined…` and `> TRON DIRECTIVE: …` —
    these are the verbatim blockquote `> ` content, not the speaky 3–5-word
    summary T146/T154 specified.
- down
  - None (atomic bug-fix task)
- follows
  - [T146: Requirement-entry NAME-first format](./task-146-requirement-name-first-format.md) — defined `model.name` = speaky 3–5 words; `model.description` = Tron quote
  - [T154: Requirement data quality — name/description/tasks](./task-154-requirement-data-quality-name-description-tasks.md) — populated `model.name` + `model.description`; per-Req audit AC2 (name plain English ≤5 words) + AC3 (description verbatim) should have caught this — re-verify
  - [T125: Foundation (Loaders)](./task-125-foundation.md) — `RequirementLoader` defaults
  - [T126: Generated views + 7 templates](./task-126-views.md) — Requirement template renders the fields
  - [T111: Specialized DetailViews](./task-111-detail-views.md) — `rb-requirement-detail` Web Component
  - [T160: Forward-ref REPOPULATION + browser freshness](./task-160-trace-browser-stale-requirement-items.md) — sibling bug (different root cause, same surface)
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** speaky-NAME-vs-Tron-quote (above)
  - **use case:** UC-TBD (architect — likely `requirement.parseName` (re-check), `view.renderRequirementTitle` (correct field source))
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UC if applicable
  - **class/method:** `scripts/migrate-to-scenario.ts` (T154 name/description parser — may need refinement); `src/public/ts/trace/rb-tree-item.ts` + `rb-requirement-detail.ts` (renderer field source); `RequirementLoader` defaults — architect names concrete files

## Context

T146 (Phase 10, ✅) introduced the NAME-first format: each `requirements.md`
entry has line-1 plain-English NAME (3–5 words) + Tron literal blockquote
+ uuid + forward link. T154 (Phase 18, ✅) parsed those entries and
populated `model.name` (plain English) + `model.description` (verbatim
quote) with a per-Req audit gate.

Tron live observation 2026-06-01 (PO-relayed): /trace shows Requirement
items titled with the **verbatim blockquote** (e.g. `> TRON DIRECTIVE: …`)
— not the speaky NAME. Either:
- T154 mis-parsed and stored the wrong text into `model.name` (data-store bug)
- The browser renderer (`rb-tree-item` / `rb-requirement-detail`) reads the
  wrong field for the title (renderer bug)

Either way, the per-Req audit gate from T154 should have caught a data-store
failure (AC2 requires `model.name` ≤5 words plain English). Suggests AC2
may have passed on some Requirements while missing others, OR the renderer
is bypassing `model.name` and reading `model.description`.

Sibling: T160 owns "empty forward arrays + browser data-freshness". T161
is the orthogonal "wrong field rendered" bug on the same surface.

## Intention

### Why this task exists
- Tron flagged the broken titles directly; they're hard-blocking the
  traceability browser readability
- T146/T154 invariants must hold: `model.name` is the speaky title

### Problems this task solves
- Requirement items in /trace render as verbatim Tron quotes (unreadable)
- Either `model.name` is data-corrupt OR the renderer field source is wrong

### How it solves them
- Architect audits sample JSONs + renderer code path to pin A vs B
- Fix path A: re-run T154 parser (with refined rules if needed); per-Req re-audit
- Fix path B: renderer reads `model.name` for title, `model.description` for body

## Acceptance Criteria
- [ ] AC1 (Root-cause diagnosis) — Architect's Design section in this file identifies (A) data-store wrong, (B) renderer wrong, or both; evidence cited (sample JSON paths, renderer file refs)
- [ ] AC2 (model.name correct per Req) — For EVERY Requirement scenario, `model.name` is plain English ≤5 words, NOT a `>`-prefixed quote line. Per-Req audit table reports failures (target: 0); identical gate to T154 AC2 — re-verify it holds post-T161
- [ ] AC3 (model.description correct per Req) — For EVERY Requirement scenario, `model.description` matches the Tron quote blockquote in `requirements.md` (verbatim); identical to T154 AC3 — re-verify post-T161
- [ ] AC4 (Renderer reads correct fields) — `rb-tree-item` (or equivalent title-rendering Web Component) uses `model.name` for the title; `rb-requirement-detail` uses `model.description` for the body. Code paths verified
- [ ] AC5 (Browser smoke test) — Load /trace; Requirement items render speaky titles (NOT `>`-prefixed blockquotes). Spot-check ≥5 Requirements across sprints
- [ ] AC6 (Sibling-class smoke) — Same bug pattern checked on Task / UC / Class / Method items (does `model.name` render correctly on those too?). If yes, fix scoped to Requirements only; if no, extend to all classes
- [ ] AC7 (Regression) — No regression on T126 / T143 / T146 / T149 / T154 / T160 (forward arrays unchanged)
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: architect confirms (likely exempt — no new route)
- [ ] AC10 — All 4 roles committed work in this file

## Test Scenarios
File: `test/vitest/requirement-name-render.test.ts` (new) + visual on /trace.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (JSON inspection) | Dump `model.name` for every Requirement scenario in `scenarios/index/` | Every value is plain English ≤5 words; no `>`-prefixed text |
| TS2 (description inspection) | Dump `model.description` for every Requirement scenario | Every value matches the corresponding `requirements.md` blockquote (verbatim) |
| TS3 (parser unit — fixtures) | Re-run T154's name/description parser on fixture `requirements.md` entries with multi-line / quote-leading shapes | Correct `name` and `description` produced |
| TS4 (renderer unit — rb-tree-item) | Mount `rb-tree-item` with a synthetic Requirement model `{name: "Speaky Name", description: "> Tron quote"}` | Renders "Speaky Name" as title |
| TS5 (renderer unit — rb-requirement-detail) | Same synthetic model | Detail body shows the description quote, not the name |
| TS6 (browser smoke — /trace) | Load /trace; visually inspect Requirement list | Items show speaky names (no `>`-prefixed blockquotes) |
| TS7 (≥5-Req spot-check) | 5 Requirements across sprints | All render speaky names correctly |
| TS8 (sibling-class smoke) | Inspect Task / UC / Class / Method items in /trace | Their titles render correctly too OR a clear gap is documented |
| TS9 (regression) | T126 / T143 / T146 / T154 / T160 | Unchanged |
| TS10 (rule-pair post-bump) | New CACHE_NAME activates | Fixed titles visible on Tron's device |

## Dependencies
- **Requires:** T146 (NAME-first format), T154 (data-quality migration), T125 (Loaders), T126 (templates), T111 (DetailView pattern)
- **Coordinate-with:** T160 (sibling bug on same browser surface — different root cause; T161 may run in parallel)
- **Enables:** readable Requirement browser; T158 build proceeds on correct data

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote into this file's Traceability block; anchors / replaces planner-suggested `requirement:uuid`; confirms scope
2. **robbin-architect** diagnoses A vs B vs both; samples ≥3 Requirement JSONs + reads `rb-tree-item` / `rb-requirement-detail`; writes Design section
3. **robbin-expert** implements the chosen fix(es); carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS10 + visual + spot-check + regression; commits verification report into QA Audit

## Definition of Done
- [ ] All AC met (AC1–AC10) — especially AC5 (browser smoke shows speaky titles)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T126 / T143 / T146 / T154 / T160
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with pre-fix screenshot + post-fix verification)

## QA Audit & User Feedback
- 2026-06-01: PO-relayed Tron live bug — "the names do not fit the json" — /trace Requirement items render verbatim blockquotes as titles instead of the speaky `model.name` from T146/T154. Sibling to T160 (different root cause, same surface). Candidate root causes: (A) `model.name` data-store wrong post-T154, (B) renderer reads wrong field. Architect to diagnose. CMM4 4-role enforced (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC9 + DoD (#15+#16). Awaiting req anchor → architect diagnosis → expert fix → tester verify → Tron QA.

## Subtasks
None (atomic bug-fix task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 25 (Requirement title-render bug; sibling to T160)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (Tron live-bug; blocks readable traceability browser; parallel with T160)*
