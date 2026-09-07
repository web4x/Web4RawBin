<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.33: Re-key home-copy home-isolation invariant — 

[task:uuid:5233d578-d778-4a57-8a2b-cf4e0009b122]

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

Deliver + verify requirement R40.33 (Re-key home-copy home-isolation invariant — ). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.33; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** HOME-ISOLATION (refined): copy-gained symlinks must all be THIS home's OWN declared roomFsLinks — materializing an own declared-but-unmaterialized link (e.g. ce981242's f74bd319) is a legitimate HEAL and must PASS. The gate REDs ONLY when a copy gains ANOTHER home's file (a real cross-home injection). [SUPERSEDES the original 'no cross-home symlink/dir injection' — the observed +1 was an own-heal, not injection.]
- [ ] **(gate)** The count-mirror check stays but is REFINED to a HOME-OWNERSHIP mirror: a blanket copy-count==source-count FALSE-FLAGS a benign own-heal (the +1 = this home's own roomFsLink materialized), so the gate must classify each gained symlink as own-declared (PASS/heal) vs another-home's-file (RED). delta-broken + content-multiset stay BLIND to symlinks — the refined ownership-mirror is the load-bearing check. [STATUS: refined home-ownership invariant COMMITTED + scratch-green — own-heal PASS / another-home-file RED / drop RED, verified 47/47 by expert.]
- [ ] **(functional)** ROOT-CAUSED (DONE, robbin-expert 2026-08-12): the +1 is a HEAL not injection — re-key rewrite materializes ce981242's OWN declared roomFsLink f74bd319 into its home; blanket count-mirror false-flagged it. The isolated-same-fs+scenario bisection resolved to own-heal-materialization (the earlier /tmp-without-scenario false-green masked the heal, not an injection).
- [ ] **(context)** MEASURED rule-in/out (recorded so the bisection does not re-walk them): (a) tokenToStorageId is INJECTIVE 47->47 distinct, 0 dup, 0 sid==token = NOT a mapping collision; (b) the +1 appears ONLY when scenario/index is PRESENT (symlink targets resolve) — WITHOUT it the copy is faithful 69; (c) 68d0f039 is NOT in ce981242's source tar = a CROSS-HOME injection in the full multi-home flow; (d) NOT the copy primitive (cp -rP, tar-pipe, AND stage-then-move all reproduce 70).
- [ ] **(governance)** R40.22 re-key resumes after: root-cause DONE (✓ HEAL-not-injection) + refined home-ownership-mirror SCRATCH-GREEN (✓ MET — 47/47 homes / 1 declared own-heal / 0 injection / 0 drop / multiset preserved / 84 rewrites / no-token-path, expert-reported) + architect review (PENDING) + Tron deploy-auth for the window (PENDING). Prod stays SAFE/INERT meanwhile.

## Subtasks
