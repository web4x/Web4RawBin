# R40.31 ROW clause (Tron 4th/LAST criterion) — architect COLD ruling

**Ruling on tester RAW `43efc40ae`** (harness 092488034, COMMIT aaf60ef61, buildDist=1 ROW_SETTLE=1, v0.8.116 both arms, real-WebKit @390). Read cold from `r4031-row-raw.txt`, not the relay.

## VERDICT: ✓ **ROW-LIVE — ACCEPTED (PASS)**. Tron gets 4/4 (controls + detail + badge + ROW).

The mechanism seal carries it, and I found it is **stronger than reported** — the "unclean exclusion" caveat is a non-issue on the numbers, and the verdict does **not** rest on C1's (inferred) poller-alive claim.

## (a) Does call-capture carry ROW-LIVE given exclusion-clean=false? — **YES.**
- `rlForTargetAfter=1`: refreshLive fired **for the target** via the ViewBus subscribe path (rb-object-item:73 → refreshLive) → the bus→refreshLive→row mechanism is directly instrumented, and the row mutated **in-place** (`rowMark RMt5iw9zialg→RMt5iw9zialg`, same node). That is live-MVC by construction.
- **The confound is fully accounted, not merely "independent":** `rlTotalAfter=2` and `c2GetsAfterApprove` = exactly **two `/api/ior` fetches** (target + current-sprint-singleton) and **zero `/api/trace/children`**. refreshLive's fetch endpoint is `/api/ior`; the /trace poll-timer endpoint is `/api/trace/children`. So **every post-approve fetch (2) is accounted for by a refreshLive call (2)** — there is NO unaccounted fetch left for an independent poll, and the poll-timer made **zero** children-fetches after approve. The `/api/ior` body that carried `Done` (→ `exclusion-clean=false`) is **refreshLive's OWN broadcast-triggered fetch** — the mechanism working, not an alternative cause. Exclusion-by-content is therefore **not load-bearing** and its "uncleanness" is explained.
- ⇒ Call-capture + fetch-accounting = the poller is excluded as the row-move cause **within the POSITIVE arm itself**.

## (b) Is the C1 poller genuinely unsuppressed, or merely asserted? — **Merely asserted (minor L21 gap), but NOT load-bearing.**
- The raw does **not positively measure** the C1 poll-timer as alive: `pollInQuietWindow=0` and `pollCountAfterApprove=0` are consistent with *both* alive-and-idle *and* suppressed. "poller alive (neuter touches broadcast only)" is **inferred from the neuter's scope**, not asserted-at-test (my L21: preconditions asserted, not inferred). Note also `pollInQuietWindow=0` in the POSITIVE arm too — the /trace poll-timer never ticked in either window.
- **Why it doesn't sink the verdict:** the seal is the POSITIVE arm's fetch-accounting (0 `/api/trace/children` after approve; 2 fetches == 2 refreshLive), which excludes the poller **regardless of whether it is alive**. C1 is corroboration (broadcast-off → row stayed, `rlForTargetAfter=0`), not the primary proof.
- **HARDENING for next time (not a blocker):** positively instrument a C1 poll-timer heartbeat (assert ≥1 `/api/trace/children` tick in a long-enough window) to convert "poller alive" from inferred → asserted. Recommended, not required for this verdict.

## (c) Anything that makes this INVALID rather than ROW-LIVE? — **No.**
- Instrument self-test PASSED **both arms**: `detectsChange=true + cleanTimeout=true` → the settle detector can catch a real change AND cleanly time out, so C1's "no move" is a **real** no-move, not a false-green. (This is what rules out INVALID.)
- Preconditions all met + asserted: expand-reached via **REAL** `.oi-expand` BFS (rounds=1, not synthetic DOM poke — satisfies my 2ba8afa1e real-gesture-preferred rule), `present-before` badge `=='QA Review'` (asserted true), `servedVersion 0.8.116` both arms, `distHasViewBusKey=true` both, passive + no-reload.
- Isolation (R40.31): prod `97e8a6ad` unchanged (still QA Review), `teardown leftover=0`, prodUp=true — no prod mutation.
- No precondition failed ⇒ not INVALID.

## Credit to the tester
The self-declared `exclusion-clean=false` caveat was exactly right to surface (L20 honesty) — and on the numbers it is defused by the fetch-accounting, which the raw already carries. Clean, honest run.

## To PO
Rule stands independently of your reading: **ROW-LIVE holds on call-capture, the exclusion confound is non-load-bearing (fetch-count == refreshLive-count, zero poll-timer fetches), and the only soft spot (C1 poller-alive inferred not measured) is corroboration, not the seal.** 4/4 for Tron. One optional hardening logged. I did not soften it — it genuinely holds.
