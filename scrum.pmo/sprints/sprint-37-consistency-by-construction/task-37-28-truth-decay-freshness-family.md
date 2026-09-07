<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.28: Truth-decay / no-freshness-invariant family — coordination root (6 per-class freshness guards + cross-cutting Arm-B/meta/prose-ungated)

[task:uuid:61718883-195a-4bd4-bbc9-ead8ecff8412]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.25 `[requirement:uuid:fcc34aa1-84da-438c-942f-1c2c27efe61a]`
  - down
    - 6 per-class subtasks (see Subtasks)

## Task Description

Coordination ROOT of the R37.25 truth-decay / no-freshness-invariant family (architect design ior:file:scrum.pmo/design-notes/design-truth-decay-freshness-invariant-family.md?commit=e31458f92). THE ONE LAW: no authoritative artifact may be stored-and-silent — derive-first, ELSE stored-with-revalidation + VISIBLE-STALE. 6 per-class GATED subtasks below (deploy-instruction/req-satisfaction/guard-coverage/boot-state/derived-slot/constraint-cycle). The cross-cutting Arm-B claim-type guards (grep-absence/positive-control, end-to-end-pairing, relayed-measurement-revalidate-at-use, repeat-directive-re-derive-before-repeat), the meta guards (coverage-self-report, satisfyingGate, gate-credit-three-link), and the prose-ungated remainder live HERE at the root, NOT per-class (mapping them per-class would 6x-duplicate + drift).

## Acceptance Criteria

