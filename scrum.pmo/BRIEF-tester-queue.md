# BRIEF — tester queue (post-rewind, PO)

**Read this file, not a long pane message.** State: prod **v0.8.149**, served==committed (I verified). HEAD carries your `r4067` kids-aware fix (`a167444e8`) — **your work survived the rewind, nothing to redo.**

## Landed (do NOT re-verify unless something looks wrong)
- **(A)** CurrentSprint empty → 14 cross-branch-uncarried units carried, fixpoint 0-dangling, pin resolves with real children on /trace + /model. CLOSED.
- **(B)(1)** fan-out removed → **count===1** per expand (was 67); task expand **27.9s → ~0.6s**. Live. You confirmed it independently (`prefetchVisibleLayer=0` in the served bundle).
- Coupling settled by your pre/post: the 28s was **pool starvation caused by the fan-out** ⇒ one defect, not two. REQ-B retracted.

## 1. PRIMARY — gate the server perf fix (expert is building it now)
Expert brief: `scrum.pmo/BRIEF-server-perf-fix.md`. Root = `server.ts:2992` full-index scan (~5777 units/request) + `server.ts:2856` per-request `new ScenarioIndex` ⇒ O(total-units) ≈ the residual ~0.5s.

**r4067 = 3 assertions:**
- (a) client **count===1** per expand — already GREEN live, keep it.
- (b) **NEW, and it is the one we actually control:** server **structural invariant — no `idx.list()`/full-index-scan on the children path; compute O(children)**. Network-independent. Assert the *structure*, not a timing.
- (c) latency on the **pinned 80ms-RTT profile**, threshold at the **measured achievable floor** (`O(children)` work + 1 RTT ≈ 100–150ms), and **state the floor inside the gate** so a later reader sees a physical limit, not a slackened standard. The bare-100ms placeholder is aspirational — reset it (it would sit RED forever and rot like r301).

**★ STALENESS GATE (equally important — the cure can be worse than the disease):** the expert is adding a cache. Prove it cannot go stale: write a CR / carry a unit → the very next request must reflect it. **Stub-must-fail: disable invalidation ⇒ RED.** Precedent: T36.3 was a stale cache (~137/138 unenriched methods served), and today's P0 wrote **14 units to disk under a running server** — a warm index without disk-change invalidation would have made that carry look like it failed. A wrong badge is worse than a slow one: slow is visible, wrong is not.

## 2. THEN — r301 derive-repair
Category **STALE-HARDCODED-UNINVOKED** (own class; do NOT merge into r241/r245's KNOWN-BROKEN-INVOCATION count, which stays 2). It gates /trace eager-lazy *structure* = Tron's surface, so **repair, don't retire**: derive the current pin at runtime (never a literal sprint number) **and wire it to a runner**. Until repaired it stays MARKED + COUNTED — mark-not-silence.

## 3. ONGOING — the ~180-ungated-gates req
Capture/route only, do not build. Shape: every gate is either **INVOKED by a runner** or **explicitly MARKED not-invoked with a reason**, and the un-invoked **count is reported**; discovered-not-hand-listed. This is the largest finding of the incident — ~180 gates exist, 4 run in CI, which is why a 250x perf breach reached Tron.

## Standing doctrine (unchanged)
Real surface only (never a proxy surface Tron doesn't use) · screenshot+pixel over DOM-count · stub-must-fail on every gate · stated==implemented (write the rule into the gate, grep out the old proxy) · report scope explicitly (which surfaces were reachable) · **a RED is a valid deliverable — never shade toward green to unblock a land.**
