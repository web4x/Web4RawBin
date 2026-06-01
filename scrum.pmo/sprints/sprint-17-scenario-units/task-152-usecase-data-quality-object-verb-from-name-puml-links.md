[Back to Sprint 17 Planning](./planning.md)

# T152: UseCase data quality — derive object/verb from name + populate tasks/classes/requirement links from PUML

[task:uuid:59b76a78-a9c1-418f-81a5-52a97ffc0ecd]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `b741d50` architect pre-design + `119e9c8` req-eng anchor B13 verbatim + canonical req:uuid)
  - [ ] creating test cases
  - [x] implementing (`1b62d75` v0.5.49 — UC data quality: object/verb derived + PUML refs populated + S16 migration; rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME → rawbin-v0.5.49)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Diligence directive (PO 2026-06-01):** per-UC audit count required —
> object/verb non-empty AND links count match PUML refs.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron quote for this directive; replace the planner-suggested `requirement:uuid` below with req's canonical one if different; confirm the derivation rule for `object` + `verb` from a UC name (canonical separator? e.g. `Object.verb` dot-form OR `verb-object` slug-form — Tron's literal authoritative)
2. **robbin-architect** — design the UseCase data-quality pass: (i) derive `model.object` + `model.verb` per UC by parsing the UC `name` (specify the exact rule, edge cases for multi-dot / hyphens / missing separator); (ii) parse each PUML diagram referenced by a UC, extract the typed refs (tasks, classes, requirements) from PUML actors/notes/relations, and populate the UC's JSON arrays (`model.links.tasks[]`, `model.links.classes[]`, `model.chain.requirement`, etc.); (iii) design the per-UC audit (object/verb non-empty + links count == count of PUML refs for that UC); update `scrum.pmo/standards/traceability-standard.md` to record the UseCase data shape
3. **robbin-expert** — implement the data-quality script per architect's design (parses UC names, parses linked PUML, populates JSON arrays); runs dry-run, produces the per-UC audit table; runs apply pass after PO sign-off; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify per-UC: object/verb non-empty for every UC scenario; links count matches PUML refs exactly (zero mismatches); spot-check ≥5 UCs round-trip (UC name → derived object/verb; PUML ref → JSON array entry); chain audit (`trace-cli`) clean across all UC units; T126 ViewGenerator regenerates UC `.md` views from the populated arrays

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:59b76a78-a9c1-418f-81a5-52a97ffc0ecd]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B13 in [scrum.pmo/backlog.md](../../backlog.md), commit `0fff8be`
  - **B13 requirement** `[requirement:uuid:c3d4e5f6-a7b8-4c9d-e0f1-234567890b13]`
    Verbatim Tron quote:
    > "i picked an arbitrary example...still no traceability content inside. object, verb empty even if it can be derived from name. bad data quality"
- down
  - None at parent level (architect may split T152.x per derivation-rule vs PUML-extraction if scope warrants — coordinate with planner first)
