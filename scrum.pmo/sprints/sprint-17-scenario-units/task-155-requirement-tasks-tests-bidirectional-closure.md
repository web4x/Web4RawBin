[Back to Sprint 17 Planning](./planning.md)

# T155: Requirement `tasks[]` + `tests[]` bidirectional closure

[task:uuid:c1b9f69e-a9da-4559-808c-6c147b65bef6]

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
> **Per-Req audit gate (PO 2026-06-01):** for every Requirement scenario —
> (a) `model.tasks[]` count equals the count of upward refs `task.links.up`
> matching that requirement (bidirectional closure from the task side);
> (b) `model.tests[]` count equals the count of test files / `[test:uuid:]`
> markers whose coverage includes this requirement. Mismatch = hard FAIL
> (same gate pattern as T151/T152/T153/T154's count-match ACs).

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — B16 captured ✓ (`e6fdda6`, canonical req:uuid:f6a7b8c9-…). Additional req work: confirm the scope — is it derived purely from `task.links.up` reverse-scan + `[test:uuid:]` coverage, or also from explicit forward bullets in `requirements.md`?; clarify how a test "covers" a requirement (test file's `## Traceability` `requirement:` ref? explicit `covers:` annotation? `[test:uuid:]` marker tied to a R-number?); produce per-Req gap list
2. **robbin-architect** — design the bidirectional closure: (i) reverse-scan all task scenario units' `model.links.up[]` (or task files' `## Traceability` upward refs) for `requirement:` references; (ii) for each matched requirement, populate `requirement.model.tasks[]` with the back-pointer; (iii) scan test files for `[test:uuid:…]` markers and their requirement coverage (architect names the marker / annotation shape); populate `requirement.model.tests[]`; (iv) design per-Req audit (tasks-count == upward-ref-count; tests-count == coverage-count); update `scrum.pmo/standards/traceability-standard.md` Requirement shape spec to include the `tests[]` field if not already there
3. **robbin-expert** — implement the closure script per architect's design (extends T151/T152/T153/T154 migrator pattern: reverse-scan tasks + tests; populate `requirement.model.tasks[]` + `requirement.model.tests[]` per requirement; emit per-Req audit table); dry-run first; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify per-Req: `model.tasks[]` count == upward-ref count (count match); `model.tests[]` count == test-coverage count (count match); spot-check ≥5 Requirements across sprints; T126 ViewGenerator regenerates Requirement `.md` views with both downward edges (tasks + tests) visible + clickable per T143; chain audit (`trace-cli`) clean

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:c1b9f69e-a9da-4559-808c-6c147b65bef6]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B16 in [scrum.pmo/backlog.md](../../backlog.md), commit `e6fdda6`
  - **B16 requirement** `[requirement:uuid:f6a7b8c9-daeb-4fc0-a123-456789010b16]`
    Verbatim Tron quote:
    > "requirement quality has improved.. BUT tasks and tests are still empty"
- down
  - None at parent level (architect may split T155.x per-field if scope warrants — coordinate with planner first)
