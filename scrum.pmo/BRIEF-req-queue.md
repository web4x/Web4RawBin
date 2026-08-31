# BRIEF — req queue (post-rewind, PO)

**Read this file, not a long pane message.** Prod **v0.8.149**, served==committed (verified). Today's P0s are closed or shipping; what remains for you is turning the *causes* into requirements so they cannot recur.

## Context in one paragraph
Tron reported two prod regressions. **(A)** CurrentSprint rendered open-and-empty — root: **14 units committed on `main` but never carried to the served branch**; R37.1 correctly fail-closed on the dangling refs. Fixed + verified. **(B)** tree expansion took ~a minute — root: the client fired **1+N requests per expand** (67 for a sprint), starving Chrome's ~6-connection cap. Fixed, live, **27.9s → ~0.6s**. Residual ~0.5s = a server **O(total-units)** full-index scan per `/children` request; expert is fixing it now.

## Your queue (priority order)
### 1. R37.29 — referential-integrity guard (write-side dual of R37.1)
Highest value: it makes today's whole P0 class **impossible by construction**. Shape: **any ref (sprint.tasks[], ownerIor, parent/child) that does not RESOLVE IN THE TREE IT IS COMMITTED TO = RED**, enforced as a **data-carry gate AND in ci:gates** (trace-audit family). Discovered-not-hand-listed, stub-must-fail, stated==implemented.
**★ AC that must be in it — learned the hard way today:** the guard must **REPORT ALL unresolvable refs, never abort on the first**. Two agents under-scoped this P0 (3 and 5 refs) because they scoped from the *error message*, which names only the FIRST refusal — **a fail-closed reports where it STOPPED, not the full damage.** The true set was 10, found only by a fixpoint sweep. Stub: 3 dangling in 2 sprints ⇒ must report all 3.
**Also:** cover **frozen (≤18) sprints too** — the expert verified they are clean today, but the guard must not report a false all-clear by only walking current-era.
This would also have caught the *47-tasks-invisible-to-Tron* incident earlier today. Same class, second occurrence.

### 2. The ~180-ungated-gates requirement (largest structural finding)
**~180 `r*.mjs` gates exist; only 4 are CI-invoked.** Everything else — including gates shipped today — runs only when a human remembers. That is why a **250x** perf breach reached Tron. Shape: **every gate is either INVOKED by a runner, or explicitly MARKED not-invoked WITH a reason, and the un-invoked COUNT is reported.** Discovered-not-hand-listed. Plus **derive-don't-hardcode** so a gate cannot rot: r301 was pinned to Sprint-30 literals, sits in no runner, and would RED if run.
Keep the categories distinct: **STALE-HARDCODED-UNINVOKED** (r301) vs **KNOWN-BROKEN-INVOCATION** (r241/r245, count stays 2). Merging them destroys the number's meaning.

### 3. R37.30 — server scale-invariance (your current thread)
From the (B) residual: `server.ts:2992` scans ~5777 units per request to compute one badge; `server.ts:2856` rebuilds the index per request. AC shape: **server compute is O(children), never O(total-units)** — structural and network-independent. Note the latency floor is **1 RTT (~80ms)**, so the AC must state an **achievable** number (~100–150ms), not a bare aspirational 100ms that would sit RED forever and rot.
**★ Defect shape worth encoding:** an `O(total)` cost is **invisible behind small fixtures** — it only appears at production scale. Sibling of gate-with-representative-data.

### 4. bb9dec65 requirement-drift (my ruling stands)
Task 40.62 is *"Render CR diagram file-artefact"* but its covering req R40.62 (`a4c9340d`) was rewritten to *"ChangeRequest shape"* with the render ACs removed. **Do NOT retire or strip it.** Establish with evidence: still-matters (⇒ re-home the render scope to a req that owns it) or deliberately-dropped (⇒ retire WITH the reason recorded). I rule once you report.

## Standing
Scenario-first (#126) · single-minter · verify-owner-first, no double-credit · full uuids in chain ops, and say which KIND (task ≠ impl — I conflated those today) · **0 Done without Tron's verdict.**