- follows
  - [T117: UseCase as class instances in PUML](./task-117-usecase-as-class.md) — first-class UC instances T152 reads from
  - [T126: Generated views + 7 templates](./task-126-views.md) — UC template consumes the populated arrays
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — TraceLink class T152 may emit
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — every typed reference a clickable link; T152 makes the UC node's edges live
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — UC speaking-name symlink T152's arrays resolve via
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — the array shape T152 populates on UC units
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B13 `[requirement:uuid:c3d4e5f6-a7b8-4c9d-e0f1-234567890b13]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `usecase.deriveObjectVerb`, `usecase.populateLinksFromPuml`, `audit.useCaseDataQuality`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds the new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** data-quality script (architect names — likely `scripts/uc-data-quality.ts` or extends `scripts/migrate-to-scenario.ts`) / `scrum.pmo/standards/traceability-standard.md` (UC shape spec) / UC scenario JSON schema

## Context

Current state (post-T117 / T126 / T134 / T143 / T149 / T151):
- UC scenarios exist as first-class units in the scenario index (T117)
- Each UC has a `model.name`; many follow the convention `Object.verb` (e.g.
  `TaskManager.createTask`) but `object` and `verb` are NOT split into
  separate fields → templates / audits can't filter by class-of-object
- T151 just landed the JSON `model.links.*` / `model.chain.*` arrays — but
  for UC units, those arrays may be sparse: the PUML diagrams already
  encode the UC's participating tasks / classes / requirement, but that
  edge data hasn't been mirrored into the UC's JSON arrays
- T126 templates render UCs without the object/verb split or the link
  arrays — visually thin

Tron's directive (PO 2026-06-01): make UC scenarios first-class data —
(a) derive `object` + `verb` from `name`; (b) populate the UC's link arrays
from the PUML refs; (c) audit per-UC that both are present and counts match.

## Intention

### Why this task exists
- UC nodes are currently sparse — name only, no structured derivative
- PUML carries the chain data but it lives in a different format than
  the JSON arrays T151 standardized
- Without object/verb split, UC filtering / grouping in templates and
  audits has to re-parse the name every time (fragile)
- T143's tree + T149's universal symlinks expect UC arrays to be live
  edges, not empty placeholders

### Problems this task solves
- UC `model.object` / `model.verb` empty → templates have nothing to group by
- UC `model.links.tasks[]` / `model.links.classes[]` / `model.chain.requirement`
  empty → 🔗 to a UC resolves but its outbound refs don't
- No per-UC audit gate → silent data quality drift over time

### How it solves them
- Parse UC `name` once at write time; persist `object` + `verb` on the unit
- Parse the PUML diagram once; extract the UC's referenced
  tasks / classes / requirement; write the refs into the UC's JSON arrays
- Per-UC audit: `object` and `verb` non-empty AND `links` count ==
  `PUML refs` count for that UC

## Design (robbin-architect, 2026-06-01 — adopted from `b741d50` pre-design; impl 1b62d75)

### Derivation rule — `deriveObjectVerb(name)`
```typescript
function deriveObjectVerb(name: string): { object: string; verb: string } {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return { object: name, verb: '' };
  return {
    object: name.slice(0, lastDot),   // 'ior' from 'ior.resolveClass'
    verb: name.slice(lastDot + 1),    // 'resolveClass' from 'ior.resolveClass'
  };
}
```
Applied to all 15 existing S17 UCs + future UCs where object/verb are empty.
**Audit evidence (15 UCs split cleanly, zero ambiguity):** unit.load → unit/load, ior.resolveClass → ior/resolveClass, ior.resolveInstance, index.put, index.get, view.renderHtml, view.renderMd, view.liveUpdate, tree.generateMd, tree.navigate, tree.symlinkJson, migrate.sprintToScenario, migrate.preserveHierarchy, planning.generate, chain.traceMethodToReq.

### PUML extraction — two formats supported

**S17 free-form** (existing `s17-usecases.puml`):
```
class "unit.load" <<UseCase>> {
    [uc:uuid:17a00101-...]
    R17.1 + R17.2              ← requirement refs (split on +, /, ,)
    T124.1 / T125              ← task refs (split on /, ,)
    Read scenario JSON...      ← description (ignored for refs)
}
```
Parse rules:
- Lines matching `R\d+\.\d+` → `model.chain.requirement` / `model.links.requirements[]`
- Lines matching `T\d+(?:\.\d+)?` → `model.links.tasks[]`

**S16 structured fields** (also S16 17 UCs migrated by this task):
```
class "detailDrawer.open" <<UseCase>> {
    [uc:uuid:16a01001-...]
    requirement: R16.1
    task: T110
    object: RbDetailDrawer
    verb: open
}
```
Parse rules: `key: value` lines map directly to `model.<key>` fields.

### Two-part fix landed in `1b62d75` v0.5.49
- **Part 1** auto-derives object/verb across all 15 S17 UCs (`deriveObjectVerb`)
- **Part 2** parses both PUML formats; populates `model.links.tasks[]`, `model.links.requirements[]` (+ S16 `classes` / `requirement` / `object` / `verb`); migrates the 17 S16 UCs into the scenario index alongside S17

Per-UC audit table evidence to be committed by tester in QA Audit (AC5 hard-FAIL gate).

## Acceptance Criteria
- [ ] AC1 (Derivation rule) — Architect-finalized rule documented in
  `scrum.pmo/standards/traceability-standard.md`: how `object` + `verb` are
  derived from a UC `name` (separator, edge cases: multi-dot, hyphen,
  missing separator)
- [ ] AC2 (Object/verb non-empty per UC) — For EVERY UC scenario unit,
  `model.object` and `model.verb` are non-empty strings; per-UC audit
  table reports any UC failing this (target: 0 failures)
- [ ] AC3 (PUML ref extraction) — Architect specifies the PUML extraction
  rule (which PUML constructs encode UC participation: actors, notes,
  relations, stereotypes); expert implements per spec
- [ ] AC4 (Links populated per UC) — Each UC scenario's
  `model.links.tasks[]`, `model.links.classes[]`, `model.chain.requirement`,
  and any other architect-defined link arrays are populated from the
  parsed PUML refs
- [ ] AC5 (Count match — loss-detection gate) — For EVERY UC scenario,
  the count of PUML refs (per relation type) EQUALS the count of JSON
  array entries (per matching field). Any mismatch is a hard FAIL.
  Per-UC audit table emitted as evidence.
- [ ] AC6 (Idempotence) — Running the data-quality pass twice yields the
  same JSON state; counts unchanged on the second run
- [ ] AC7 (Dry-run) — `--dry-run` mode reports per-UC audit table without
  writing
- [ ] AC8 (Spot-check round-trip ≥5 UCs) — Architect/tester selects ≥5
  UCs across different objects; verifies `object`/`verb` derivation
  matches expectation AND `links` arrays carry the same refs as the PUML
- [ ] AC9 (T126 regenerates) — After the data-quality pass, T126
  ViewGenerator can regenerate the UC `.md` view with object/verb in the
  template + populated links rendered as chain bullets
- [ ] AC10 (`trace-cli` clean) — Chain audit reports 0 broken UC links;
  orphan/missing-target counts ≤ pre-migration baseline
- [ ] AC11 (Regression) — No regression on T117 / T126 / T134 / T143 /
  T149 / T151 — other classes and the tree/symlink/array machinery
  unchanged
- [ ] AC12 — `npm run build` succeeds; all existing tests pass
- [ ] AC13 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json`
  "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME
  commit-set as the user-facing impl (T126 UC view regeneration reaches
  Tron's device). (c) STATIC_SHELL: likely exempt (no new route — architect
  to confirm)