- [ ] **(meta/by-construction)** The family has TWO ARMS, both enforced. ARM A (WENT-STALE -> freshness): NO artifact CLASS that reads as authoritative may be STORED-AND-SILENT; it must (a) DERIVE-first from its single source each read, ELSE (b) be STORED with provenance RE-VALIDATED PER READ + rendered VISIBLY STALE + show-age on failure. ARM B (BORN-FALSE -> provenance/positive-control): NO authoritative claim may be asserted from a guess, an unvalidated instrument, or ONE HALF of a required pairing — existence of one half proves nothing. Silence (Arm A) and assert-from-one-half/unproven-instrument (Arm B) are BOTH forbidden. Arm B differs because revalidating a born-false claim re-runs the SAME wrong instrument and re-confirms it — Arm B validates the INSTRUMENT and DEMANDS THE OTHER HALF, not just freshness.
- [ ] **(meta/priority)** DERIVE-first (a) is the REQUIRED cure wherever derivation is possible; STORED-with-revalidation (b) is admissible ONLY when derivation is genuinely impossible and the artifact MUST be stored. A class that stores+revalidates where it could instead derive is a WEAKER cure than available => flagged (prefer-derive).
- [ ] **(per-class/deploy-instruction)** deploy-instruction (DEPLOY-STATE.md): (a) DERIVE the instruction from BRANCH REALITY (branch-contains + main..HEAD), OR (b) stamp it with the commit-range it was true for + render STALE when HEAD moves past that range. A stored 'do NOT merge/DELETE branch' with no re-check against branch state (14 hotfix commits incl shipped v0.8.143) => the pure specimen.
- [ ] **(per-class/req-satisfaction)** req-satisfaction: (a) DERIVE 'satisfied' from a tracked COVERING TASK's state — NEVER store 'satisfied' as an authored flag. An AC with tasks[]==empty is UN-SATISFIABLE-BY-CONSTRUCTION (rides R40.54 failable family + the untasked-AC audit). Specimen: R40.50 4c4de905 had 7 ACs / tasks[]=empty, shipped falsely-satisfied v0.8.118 then reopened.
- [ ] **(per-class/guard-coverage)** guard-coverage: (a) coverage DERIVES from the guard being IN ci:gates + the substep present — never an assertion that a guard 'is wired' with nothing checking it. Worked CURE proof: T40.1 7a956c21 now carries '- [ ] processing change requests' + status DERIVES QA-Review-with-open-CR (R40.59 task-status.ts:43).
- [ ] **(per-class/boot-state)** boot-state (sprint/version): (a) state-removal (R40.55 Layer-2, timeless+pointer) ELSE (b) currency-lint boot==HEAD (R40.55 Layer-1). CITES R40.55 as the already-landed per-instance fix; does NOT duplicate its design.
- [ ] **(per-class/derived-slot)** derived-slot (NEXT/CURRENT): (a) DERIVE from single source; DROP stored overrides. Specimen: fact-2 nextBacklogOverride (46c68e1fc) = a stored NEXT that rots; cured by derive-don't-store. CITES fact-2 fix; does not duplicate.
- [ ] **(meta/enumerate-not-universal)** The artifact-CLASS set is ENUMERATED (corpus >=10 specimens: deploy-instruction, req-satisfaction, guard-coverage, boot-state, derived-slot, circular-ruling/unsatisfiable-constraint, relayed-measurement x2 + standing-repeat-directive(#9) + end-to-end-pairing/assert-one-half(#10, the recorder case)) WITH a divergence/completeness check: a NEW authoritative-artifact class matching the meta-shape (authoritative-reading + nothing-validates + silent) that is NOT enrolled => flagged for triage, never silent-pass. A hand-maintained class list rots exactly like the artifacts it polices (self-application, R40.55 owner-list lesson). Each enumerated class has EITHER a dedicated gate AC OR an explicit enrolled-not-CI-gated-by-nature marking with a written reason (constraint-liveness #6 3-way split: STRUCTURAL cycle => GATED [AC-armB-constraint-cycle], true PROSE ruling => ungated-list [AC-armB-prose-ruling-ungated], and the gate SELF-REPORTS gated/ungated counts every run [AC-coverage-self-report] so no hole hides); an enumerated class with NEITHER a gate NOR a reasoned enrollment => the born-false coverage-claimed-nothing-enforces-it disease => RED.
- [ ] **(meta/relayed-measurement)** A RELAYED MEASUREMENT (a peer's line-numbers/counts/'X absent-or-present') is itself a STORED artifact timestamped at THEIR read, not yours — it decays. It MUST be RE-DERIVED at point-of-use before being asserted as current, ESPECIALLY into a durable artifact or a report. Specimens #7 (author cited a peer's stale DEPLOY-STATE read) + #8 (PO escalated a wrong-name resolveChangeRequest grep=0 to Tron 3x). Enforcement is process-failable: a durable claim citing a measurement must carry its own point-of-use re-derivation or be marked RELAYED-UNVERIFIED.
- [ ] **(meta/R40.54-failability)** The family cure is REAL only if it can FAIL: each artifact-class gets a lint/gate that RENDERS-STALE or REDs when its invariant breaks, WITH a stub-must-fail (a seeded broken artifact of that class observed RED before the gate counts as wired). Generalizes R40.54 evidence-must-fail from a single AC to the whole family. A class whose gate has never been shown RED on its own defect = UNPROVEN.
- [ ] **(armB/born-false)** A NEGATIVE / ABSENCE claim (grep=0, 'missing', 'absent', 'not implemented') is INADMISSIBLE until the INSTRUMENT is shown able to SUCCEED — a POSITIVE CONTROL attached in the same gate/report (the query returns >0 on a known-present target; the tool CAN find something). An absence-based ESCALATION (grep=0 -> BLOCKER) must carry its positive control at the FIRST escalation, else inadmissible. Would have stopped specimen #8 (resolveChangeRequest grep=0 relayed+escalated-to-Tron-3x on a WRONG name while approveChangeRequest EXISTS). The stub-must-fail IS the positive control: prove the query finds a known-present thing before trusting its 0.
- [ ] **(armB/pairing)** A claim about a COMPOSED system (ARMED, wired, deployed, covered end-to-end) must present EVIDENCE FROM EACH PART of the pairing — NOT one half + inferred whole. Concretely: client-marker-present AND sink-returns-403-not-404; producer AND consumer; payload AND rendered-artifact; local-emit AND passive-2nd-client-received. Asserting the whole from one end is inadmissible (a proxy/one-half shares the whole's blind spot: assert the RENDERED artifact, not a proxy). This is BROADER than grep=0 and MUST fire on it. Fires on specimen #10 (client bundle 'ARMED' while server sink 404'd = capture INERT) and on the R40.70 local-emit-is-not-a-broadcast case.
- [ ] **(armB/repeat-directive)** A STANDING repeat-directive ('repeat X every report', 'keep saying X', a carried blocker) is itself an authoritative artifact with no freshness — it re-injects a stale fact on every cycle (WORSE than a one-time relay). It MUST carry a RE-DERIVE-BEFORE-REPEAT clause: what it asserts is re-derived at point-of-use each repeat, never relayed-from-store — especially a BLOCKER, re-derived at each report. This is derive-per-read applied to the reporting loop itself. Fires on specimen #9 (planner carried 'T40.1 BLOCKED: resolveChangeRequest grep=0' in its anchor + every report for days under a keep-repeating instruction; the close-path approveChangeRequest existed all along).
- [ ] **(armB/constraint-liveness-gated)** Where a constraint/ruling is expressed STRUCTURALLY (a blocker graph / task deps / 'X waits on Y'), run CYCLE + NO-SATISFYING-PATH detection => RED on a dependency cycle or a constraint unsatisfiable-from-birth. Specimen #6 (the reconcile<->live-MVC deadlock) IS a 2-node cycle = GATED here, NOT ungatable (this corrects the earlier 'authoring-discipline only' framing: the structural half of constraint-liveness is machine-detectable).
- [ ] **(armB/constraint-liveness-ungated)** A free-text ruling with NO structural form is not CI-detectable => DECLARED in the ungated list, cured by AUTHORING-DISCIPLINE (author checks satisfiability before issuing). This remainder is kept AS SMALL AS HONESTLY ACHIEVABLE — only TRUE prose (anything structural goes to AC-armB-constraint-cycle). Honest enumeration with a written reason (R40.55 asymmetry), never a silent carve-out.
- [ ] **(meta/coverage-self-report)** The family gate OUTPUT must EMIT, EVERY run, 'N classes GATED / M UNGATED (listed BY NAME)' — the prose-ungated remainder MUST appear in that surfaced count, not only in the design note. A cure that implies FULL coverage while hiding its holes IS the disease (born-false coverage-claimed). This meta-gate catches its OWN silent hole: an ungated class absent from the emitted run output => RED.
- [ ] **(armB/gate-credit)** Satisfaction-via-GATE (a req cured by a lint/guard rather than a two-keyed Test) is credited only on a THREE-LINK chain, ALL required: (1) CITE — the req/task carries a RESOLVABLE, walkable satisfyingGate resolving to the gate's status (uncited => INADMISSIBLE-BY-CONSTRUCTION; the author's link). (2) GREEN-ON-HEAD — the cited gate actually passes on HEAD. (3) ASSERTS-THIS-AC — the gate's assertion SCOPE-MATCHES this req's specific AC (not merely a name/id match). ★ LINKS 2+3 ARE THE TESTER'S INDEPENDENT VERDICT, not the req's and not the planner's (PROOF-BUILDER SEPARATION: neither the minter nor the stager credits a gate they build/stage from). Link 1 is the CURE (makes the claim verifiable); links 2+3 are the VERIFICATION. A gate GREEN on the wrong surface, or matched by NAME while asserting a different scope, is FALSE-GREEN (R4 evidence-must-fail / AST-attach applied to gate-credit). This is the Arm-B shape: a whole (satisfied) inferred from one link (cited) is inadmissible until the other links are independently verified.

## Subtasks

Coordination ROOT — 6 per-class GATED freshness guards (buildOrder = cite-existing cheap first):
- [Task 37.28.1: boot-state](./task-37-28-1-boot-state.md) `[task:uuid:bd0e5f4a-ef1c-4d06-b019-a66d6057aa7b]`
- [Task 37.28.2: derived-slot](./task-37-28-2-derived-slot.md) `[task:uuid:25772198-1c7d-4e6b-81b9-e35a2a082252]`
- [Task 37.28.3: deploy-instruction](./task-37-28-3-deploy-instruction.md) `[task:uuid:968d966d-ea74-404b-9751-f611fdab475e]`
- [Task 37.28.4: req-satisfaction](./task-37-28-4-req-satisfaction.md) `[task:uuid:2af98c11-cb0d-439c-a294-1ea0d3402d62]`
- [Task 37.28.5: guard-coverage](./task-37-28-5-guard-coverage.md) `[task:uuid:afe976e3-20fa-44b4-8170-1caea4e04528]`
- [Task 37.28.6: constraint-cycle](./task-37-28-6-constraint-cycle.md) `[task:uuid:e2068636-2980-4e14-a150-7266b7582bf1]`

prose-ungated remainder = declared-not-tasked at this root (authoring-discipline, no gate).
