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

- [ ] **(by-construction)** ONE shared transport-lifecycle helper handles BOTH transports (no per-transport fork of reconnect/resync logic) — the DRY single-source that makes the behaviour identical across every live connection.
- [ ] **(functional)** On visibilitychange->visible AND on pageshow (incl bfcache-restored persisted=true), the helper VERIFIES-OR-RECONNECTS the transport and RE-SYNCS the view. Both events are handled (pageshow catches the bfcache path visibilitychange misses).
- [ ] **(fail-loud)** RESYNC refetches from the SOURCE (never trusts in-memory/DOM state after the gap) — a suspended client's in-memory model is presumed STALE until refetched.
- [ ] **(fail-loud)** If reconnect OR resync FAILS, the client FAILS LOUD (a visible stale/disconnected indicator), NEVER silent-stale. A dead-but-silent transport is the exact defect (the DOM looks live but is frozen).
- [ ] **(by-construction)** NO UA-sniff / iOS-detection / platform branch — the fix is GENERAL-CORRECT via the standard lifecycle events (visibilitychange/pageshow), so it works on every browser that suspends, not just today's iOS Safari. A UA/platform branch in the transport-lifecycle path => RED.
- [ ] **(gate)** TESTER SEVERED-CHANNEL GATE (stub-must-fail): programmatically SEVER the socket, mutate the data at source, then foreground/visibility-restore -> the view RESYNCS to current (not stale). A build where the severed-then-foregrounded view stays stale => RED. Proves the resync actually catches a dead channel.
- [ ] **(verify-device)** DEFERRED (bucket-2, 2026-09-05) — NOT a closing condition now and MUST NOT be closed via a Tron-confirms AC. iOS transport-suspend resync is a transport-lifecycle FUNCTIONALITY concern (NOT security, NOT owner-auth, NOT basic-functionality-for-the-folder); un-mockable in headless/desktop-WebKit. When prioritized, verification = a real-iOS-DEVICE driver (no auth, no owner) = OUR harness, never ship-and-ask-Tron. Recorded, no harness proposed now (STOP-SECURITY aligned). Tron on a real device would be ACCEPTANCE, never our verification.

## Subtasks

None (atomic task).
