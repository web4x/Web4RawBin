[Back to Sprint 17 Planning](./planning.md)

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

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron quote (T152 follow-up directive); replace the planner-suggested `requirement:uuid` below with req's canonical one; confirm which UC fields remain gaps (per T152's audit, likely `model.classes[]` + `model.requirement` are the residual empties)
2. **robbin-architect** — design the population rule for the residual fields (which PUML constructs encode class refs? note + relation? actor stereotype?); decide the inverse-resolver if a UC's `requirement` must be picked from multiple parsed refs; design the per-UC audit (classes-count and requirement-presence per UC); update `scrum.pmo/standards/traceability-standard.md` UseCase shape spec to reference this completion pass
3. **robbin-expert** — implement the population script per architect's design (extends T152's data-quality script, or new pass); runs dry-run, produces the per-UC audit table; runs apply pass after PO sign-off; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify per-UC: `model.classes[]` populated where PUML carries class refs (non-empty where applicable) AND `model.requirement` set per architect's resolver; counts match PUML refs; spot-check ≥5 UCs round-trip; chain audit (`trace-cli`) clean; T126 ViewGenerator regenerates UC `.md` views showing populated classes + requirement edges

**This file is the single source of truth.** No chat clarification.

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

## Design (robbin-architect, 2026-06-01 — adopted from stub `task-153-uc-class-req-refs.md`; T-153 collision resolved)

### Source data in PUML
- **S17 class refs** — arrow lines (`"unit.load" --> SU : implements`); alias map parsed from `class "Name" as ALIAS` (SU→ScenarioUnit, IR→IORResolver, CR→ClassRegistry, SI→ScenarioIndex, ST→SpeakingTree, VT→ViewTemplateRegistry)
- **S16 class refs** — `object:` field inside UC blocks IS the class name
- **S17 requirement refs** — free-form `R17.X + R17.Y` lines inside UC blocks (split on `+` / `/` / `,`)
- **S16 requirement refs** — structured `requirement: R16.X` field

### Parsing (extends T152's `fixUcDataQuality()`)
```typescript
function parseClassRefs(pumlText, ucName, aliasMap): string[]   // S17 arrows
function parseAliasMap(pumlText): Map<alias, className>         // skip <<UseCase>>
function parseS16ObjectAsClass(ucBlock): string | null          // object: field
function parseReqRefs(ucBlock, reqIndex): string | string[]     // structured + free-form
function resolveReqRef(rNum, reqIndex): string                  // R17.X → ior:instance:<uuid> or label
```

### Schema decision
`model.requirement: null` (singular, deprecated for back-compat) **stays**; new `model.requirements: []` (plural array) added to `UseCaseLoader` defaults — consistent with `tasks[]` / `classes[]`. T153 populates `model.requirements[]` (multi-ref) AND keeps `model.requirement` populated with the primary requirement per architect's resolver.

### Expected outcomes (S17 spot-check)
| UC | model.classes[] | model.requirements |
|----|----------------|--------------------|
| unit.load | [ScenarioUnit, IORResolver] | [ior:instance:R17.1, ior:instance:R17.2] |
| ior.resolveClass | [IORResolver, ClassRegistry] | [ior:instance:R17.2] |
| index.put | [ScenarioIndex] | [ior:instance:R17.4] |
| view.renderHtml | [ViewTemplateRegistry] | [ior:instance:R17.7, ior:instance:R17.8] |

### Touchpoints
| File | Change |
|------|--------|
| `scripts/migrate-to-scenario.ts` | Extend `fixUcDataQuality()` with class + req parsers |
| `src/ts/scenario/classes.ts` | `UseCaseLoader`: add `requirements: []` default |

No new routes, no STATIC_SHELL change.

## Acceptance Criteria
- [ ] AC1 (Extraction rule — classes) — Architect-finalized rule for which
  PUML constructs encode a UC's class refs (note / relation / stereotype);
  documented in `scrum.pmo/standards/traceability-standard.md`
- [ ] AC2 (Extraction rule — requirement singular) — Architect-finalized
  rule for picking the singular `model.requirement` when a UC has multiple
  requirement candidates (or always derive from `model.links.requirements[0]`,
  or use an explicit `requirement:` PUML field — architect decides)
