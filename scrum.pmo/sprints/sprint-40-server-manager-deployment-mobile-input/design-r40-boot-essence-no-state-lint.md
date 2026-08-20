# Backstop lint — boot-essence carries no stale state (architect, 2026-08-20)
PO ruling: boot-essence = durable rules + an anchor POINTER, NEVER a state snapshot. This lint makes it FAILABLE (R40.54) so the AC is not a wish.
## The check (check-boot-essence-no-state.ts, ci:gates)
For each committer boot-essence (the boot.md read-path files, discovered via the ONE structuralDiscover — discoveryUtilitySingleSource, not a hand-list):
1. Extract any STATE token it names: a version `v?0\.\d+\.\d+`, a sprint `S\d+` / `Sprint \d+`, or an in-flight task list.
2. **RED if a named version/sprint != CURRENT** (current version from the version single-source / current sprint from the sprint-pin single-source). Named-current or named-nothing = PASS. This is the PO's rule verbatim: "if it names a version/sprint it must match current, otherwise it must not name one at all."
3. Preferred steady state (the restructure): boot files name NO state at all → trivially green forever; the lint is the BACKSTOP catching a regression where someone re-adds state.
## Failability (R40.54 self-application)
stub-must-fail: plant a stale version (e.g. `v0.8.61`) in a boot-essence file → the lint goes RED. That proves the gate bites; the AC ('boot-essence carries durable rules + anchor pointer, never a state snapshot; any named version/sprint must match current') is now a failable AC, not a wish.
## Why this is the by-construction cure, not a regen
A regen fixes today and rots in two weeks. The restructure (state lives ONLY in the anchor, reached by pointer) makes the state half UNABLE to go stale; the lint enforces that no state creeps back. Ghost-context stops being a per-rewind manual correction and becomes impossible-by-construction for the boot read-path.