- follows
  - [T119: Test traceability](../sprint-13-stability/task-118-e2e-cleanup.md) — historical test-traceability pattern (architect to verify the link / replace with the right T119 file)
  - [T126: Generated views + 7 templates](./task-126-views.md) — Requirement template consumes the populated `tasks[]` + `tests[]`
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — TraceLink class (T155 may emit `requirement → task` + `requirement → test` TraceLink units)
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — `tasks[]` + `tests[]` are downward tree edges from the Requirement
  - [T146: Requirement-entry NAME-first format](./task-146-requirement-name-first-format.md) — source-shape precursor
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — task + test symlinks resolve via the tree
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — the array shape T155 populates
  - [T152: UC data quality (object/verb + PUML links)](./task-152-usecase-data-quality-object-verb-from-name-puml-links.md) — sibling data-quality pattern
  - [T153: UC residual fields (classes + requirement)](./task-153-populate-classes-requirement-on-ucs.md) — sibling; introduced `altId` on Requirements (reverse-lookup precedent)
  - [T154: Requirement name vs description split + tasks[] populated](./task-154-requirement-data-quality-name-description-tasks.md) — direct predecessor; T155 closes the residual `tasks[]` count gap **bidirectionally** + adds `tests[]` (T154 wired `tasks[]` from forward links only; T155 reverse-scans for completeness)
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B16 (above)
  - **use case:** UC-TBD (architect — likely `requirement.reverseClosureTasks`, `requirement.reverseClosureTests`, `audit.requirementBidirectionalCounts`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** closure script (architect names — likely extends `scripts/migrate-to-scenario.ts`) / `RequirementLoader` defaults (add `tests: []` if missing) / `scrum.pmo/standards/traceability-standard.md` Requirement shape spec

## Context

Tron 2026-06-01 (B16): after T154 landed (name/description + `tasks[]`
populated from forward links), the per-Req audit still shows `tasks[]`
incomplete + `tests[]` empty. T154's forward-link parse missed cases where
the relationship is encoded ONLY on the task side (`task.links.up`)
without a matching forward bullet in `requirements.md`. T155 closes both
gaps via **bidirectional closure**:

- **Tasks (closure):** reverse-scan every Task scenario's `model.links.up`
  (and/or task file's `## Traceability` upward refs) — for each `requirement:`
  back-pointer, append to that requirement's `model.tasks[]`. Deduplicate
  with whatever T154 already wrote.
- **Tests (new):** scan test files / `[test:uuid:…]` markers for their
  requirement coverage; populate `requirement.model.tests[]`.

## Intention

### Why this task exists
- T154 left `tasks[]` partial (forward-only); T155 closes via reverse-scan
- `tests[]` was never populated; T155 introduces it for full traceability
- Tron's quality bar: ALL Requirement fields populated to per-Req count gate

### Problems this task solves
- `model.tasks[]` incomplete where the link is encoded only on task side
- `model.tests[]` empty → no test coverage edge from Requirements
- Audit gap: T154 audits forward count; T155 audits bidirectional closure

### How it solves them
- Reverse-scan task units for upward requirement refs → back-populate
- Scan test files for coverage refs → populate tests array
- Per-Req audit gate: tasks count == reverse-scan count; tests count ==
  coverage count

## Acceptance Criteria
- [ ] AC1 (Shape spec) — `RequirementLoader` defaults include
  `tasks: []` AND `tests: []`; documented in
  `scrum.pmo/standards/traceability-standard.md`
- [ ] AC2 (Tasks reverse-closure rule) — Architect-finalized rule for
  reverse-scanning task units' upward refs; documented in the standard
- [ ] AC3 (Tests coverage rule) — Architect-finalized rule for how a test
  file declares requirement coverage (marker / annotation / linkage);
  documented in the standard
- [ ] AC4 (Tasks closure per Req) — For EVERY Requirement scenario, the
  count of `model.tasks[]` entries EQUALS the count of Task units whose
  `links.up` references that requirement. Per-Req audit table reports
  mismatches (target: 0). Mismatch = hard FAIL.
- [ ] AC5 (Tests coverage per Req) — For EVERY Requirement scenario, the
  count of `model.tests[]` entries EQUALS the count of tests whose coverage
  includes that requirement (per architect's rule). Per-Req audit table
  reports mismatches (target: 0). Mismatch = hard FAIL.
- [ ] AC6 (Idempotence) — Running the closure twice yields the same JSON;
  counts unchanged on the second run
- [ ] AC7 (Dry-run) — `--dry-run` mode reports per-Req audit table without
  writing
- [ ] AC8 (Spot-check round-trip ≥5 Reqs) — Architect/tester selects ≥5
  Requirements across S10–S17; verifies bidirectional counts match
- [ ] AC9 (T126 regenerates) — Requirement `.md` views show both downward
  edges: tasks + tests, each clickable per T143
- [ ] AC10 (`trace-cli` clean) — Chain audit shows 0 broken
  requirement → task or requirement → test links
- [ ] AC11 (Regression) — No regression on T126 / T134 / T143 / T146 /
  T149 / T151 / T152 / T153 / T154
- [ ] AC12 — `npm run build` succeeds; all existing tests pass
- [ ] AC13 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json`
  "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME
  commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt
  (no new route — architect to confirm)
- [ ] AC14 — All 4 roles committed work in this file

## Test Scenarios
File: `test/vitest/requirement-bidirectional-closure.test.ts` (new — sibling to T154's data-quality test) + per-Req evidence table committed to QA Audit.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (tasks reverse-closure per Req) | Dry-run audit; emit per-Req table `Req → reverse-scanned-tasks-count → model.tasks-count` | Every row: counts match |
| TS2 (tests coverage per Req) | Dry-run audit; emit per-Req table `Req → covering-tests-count → model.tests-count` | Every row: counts match |
| TS3 (reverse-scan unit test) | Architect's rule on fixture task units with known upward refs | All `requirement:` back-pointers extracted |
| TS4 (test coverage unit test) | Architect's rule on fixture test files with known requirement coverage | All coverage links extracted |
| TS5 (idempotence) | Apply closure twice | Second run reports 0 changes |
| TS6 (spot-check ≥5 Reqs) | Compare reverse-scan results vs `requirement.model.tasks[]` + `tests[]` for 5+ Reqs across sprints | All match |
| TS7 (T126 regenerates) | View a Requirement `.md` post-pass | Shows tasks + tests downward edges; clickable per T143 |
| TS8 (broken-link audit) | `trace-cli` chain audit | 0 broken req → task / req → test links |
| TS9 (regression) | Visual + click-through across T126 / T143 / T146 / T151 / T152 / T153 / T154 | No regression |
| TS10 (rule-pair post-bump) | New CACHE_NAME activates | Richer Req views on Tron's device |

## Dependencies
- **Requires:** T154 (Requirement name/description + forward `tasks[]` — T155 closes the count gap bidirectionally + adds `tests[]`), T151 (JSON arrays — shape), T134 (TraceLink class — may emit closure links), T126 (ViewGenerator + Requirement template — consumes both arrays), T143 (chain tree — downward edges), T149 (universal symlinks — task + test refs resolve)
- **Coordinate-with:** T152 / T153 (sibling UC data-quality pass; shares the reverse-lookup machinery)
- **Enables:** Requirement nodes are FULLY first-class data in both directions; closes the last per-Req audit gap

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** B16 captured ✓; does additional req work: scope confirmation (reverse-scan only vs forward+reverse), test-coverage marker shape; per-Req gap list
2. **robbin-architect** designs: reverse-scan rule + test-coverage rule + per-Req audit; standard update; writes Design section here
3. **robbin-expert** implements (extends T154 migrator); dry-run; commits per-Req closure table into QA Audit as evidence; apply pass after PO sign-off; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS10 + ≥5-Req round-trip + regression; commits verification report into QA Audit

## Definition of Done
- [ ] All AC met (AC1–AC14) — especially AC4 (tasks closure count match, zero mismatches) and AC5 (tests coverage count match, zero mismatches)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T126 / T134 / T143 / T146 / T149 / T151 / T152 / T153 / T154
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with per-Req bidirectional closure evidence table)

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T155 as the Requirement bidirectional closure pass (sibling/successor to T154). B16 already captured by req-eng (`e6fdda6` canonical req:uuid:f6a7b8c9-…). Per-Req audit gate AC4 + AC5 (tasks count match + tests count match). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC13 + DoD (learnings #15 + #16). Awaiting architect design → expert dry-run + apply → tester per-Req verify → Tron QA.

## Subtasks
None at parent level (architect may split T155.x if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 19 (Requirement bidirectional closure: tasks + tests)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (closes the last per-Req count gap; rides on T154 + T151/T152/T153 audit machinery)*
