# T180: Real CA cert (Let's Encrypt) for home.donges.it + CDP Playwright workaround — Tron real-device unblock (CRITICAL-PATH #1)
[task:uuid:915f458e-57af-416a-951f-ba1d33e08ca5]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect designs LE issuance + auto-renew pipeline + CDP Playwright config)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-04 (Tron-relayed): real-device blocker; SW registration blocked on self-signed cert; Tron locked out
  - **R-T** `[requirement:uuid:b748f8be-e821-4b9f-8262-bff3adfba2f8]` — production server MUST present a real CA-issued certificate; PWA Service Worker registration MUST succeed for Tron's real-device use. CDP `setIgnoreCertificateErrors` covers the headless-test path (planner pre-seed; req-eng to anchor verbatim Tron quote if relayed)
- follows
  - T179 (`886f9815` v0.5.79) — SW reliability landed; T180 unblocks the SW from registering at all on Tron's device
  - T100 — isolated test server self-signed cert (port 4445); T180 part (b) provides the headless workaround
  - T176 (NOT-A-BUG) — `ignoreHTTPSErrors:true` covers Playwright navigation/module-fetch but does NOT cover `navigator.serviceWorker.register()` on insecure origins; T180 closes that specific gap with the CDP override
- unblocks
  - Tron's real-device app use (CRITICAL)
  - T179 AC11-13 SW-active verification in headless tests (CDP workaround)
  - All future PWA / SW-touching tasks (no more "tested fine but Tron's device rejects SW")
- down
  - None (atomic task — two coordinated tracks shipped together)

## Acceptance Criteria

**R-T part (a) — Production CA cert (Tron real-device unblock):**
- [ ] AC1 — `home.donges.it:4444` presents a valid Let's Encrypt certificate chain (verified via `openssl s_client` or `curl` without `-k`)
- [ ] AC2 — Browser (Chrome, Safari) on Tron's iPhone successfully registers the SW on a fresh visit — `navigator.serviceWorker.register('/sw.js')` reaches `activated` without security errors
- [ ] AC3 — Auto-renew configured: certificate renews ≥30 days before expiry without manual intervention; renewal hook reloads server cert without dropping in-flight connections (or with graceful restart)
- [ ] AC4 — Rollback path documented: if renewal fails, server keeps serving the previous valid cert (no service down on renew failure)
- [ ] AC5 — Tron confirms (real-device): can open the app, SW caches kick in, offline page works

**R-T part (b) — Headless test workaround:**
- [ ] AC6 — Playwright spec helper uses CDP `Security.setIgnoreCertificateErrors` for SW-test contexts; documented + limited to T100 test scope
- [ ] AC7 — A Playwright spec successfully calls `navigator.serviceWorker.register('/sw.js')` against the T100 server and the SW reaches `activated` state
- [ ] AC8 — T179 AC11-13 (SW-ACTIVE verify per strict-bar 2b) become verifiable headlessly via this workaround
- [ ] AC9 — Production code paths are NEVER affected by the CDP override (it lives in test config only)

**Backwards-compat + ship rules:**
- [ ] AC10 — Existing T100 specs that DON'T need SW registration continue to use the baseline `ignoreHTTPSErrors:true` (no forced migration)
- [ ] AC11 — Rule-pair (a)+(b) — architect declares: likely **EXEMPT** for BOTH tracks (production cert = server-infra only; test config = test-only). Per learning #24.
- [ ] AC12 — `npm run build` clean; `npm test` clean; new SW-registration spec passes against T100

## QA Audit & User Feedback

- 2026-06-04: PO directs T180 stand-up NOW — TOP PRIORITY above T178. Tron locked out: Chrome blocks SW registration on self-signed cert; with T179 making SW the durable runtime, this is a real-device blocker. Two-track scope: production LE cert + CDP Playwright workaround. Architect designs both; expert ships; tester verifies (iPhone real-device + headless SW registration).
- 2026-06-04: **AWAITING TRON ACTION** — PO escalated the production cert to Tron with a DNS-01 certbot one-liner. Track 1 (LE cert provisioning) cannot proceed without Tron's DNS API access / direct shell execution on the host. Track 2 (Playwright CDP workaround) can proceed in parallel.
- Pending Track 1: Tron runs DNS-01 certbot one-liner → expert updates `server.ts` to load LE cert/key/chain + wires auto-renew → tester confirms LE chain valid + iPhone SW registers.
- Pending Track 2: architect designs CDP `Security.setIgnoreCertificateErrors` Playwright config → expert wires SW-test helper → tester proves SW registration succeeds against T100; unblocks T179 AC11-13 headless verify.
- Pending overall: both tracks land → Tron QA closes the real-device unblock.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 36 — R-T (real CA cert + CDP test-infra workaround — Tron real-device unblock)
**Priority:** **CRITICAL-PATH #1** (above T178; Tron locked out of real device)
**Follows:** T179 (SW runtime durable) · T100 (isolated test server) · T176 (Playwright baseline; T180 closes the SW-registration gap T176 left open by design)
**Unblocks:** Tron real-device app use · T179 AC11-13 SW-active headless verify · all future PWA/SW tasks
**Rule-pair scope:** (a)+(b) likely EXEMPT for both tracks (infra-only / test-only per learning #24); architect confirms.

## Subtasks

None (atomic task — two tracks shipped together; architect designs both, expert implements both).
