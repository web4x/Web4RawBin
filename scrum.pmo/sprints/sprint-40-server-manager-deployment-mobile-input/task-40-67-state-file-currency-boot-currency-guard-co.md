<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.67: State-file currency — boot-currency guard co

[task:uuid:05d86575-f67c-4062-8482-f785070bb81e]

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

Deliver + verify requirement R40.67 (State-file currency — boot-currency guard co). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.67; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(hazard/two-source)** SHADOW single-source (the sharp hazard): a role with BOTH <role>/context.md AND <role>@<host>/context.md = TWO sources for one agent (measured pairs: agent-trainer, oosh-architect/expert/po/tester). The boot defaults toward the BARE name. The bare-name file MUST be absent, OR a DEPRECATED-pointer to the live one, OR itself current. A stale-unmarked bare shadow a boot defaults to => RED (two-source-of-truth disease; cure = retire/deprecate the second, never keep two live).
- [ ] **(PO-D5/rot-evident)** ROT-EVIDENT shape (PO D5, now enforced): a boot-pointed ACTIVE state file MUST carry the verify-don't-trust anchor preface (the '⚠ DO NOT TRUST — re-derive via git… + otmux pane.self' head). Missing it = the file asserts itself as current-truth = the rot hazard => RED. Makes every active state file rot-EVIDENT (a stale file cannot be read as current).
- [ ] **(marker/fail-closed)** DEPRECATION marker (trainer convention, propagated): a superseded/shadowed state file carries `> ⛔ DEPRECATED <YYYY-MM-DD> -> <successor path>`. The lint asserts a shadowed/dormant file carries it AND is FAIL-CLOSED on an unparseable date — a marker with no parseable date => RED, never skip-as-ok (same fail-closed posture as the R3 resolver / boot-currency truth-source).
- [ ] **(★CORE/enumerate-not-universal-completeness)** ★ THE CORE ASSERTION (trainer/PO load-bearing, NOT secondary): the ROOT blind-side was enumerating a file TYPE (boot.md) so a different KIND (context.md) hid OUTSIDE the scan. The guard DISCOVERS the agent-state-file set by STRUCTURE/GLOB — session/agents/*/context.md, */learnings.md, AND per-host */@*/… — NEVER a hand-listed type list; a state file present-on-disk but NOT in the evaluated set => RED (enumerate-not-universal + COMPLETENESS). The stub-must-fail seeds a NEW-KIND file (not merely a stale one) and proves the lint REDs on the UNENROLLED KIND — the exact property that would have caught THIS defect (same recursion-closure as R40.54: new-X-not-enrolled => RED).

## Subtasks
