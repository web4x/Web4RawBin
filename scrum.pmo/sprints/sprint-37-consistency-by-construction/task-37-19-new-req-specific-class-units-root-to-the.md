<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.19: New req-specific Class units root to the

[task:uuid:0a46b84d-877b-43a5-8888-aafa9ebe76fe]

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

Deliver + verify requirement R37.19 (New req-specific Class units root to the). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.19; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** SWEEP the 7 measured unrooted new-req Classes (OwnedOutputGuard 985d8f5b / StepEvidence 0d9a7b85 / SelfHeal 5f17f9f6 / PrecommitOverviewRegen d63e557b / AltIdCanonGuard 13f97053 / DoneProvenance a6cfc8e6 / DeploymentModel 78342cc7): set each ownerIor -> its owning UC (the UC whose .class/.classes[] references it), one mechanical fix per Class. DetailFields 7e7813be is EXCLUDED (measured already-rooted, ownerIor=cee1f429); StaleSteerLog ad92f487 already fixed.
- [ ] **(functional)** SHARED classes (many UC referencers, e.g. CurrentSprint 43d570be keeps S20, RbDetailView) KEEP their ORIGINAL owner — verify-owner-first, do NOT re-point a shared class + steal its attribution. The sweep touches ONLY new-req-specific Classes (single owning UC).
- [ ] **(gate)** A trace-audit RECURRENCE GATE: a Class referenced as a UC's OWN class (req-specific, single UC referencer) with a NULL ownerIor -> FAIL. STUB-MUST-FAIL: plant a null-owner req-specific class -> RED; a rooted one -> GREEN; weaken/remove the gate -> the bite suite goes RED (meta-bite).
- [ ] **(gate)** ★ MANDATORY (PO ruling): the gate lands REPORT-ONLY-LOUD first (surfaces every offender loudly but does NOT fail the build) and flips to STRICT (build-fail) ONLY once the sweep reaches 0 offenders. Precedent: assertStatusConsistent / check:task-status. A gate that is RED from day one is how gates get silently removed (that happened tonight) — report-only-until-clean prevents it.
- [ ] **(framing)** EXPLICIT: this is an INTEGRITY / navigability debt (the Class->UC uplink is missing), NOT a false-credit debt — the forward chain still derives, nothing is over-credited. The fix roots the uplink; it must NEVER be resolved by re-pointing credit/attribution (that would convert a harmless navigability gap into a real over-credit).
- [ ] **(by-construction)** Going forward, new req-specific Classes are minted WITH ownerIor -> their UC AT MINT (correct-by-construction, robbin-req convention fix adopted 2026-08-12). The recurrence gate catches any that slip; by-construction prevention + gate = the layered fix (neither alone holds).

## Subtasks
