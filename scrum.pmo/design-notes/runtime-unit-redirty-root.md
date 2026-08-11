# Runtime unit re-dirtying — ROOT (guard scope) + sweep phantom-check

**By:** robbin-architect 2026-08-11, per PO. Two questions, measured; the re-dirtying root OUTRANKS the sweep.

## 1. SWEEP PHANTOM-CHECK (per sprint, with evidence) — REAL for S10–S33, S34 was the artifact
Measured HEAD-vs-worktree:
- **Sprint units are NOT dirty** — `git diff scenario/index` shows ZERO Sprint-unit name changes; no Sprint file is modified. So worktree==HEAD for every Sprint.
- **The embed is IN HEAD** — `git show HEAD:…/9996b46a…` = `"name": "Sprint 22 — Traceability View Fixes"` (S22 embeds the number in the COMMITTED unit). Same for S10–S33.
- **S34 was the worktree artifact** (already restored to a clean HEAD, per planner).
⇒ **The S10–S33 embeds are REAL (committed-in-HEAD), NOT phantom** — my earlier "24" was worktree, but worktree==HEAD for sprints, so it stands. A de-embed of S10–S33 is a REAL rename (subject to R-C7: regen only owned boards). **BUT it is subordinate to the root below** — do not schedule it until re-dirtying is fixed, or the fix will fight fresh runtime writes.

## 2. ★ RE-DIRTYING ROOT — the PO's hypothesis is CONFIRMED: the no-flush guard SCOPE is the defect
- **The guard protects ONE uuid.** `index-store.ts:48`: `BUILD_OWNED_UUIDS = new Set(['config-singleton-0000-000000000001'])`; `put()` (:52) refuses a runtime write ONLY for that uuid. The chokepoint is right (put() is the sole disk-write, R31.7) — the SCOPE is wrong.
- **The running server WRITES other units at runtime, ON READ.** `server.ts:268/283/342/362`: `let unit = idx.get(token); if (!unit) { unit = {Profile…}; idx.put(token, unit); }` — a profile LOOKUP auto-creates + PERSISTS a Profile unit to disk. That is a WRITE-ON-READ: a mere connection/lookup re-dirties the shared worktree with Profile units nobody deliberately committed. Plus `:1462` task-verdict, and any reconcile round-trip. **The guard sees none of these** (they aren't the config uuid).
- ⇒ **Exactly the disease we already fixed for the config unit, merely scoped to one uuid instead of the CLASS of units nobody should be silently rewriting.** The guard's existence is fine; its scope is the defect.

**Honest scope note:** the profile write-on-read demonstrably re-dirties *Profile* units (a large share of the 30+ dirty units). It does NOT write *Sprint* units — so the S34 sprint re-embed came from a DIFFERENT source (an agent mint/reconcile tool, or pre-existing stale worktree residue), not this path. Both are covered by the fix below, because the fix guards the CLASS, not a path.

## FIX (design — broaden the guard at the ONE chokepoint, by construction)
Replace `BUILD_OWNED_UUIDS` (1 uuid) with a **committed-unit-class predicate** in `ScenarioIndex.put`:
- **Refuse a runtime write to any COMMITTED/board unit class** — Sprint, Task, Requirement, UseCase, Class, Method, Implementation, Test (+ the config singleton). These are agent-authored via deliberate commits; the prod server must NEVER persist them as a side-effect of a read/reconcile/connect.
- **Allow app RUNTIME data classes** — Profile, Room, Message, Device — but fix the write-on-READ: create in-memory on lookup, persist ONLY on a deliberate user MUTATION (a save), never on a bare `get`. (Or route live app data to a separate mutable store outside scenario/index — the cleaner long-term split.)
- One chokepoint (put), so it holds BY CONSTRUCTION for every write path present and future.
- **STUB-MUST-FAIL bite:** (i) simulate a runtime write of a Sprint/Task unit → the guard REFUSES (RED if it doesn't); (ii) meta-assert the guard runs → weaken/remove it → suite RED. Same two-bite standard as R-C8.

**Why this outranks the sweep:** the sweep is cosmetic; this is the recurring, board-CORRUPTING source (it re-dirtied S34's cousin-class, the T34.1/T36.1 status regressions, and 30+ units now). De-numbering names while the server keeps re-dirtying units is bailing a boat with the hole open. **Fix the guard scope first; then the sweep (if still wanted) runs on a tree that stays clean.**

## Chain / ownership (verify-owner-first)
Rides R31.7's existing guard — `ScenarioIndex.put` (Method `c2ab4e27`, Impl `7f2d9046`). The scope-broadening = a NEW distinct Impl on that Method (R30.11, do NOT re-credit R31.7's config-only Impl) + a distinct BITE Test; the write-on-read fix = the server profile path. New UC `scenarioIndex.guardCommittedClasses` under a new req. req mints; I confirm.
