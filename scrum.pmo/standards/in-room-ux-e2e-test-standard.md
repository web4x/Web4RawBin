# Standard: In-Room UX requires a real END-TO-END Test (anti-false-green)

**Recorded:** 2026-06-13 (PO directive via robbin-po, robbinTeam2:0.0)
**Owner:** robbin-planner (gate) + robbin-tester (authors the E2E test)
**Applies to:** every Requirement whose behavior is an in-room / rendered-UI interaction.

## Rule

For an **in-room UX requirement**, the chain's **Test node MUST be a real end-to-end test**:
- **Playwright** (or equivalent browser-driven), NOT a unit test or source-string assertion.
- It **reaches the rendered in-room view** (launches the app, enters a room, renders the file tree / detail drawer / dialog under test).
- It **asserts the actual behavior** the requirement describes (the click opens the drawer, the item initializes, the state is wiped, etc.).
- It **captures a screenshot** as evidence of the rendered state.

A unit-green or source-marker-green chain whose **live behavior is broken = FALSE champagne.**
The chain is **NOT genuinely complete** until the E2E screenshot test backs it, regardless of det-3x count or `Impl.tests[]` wiring.

## Why

This is the **anti-false-green** standard. The chain-completion scoreboard gates on a real `[test:uuid:]` marker + `Impl.tests[]` — but a *unit* test can carry a real marker and still pass while the rendered UI is broken (the iOS init-race chains were "unit-green" while items didn't initialize on the device). Only a browser-driven test that renders the real view and screenshots it proves the behavior.

This composes with the planner cert guards (boot.md): **validate-vs-ground-truth** + **real-markers-not-stubs** now extend to **real-E2E-not-unit** for UX requirements.

## In-room chains marked PENDING-GENUINE-TEST (2026-06-13)

These chains may read complete via unit/source tests but are **NOT genuine** until an E2E screenshot test backs them:

| Req | Chain subject | Canonical task |
|-----|---------------|----------------|
| R19.21 | single in-room tree component (intent) | req d1391ee3 |
| R19.83 | in-room file lifecycle render | task 322d0fcd |
| R19.88 | per-item init gate (whenDefined) | task 67abd046 |
| R19.88.A | tree diff-render (no innerHTML churn) | task c524c8a0 |
| R19.90 | in-room reuses rb-trace-tree (DRY/OOP) | task b8da64a1 |
| R19.91 | removeLocalIdentity full state wipe | task 5da32d29 |
| R19.92 | in-room files use /trace data path | task 4aa7e19d |
| R19.93 | preview button on file detail view | task 2668b5f0→architect 5ab2d3b9 |

"systematic-fix" = the R19.88/88.A/90 consolidation arc — all gated on the same in-room E2E proof.

The planner does NOT credit any of these as 🧪/complete on the scoreboard until the tester lands the Playwright + screenshot Test node. Tron device-acceptance remains the final 🏁 gate on top.
