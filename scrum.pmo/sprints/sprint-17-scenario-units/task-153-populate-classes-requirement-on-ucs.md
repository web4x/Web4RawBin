<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T153: T152 follow-up — populate `model.classes` + `model.requirement` on UseCases

[task:uuid:acfc7ebf-1d8c-445f-9cb7-bc5d23e5f0c0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — architect pre-design adopted from stub `task-153-uc-class-req-refs.md`; req-eng backfill DONE via `ee04ffb` — B14 anchored with verbatim Tron quote "quality much better… classes array and requirements still empty and traceability therefore broken" + canonical `requirement:uuid:d4e5f6a7-…`)
  - [ ] creating test cases
  - [x] implementing — both halves landed: `0365ff1` v0.5.50 (classes ✓ from PUML arrows + S16 `object:` field) + `c77d1f5` architect v2 R-resolution design (`model.altId` on Requirements) + `a9f9571` v0.5.51 expert R-resolution impl (altId on requirements + UC req refs via altId lookup). Rule-pair (a)+(b) ✓ in BOTH ship commits (v0.5.50 + v0.5.51).
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Per-UC audit gate:** every UC must have `model.classes[]` populated (non-empty
> where applicable) AND `model.requirement` set (non-null where applicable);
> counts must match PUML refs exactly. Mismatch = hard FAIL (same gate pattern
> as T152's AC5 and T151's AC5).

## Traceability

`[task:uuid:acfc7ebf-1d8c-445f-9cb7-bc5d23e5f0c0]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B14 in [scrum.pmo/backlog.md](../../backlog.md), commit `5b90ac4`
  - **B14 requirement** `[requirement:uuid:d4e5f6a7-b8c9-4dae-f0a1-234567890b14]`
    Verbatim Tron quote:
    > "quality much better… classes array and requirements still empty and traceability therefore broken"
- down
  - None at parent level (architect may split T153.x per residual field if scope warrants — coordinate with planner first)
- follows
  - [T117: UseCase as class instances in PUML](./task-117-usecase-as-class.md) — first-class UC instances
  - [T126: Generated views + 7 templates](./task-126-views.md) — UC template consumes the populated arrays
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — TraceLink class (T153 may emit `class → uc` TraceLink units)
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — every typed reference a clickable link; T153 closes UC's class/requirement edges
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — class + requirement speaking-name symlinks T153's arrays resolve via
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — the array shape T153 populates
  - [T152: UseCase data quality (object/verb + PUML links)](./task-152-usecase-data-quality-object-verb-from-name-puml-links.md) — T153 is its direct follow-up; T152 closed tasks + requirements[]; T153 closes classes + requirement (singular)
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B14 `[requirement:uuid:d4e5f6a7-b8c9-4dae-f0a1-234567890b14]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `usecase.populateClassesFromPuml`, `usecase.resolveRequirement`, `audit.useCaseClassesAndRequirement`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** data-quality script extension (architect names — likely extends T152's `scripts/uc-data-quality.ts`) / `scrum.pmo/standards/traceability-standard.md` (UC shape spec) / UC scenario JSON schema

## Task Description

Follow-up to T152: populate model.classes and model.requirement on UseCase units.

## Context

Post-T152 (v0.5.49) state — per-UC audit landed; residual gaps:
- T152's Part 1 derived `model.object` + `model.verb` for all 15 S17 UCs
  (and 17 S16 UCs migrated in the same pass) — fully populated
- T152's Part 2 parsed PUML to populate `model.links.tasks[]` and (per
  S16 structured format) `model.links.requirements[]`
- **Residual:** `model.classes[]` (which Class scenarios a UC participates
  in) and `model.requirement` (the singular primary-requirement link, when
  the architect decides one is canonical) — still empty on many UCs

Tron's directive (PO 2026-06-01 as T152 follow-up): close those residual
fields with the same per-UC audit discipline that T152 introduced.

## Intention

### Why this task exists
- T152 left two UC fields incomplete; T153 finishes the job
- `classes` array is essential for templates that group UCs by class
- `requirement` singular field clarifies the dominant requirement when a
  UC has multiple ref candidates

### Problems this task solves
- `model.classes[]` empty → templates lose the class-grouping view
- `model.requirement` empty → 🔗 to UC's primary requirement breaks
- Audit gap: T152 audits tasks + requirements counts; T153 extends to
  classes + (singular) requirement

### How it solves them
- Extend T152's PUML extraction rule to cover class refs
- Architect defines the requirement-singular resolver (e.g. first listed,
  or explicit `requirement:` field on S16 format)
- Per-UC audit table reports classes-count match + requirement-presence
- T126 regenerates UC view to include classes + requirement edges

## Dependencies

- **Requires:** T152 (UC data-quality script + per-UC audit pattern — T153 extends both), T117 (UC PUML class), T126 (ViewGenerator + UC template), T134 (TraceLink class), T143 (chain tree), T149 (universal symlinks), T151 (JSON arrays shape)
- **Coordinate-with:** T146 (NAME-first format — class + requirement refs use NAMEs in templates)
- **Enables:** UC nodes are FULLY first-class data; templates filter / group by class; UC's primary-requirement link is canonical

## Definition of Done

- [ ] All AC met (AC1–AC14) — especially AC3 (classes populated where PUML has refs, zero failures), AC4 (requirement populated where PUML has ≥1 req ref, zero failures), AC5 (count match per UC, zero mismatches)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T117 / T126 / T134 / T143 / T149 / T151 / T152
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with per-UC count + requirement-presence evidence)

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T153 as T152 follow-up. CMM4 4-role (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC13 + DoD (#15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:7eb4cc80` with req's canonical `requirement:uuid:d4e5f6a7...0b14` (from B14 capture, commit `5b90ac4`). Verbatim Tron quote anchored. Tron acknowledges T152 progress ("quality much better") but classes[] + requirement still empty = "traceability therefore broken". Ready for architect.

## Subtasks

None at parent level (architect may split T153.x if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 17 (UC residual fields — classes + requirement singular; T152 follow-up)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (closes T152 residual gap; rides on T152 audit machinery)*
