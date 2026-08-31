# R37.31 — Phantom Coverage: discovered tiered invocation (architect, 2026-08-31)

req measured 272 gates, 268 not CI-invoked; family spans un-invoked GATES + un-tasked ACs. Both read as coverage, neither protects anything — why a 250x perf breach reached Tron. Design-only. PO's steer: design toward what is ENFORCEABLE and say what it COSTS; do NOT design toward "268-invoked" (a picked number).

## Measured landscape (mine)
- **31** `scripts/check-*.{mjs,ts}` (structural gates) — ~48 npm gate-scripts total in `ci:gates:raw` (the blocking runner, every push).
- **280** `test/visual/*.mjs` (device/browser gates — need a scratch server + WebKit/@390). Only **4** are wired into a runner (`gate:device:live:raw` = r4012/r4011/r4019/r3729). **~276 device gates are in NO runner** = ran once as an author-time RED-baseline→GREEN, never re-run → the phantom coverage.
- ⇒ **The 280 device gates CANNOT run every-push** (each spins a browser + scratch server, seconds-to-minutes → hours for 280). So "invoke all 272 in blocking CI" is INFEASIBLE. The answer is TIERS, and "un-invoked" becomes "**UNTIERED / un-run-in-its-tier**."

## The unifying invariant (both layers, one law)
**A coverage artifact (a GATE or an AC) must be PROVABLY CONNECTED TO AN EXECUTOR — a gate to a runner that RUNS it; an AC to a task that IMPLEMENTS it — DISCOVERED, not declared.** Phantom coverage = a coverage artifact with no executor. This is [[connection-is-what-lives]] (F8) + scan-the-hazard-not-the-actors + discovered-not-hand-listed + truth-decay-freshness, unified: a gate/AC that "exists" on a board but nothing runs/implements it is the stored-authoritative-artifact-nothing-keeps-it-true disease (the 250x breach: a perf gate that existed but ran on /model not /trace = invoked-on-the-wrong-surface = still phantom for Tron's surface).

## (a) INVOKED is DISCOVERED, never declared
Do NOT keep an "invoked list" (self-declaration = the className failure again). **DISCOVER the reachable set by PARSING THE RUNNERS**: extract every `npm run X` / `node test/visual/Y.mjs` that `ci:gates:raw` + each tier runner executes (transitively expand npm-script chains). That is the provably-reachable gate set. **Glob every gate file** (`scripts/check-*`, `test/visual/*.mjs`) → any gate NOT in the discovered-reachable set of ANY tier runner = **un-invoked**. Provably-reachable-from-a-runner, not asserted. (r301 died because it was pinned to Sprint-30 literals and in no runner — discovered-un-invocation flags exactly that; and an invoked gate that would RED-if-run REDs LOUDLY, not silently.)

## (b) MARKED-not-invoked + count + shrink-only
A gate legitimately not in a runner (a one-shot author-time RED-baseline, a superseded/replaced gate) must be **MARKED** with a tier + reason (`tier: one-shot-baseline` / `tier: retired, superseded-by X` / `tier: nightly`) — **mark, not silence**. The **un-invoked-AND-UNMARKED count is REPORTED** and **shrink-only** (only decreases, like the hazard ceiling). A NEW gate authored with no tier marker = RED (forces the author to tier it). This converts 276 silent phantoms into an explicit, shrinking, reasoned inventory.

## (c) Anti-rot — derive-don't-hardcode (so it can't die like r301)
Gate inventory = DISCOVERED (glob), runner-reachable set = DERIVED (parse runners) → adding a gate or a runner auto-updates; ZERO Sprint-30-style literals. **Each ACTIVE tier must actually RUN on its cadence with results TRACKED** — a nightly-tier gate not run in N days = its result is STALE = RED (truth-decay freshness applied to gate execution). This kills the r301 failure mode structurally: a gate is either (i) in a runner and RUN (REDs loudly on a real defect) or (ii) marked-retired with a reason — NEVER "exists, in no runner, would-RED-if-run, shows-as-coverage."

## (d) AC layer — discover an untasked AC structurally
Every AC lives on a req's `acceptanceCriteria[]`. **Glob all req units; for each AC, require a covering EXECUTOR = a task** (a task whose `coveredRequirements[]` includes the req AND — stronger — the AC is referenced by a task/`satisfyingGate`). An AC with no covering task = **un-tasked** = phantom ("looks covered, nothing implements it"). Seed exists: `ac-untasked-audit.mjs` (on main). discovered-not-hand-listed (glob all ACs). This is the same born-false class as R40.54 (satisfaction ASSUMED, never DERIVED from a producer) — coordinate: R40.54 = an AC must be failable; R37.31 AC-layer = an AC must be TASKED (have an implementer). Two distinct executor-connections (a gate runs it / a task implements it), one law (connected-to-an-executor).

## (e) THE HONEST ANSWER — TIERS, and the cost
"268-invoked-in-CI" is the WRONG target (280 device gates can't run every-push). The enforceable shape = **every gate TIERED, each active tier actually run on cadence, 0 untiered / 0 stale-in-tier:**
| Tier | What | Cadence | Cost |
|---|---|---|---|
| **blocking** | fast structural (`scripts/check-*`, trace-audit, bites) | every push | seconds (~48 gates, already runs) |
| **pre-deploy device** | device gates for the CURRENTLY-shippable surfaces | before each deploy, on the R40.31 scratch | minutes (~10-30 gates) |
| **nightly comprehensive** | the full device sweep | scheduled, results tracked | the 280 on infra we have (the scratch); a fail = flagged, not blocking-the-push |
| **retired / one-shot** | author-time RED-baselines that proved a fix, not meant to re-run | never (marked) | 0 (marked with reason) |
The invariant is NOT a run-count; it is: **0 untiered gates + 0 stale-in-active-tier + 0 un-tasked ACs**, all DISCOVERED. Honest cost: the blocking tier stays fast; the device tiers reuse the R40.31 scratch infra; the retired majority (likely most of the 276) cost nothing but a marker. What we spend: authoring the tier markers once + a scheduled nightly runner + the discovery lint. What we get: no gate/AC can silently be phantom coverage again.

## Failable enforcement (ride R40.54)
- `check:gate-tiered` (blocking): every discovered gate file is in a tier-runner OR marked (with reason); un-invoked-unmarked count shrink-only; NEW-untiered-gate = RED. Stub-must-fail: drop a gate from all runners + markers → RED.
- `check:tier-fresh`: each active tier's last-run recency within its cadence, else RED (stale-tier). Stub: stale a nightly result → RED.
- `check:ac-tasked` (extend `ac-untasked-audit`): every AC has a covering task, discovered; un-tasked count shrink-only. Stub: mint an AC with no task → RED.
- All discovered-not-hand-listed; the meta-check (R40.66 "every check-* in ci:gates:raw") is the seed of `check:gate-tiered`, generalized from check-* to ALL gate files + tiers.

## Handoff
req mints R37.31 with the tiered-invocation ACs (+ the AC-tasked layer, coordinated with R40.54 not-duplicated); planner tasks; expert builds the discovery lint + tier markers + nightly runner. I backstop: discovered-reachability is real (not a hand-list), shrink-only holds, stub-must-fail per gate. This is the same measure-executor-connection law as R37.29 (referential integrity) and the truth-decay family — coordinate so we build ONE discovery mechanism, not three.
