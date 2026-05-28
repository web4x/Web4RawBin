[Back to Sprint 16 Planning](./planning.md)

# T121: Data + traceability-chain fix — diagnose what's "very bad", remediate

[task:uuid:f5121d0a-041b-4e74-e2c5-8b1f0bc4a1ab]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect + req — diagnose phase)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-architect + robbin-req (Tron-assigned, jointly) — diagnose chain-data issues, design + execute the remediation; robbin-expert assists on code changes if the fix reaches source; robbin-tester verifies the chain is clean.
**This file is the single source of truth.** All roles work from this file alone — no chat clarification.

## Traceability

`[task:uuid:f5121d0a-041b-4e74-e2c5-8b1f0bc4a1ab]`

- up
  - [Sprint 16 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:r121-chain-data-fix-041b-3e74-d2c58b1f0bc4]` —
    "The traceability chain data is very bad — diagnose what's wrong and fix it."
    (Tron directive 2026-05-29; req-eng to capture the literal verbatim quote
    in this slot.)
- down
  - None (atomic task — diagnose + fix bundled because the remediation depends on the diagnosis)
- follows
  - [T116: Traceability-chain review](./task-116-chain-review.md) — Pass 5 `[impl:uuid:]` scan + orphan-UC validation
  - [T117: UseCase as class instances in PUML](./task-117-usecase-as-class.md) — Pass 4 PUML UC scan
  - [T119: Test traceability](../sprint-11-traceability/task-119-test-traceability.md) — adds the **test** node to the chain (parallel work; T121 may surface issues T119 also addresses)
- chain (req → usecase → puml → class/method)
  - **requirement:** r121-chain-data-fix (Tron 2026-05-29)
  - **use case:** UC-chainDataDiagnose (new), UC-chainDataRemediate (new); architect adds to S16 PUML
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (architect adds the two diagnose/remediate UCs after design)
  - **class/method:** TBD — depends on the diagnosis. Candidates: `src/ts/trace-cli/trace-cli.ts` (parser tightening, orphan reporting), `scrum.pmo/standards/traceability-standard.md` (rule clarification), task files (chain stubs → real ids), PUML files (broken UC ids), `scrum.pmo/traceability-matrix.md` (mis-mappings)

## Task Description
Tron 2026-05-29 (literal quote to be filled in by req-eng):
> "<verbatim Tron quote pending req capture; planner's reading: 'the chain data
> is very bad — fix it'>"

Two-phase task — **bundled** because the remediation cannot start until the
diagnosis is complete.

### Phase 1 — Diagnose (architect + req jointly)

Inventory what's wrong with the current chain data. Walk the chain
`requirement → task → use case → class/method (→ test, post-T119)` against the
graph emitted by trace-cli (Passes 1-5 today; +6 after T119). Catalog every
class of defect. Likely candidates (planner's hypothesis — architect/req
verify and extend):

| Class | Example | Why "bad" |
|-------|---------|-----------|
| C1 — Stub chain | Many older tasks (S1–S10) have `**requirement:** TBD` or no `chain` block | Chain doesn't resolve; T90's audit would fail at scale |
| C2 — Placeholder requirement:uuids | Recent tasks invent ids like `r118-...-d18b-...` that aren't real v4 UUIDs and aren't linked anywhere | Looks traceable, isn't |
| C3 — Orphan UseCases | UCs declared in PUML with no incoming requirement / no outgoing class | T116's existing orphan-UC check flags this; data has many |
| C4 — Broken PUML refs | `puml: diagrams/...` that doesn't exist, or filename mismatch (T117/T113 hit this earlier) | Chain link doesn't resolve in tooling |
| C5 — Method markers absent | Many src/ files lack `[impl:uuid:]` despite T116 Pass 5 expecting them | Test/runtime layers have no upward link |
| C6 — Matrix drift | `scrum.pmo/traceability-matrix.md` rows disagree with the live graph (T102 fix engine should catch — verify) | Single source of truth contested |
| C7 — Duplicate/colliding ids | Two tasks reference the same uuid; or two reqs map to one task without `changes`/`supersedes` annotation | Graph navigation ambiguous |
| C8 — Closed sprints unmigrated | S1-9 still in legacy format (S11 batches T87/T88/T89 are the planned remediation) | Out of scope of T121 to rewrite, but cataloged |

Output: a diagnosis report (markdown table, in this task file under
"Diagnosis (architect + req, <date>)") that lists each defect class, count,
sample affected files/ids, and severity (BLOCKER / HIGH / MEDIUM / LOW for
T119/T90 readiness).

### Phase 2 — Remediate (architect + req lead, expert assists if source change)

Per the diagnosis, design and execute fixes scoped to T121:

- C1 stubs → req-eng fills in real requirement ids on active sprints (S10-S16);
  S1-9 deferred to S11 T87/T88/T89 batches.
- C2 placeholder ids → req-eng formalizes each invented id into a real entry
  in `scrum.pmo/traceability-matrix.md` (or replaces with a proper v4 UUID).
- C3 orphan UCs → architect prunes or links each in `diagrams/*.puml`.
- C4 broken PUML refs → architect fixes filename/path.
- C5 method markers → expert adds `[impl:uuid:]` on the methods covered by
  task scopes (NOT a wholesale src/ sweep — bounded to the methods listed in
  task chain blocks).
- C6 matrix drift → run `npm run trace:check` (T102 engine); architect/req
  reconcile; commit the reconciled matrix.
- C7 duplicate ids → architect flags + req renames; cross-link via
  `changes`/`supersedes` traceability annotation.
- C8 closed sprints — out of scope, hand back to S11 batches (T87-T89). Document the boundary.

Order of operations: C4 + C6 first (cheap to fix, unblock graph parsing); then
C3/C5/C7 (architect-led); then C1/C2 (req-led, sweep across active sprints);
C8 explicitly deferred.

## Acceptance Criteria
- [ ] AC1 — Diagnosis report committed in this task file (Phase 1 output table with classes C1-C8 counts/samples/severity)
- [ ] AC2 — All BLOCKER + HIGH defects from the diagnosis remediated and verified
- [ ] AC3 — `npm run trace:check` (T102 engine) runs clean against the remediated graph, OR documented allowlist with rationale
- [ ] AC4 — `sprint audit` (Web4Articles compliance) passes 0-issue across S10-S16 task files after remediation
- [ ] AC5 — `scrum.pmo/traceability-matrix.md` reconciled with live graph; T102 engine reports consistent
- [ ] AC6 — S1-9 boundary explicitly documented as deferred to S11 T87-T89 (not in T121 scope)
- [ ] AC7 — `npm run build` succeeds; vitest + playwright pass; no regression
- [ ] AC8 — **Version + sw.js bumped IF any client-facing file changed** (per learnings #15); planning/PUML/task-file-only changes likely don't need bump — architect documents the call

## Test Scenarios

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run trace-cli against the remediated graph | All Passes 1-5 succeed; `validate()` reports `orphanUCs.length <= allowlist`; `orphanImpls.length <= allowlist` |
| TS2 | Run `npm run trace:check` (T102 matrix fix engine) | No drift detected, OR drift auto-fixed and matrix re-committed |
| TS3 | `sprint audit` on S10-S16 | 0 issues |
| TS4 | Open `/trace` browser, navigate a few requirements → tasks → UCs → impls | Every chain link resolves; no broken refs |
| TS5 | Inspect `scrum.pmo/traceability-matrix.md` and live graph | Identical (per T102 consistency engine) |

## Drive Plan (planner-coordinated)

1. **req-eng** captures the verbatim Tron quote in the requirement block above.
   Without the literal text, this task remains in refinement.
2. **architect + req** (Phase 1) — diagnose, commit the classified report in
   this task file. Estimated effort: ~2-3h.
3. **architect + req + expert** (Phase 2) — execute per the order above. Each
   fix is a small commit; the **planner** maintains symbol per state.
4. **tester** (post-Phase 2) — TS1–TS5 verification + manual /trace walk-through.
5. **planner** — coordinate, sync planning.md symbols, verify learnings #15/#16
   apply at the final shipping commit (if it bumps version).

## Dependencies
- **Requires:** T116, T117 (trace-cli machinery); T102 (matrix consistency engine)
- **Enables:** T119's test-layer additions land on a clean base; T90 audit gate has a real target; the `/trace` browser shows truthful data
- **Parallel-with:** T119 (test traceability) — coordinate via req; T119 may surface defects T121 also catches

## Definition of Done
- [ ] All AC met; diagnosis report + remediation evidence in this task file
- [ ] `npm run trace:check` clean; sprint audit clean
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## Diagnosis Report — Phase 1 (robbin-architect, 2026-05-29)

### trace-cli check results
- **23 errors, 117 warnings** across 128 tasks, 139 graph objects
- 8 UseCase objects parsed from PUML (from s16-usecases.puml)

### Defect Catalog

| Class | Count | Severity | Description | Samples |
|-------|-------|----------|-------------|---------|
| **C1 — No requirement up-link** | 117 tasks | MEDIUM | Task has no `[requirement:uuid:]` tag → chain starts at task, not requirement. S1-S9 have zero requirements.md files. | All S1-S9 tasks (80+), plus S11/S13/S16 tasks |
| **C2a — Invalid v4 UUIDs on tasks** | **34 / 128** | **BLOCKER** | Task UUIDs fail strict v4 validation. The 4th group's variant nibble is outside `[89ab]` (uses c/d/e/f). trace-cli `isUuidV4()` rejects them → tasks invisible in graph. | S16 T111 `b1113a7d-...-c3b9-...` (c≠[89ab]), T112 `c1124b8e-...-d4c0-...`, T117 `11179033-...-c915-...`, ALL 8 S16 tasks fail |
| **C2b — Invented non-hex requirement UUIDs** | 3 | **BLOCKER** | T120/T121/T122 have UUIDs starting with `r120-`, `r121-`, `r122-` — not hex at all. Scanner ignores them completely. | `r121-chain-data-fix-041b-3e74-d2c58b1f0bc4` |
| **C3 — Orphan UseCases** | 8 UCs | HIGH | UseCases in PUML with no linked task in the graph (because task UUIDs are invalid v4 → tasks not in graph → UC→task link unresolvable). | `usecase:16a01101-...` through `16a01171-...` |
| **C4 — Placeholder requirement quotes** | 4 | LOW | S14 requirements.md has `_(req to insert literal quote)_` — cosmetic, title extraction uses description line above. | S14 R96-R99 |
| **C5 — No requirements.md** | 9 sprints | HIGH | S1-S9 have no requirements.md → no requirement objects in graph → all their tasks are chain-orphans. | sprint-1 through sprint-9 |
| **C6 — UseCase→Task link gap** | 8 | HIGH | s16-usecases.puml UC classes have `task: T110` etc. as text fields, but trace-cli doesn't parse these into graph links. Scanner only links via `[requirement:uuid]` tags, not PUML field text. | All 15 S16 UCs (8 warned as unlinked) |
| **C7 — S16 has no requirements.md** | 1 | HIGH | Sprint 16 has compound-requirement-source.md but no formal requirements.md with `[requirement:uuid:]` tags → S16 tasks can't up-link. | sprint-16-traceability-ux/ |
| **C8 — Dangling requirement** | 1 | ERROR | `b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e` exists in a requirements.md but no task links to it. | S15 or S10 |

### Root Cause Analysis

**The #1 blocker is C2a: 34 task UUIDs with invalid v4 variant nibbles.** These were likely generated by a tool that doesn't enforce the RFC 4122 variant bits (bits must be `10xx` → first nibble of 4th group must be `8`, `9`, `a`, or `b`). Since `isUuidV4()` in TraceModel.ts rejects them, 34 tasks silently disappear from the graph → their requirement up-links, UC links, and chain links all break.

**The #2 issue is C5+C7: 10 sprints have no requirements.md.** Without requirement objects, 90+ tasks have no chain root. This is structural — S1-S9 predate the traceability standard. S16's compound-requirement-source.md was never formalized into requirements.md by req-eng.

**The #3 issue is C6: PUML UC field text isn't parsed into graph links.** The scanner's Pass 4 (PUML UC parsing, T117 spec) hasn't been implemented by the expert yet. UCs exist in the graph as objects but have no edges to tasks or classes.

### Remediation Priority

1. **C2a FIX (BLOCKER):** Regenerate 34 invalid UUIDs with proper v4 values. Sed script: for each task file, replace the UUID with a fresh `crypto.randomUUID()`. Must also update any cross-references (requirement up-links, chain blocks, PUML [uc:uuid] refs).
2. **C2b FIX (BLOCKER):** Replace 3 invented `r1xx-` UUIDs with real v4 UUIDs.
3. **C7 FIX (HIGH):** Create `sprint-16-traceability-ux/requirements.md` from compound-requirement-source.md R16.1-R16.10 with real v4 `[requirement:uuid:]` tags.
4. **C6 FIX (HIGH):** Expert implements T117 Pass 4 — parse `<<UseCase>>` PUML classes into graph with task/class links from field text + arrows.
5. **C5 DEFER:** S1-S9 requirements.md creation deferred to S11 T87-T89 batches (documented, not in T121 scope).
6. **C4 COSMETIC:** Req-eng fills S14 placeholder quotes (parallel work).
7. **C8 FIX (ERROR):** Identify and link the dangling requirement `b2c3d4e5-...` or remove if orphaned.

## QA Audit & User Feedback
- 2026-05-29: Tron directive — chain data is "very bad", architect + req assigned together to diagnose + fix. Routed via PO. Phase 1 diagnosis COMPLETE (see catalog above). Phase 2 remediation pending PO review of priority order.

## Subtasks
None (atomic — Phase 1 + Phase 2 bundled because remediation depends on diagnosis).

---

*Sprint 16 — Traceability UX & DetailViews · Phase 4 (Tron iteration)*
*Owner: robbin-architect + robbin-req (jointly, Tron-assigned), robbin-expert assists, robbin-tester verifies*
*Priority: HIGH (precondition for clean T119 land + T90 audit gate)*
