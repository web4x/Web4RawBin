<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.4: Graph integrity — resolve/prune dangling UC refs + orphan Methods

[task:uuid:cd974edc-1a71-4f47-80f0-966e6a252abd]

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
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.4 `[requirement:uuid:e205f7c3-97d8-474a-a4e6-053a7a7f30aa]`
  - crossRef
    - R24.5 trace:audit:strict (the CI gate enforcing 0-dangling/0-orphan) + R27.2 (independent, 0 intersect)
  - down
    - [UC27.4: graph.repairIntegrity](./planning.md#uc27-4) `[uc:uuid:f7a06e18-5237-4640-a731-0575bc965917]`

## Task Description

Repair the PRE-EXISTING graph integrity debt: 12 dangling UC refs (class/classes[]/method pointing at units that don't exist) + 51 orphan Methods (Method units not owned by any Class's methods[]). Every UC ref must resolve; every Method must be owned by a Class that lists it. trace:audit:strict (R24.5) enforces it going forward.

## Context

PRE-EXISTING (NOT from R27.2 dedup). MEASURED INDEPENDENT: 0 of the 12 dangling intersect the R27.2 dedup set (all dead uuids: 10 dead-RbDetailView refs -> repoint to live canonical, 1 dead-method, 1 literal TODO-placeholder) -> R27.4 runs in EITHER order vs T27.2. crossRef R24.5 (trace:audit:strict is the CI gate) + R27.2 (independent, 0 intersect).

## Intention

Measurement-surfaced debt (req baseline verify_r27_2_migration.py): the graph carried 12 dangling UC refs + 51 orphan Methods BEFORE the R27.2 dedup — an absolute no-dangling gate would false-abort, so this is repaired separately.

## Acceptance Criteria

- [ ] **(invariant)** Every UseCase class / classes[] / method reference resolves to an existing unit - 0 dangling UC refs.
- [ ] **(invariant)** Every Method unit is owned by a Class that lists it in methods[] - 0 UNINTENTIONAL orphan Methods. A Method carrying an explicit orphanByDesign marker whose impl has NO sourceFile is legitimately exempt (design-stage); that exempt set is currently EMPTY (all 51 have real source).
- [ ] **(cleanup)** The 12 dangling are repaired: the 10 refs at the DEAD f2f84ce3-bbbc-4bf7-9345-6a9d4dc64fb5 are repointed to the LIVE canonical RbDetailView f2f84ce3-6f8f-4db1-9ab7-dbcfe8d3bc07 (PO-ratified canonical; it holds those UCs methods by name); the dead Method ref fcf6dae1-69c7 + the literal string TODO-server-class are triaged (repoint OR remove) with a reason.
- [ ] **(cleanup)** All 51 orphan Methods attach to their name-derived Class (resolver: live ownerIor Class -> UC.class of a using UC -> R27.2-canonical). All 51 carry impls with REAL sourceFiles, so 0 prune (deletes nothing). The 37 STALE orphanByDesign markers (marker asserts no-source but the impl HAS a sourceFile) are CLEARED as part of the repair. Dry-run+count FIRST; distinct Impl 434==434 (nothing deleted).
- [ ] **(ci-gate)** trace:audit:strict (R24.5) FAILS on: (a) any dangling UC ref; (b) any UNINTENTIONAL orphan Method - METHOD-SCOPED = Method not in any Class.methods[] (+ orphan Impls), NOT the tools BROAD all-types unreachable-from-Requirement metric (=2207, benign: Tasks+TestCase/Device/Room/File that can NEVER be 0 - stays REPORTED-only, not hard-gated); (c) a LYING orphanByDesign marker (asserts no-source but a real sourceFile EXISTS). Attach-on-wire AUTO-CLEARS orphanByDesign when source appears. Exemption MARKER-KEYED (impl-with-no-sourceFile only).
- [ ] **(verify)** Post-cleanup re-measure: 0 dangling UC refs, 0 orphan Methods.

## Implementation

GATED REPAIR MIGRATION (finalized w/ PO/req targets 2026-07-01; architect designing the repair body + wiring UC f7a06e18). CONCRETE TARGETS: (dangling, 12) repoint the 10 dead-bbbc* UC refs -> canonical RbDetailView f2f84ce3-6f8f (the R27.2-locked canonical, EXISTS); prune the 1 dead Method ref fcf6dae1 (no unit on disk) + the 1 literal TODO-string placeholder. (orphan, 51) triage the 51 orphan Methods -> attach each to its owning Class (add to Class.methods[]) OR prune if truly dead — PRESERVING IMPLS (0 impl lost, same INV1b discipline R27.2 used). DISCIPLINE (same as R27.2 18a8703e2): expert implements DRY-RUN+COUNT body -> gateOk self-assert -> planner delta-verify + req 3-point delta-verify (DUAL) -> ATOMIC + ROLLBACKABLE --apply -> post-apply re-verify (dangling->0, orphan->0, 0 impl lost). RECURRENCE-PREVENTION: trace:audit:strict (R24.5) FAILS CI on any dangling/orphan. INDEPENDENT of R27.2 (0/12 intersect; R27.2 DONE 18a8703e2 left the 12+51 unchanged). testing OPEN — expert runs, I verify the gate. Wire T27.4.useCases f7a06e18 once architect mints the UC. ✓ REPAIR DONE + GATED 8/8: expert ran repair-r27.4.ts (dry-run 45f49da63/20d536298 -> apply 7dae77ca9: attach 51 orphan Methods + repoint 15 bbbc/fcf6dae1/TODO refs + clear 53 lying markers, 0-new-dangling, 434==434 impls preserved) -> closure d2e2ba173 (drop dead fcf6dae1 from Test.methods back-edge + null 8 lying orphanRationale = 8/8). UC f7a06e18 MINTED (architect). req 3-point independently verified. QA Review -> Done pending architect+PO sign-off (internal-migration gate, same as R27.2). ✓ DONE — PO SIGN-OFF 2026-07-02 (internal-migration gate: architect 8/8 + req 3-pt verify + PO).

## Subtasks

None (atomic gated-repair task).