- [ ] AC14 — All 4 roles committed work in this file (req anchor +
  architect design + expert impl + tester per-UC verify)

## Test Scenarios
File: `test/vitest/uc-data-quality.test.ts` (new) + per-UC evidence table committed to QA Audit.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (object/verb per UC) | Dry-run audit across all UC scenarios in the index | Every UC: `object` non-empty, `verb` non-empty |
| TS2 (count match per UC) | Dry-run audit emits per-UC table `UC → PUML-refs-count → JSON-array-count` per relation type | Every row: PUML count == JSON count |
| TS3 (derivation rule unit tests) | Architect's rule applied to synthetic names: `Object.verb`, `Object.verb.method`, `verb-only`, `object-only` | Each yields the architect-specified outcome (object/verb split or controlled "missing" indicator) |
| TS4 (PUML extraction rule unit tests) | Architect's rule applied to a fixture PUML with known refs | All refs extracted; UC instance → tasks / classes / requirement edges populated |
| TS5 (idempotence) | Apply data-quality pass; run again | Second run reports 0 changes |
| TS6 (round-trip spot-check ≥5 UCs) | Compare PUML refs vs JSON arrays for 5+ UCs across different objects | All match; no silent drops |
| TS7 (T126 regenerates) | Run ViewGenerator post-pass; open a UC `.md` view | Shows `object` + `verb` in template + populated links as chain bullets |
| TS8 (broken-link audit) | `trace-cli` chain audit | 0 broken UC links; orphans ≤ baseline |
| TS9 (regression) | Visual + click-through on T126 / T141 / T144 / T147 / T149 / T146 / T151 surfaces | No behavioral change for non-UC paths |
| TS10 (rule-pair post-bump) | New CACHE_NAME activates; richer UC views visible on Tron's device | ✓ |

## Dependencies
- **Requires:** T117 (UseCase as PUML class — provides the source data), T126 (ViewGenerator + UC template), T134 (TraceLink class — architect decides if arrays inline objects or TraceLink-unit references), T143 (chain tree — UC node's edges go live), T149 (universal symlinks — UC ref resolution), T151 (JSON model arrays — the shape T152 populates)
- **Coordinate-with:** T146 (NAME-first format — UC `name` line consistent with the derivation rule), T141 (chain-link rendering — UC anchors resolve via populated arrays)
- **Enables:** UC nodes are full first-class data; templates filter / group by object/verb; chain audits enforce UC data quality going forward

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote into the Traceability block above; anchors / replaces the planner-suggested `requirement:uuid` with req's canonical one; closes any scope ambiguity (separator rule, PUML extraction surface)
2. **robbin-architect** designs: derivation rule (with edge cases); PUML extraction rule; per-UC audit; standard update; writes Design section here
3. **robbin-expert** implements the data-quality script; runs dry-run; commits the per-UC audit table into QA Audit; after PO sign-off, runs the apply pass; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS10 + ≥5-UC round-trip + regression; commits verification report into QA Audit

## Definition of Done
- [ ] All AC met (AC1–AC14) — especially AC2 (object/verb non-empty per UC, zero failures) and AC5 (count match per UC, zero mismatches)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T117 / T126 / T134 / T143 / T149 / T151
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with per-UC count + object/verb evidence table)

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T152 with per-UC audit count gate. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (#17); rule-pair (a)+(b) baked into AC13 + DoD (#15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:010deb5a` with req's canonical `requirement:uuid:c3d4e5f6...0b13` (from B13 capture, commit `0fff8be`). Verbatim Tron quote anchored. Tron's key phrase: "bad data quality" — object+verb derivable from name but not populated, traceability arrays empty. Same T151 discipline (no info loss, count gate). Ready for architect.

## Subtasks
None at parent level (architect may split T152.x per derivation-rule vs PUML-extraction if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 16 (UseCase data quality — object/verb + PUML links)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (foundation for UC filtering/grouping in templates; rides on T117/T126/T143/T149/T151)*
