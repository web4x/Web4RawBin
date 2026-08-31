# BRIEF — server /children O(total) fix (expert lane, PO-authorized)

**Read this file instead of a long pane message.** State as of v0.8.149 (served==committed, verified).

## Done already (do NOT redo)
- **(A)** CurrentSprint empty = 14 cross-branch-uncarried units → carried, fixpoint 0-dangling, pin resolves with real children. CLOSED.
- **(B)(1)** fan-out removed → **1 request per expand** (was 67). Task expand **27.9s → ~0.6s**. SERVED v0.8.149 (822cb6596). Tron's "minute" is gone.
- Coupling settled: the 28s was pool starvation *caused by* the fan-out. **One defect, not two.** REQ-B retracted.

## Your next task: kill the O(total-units) server cost
**Root (architect f68abf777, measured):**
- `server.ts:2992` — `for (const cru of idx.list()) { idx.get(cru) }` = **full-index scan (~5777 units, file-read + JSON.parse each) on EVERY /api/trace/children request**, to build the R40.64 CR-owner-count map. O(total-units), independent of children count ⇒ the fixed ~0.4s.
- `server.ts:2856` — `new ScenarioIndex` **per request** ⇒ cold cache every call.

**Fix shape:** (1) cached CR-owner **reverse-index**, built once + invalidated on CR write ⇒ per-child CR count = O(1) for only the N rendered children; (2) warm/persistent ScenarioIndex. Endpoint becomes **O(children)**.

## ⚠ PO GUARDRAILS — the cure can be worse than the disease
A wrong badge is worse than a slow one: **slow is visible, wrong is not.**
1. **Invalidate on EVERY CR write path** (mint, status change, delete/retire) — not just the obvious one. If you cannot enumerate them with certainty, SAY SO rather than guess.
2. **Invalidate on DISK CHANGE, not only on writes the server itself performed.** Precedent, twice:
   - **T36.3 was a stale cache** (~137/138 unenriched methods served to Tron).
   - Today's P0 wrote **14 units to disk underneath a running server**. A warm index without disk-change invalidation would have made that carry look like it failed — and my "fixed" to Tron would have been false.
   If disk-change invalidation is hard, prefer a **bounded TTL or an explicit re-derive hook** over an unbounded warm cache.
3. **Report the enumerated invalidation paths BEFORE shipping.**

## Acceptance (tester gates it — r4067, 3 assertions)
- (a) client **count===1** per expand — already GREEN live.
- (b) server **structural invariant: no `idx.list()`/full-index-scan on the children path; compute O(children)** — network-independent, this is the thing we control.
- (c) latency on the **pinned 80ms-RTT profile**, threshold at the **measured achievable floor (~100–150ms = RTT + O(children))**, with the floor STATED IN THE GATE (a bare 100ms is aspirational and will rot like r301).
- **Staleness gate, stub-must-fail:** write a CR / carry a unit → next request must reflect it; disable invalidation ⇒ RED.

## Ship discipline
Version-bump + atomic + boot-check + recorder-survival (POST-sink 403) + served==committed. Path-limited one-step commit (`git commit -m MSG -- <explicit paths>`), never `-A`; verify `git show --stat HEAD` lists only your paths (a peer's file rode along once today).

**Report scope honestly:** never "(B) fixed" until (b) and (c) both hold.

---

## NEXT AFTER the perf fix — Q1 fail-loud surfacing (do NOT let this stay orphaned)
**Status: designed (architect `edc2e9620`/`dd91889f6`), NOT shipped.** I checked: `pinSprintLabel` is still only COMPUTED (server.ts ~2887/2896) and never emitted — so a refused pin STILL renders as an open, empty node with no reason.

**Why it matters even though the referential-integrity gate (T37.33) will prevent dangling refs by construction:** this is the defect that made Tron experience a *correct* fail-closed as *"the current is open and empty… a new regression"*. He lost time, we burned a P0 cycle, and the system had already written the honest reason — the UI just dropped it. Guards that refuse silently are indistinguishable from bugs. T37.33 stops the cause; Q1 makes any *future* refusal legible. Defense in depth, and cheap.

**Fix:** emit a NOTICE CHILD row carrying `pinSprintLabel` where the 3 slots would have been (`children = slotEntries.filter(s => s.slot?.taskUuid)` yields `[]` on a refused pin ⇒ open+empty). Same law as the Phase-A base `⚠ unresolved` — a refusal the user cannot see is fail-SILENT.

**Acceptance:** with a deliberately unresolvable ref, /trace and /model must render the ⚠ reason text where children would be — asserted on the REAL surfaces, screenshot+pixel, stub-must-fail (suppress the emit ⇒ RED). Code-only, no prod data write.
