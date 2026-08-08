<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.6: deploymentRefs -> real typed OOP model (typed units + typed IOR relationships + inheritance/interfaces, each leaf resolves a real file)

[task:uuid:95d74272-2283-446c-b383-697b2ded6eb8]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.6 (deploymentRefs -> typed OOP model; THE DEEP ONE). Scenario-first: req minted R40.6 6a9d99c3 (515f743b8); coveredRequirements + useCases b2c5cdba wired; ACs MIRRORED — UPDATED to req 714b16491 (10 ACs, all AUTOMATABLE graph/disk): +generalization-queryable (IS-A real graph edge) +interfaces-realizable (UmlInterface cross-cutting) +CROWN leaf-resolves-as-model-query fail-closed +sentinelReason. Architect ecaed1399 measured M2 kinds already exist (no new machinery). Architect designs the typed-OOP-model chain (esp this one). No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.6 `[requirement:uuid:6a9d99c3-7ca7-4b35-b808-8dcc6719e162]`
  - down
    - None (atomic task)

## Task Description

R40.6 (Tron: 'just ior relationships to uml deployment diagram nodes that basically end in files - think oop interfaces and inheritance scenario-first'). The WODA.prod deploymentRefs (today ad-hoc {role, ref:'ior:file:...', note} STRING array) become a real OOP model: each ref a first-class TYPED unit related by TYPED IOR relationships (deploys/contains/manifestsAs/configuredBy), a genuine inheritance hierarchy with interfaces (abstract deployment-target -> Device/ExecutionEnvironment/Service; Artifact -> ConfigFile/Certificate/KeyFile/EnvValue), each leaf resolving to a real file on disk. Reuses the existing M2 family (no parallel type system; R40.2 UmlNode facet extends, not forks). THE DEEP ONE. Scenario-first: req mints R40.6 + ACs; architect designs the typed-OOP-model chain; expert implements; tester gates (graph+disk).

## Acceptance Criteria

- [ ] [AUTOMATABLE, graph] Each ref is a FIRST-CLASS typed unit (an ior:class:ModelElement instanceOf its deployment-type), NOT a string in an array.
- [ ] [AUTOMATABLE, graph] Refs are related by TYPED IOR relationships (deploys / contains / manifestsAs / configuredBy), NOT a free-text 'role' string.
- [ ] [AUTOMATABLE, graph] A genuine inheritance hierarchy with interfaces exists: abstract deployment-target -> Device / ExecutionEnvironment / Service; Artifact -> ConfigFile / Certificate / KeyFile / EnvValue.
- [ ] [AUTOMATABLE, graph] IS-A is a REAL GRAPH EDGE: generalization/realization are ior:class:Relationship instances using the EXISTING M2 kinds (UmlGeneralization/UmlDependency); ConfigFile --generalization--> Artifact + Certificate --realizes--> FileBacked are QUERYABLE EDGES; gate asserts IS-A by READING THE GRAPH, never a string/name.
- [ ] [AUTOMATABLE, graph] INTERFACES are UmlInterface contracts CUTTING ACROSS the tree (not single-inheritance): FileBacked (all 4 Artifact subtypes realize it), Deployable (target subtypes), Measurable (Certificate/ConfigFile/KeyFile); Realization is a QUERYABLE edge read like generalization.
- [ ] [AUTOMATABLE, disk, ★ CROWN AC / fail-closed] For EVERY unit realizing FileBacked, resolve(u.manifestsAs) MUST EXIST as a real on-disk file — evaluated as a MODEL QUERY over the graph, FAIL-CLOSED. Correct-by-construction: gate FINDS the FileBacked realizers BY QUERY (not re-listing) so a future 5th artifact type is covered automatically, no gate edit. Makes Tron's 'basically-end-in-files' PROVABLE; guards the fabricated-reference class killed 5x this sprint.
- [ ] [AUTOMATABLE, graph+disk] All 4 existing refs survive the migration as proper typed nodes: sshd_config · host key · .env#LE_DOMAIN · LE fullchain — none lost, each now a typed unit.
- [ ] [AUTOMATABLE, graph] The types reuse the existing M2 metamodel family (a1d2e3f4-.. sentinels) — NO parallel type system; the R40.2 UmlNode deployment-node facet extends, not forks.
- [ ] [AUTOMATABLE] INV-T byte-diff==0 — the typed model is compute-on-read / a structural migration that does not churn unrelated units.
- [ ] [AUTOMATABLE, graph] Each NEW M2 member carries a sentinelReason field ('M2 deployment-metamodel member, patterned by design for family lookup') so the registered-sentinel exception is PROVABLE-not-remembered (R5 sentinel rule + identity-detector exclusion).

## Subtasks

None (atomic task).
