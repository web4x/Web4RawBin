# PII Containment — by-construction design (architect, 2026-08-11)

SECURITY-CRITICAL, PO-dispatched (outranks hold). Live PII exposure: PII-type scenario units git-tracked in a PUBLIC repo (incl. Tron's own mobile number via R21 vCard onboarding). **Design-only — execute nothing. No PII values are quoted anywhere in this note (measured by ior-TYPE + path + count only).**

## Measured ground truth
- **Read path is SAFE for untrack.** `ScenarioIndex` reads/writes WORKING-DIRECTORY files (`fs.readFileSync`/`writeFileSync` at `basePath`, index-store.ts:24-56) — it never reads git. ⇒ **`git rm --cached <unit>` removes it from the index while keeping the working file, and the app keeps serving it.** Confirmed against our read path — the untrack is safe.
- **★ THE CONSTRAINT: PII instances are INTERMIXED with traceability units** in the same `scenario/index/<hex-shard>/` dirs — the store is sharded by uuid-prefix, NOT by type. Every shard 0–f holds a mix of Device/Message/Phone/Profile/Room/WebItem AND UseCase/Test/TestCase/… ⇒ **NO path-glob `.gitignore` can separate PII from traceability in the current layout.** This drives the whole design.
- **★ CATCH — exposure is larger than the 113 briefed.** Measured **311 git-TRACKED PII-type units** (of 5580 tracked scenario units): **Device 195**, Room 45, Profile 23, WebItem 18, Phone 13, Message 12, Company 2, User 1, ChangeRequest 1, Email 1. The briefed 113 ≈ the non-Device types. **195 tracked `Device` units are unaccounted for** — Device units are PII-ADJACENT (device fingerprints / identifiers / push-tokens). ⇒ **req must RULE whether Device is PII** before we finalize the type-list; if yes, exposure is ~311, not ~113.
- A few instances are already path-segregated: Profile @ `scenario/alt/phone` (7), `scenario/alt/email` (1), Company @ `scenario/alt/company` (1). Most are in `scenario/index/`.
- `.gitignore` already ignores runtime AGGREGATES (`data/rooms/`, `data/users/`, `data/profiles.json`, …) but NOT the per-unit scenario files.

## The two-phase containment (because gitignore-by-construction REQUIRES type-segregated paths)
A path-based `.gitignore` cannot make intermixed instances "untrackable by construction" — that guarantee needs the instances at a gitignorable path. So the by-construction gitignore (ask #1) and the enforcement gate (ask #2) split across two phases:

### PHASE 1 — STOP THE EXPOSURE NOW (no storage change, no chokepoint touch)
1. **UNTRACK** the measured tracked PII-type units via `git rm --cached` (keeps working files → app keeps running; read-path-safe, confirmed). Scope by the ruled type-list (incl. Device pending req). Commit the removal.
2. **★ THE GATE — `trace:pii-guard`, wired into `ci:gates`** (this is the real enforcement; a `.gitignore` is a convention a `--force`/new-path defeats, a failing gate is not): scan `git ls-files scenario/`, read each unit's `ior` type, **FAIL (non-zero) if ANY PII-type unit is tracked**, listing count-by-type (never values). Same reasoning as R40.31 — make the bad state impossible, not discouraged. **stub-must-fail:** the gate's own test stages one tracked PII-type unit and asserts the gate goes RED; a gate that can't fail is not a gate.
3. **gitignore** the already-segregable paths (`scenario/alt/phone`, `scenario/alt/email`, `scenario/alt/company`, any runtime instance dir) — partial by-construction where the path allows; the GATE covers the intermixed `scenario/index/` remainder.
- Phase 1 stops new exposure and enforces it in CI without touching storage or the ScenarioIndex chokepoint.

### PHASE 2 — TRUE BY-CONSTRUCTION (type-segregated storage; ★ CHOKEPOINT — HOLD for confirm)
Move runtime-instance types to a gitignored data root (e.g. `scenario/data/<type>/` or `data/scenario-instances/`), distinct from `scenario/index/` (traceability, tracked). `.gitignore` the data root ⇒ a future commit CANNOT include an instance **by construction** (path encodes trackability). This requires **`ScenarioIndex.put`/`get` to route by `ior`-type** (write Profile→data root, UseCase→index root; read both) — **this touches the ScenarioIndex put/get chokepoint.** ★ **I FLAG it and will NOT design through it by availability.** When scheduled it carries the positive-control obligation: prove the app still serves Rooms/Messages/Profiles/Devices from the new root (read paths intact), not merely that instances become untracked — a router that breaks reads passes the "is it untracked" test while breaking the product. The Phase-1 GATE keeps enforcing throughout, so Phase 2 is not time-critical.

## History question — for TRON's decision, not ours (ask #3)
- **Making the repo private stops NEW exposure but git HISTORY retains the PII** — every past commit still contains the values (incl. Tron's number). Private ≠ removed.
- **Actual removal from history = a rewrite** (`git-filter-repo` or BFG) purging the PII files/paths from all commits. Consequence: **every commit SHA changes** → all clones must re-clone/re-fork; open PRs/branches break; **anyone who already cloned or forked retains the old history regardless.**
- **The exposed values should be treated as already-public** (a public repo may be cloned/indexed/cached by third parties). A phone number isn't "rotatable" like a token — that is a real-world decision for Tron.
- **Options for Tron:** (a) private + leave history (fast; stops new exposure; history + existing clones still hold PII); (b) private + history rewrite (purges repo history; SHAs change; forks/clones still hold it); (c) accept exposure + rotate whatever is rotatable. **The rewrite is Tron's call; we lay out consequences and do not execute.**

## Gate isolation (R40.31) + what I flag
- `trace:pii-guard` reads git metadata only (`ls-files`) + unit `ior` — **no prod mutation, no PII printed** (counts by type). Cleanup-N/A (read-only). Proven-able-to-fail via the stub-must-fail control.
- **Flags to PO:** (1) untrack is read-path-SAFE (confirmed) — proceed. (2) exposure is ~311 tracked PII-type units incl. **195 Device — req must rule Device in/out.** (3) gitignore-by-construction needs Phase-2 type-segregation (chokepoint, hold for confirm + positive controls); Phase-1 gate is the immediate enforcement. (4) execute nothing until PO/Tron GO on Phase 1 and Tron rules on history.
