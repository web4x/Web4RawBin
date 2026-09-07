<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.51: Every Task is reciprocated by exactly one Sp

[task:uuid:bf6c70d8-1e66-4806-89aa-cb178539eb28]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.51 (Every Task is reciprocated by exactly one Sp). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.51; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(invariant)** Every ior:class:Task is claimed by EXACTLY ONE Sprint via Sprint.tasks[], reciprocated (the task and the Sprint agree). No task in zero sprints; none in multiple.
- [ ] **(detector)** A detector reports the orphan count GRAPH-WIDE (tasks in zero Sprint.tasks[]) + any multi-listed. Measured now: 109 orphans of 525 (20.8%) = 99 old-schema (R40.49 Case-D) + 10 non-old-schema with an unreciprocated parent; 0 multi-listed. The detector counts all 109, not only the 99 old-schema.
- [ ] **(process)** The orphans are re-homed by an EXPLICIT decision path: (a) sprint-number embedded in the task name/slug, else (b) createdAt era, else (c) FLAGGED FOR TRON where genuinely unknowable. NO silent guess.
- [ ] **(by-construction/law)** A migration must NEVER fabricate a link to satisfy its own rule. Setting a task model.parent (or ownerIor) to a Sprint whose tasks[] does not list it invents data so a migration looks complete = the exact drift this req removes. An orphan stays honestly UNSORTED until a RECIPROCATED claim exists on BOTH sides. stub-must-fail: a re-home that sets a Sprint pointer without adding the task to that Sprint.tasks[] (unreciprocated) => RED.
- [ ] **(scope)** Recorded as PRE-EXISTING (audit-surfaced, not caused by the ownership backfill). R40.49 explicitly does NOT re-home orphans — it sets their owner + drops the stale pointer and leaves them unsorted; R40.51 does the honest re-homing separately.

## Subtasks
