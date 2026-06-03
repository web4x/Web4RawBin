[Back to Sprint 17 Planning](./planning.md)

# T176: Headless test-infra unblocker — page JS must execute over the isolated test server (R-O)
[task:uuid:c9ebef46-a418-40f3-9a0c-93db265a29cf]

> **PO direction 2026-06-03:** Stand up T176 (R-O) — test-infra fix. Headless
> Playwright can't execute ES-module page JS over self-signed SSL → browser-
> behavior ACs (T174 R-M3d/M3e, T175 R-N1/N2, anything client-JS dependent)
> are unverifiable headlessly, forced to Tron's physical device. Fix the
> isolated test server cert/scheme so module JS executes in headless. This
> unblocks ALL future browser-behavior verification. 4-role.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect: pick approach; tester confirms unblock works)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-O verbatim (req-eng captured in `7bc51c5b`)
  - **R-O** `[requirement:uuid:dc7aa9c8-165b-46ab-8539-8444a7048563]` — test server must serve page JS so headless Playwright executes it; browser-behavior ACs become headlessly verifiable (planner pre-seed; req-eng `7bc51c5b` anchors verbatim — no formal scenario unit yet)
- follows
  - T100 (isolated test server on port 4445 with self-signed cert — the surface this fix lives on)
- unblocks
  - T174 R-M3d/M3e tester verification headlessly
  - T175 R-N1/N2 tester verification headlessly
  - ALL future browser-behavior tasks (DOM state, click interactions, lazy-load cascading)
- down
  - None (atomic task — single approach picked by architect, single fix)

## Task Description (planner seed — req-eng owns verbatim already captured)

**Problem (R-O verbatim from `compound-requirement-source-2.md`):**

> The isolated test server (T100, port 4445) uses a self-signed certificate.
> Playwright's `ignoreHTTPSErrors` handles navigation but does NOT cover ES
> module `import` fetches — the browser silently refuses to load
> `<script type="module">` from an untrusted origin. This means all
> browser-behavior ACs (DOM state, click interactions, lazy-load cascading)
> cannot be verified headlessly — they are deferred to Tron's physical
> device.

**Three fix options (req-listed; architect to pick + design):**
1. **Valid/trusted test certificate** — e.g. mkcert-generated cert added to system trust store. Pro: closest to prod parity (same scheme). Con: requires per-machine trust store setup; CI complications.
2. **HTTP test scheme** — drop SSL on the test server only; modules load over plain HTTP. Pro: simplest; no cert management. Con: diverges from prod scheme; may mask SSL-sensitive bugs.
3. **Module-fetch cert handling** — Chromium launch flag (e.g. `--allow-insecure-localhost` or equivalent) so ES module imports bypass the cert check. Pro: keeps SSL parity; minimal config change. Con: Chromium-specific; may not cover all module-load codepaths.

Architect picks ONE approach with rationale (parity vs simplicity vs scope).

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — captured R-O verbatim in compound source (done; planner adopts)
- **robbin-architect** — pick approach (cert / HTTP / launch-flag); design the exact change to the T100 isolated test server (or Playwright launch config)
- **robbin-expert** — implement architect's pick; rule-pair (a)+(b) likely **exempt** (test-infra only, no user surface — declare per architect; see learning #24 rule-pair exemption categories)
- **robbin-tester** — **prove headless module-load works** by running an existing browser-behavior spec that previously failed silently (e.g. T174 R-M3d/M3e or T175 R-N2 localStorage). Confirm DOM state observable in the page. This IS the AC.

## Acceptance Criteria

**R-O (headless module-load unblocker):**
- [ ] AC1 — Architect-picked approach is documented in this file with rationale (parity vs simplicity)
- [ ] AC2 — Isolated test server (T100, port 4445) — or Playwright launch config — modified per the picked approach
- [ ] AC3 — Headless Playwright loads a page with `<script type="module">` from the test server; the module's top-level code runs (e.g. a known global is set, a known DOM mutation occurs)
- [ ] AC4 — Tester reports a previously-deferred browser-behavior AC (T174 R-M3d/M3e OR T175 R-N1/N2) is NOW verifiable headlessly — runs and produces a definitive PASS/FAIL (not "deferred to Tron device")
- [ ] AC5 — No regression on the prod scheme/cert path (test-only change; production HTTPS unchanged)
- [ ] AC6 — Existing T100 test specs still pass with the new scheme/cert config (no break of non-module specs)

**Ship rules:**
- [ ] AC7 — Rule-pair (a)+(b) — architect declares: likely **EXEMPT** (test-infra only, no user-facing surface change). If a cert is committed (option 1), exempt holds; if launch flag is in playwright.config (option 3), exempt holds; if test server URL scheme changes (option 2), still exempt — no PWA/app behavior change. (Per learning #24.)
- [ ] AC8 — `npm run build` clean; `npm test` clean; new headless module-load proof spec passes

## Subtasks
None (atomic task — single architect-picked approach, single fix, single tester proof).

## QA Audit & User Feedback
- 2026-06-03: req-eng captured R-O verbatim in `compound-requirement-source-2.md` — headless Playwright + self-signed SSL + ES modules silently refuse to load, deferring all browser-behavior ACs to Tron's physical device.
- 2026-06-03: PO directs T176 stand-up — "fix the isolated test server cert/scheme so module JS executes in headless. This unblocks ALL future browser-behavior verification." Owner: architect (approach) + expert (impl) + tester (prove /scenario JS runs headless). 4-role.
- Pending: architect picks approach + designs → expert impls → tester proves headless module-load via a previously-deferred AC → Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 32 — R-O (test-infra unblocker)
**Follows:** T100 (isolated test server)
**Unblocks:** T174 R-M3d/M3e headless verify · T175 R-N1/N2 headless verify · all future browser-behavior tasks
**Rule-pair scope:** (a)+(b) likely EXEMPT (test-infra only, no user surface — architect to confirm in refinement, per learning #24).
