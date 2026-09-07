<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.58: Current-role LIVE fix — resolver result read

[task:uuid:c68be2f7-8cde-4226-8ad9-8499121332a2]

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

Deliver + verify requirement R40.58 (Current-role LIVE fix — resolver result read). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.58; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(D1/retire-second-definition)** DELETE the `as { current?: { uuid?: string } }` cast in currentTaskUuidFromSlots (server.ts:1402); consume the REAL exported ThreeSlots type so TS enforces the shape; read slots.current.taskUuid (not .uuid). The false cast is a SECOND DEFINITION of the slot shape (getThreeSlots defines {taskUuid}; the cast re-declared {uuid}) — retire the re-declaration, don't patch the field name blind.
- [ ] **(D1/by-construction-generalized)** HAZARD guard (by-construction, GENERALIZED — architect fold f2049ed5c + PO): 0 `as`-shape STRUCTURAL casts that re-declare the return shape of ANY of OUR OWN exported, typed functions (NOT just slotsFrom/getThreeSlots — that narrower scope was scan-the-ACTORS drift; the next as-cast on a DIFFERENT typed fn re-opens the identical class). A typed result MUST be consumed at its exported type; `as` is allowed ONLY at genuinely-untyped boundaries (JSON.parse / external IO). A cast that silences TS = a DEFEATED detector, worse than a missing guard. (Reworded from the narrow 'slotsFrom/getThreeSlots result' scope — narrowing kept visible: scan-the-HAZARD not the actors.)
- [ ] **(D1/RED-baseline/evidence)** RED-BASELINE (gate-first on the LIVE specimen): a DESIGNATED task's served pinRole must be 'current'. On TODAY's unmodified tree it is 'other'/'' (the live D1 bug) — capture that RED raw output BEFORE the fix (redBaselineEvidence). The RED must cite the FIELD-READ ('' currentUuid / pinRole=='other' for the designated task), NOT @host (uuid-form was measured-killed). If the gate does not RED on the designated-task-'other' case it asserts the wrong property -> do NOT proceed. THEN delete the cast + the SAME gate greens (designated task -> 'current').
- [ ] **(D2/prevention/one-definition)** ONE canonical bareUuid(s): strips the ior:(instance|class|file): prefix AND @host suffix; EVERY producer routes through it (server.ts:2894 which retains @host, :272 which strips it, and others). A federated uuid@originHost id would fail raw equality today = a REAL latent bug, but MEASURED NOT the current failure (all ids bare). Same PO cure (retire beats repair / one definition of a shared truth) as D1, applied to the uuid FORM.
- [ ] **(D2/by-construction)** HAZARD guard: 0 ad-hoc prefix-replace / `@`-split normalizations OUTSIDE bareUuid; raw `===` between two producers' uuids forbidden (route through the one identity helper). The hazard names itself (a uuid form-strip outside the canonical fn).
- [ ] **(D2/honesty)** D2 is SECONDARY prevention and MUST NOT be credited as the live-screen fix. D1 (the field-read) fixes what Tron sees; D2 prevents the latent @host identity class from ever causing it. Recording both honestly: the screen went 'other' because of the field-read, NOT because of a form mismatch (that was the killed hypothesis).

## Subtasks
