# T154: Requirement data quality — name vs description split + `tasks[]` populated
[task:uuid:34ea153f-1981-48ef-bfac-fc336ebf58d4]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `cd84ffe` req-eng B15 anchor (verbatim Tron quote + canonical req:uuid:e5f6a7b8-…) + `2077202` architect design — Requirement data quality)
  - [ ] creating test cases
  - [x] implementing (`e3ae6ea` v0.5.52 — Requirement data quality migration: name/description/tasks[]; rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME → rawbin-v0.5.52)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Per-Requirement audit gate (PO 2026-06-01):** for every Requirement scenario —
> (a) `name` is plain English (the speaky 3–5 word summary, per T146 NAME-first
> format), (b) `description` is the **verbatim Tron quote** (no paraphrase, no
> duplicate of NAME), (c) `tasks[]` count equals the count of forward links
> req → task across `requirements.md` + task files. Mismatch on any of the
> three = hard FAIL (same gate pattern as T151's AC5, T152's AC5, T153's AC5).

## Traceability

`[task:uuid:34ea153f-1981-48ef-bfac-fc336ebf58d4]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B15 in [scrum.pmo/backlog.md](../../backlog.md), commit `8cf2b7f`
  - **B15 requirement** `[requirement:uuid:e5f6a7b8-c9da-4ebf-0a12-345678900b15]`
    Verbatim Tron quote:
    > "data quality massively improved...requirement quality still poor. name and description should differ. name should be similar to filename but plain English. tasks traceability is still empty. needs to improve too."
- down
  - None at parent level (architect may split T154.x per field if scope warrants — coordinate with planner first)
- follows
  - [T126: Generated views + 7 templates](./task-126-views.md) — Requirement template consumes the populated fields
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — TraceLink class (T154 may emit `requirement → task` TraceLink units)
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — `tasks[]` is the Requirement's downward tree edge
  - [T146: Requirement-entry NAME-first format](./task-146-requirement-name-first-format.md) — defines the source shape (NAME line + Tron blockquote)
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — Requirement symlinks resolve via populated arrays
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — `tasks[]` is one of the array shapes T151 standardized
  - [T152: UC data quality (object/verb + PUML links)](./task-152-usecase-data-quality-object-verb-from-name-puml-links.md) — sibling data-quality pattern (UC side)
  - [T153: UC residual fields (classes + requirement)](./task-153-populate-classes-requirement-on-ucs.md) — sibling data-quality pattern; introduces `altId` field on Requirements — T154 may reuse the altId-based reverse-lookup for `tasks[]` resolution
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B15 `[requirement:uuid:e5f6a7b8-c9da-4ebf-0a12-345678900b15]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `requirement.parseNameDescription`, `requirement.populateTasks`, `audit.requirementDataQuality`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** data-quality script extension (architect names — likely extends `scripts/migrate-to-scenario.ts`) / `RequirementLoader` defaults / `scrum.pmo/standards/traceability-standard.md` Requirement shape spec

## Context

Sibling to T152 (UC data quality) and T153 (UC residual fields). T146 introduced
the NAME-first format for `requirements.md`; T151 standardized JSON model arrays
including `tasks[]`. But for Requirement scenarios:
- `model.name` is set (post-T146) but quality varies — some entries may have
  paraphrased text instead of the canonical 3–5-word plain-English summary
- `model.description` is often empty / duplicate of name — the Tron quote
  blockquote is not being captured as the description per T146's format
- `model.tasks[]` is the forward edge to tasks the Requirement is implemented
  by; sparse today

Tron's directive (PO 2026-06-01 as data-quality completion): close all three
fields with the per-Req audit gate; mismatch on name/description/tasks-count
= hard FAIL.

## Intention

### Why this task exists
- Per-Req data quality is the last missing piece after T152/T153 (UC side)
- Without `tasks[]` populated, requirement → task downward tree edges break
- Without NAME / description split, T146's view templates render uniformly
  but the underlying data carries duplication or empties

### Problems this task solves
- `model.description` empty or duplicate of `name` → no Tron-quote rendering
- `model.tasks[]` empty → 🔗 from Requirement to implementing Task breaks
- Audit gap: T151/T152/T153 audit counts; T154 extends to Requirements

### How it solves them
- Parse each `requirements.md` entry per T146 format → split NAME (line 1)
  from description (blockquote)
- Populate `model.tasks[]` from forward-link bullets in `requirements.md` AND/OR
  reverse-resolve from task files' `## Traceability` `requirement:` refs
- Per-Req audit table: name plain English + description == verbatim quote +
  tasks-count match
- T126 regenerates Requirement view with both fields

## Acceptance Criteria

- [ ] AC1 (Shape spec) — Architect-finalized Requirement shape documented in
  `scrum.pmo/standards/traceability-standard.md`: `model.name` = plain
  English 3–5 word summary; `model.description` = verbatim Tron quote (no
  paraphrase, no duplicate of name); `model.tasks[]` = forward-link array
  to implementing Task units
- [ ] AC2 (name plain English per Req) — For EVERY Requirement scenario,
  `model.name` is non-empty, ≤5 words, plain English (no UUID, no
  R-number, no code marker); per-Req audit table reports failures (target: 0)
- [ ] AC3 (description = Tron quote verbatim per Req) — For EVERY Requirement
  scenario, `model.description` matches the Tron quote blockquote in
  `requirements.md` EXACTLY (whitespace-normalized); per-Req audit reports
  failures (target: 0)
- [ ] AC4 (tasks count match per Req) — For EVERY Requirement scenario, the
  count of `model.tasks[]` entries EQUALS the count of forward links
  req → task found in `requirements.md` + task files' `## Traceability`.
  Mismatch = hard FAIL.
- [ ] AC5 (Idempotence) — Running the data-quality pass twice yields the
  same JSON; counts unchanged on the second run
- [ ] AC6 (Dry-run) — `--dry-run` mode reports per-Req audit table without
  writing
- [ ] AC7 (Spot-check round-trip ≥5 Reqs) — Architect/tester selects ≥5
  Requirements across S10–S17; verifies name + description + tasks against
  the source `requirements.md` + linked task files
- [ ] AC8 (T126 regenerates) — Requirement `.md` views show NAME + Tron-quote
  description + tasks edges (clickable per T143)
- [ ] AC9 (`trace-cli` clean) — Chain audit shows 0 broken
  requirement → task links
- [ ] AC10 (Regression) — No regression on T126 / T134 / T143 / T146 / T149 /
  T151 / T152 / T153
- [ ] AC11 — `npm run build` succeeds; all existing tests pass
- [ ] AC12 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json`
  "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME
  commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt
  (no new route — architect to confirm)
- [ ] AC13 — All 4 roles committed work in this file

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T154 as Requirement-side data-quality pass. CMM4 4-role (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC12 + DoD (#15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:2e6348c1` with req's canonical `requirement:uuid:e5f6a7b8...0b15` (from B15 capture, commit `8cf2b7f`). Verbatim Tron quote anchored. Tron acknowledges data quality progress ("massively improved") but Requirement quality specifically "still poor": name=description (should differ), tasks[] empty. Aligns with T146 (MD name-first) — T154 is the JSON-side equivalent. Ready for architect.

## Subtasks

None (single pass extending the migration pipeline).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 18 (Requirement data quality — name / description / tasks)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (closes the Requirement-class audit gap; sibling to T152/T153 UC data-quality work)*
