<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.6: deploymentRefs -> real typed OOP model (typed units + typed IOR relationships + inheritance/interfaces, each leaf resolves a real file)

[task:uuid:95d74272-2283-446c-b383-697b2ded6eb8]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

QA-Review (planner flip 2026-08-12, chain-complete-to-Test VERIFIED both-dir on ORIGIN, not relayed): the NEEDS this unit documented is now CLOSED — Test c5a92e14 'test:T40.6 DeploymentModel.buildTypedModel PURE reconcile rule' status=pass wired both-dir to Impl e009ace7 (markerPending=false, REAL host DeploymentModel.ts:42): e009ace7.tests[]=[c5a92e14] + c5a92e14.implementations[]=[e009ace7]. VERIFY-OWNER-FIRST CLEAN: c5a92e14 is T40.6's OWN test (typed-model reconcile-rule facet), e009ace7 sharedByTasks=[95d74272 ONLY] = distinct-intent to R40.6 (e009ace7 code also serves R40.11 but this Test covers R40.6's facet — no cross-credit). HONESTLY closes the once-suspected-fictional e009ace7 chain (was 0 src hits; expert built it real, req chain-mint cd483bf79) — vindicates the earlier fictional->real correction. All 4 In-Progress sub-steps evidenced -> QA-Review. Awaiting Tron QA verdict (0 Done till Tron).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.6 `[requirement:uuid:6a9d99c3-7ca7-4b35-b808-8dcc6719e162]`
  - down
    - None (atomic task)

## Task Description

R40.6 (Tron: 'just ior relationships to uml deployment diagram nodes that basically end in files - think oop interfaces and inheritance scenario-first'). The WODA.prod deploymentRefs (today ad-hoc {role, ref:'ior:file:...', note} STRING array) become a real OOP model: each ref a first-class TYPED unit related by TYPED IOR relationships (deploys/contains/manifestsAs/configuredBy), a genuine inheritance hierarchy with interfaces (abstract deployment-target -> Device/ExecutionEnvironment/Service; Artifact -> ConfigFile/Certificate/KeyFile/EnvValue), each leaf resolving to a real file on disk. Reuses the existing M2 family (no parallel type system; R40.2 UmlNode facet extends, not forks). THE DEEP ONE. Scenario-first: req mints R40.6 + ACs; architect designs the typed-OOP-model chain; expert implements; tester gates (graph+disk).

## Acceptance Criteria

- [ ] **(automatable)** [AUTOMATABLE, graph] Each ref is a FIRST-CLASS typed unit (an ior:class:ModelElement instanceOf its deployment-type), NOT a string in an array.
- [ ] **(automatable)** [AUTOMATABLE, graph] Refs are related by TYPED IOR relationships (deploys / contains / manifestsAs / configuredBy), NOT a free-text 'role' string.
- [ ] **(automatable)** [AUTOMATABLE, graph] A genuine inheritance hierarchy with interfaces exists: abstract deployment-target -> Device / ExecutionEnvironment / Service; Artifact -> ConfigFile / Certificate / KeyFile / EnvValue.
- [ ] **(automatable)** [AUTOMATABLE, graph] IS-A is a REAL GRAPH EDGE: generalization/realization are ior:class:Relationship instances using the EXISTING M2 kinds (UmlGeneralization a1d2e3f4-..0011, UmlDependency ..0012). ConfigFile --generalization--> Artifact and Certificate --realizes--> FileBacked are QUERYABLE EDGES; a gate asserts IS-A by READING THE GRAPH, never a string/name. (Architect ecaed1399: measured the kinds already exist, invented no machinery.)
- [ ] **(automatable)** [AUTOMATABLE, graph] INTERFACES are UmlInterface (a1d2e3f4-..0004) contracts CUTTING ACROSS the tree (not single-inheritance): FileBacked (all 4 Artifact subtypes realize it), Deployable (the target subtypes), Measurable (Certificate/ConfigFile/KeyFile). Realization is a QUERYABLE edge (realizes, via UmlDependency/UmlInterface), read the same way as generalization.
- [ ] **(invariant)** [AUTOMATABLE, disk, ★ THE CROWN AC / fail-closed] For EVERY unit realizing FileBacked, resolve(u.manifestsAs) MUST EXIST as a real on-disk file — evaluated as a MODEL QUERY over the graph, FAIL-CLOSED. ★ Correct-by-construction: M1 nodes inherit the contract via instanceOf->M2 edges, so the gate FINDS the FileBacked realizers BY QUERY (not by re-listing) — a future 5th artifact type is covered automatically, no gate edit (correct-by-construction, not maintained-by-memory). Makes Trons basically-end-in-files PROVABLE; guards the fabricated-reference class killed 5x this sprint.
- [ ] **(automatable)** [AUTOMATABLE, graph+disk] All 4 existing refs survive the migration as proper typed nodes: sshd_config · host key · .env#LE_DOMAIN · LE fullchain — none lost, each now a typed unit.
- [ ] **(automatable)** [AUTOMATABLE, graph] The types reuse the existing M2 metamodel family (a1d2e3f4-... sentinels) — NO parallel type system; the deployment-node facet already added (R40.2 UmlNode) extends, not forks.
- [ ] **(automatable)** [AUTOMATABLE] INV-T byte-diff==0 — the typed model is compute-on-read / a structural migration that does not churn unrelated units.
- [ ] **(automatable)** [AUTOMATABLE, graph] Each NEW M2 member (the deployment-type metaclasses joining the a1d2e3f4-.. family) carries a sentinelReason field ("M2 deployment-metamodel member, patterned by design for family lookup") so the registered-sentinel exception is PROVABLE-not-remembered — an unexplained legitimate patterned uuid is indistinguishable from a fabricated defect (R5 sentinel rule + the identity-detector exclusion).

## Subtasks

None (atomic task).
