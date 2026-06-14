### B2: Recurring test-pollution — E2E specs leak users/rooms into shared data, polluting other tests.

<details><summary>Tron directive</summary>

> RECURRING BUG (dogfoods ior:class:Bug, R20.4): E2E specs create users/rooms that leak into shared data and pollute other tests (flaky/order-dependent failures). Reactive cleanup (T118 cleanupTestUsers + per-spec afterAll) is whack-a-mole. ROOT FIX = ZERO-POLLUTION-BY-CONSTRUCTION (learning #4): ONE systemTester identity + ONE persistent system test room — all E2E runs operate within that single bounded identity+room, so no test ever creates stray shared state. Promotes into T118 (S13), superseding the reactive cleanup approach.

</details>

## Traceability

**Tasks:**
- [🔗 T118: E2E test cleanup — cleanupTestUsers + per-spec afterAll + backfill purge](../task/task-118-e2e-cleanup.md)
