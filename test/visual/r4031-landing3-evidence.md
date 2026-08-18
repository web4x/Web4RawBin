# R40.31 Landing-3 — RAW per-surface evidence (A APPEAR + B VANISH on /model)

Harness reworked `/trace`→`/model` per architect ruling **70cfcdab1** (defect reachable on /model:
graph-less drawer mount). Runs against the isolated foundation scratch server. **worktree ddb645b78 / served v0.8.114.**
Real-WebKit @390. Report A and B as SEPARATE blocks (architect interprets each). Three outcomes: GREEN / RED / **INVALID**.

---

## HALF A (APPEAR — controls follow STATUS not MEMBERSHIP, graph-absent subject) — DIRECT GREEN, DIFFERENTIAL CONFOUNDED

- **Subject swept = 92bdca8b** (Sprint 25 QA-Review). On /model: `_graph.get(92bdca8b) === undefined` **AT TEST TIME** (invariant met — graph-absent precondition VALID, unlike /trace where it was graph-present).
- **DIRECT (fix-on) = GREEN**: controls render=**true** · `/api/ior` status=**QA Review** (sole source) · graph-absent=true. → On /model, control visibility follows the `/api/ior` STATUS on a graph-ABSENT subject. ✅
- **DIFFERENTIAL (fix-off, attachTaskStatus neutered @ same commit) = CONFOUNDED / not isolating**:
  - neuter regex verified to MATCH (`grep -c 'function attachTaskStatus(m: Record<string, unknown>): void {'` = 1) → patch applies deterministically.
  - BUT fix-off arm still measured `iorStatus='QA Review'` AND controls render=true (controlsHidden=**false**).
  - **Root**: the subject carries a STORED `model.status`; `/api/ior` returns it independently of `attachTaskStatus`. `attachTaskStatus` (server.ts:1425, called at the read boundary :2873) computes DERIVED status — redundant when a stored status already satisfies the render.
- **★ ARCHITECT QUESTION (you own EXPECTED):** to isolate `attachTaskStatus`, should the fix-off arm ALSO strip the stored `model.status` (so status is available ONLY via derivation), OR is the DIRECT proof (graph-absent + controls follow /api/ior) the intended acceptance and the differential over-specified for a stored-status subject? The auto-verdict prints RED, but the DIRECT invariant is GREEN and the differential is confounded, not falsified.

## HALF B (VANISH — Tab B moves from broadcast alone, no reload) — INVALID (precondition unmet on /model) + harness gaps

- **Subject = 97e8a6ad** (Sprint 37 QA-Review). worktree ddb645b78 / v0.8.114.
- **(2) C1 STUB broadcast-OFF → client-2 did NOT update = PASS** (the causal negative control holds).
- **(4) NO-RELOAD positive** (sentinel survived + 0 nav on client-2) = **true**.
- **★ PROD 97e8a6ad UNCHANGED (isolation held for a REAL task): true** (QA Review → QA Review) — scratch-only, prod untouched.
- **teardown**: prod:4444 untouched + 0 leftover = true (both arms).
- **PRECONDITION UNMET → INVALID, not RED:**
  1. **controls ABSENT-before** (`before.approve=false`) → PRESENT-after (`after.approve=true`) — the OPPOSITE of vanish. A's DIRECT proved controls DO render for a graph-absent QA-Review subject *with a warmup + `waitForSelector('button[data-verb=qa-approve]')`*; B's before-snapshot lacks that warmup → captured before the drawer rendered controls → present-before precondition FALSE.
  2. **client-2 on /model NOT quiet** — `c2GetsAfterApprove` shows many `/api/trace/children/...?mode=trace` requests + `pollInQuietWindow=3`. This CONTRADICTS the ruling's "/model is tree-less → client-2 quiet" assumption; trap-1 (broadcast≠poll, surgical-only) cannot be evaluated on /model as-loaded.
  3. **status regex noisy** — `before.statusDone=true` BEFORE any approve (drawer textContent contains "Done" substrings); statusDone/statusQaReview are substring matches, not the live status.
- **★ ARCHITECT QUESTION:** is /model genuinely tree-less as ruled, or does the loaded /model page carry a tree subscribed to `graph` emits (the observed `/api/trace/children` calls)? If /model has a tree, the "quiet client-2" causality (trap-1) needs a different surface OR the tree must be excluded. B also needs a harness fix: warmup the before-snapshot (mirror A's openAndRead) + assert the live status via the control-bar/badge element, not a textContent substring.

## NET (tester, honest — not rubber-stamped)
- **A DIRECT = GREEN** on /model (the graph-absence precondition that was INVALID on /trace is now VALID). **A DIFFERENTIAL = confounded by stored status** (architect ruling needed).
- **B = INVALID** (present-before precondition unmet + /model-not-quiet + noisy status detection) — the C1 negative-control + no-reload + prod-isolation all pass, but the core present→absent vanish is not yet measurable as-built. Harness refinement (mine) + a /model-tree ruling (architect) needed before a real B verdict.
