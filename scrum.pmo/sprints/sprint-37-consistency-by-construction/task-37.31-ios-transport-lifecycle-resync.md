<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.31: iOS transport-lifecycle RESYNC — live-MVC recovers after background/lock (both transports, refetch + fail-loud); Tron real-iOS acceptance

[task:uuid:c0157a03-81c0-49a8-8631-687b57eccd6c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

ADVANCED -> QA-Review (2026-08-30, req-directed + VERIFIED on disk not relayed): chain-complete-to-Test BOTH-DIR (Impl dba2b25d wireTransportResync markerPending=false tests[]=[3e84d26a] <-> Test 3e84d26a implementations[]=[dba2b25d]) + gate r4065-ios-resync-gate.mjs tester-GREEN DET-3x (612f44711; 3 arms resync-heals/stub-must-fail/fail-loud on isolated scratch). ★ QA-Review is the CEILING (NOT Done): certScope.satisfied=FALSE — TRON REAL-iOS DEVICE-PENDING (un-mockable, desktop-green inadmissible = closing AC). RESIDUAL (honest, non-blocking for QA-Review — mechanism already tester-gate-proven): Test 3e84d26a = req-minted CANDIDATE uuid; tester two-key AST-attach to r4065 arms PENDING (uuid-adoption hygiene). ⚠ Test 3e84d26a + Impl dba2b25d origin/main-only -> flagged expert to carry to served so /trace renders the chain. Residual /app frozen-OPEN = backlog NAMED-DEBT (NOT this task).

## Task Description

Tron's #1 live-MVC symptom is iOS-Safari-SPECIFIC (tester closing run: passive client updated from broadcast ALONE 3/3 on desktop-WebKit => the general render path is RULED OUT). MECHANISM: iOS SUSPENDS WebSockets on background/lock -> the socket dies QUIETLY -> the DOM stays STALE -> only a manual reload resyncs = exactly his symptom. REPRO: background/lock the app on real iOS -> a change occurs server-side -> foreground shows the STALE state (not the change) until manual reload. FIX (architect design 0b9aa6dc7, expert pre-built 8d04af8a2, re-inspect PASS): ONE shared transport-lifecycle helper across BOTH transports; on visibilitychange->visible AND pageshow(bfcache): verify-or-reconnect + RE-SYNC by REFETCH (never trust in-memory) + FAIL-LOUD if the resync fails; NO UA-sniff, general-correct. Scope = the COMMON case + Tron's live-bridge/trace-pin surface (fully covered by state-independent HTTP refetch). The /app frozen-OPEN zombie residual is a SEPARATE deferred backlog item (1c842f26f) — NOT this task. Reuse the existing transport clients, NO fork.

## Context

Covers R37.27 9ad82c6e (transportLifecycle.resyncOnResume, UC e6a9d288). Structural NEW = the TRANSPORT LAYER (R37.12/R37.24 view-bus ASSUME a live transport; R40.45 = sanctioned emit-path; none scope WS-survives-suspend/resume). S37 realtime-MVC family. Deferred residual: /app frozen-OPEN zombie liveness-probe (backlog 1c842f26f).

## Intention

Keep R37.12's view-bus ALIVE to a RESUMED iOS client: a suspended/dead socket self-heals on resume via refetch, or fails loud — never silently-stale.

## Acceptance Criteria

- [ ] SHARED HELPER, BOTH TRANSPORTS: one transport-lifecycle helper covers BOTH transports (not a per-transport copy) — the resync logic lives in ONE place.
- [ ] RESYNC ON RESUME: on visibilitychange->visible AND pageshow (bfcache restore), the helper verifies-or-reconnects the transport and resyncs.
- [ ] REFETCH NEVER TRUST MEMORY: the resync RE-FETCHES authoritative state from the server; it never trusts in-memory / stale DOM state to be current after a suspend.
- [ ] FAIL-LOUD ON RESYNC FAIL: if reconnect/refetch fails, the client FAILS LOUD (visible error/retry) — never silently-stale.
- [ ] GENERAL-CORRECT, NO UA-SNIFF: the fix uses standard visibilitychange/pageshow (no iOS UA-sniff); desktop transports are unaffected.
- [ ] ★ SEVERED-CHANNEL GATE (tester stub, non-vacuous): a test SEVERS the channel (simulate iOS WS suspend), a change occurs, the client RESUMES -> asserts it REFETCHES + renders FRESH; planted-defect (stays stale on resume) = RED.
- [ ] ★ DEFERRED — NOT A CLOSING CONDITION (rewordProvenance 2026-09-05, customer-not-tester law): iOS transport-suspend resync (background/lock -> change -> foreground shows FRESH state) is un-mockable in headless/desktop-WebKit, but it MUST NOT close via a Tron-confirms AC (never ask the customer to verify). It is NOT security / NOT owner-auth / NOT basic-functionality. A real-iOS-DEVICE driver (no auth, no owner) would let US verify it LATER; DEFERRED behind basic functionality, no harness proposed now. Recorded so it is never silently closed by asking Tron to confirm.

## Subtasks

None (atomic task).
