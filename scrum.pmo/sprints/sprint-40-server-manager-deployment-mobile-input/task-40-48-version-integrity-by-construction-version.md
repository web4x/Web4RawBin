<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.48: Version integrity by construction — version-

[task:uuid:4ea81b33-c9fd-42ed-885f-20985821ea8a]

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

Deliver + verify requirement R40.48 (Version integrity by construction — version-). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.48; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** A version bump fires ONLY from an explicit DEPLOY action; there is NO uncommitted version state that a commit could pick up incidentally. (The post-commit hook only TAGS an already-changed version — it does not bump.)
- [ ] **(by-construction)** Any version bump is ATOMIC with a rebuild — the source version unit + package.json + sw.js + dist move together or not at all; no partial bump that updates the stamp without producing the matching build.
- [ ] **(stub-must-fail)** Source/package version bumped while sw.js/dist stay at the OLD stamp => RED (the inconsistent-build harm made impossible by construction, not caught by luck-of-a-build).
- [ ] **(by-construction)** The version is a PROOF signal: it moves IFF a deployable change actually went live. A rebuild that produces a byte-identical dist is NOT a deployable change and MUST NOT bump — preserving the only mechanism that proves a fix shipped.
- [ ] **(by-construction/root)** A broad add-all (git add -A), a directory add (git add <dir>), or commit-all in the shared repo is impossible-or-caught; every commit is PATH-LIMITED in ONE step, so no agent can sweep another agent's uncommitted files (including an uncommitted version-bump) into a commit.
- [ ] **(stub-must-fail)** Seed a foreign dirty file (another agent's uncommitted unit, or an uncommitted version-bump) in the working tree and run a commit; if it RIDES ALONG => RED. Commit isolation is by construction.
- [ ] **(by-construction/enforcement)** A sanctioned rbadd <explicit-file>... wrapper is the ONLY stage path: it REFUSES a directory arg, ., -A, -u, or a glob that expands to a dir; it stages ONLY named files and appends them to a per-agent manifest .git/rb-staged. A broad add is impossible AT THE TOOL.
- [ ] **(by-construction/enforcement)** A pre-commit hook computes git diff --cached --name-only and REJECTS (exit 1) if the staged set is NOT a subset of the .git/rb-staged manifest - any file staged that the committer did NOT explicitly name => RED, commit blocked. Clears the manifest on success. Registered with the other CI gates. (A pre-commit cannot see HOW files were staged - -A and explicit produce identical staged sets - so the guard is staged-must-equal-declared, not detect--A.)
- [ ] **(stub-must-fail)** Stage a file the committer did NOT name (simulate a peer WIP swept in) -> pre-commit goes RED. Proves the guard bites - the exact 2edf66a72 sweep becomes impossible to commit.
- [ ] **(by-construction/authorized)** Per-agent git worktrees (Layer-2 - eliminates the file-sweep (i-iv) AND the index-race (v) by ISOLATION: each agent has its own .git index/branch, self-integrates to main when clean) are AUTHORIZED BY TRON. Migration is GATED on LIVE-MVC DEFECT CLOSURE: do NOT migrate the fleet while any live-MVC defect AC (R37.12 A/B/C + R40.17 D) is still open - Tron sequenced the migration AFTER his live-MVC defects close; Layer-1 (rbadd + pre-commit staged-subset) ships NOW regardless. The gate stays EXPLICIT (an authorization without its condition would let someone migrate the fleet mid-fix, exactly what he sequenced against). stub-must-fail: the worktree migration executed while ANY live-MVC defect AC is still open => RED.
- [ ] **(by-construction/authorized)** In the worktree migration, agents SELF-INTEGRATE to main when clean; a CONFLICT (two agents on one unit = a SCOPE call, not a mechanical merge) ESCALATES to the PO - NEVER silently auto-resolved. stub-must-fail: a conflict auto-resolved / silently merged without PO escalation => RED (a silent auto-resolve defeats the entire point of the migration).

## Subtasks
