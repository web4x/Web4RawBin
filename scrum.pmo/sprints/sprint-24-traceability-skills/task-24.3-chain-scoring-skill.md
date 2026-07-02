<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 24.3: Chain scoring skill (measurement instruments)

[task:uuid:1f6d9fc6-19e8-429b-959a-6581738c354f]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 24 Planning](./planning.md)
    - Requirement R24.3 `[requirement:uuid:fc9a7079-5324-4867-95de-784666d7fc5a]`
  - down
    - [UC-SK.3: skill.chain-scoring-skill](./planning.md#uc-sk3) `[uc:uuid:4b66c336-c740-4cbf-b9b4-4cbee596fee1]`

## Task Description

Chain completion is measured by one Object.verb skill class (skill-classes.ts Chain) exposing scoreboard, followUp, listComplete, lintMarkers (and snapshotComplete): followUp is the ONE canonical completion measure (one summary row per Requirement), scoreboard renders the table + dispatch list + Summary line, listComplete emits one diffable line per complete requirement, and lintMarkers catches invented-suffix uuids / prefix collisions / shared Impls / orphan markers BEFORE a re-measure.

## Context

Impl base (formalize, do not rewrite): src/ts/scenario/skill-classes.ts class Chain (followUp/listComplete/scoreboard/lintMarkers/snapshotComplete/wireImplNode/generateMatrix). Canonical scoreboard: `npx tsx scripts/objectVerb.ts Chain followUp --all` (det-3x).

## Intention

PO 2026-06-29: formalize the scattered traceability + MD-planning TS tools as a coherent OOSH-like Object.verb SKILL set — R24.3 is chain scoring (the measurement instrument; one canonical measure).

## Acceptance Criteria

- [x] (followUp) Chain.followUp(reqUuids, sprint?) is the single canonical completion measure - one summary row per Requirement, dedup by methodUuid (UUID identity), NOT display name (display names collide: two *.render on one Req = the R15.6 over-credit bug)
- [x] (scoreboard) Chain.scoreboard renders the canonical markdown: table + dispatch list + Summary line
- [x] (listComplete) Chain.listComplete emits one diffable line per COMPLETE requirement (TSV-stable)
- [x] (lintMarkers) Chain.lintMarkers reports invented-suffix uuids, prefix collisions, shared Impls, and orphan markers before any re-measure
- [x] (one-measure) There is exactly ONE completion measure (followUp); no competing/duplicate scoreboard logic
- [x] (one-measure-confirmed) scoreboard, listComplete, generateMatrix, and Velocity ALL delegate to Chain.followUp - verified no competing count (skill-expert confirmed)

## Implementation

Impl markers 7dd6a762c (named Chain methods); Test hop wired d33440e1c; chain scores COMPLETE (28->32/297) via the Chain.followUp measure itself. Tested via the scoreboard (objectVerb Chain) + Test unit — NO separate per-task DET-3x gate commit (vs T24.1/T24.2 explicit gates); flagged to PO. ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