- [ ] AC3 (Classes populated per UC) — For every UC scenario where PUML
  carries class refs, `model.classes[]` is populated; per-UC audit table
  reports any UC where PUML has class refs but `model.classes[]` is empty
  (target: 0)
- [ ] AC4 (Requirement populated per UC) — For every UC scenario where PUML
  carries ≥1 requirement ref, `model.requirement` is non-null per the
  architect-finalized resolver; per-UC audit reports any UC with PUML
  requirement refs but null `model.requirement` (target: 0)
- [ ] AC5 (Count match — loss-detection gate) — For EVERY UC, the count of
  PUML class refs EQUALS the count of `model.classes[]` entries.
  Mismatch = hard FAIL. Per-UC audit table emitted as evidence.
- [ ] AC6 (Idempotence) — Running the pass twice yields the same JSON;
  counts unchanged on the second run
- [ ] AC7 (Dry-run) — `--dry-run` mode reports per-UC audit table without
  writing
- [ ] AC8 (Spot-check round-trip ≥5 UCs) — Architect/tester selects ≥5 UCs
  across different classes; verifies extracted classes + requirement match
  the PUML
- [ ] AC9 (T126 regenerates) — UC `.md` views show classes + requirement
  as chain edges (clickable per T143)
- [ ] AC10 (`trace-cli` clean) — Chain audit shows 0 broken UC-class /
  UC-requirement links
- [ ] AC11 (Regression) — No regression on T117 / T126 / T134 / T143 /
  T149 / T151 / T152 (UC's existing object/verb/tasks/requirements arrays
  unchanged)
- [ ] AC12 — `npm run build` succeeds; all existing tests pass
- [ ] AC13 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json`
  "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME
  commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt
  (no new route — architect to confirm)
- [ ] AC14 — All 4 roles committed work in this file

## Test Scenarios
File: `test/vitest/uc-classes-requirement.test.ts` (new — extends T152's `uc-data-quality.test.ts` pattern) + per-UC evidence table committed to QA Audit.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (classes per UC) | Dry-run; emit per-UC table `UC → PUML-classes-count → model.classes-count` | Every row: counts match |
| TS2 (requirement per UC) | Dry-run; report each UC's PUML requirement refs vs `model.requirement` | Every UC with ≥1 PUML req ref has non-null `model.requirement` per resolver |
| TS3 (classes extraction unit test) | Architect's rule on fixture PUML with known class refs | All refs extracted |
| TS4 (requirement resolver unit test) | Architect's resolver on synthetic UC with multiple req refs | Yields the architect-specified `model.requirement` |
| TS5 (idempotence) | Apply twice | Second run reports 0 changes |
| TS6 (round-trip ≥5 UCs) | Compare PUML class+req refs vs JSON across 5+ UCs | All match |
| TS7 (T126 regenerates) | View a UC `.md` post-pass | Shows class + requirement edges; clickable per T143 |
| TS8 (broken-link audit) | `trace-cli` | 0 broken UC-class / UC-req links; orphans ≤ baseline |
| TS9 (regression) | Visual + click-through across T117/T126/T143/T149/T151/T152 | No change for other surfaces |
| TS10 (rule-pair post-bump) | New CACHE_NAME activates | Richer UC views on Tron's device |

## Dependencies
- **Requires:** T152 (UC data-quality script + per-UC audit pattern — T153 extends both), T117 (UC PUML class), T126 (ViewGenerator + UC template), T134 (TraceLink class), T143 (chain tree), T149 (universal symlinks), T151 (JSON arrays shape)
- **Coordinate-with:** T146 (NAME-first format — class + requirement refs use NAMEs in templates)
- **Enables:** UC nodes are FULLY first-class data; templates filter / group by class; UC's primary-requirement link is canonical

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote into the Traceability block above; anchors / replaces the planner-suggested `requirement:uuid`; confirms the residual-field list (classes + requirement singular)
2. **robbin-architect** designs: classes-extraction rule; requirement-singular resolver; per-UC audit extensions; standard update; writes Design section here
3. **robbin-expert** implements (extends T152 script or new pass); dry-run; commits per-UC table as evidence; apply pass after PO sign-off; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS10 + ≥5-UC round-trip + regression; commits verification report into QA Audit

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
