[Back to Sprint 17 Planning](./planning.md)

# T180: Real CA cert (Let's Encrypt) for home.donges.it + CDP Playwright workaround — Tron real-device unblock (CRITICAL-PATH #1)
[task:uuid:915f458e-57af-416a-951f-ba1d33e08ca5]

> **PO direction 2026-06-04:** Stand up T180 NOW. TOP PRIORITY — **above T178**.
> Tron is locked out of the app on his iPhone: Chrome (and Safari) **block PWA
> Service Worker registration on a self-signed certificate**. With T179 making
> the SW the durable runtime, this is now a **real-device blocker** — Tron
> literally can't use the app until the server presents a real CA-issued cert.
>
> **Scope (two parallel tracks, single task):**
> 1. **Production fix** — provision a real CA cert (Let's Encrypt) for
>    `home.donges.it`. Server (HTTPS port 4444) must present the LE cert; auto-
>    renew configured.
> 2. **Test-infra workaround** — for the isolated test server (T100, port 4445)
>    keep the self-signed cert but use **Chromium DevTools Protocol
>    `Security.setIgnoreCertificateErrors`** in Playwright launch so SW
>    registration succeeds in headless during AC verification of T179 + future
>    PWA tasks.
>
> 4-role planner-first. R-T new letter (R-R is taken by S13; R-S by T179).

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

## Task Description (planner seed — architect designs)

**Problem (PO 2026-06-04):**

Chrome / Edge / Safari refuse to register a Service Worker on an origin with an
untrusted certificate. `home.donges.it` currently presents a self-signed cert.
After T179 made the SW the durable runtime layer, this means:

- Tron's iPhone Safari + Chrome can't register the v0.5.79 SW → no PWA → no app
  caching → no offline fallback → every route fails as soon as the network blips.
- Headless Playwright with `ignoreHTTPSErrors:true` ALLOWS module imports (T176
  proved this) but **does NOT enable** `navigator.serviceWorker.register()` on
  the same origin — SW registration explicitly requires a "secure context" per
  the spec, and `ignoreHTTPSErrors` doesn't satisfy that flag. So even the
  tester can't verify T179 ACs (SW-active gate of the strict-bar) without a
  different mechanism.

**Two-track architect design:**

### Track 1 — Production: Let's Encrypt cert for `home.donges.it`

Architect designs the issuance + renew pipeline:
- ACME client choice (e.g. `certbot`, `acme.sh`, or a Node implementation that
  fits the existing server scripts)
- Validation method: HTTP-01 (port 80 must be available) vs DNS-01 (no port 80
  needed but requires DNS provider API access)
- Where the cert lives on the host: filesystem path + permissions
- Server integration: how `src/ts/server/server.ts` loads `cert.pem` + `key.pem`
  + intermediate chain (replace the current self-signed load)
- Auto-renew schedule: cron / systemd timer / launchd
- Renewal hook: reload the Node server to pick up the new cert without dropping
  connections (or graceful restart)
- Rollback: if renewal fails, fall back to the existing cert until next attempt
  (don't break the running server)

### Track 2 — Headless test: CDP `Security.setIgnoreCertificateErrors`

Architect designs the Playwright config change:
- Switch to Chromium-only for SW tests (CDP is Chrome-specific; WebKit/Firefox
  use different mechanisms)
- In Playwright `browser.newContext` or `browserType.launch`, attach a CDP
  session on the page and call:

```typescript
const session = await context.newCDPSession(page);
await session.send('Security.enable');
await session.send('Security.setIgnoreCertificateErrors', { ignore: true });
```

  This convinces Chromium to treat the self-signed origin as a "secure context"
  for the duration of the session, allowing `navigator.serviceWorker.register()`
  to succeed.

- Apply ONLY to test specs that need SW registration; keep `ignoreHTTPSErrors`
  for the rest (T176 baseline).
- Document the boundary: production NEVER uses this override; only T100 / Playwright.

**Expert implements both tracks.** Track 1: cert issuance + server.ts update +
auto-renew job. Track 2: Playwright config + a helper for SW-test specs. **Rule-
pair:** (a)+(b) likely **exempt** for both tracks — production cert change is
infra (no PWA bundle change); test config is test-only (per learning #24
rule-pair exemption). Architect to confirm.

**Tester verifies:**
- Track 1 (production): `curl -v https://home.donges.it:4444/` shows a valid LE
  cert chain (no `-k` flag needed); the iPhone Safari registers the SW on a
  fresh visit (manual verify on Tron's device, OR a synthetic Safari/Chrome
  load against the LE-secured origin succeeds).
- Track 2 (test): a Playwright spec that calls
  `navigator.serviceWorker.register('/sw.js')` against the T100 server succeeds
  (no `InvalidStateError` for insecure context); SW reaches `activated`; then
  T179 AC11-13 become verifiable.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-T verbatim if Tron relays additional context (e.g. "locked out", "can't open app")
- **robbin-architect** — Track 1: ACME pipeline + server integration + auto-renew. Track 2: CDP Playwright config. Declare (c) STATIC_SHELL N/A (no bundle change either side).
- **robbin-expert** — implement both tracks; provision the LE cert; update `server.ts` to load it; wire the auto-renew job; modify Playwright config for SW-test specs
- **robbin-tester** — verify (1) production cert chain valid + iPhone SW registers; (2) T100 + CDP override → Playwright SW registration succeeds → T179 AC11-13 verifiable

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

## Subtasks
None (atomic task — two tracks shipped together; architect designs both, expert implements both).

## QA Audit & User Feedback
- 2026-06-04: PO directs T180 stand-up NOW — TOP PRIORITY above T178. Tron locked out: Chrome blocks SW registration on self-signed cert; with T179 making SW the durable runtime, this is a real-device blocker. Two-track scope: production LE cert + CDP Playwright workaround. Architect designs both; expert ships; tester verifies (iPhone real-device + headless SW registration).
- Pending: architect designs → expert provisions LE cert + updates server.ts + wires Playwright CDP config → tester verifies AC1-AC9 → Tron QA closes the real-device unblock.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 36 — R-T (real CA cert + CDP test-infra workaround — Tron real-device unblock)
**Priority:** **CRITICAL-PATH #1** (above T178; Tron locked out of real device)
**Follows:** T179 (SW runtime durable) · T100 (isolated test server) · T176 (Playwright baseline; T180 closes the SW-registration gap T176 left open by design)
**Unblocks:** Tron real-device app use · T179 AC11-13 SW-active headless verify · all future PWA/SW tasks
**Rule-pair scope:** (a)+(b) likely EXEMPT for both tracks (infra-only / test-only per learning #24); architect confirms.
